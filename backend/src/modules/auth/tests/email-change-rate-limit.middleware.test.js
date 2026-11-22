import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createEmailChangeQuotaMiddleware,
} from '../middlewares/email-change-rate-limit.middleware.js';

// ============================================================
// DATOS DE PRUEBA
// ============================================================

const userId =
    '11111111-1111-4111-8111-111111111111';

const requestIp = '127.0.0.1';

// ============================================================
// SIMULAR LA EJECUCION DEL MIDDLEWARE
// ============================================================

const executeMiddleware = async ({
    operation = 'request',
    auth = { userId },
    consumeQuota = async () => ({ allowed: true }),
} = {}) => {
    const headers = {};

    const received = {
        nextCalls: 0,
        error: null,
        headers,
    };

    const req = {
        auth,
        ip: requestIp,
    };

    const res = {
        set(name, value) {
            headers[name] = value;
            return this;
        },
    };

    const middleware =
        createEmailChangeQuotaMiddleware({
            operation,
            consumeQuota,
        });

    await middleware(req, res, (error) => {
        received.nextCalls += 1;
        received.error = error ?? null;
    });

    return received;
};

// ============================================================
// 1. PERMITIR SOLICITUDES DENTRO DEL LIMITE
// ============================================================

test(
    'allows email change requests within the quota',
    async () => {
        let consumed = null;

        const result = await executeMiddleware({
            operation: 'request',

            consumeQuota: async (options) => {
                consumed = options;

                return {
                    allowed: true,
                };
            },
        });

        assert.equal(result.nextCalls, 1);
        assert.equal(result.error, null);

        assert.deepEqual(consumed, {
            userId,
            requestIp,
            operation: 'request',
        });

        assert.deepEqual(result.headers, {});
    },
);

// ============================================================
// 2. PERMITIR CONFIRMACIONES DENTRO DEL LIMITE
// ============================================================

test(
    'allows email change confirmations within the quota',
    async () => {
        let consumed = null;

        const result = await executeMiddleware({
            operation: 'confirm',

            consumeQuota: async (options) => {
                consumed = options;

                return {
                    allowed: true,
                };
            },
        });

        assert.equal(result.nextCalls, 1);
        assert.equal(result.error, null);

        assert.deepEqual(consumed, {
            userId,
            requestIp,
            operation: 'confirm',
        });
    },
);

// ============================================================
// 3. RECHAZAR SOLICITUDES SIN AUTENTICACION
// ============================================================

test(
    'rejects unauthenticated requests before Redis access',
    async () => {
        let quotaCalled = false;

        const result = await executeMiddleware({
            auth: null,

            consumeQuota: async () => {
                quotaCalled = true;

                return {
                    allowed: true,
                };
            },
        });

        assert.equal(quotaCalled, false);

        assert.equal(result.nextCalls, 1);

        assert.equal(
            result.error.code,
            'AUTHENTICATION_REQUIRED',
        );

        assert.equal(
            result.error.statusCode,
            401,
        );
    },
);

// ============================================================
// 4. RECHAZAR OPERACIONES NO PERMITIDAS
// ============================================================

test(
    'rejects unsupported email change operations',
    () => {
        const invalidOperations = [
            undefined,
            null,
            '',
            'unknown',
            'delete',
        ];

        for (const operation of invalidOperations) {
            assert.throws(
                () => createEmailChangeQuotaMiddleware({
                    operation,
                }),
                TypeError,
            );
        }
    },
);

// ============================================================
// 5. BLOQUEAR CUANDO SE AGOTA LA CUOTA DEL USUARIO
// ============================================================

test(
    'blocks account quota exhaustion with Retry-After',
    async () => {
        const quotaError =
            new Error('Account quota exceeded');

        quotaError.code =
            'EMAIL_CHANGE_RATE_LIMITED';

        quotaError.statusCode = 429;
        quotaError.scope = 'account';
        quotaError.retryAfterSeconds = 1800;

        const result = await executeMiddleware({
            operation: 'request',

            consumeQuota: async () => {
                throw quotaError;
            },
        });

        assert.equal(result.nextCalls, 1);

        assert.equal(
            result.error,
            quotaError,
        );

        assert.equal(
            result.error.statusCode,
            429,
        );

        assert.equal(
            result.headers['Retry-After'],
            '1800',
        );
    },
);

// ============================================================
// 6. BLOQUEAR CUANDO SE AGOTA LA CUOTA DE LA IP
// ============================================================

test(
    'blocks IP quota exhaustion with Retry-After',
    async () => {
        const quotaError =
            new Error('IP quota exceeded');

        quotaError.code =
            'EMAIL_CHANGE_RATE_LIMITED';

        quotaError.statusCode = 429;
        quotaError.scope = 'ip';
        quotaError.retryAfterSeconds = 900;

        const result = await executeMiddleware({
            operation: 'confirm',

            consumeQuota: async () => {
                throw quotaError;
            },
        });

        assert.equal(result.nextCalls, 1);

        assert.equal(
            result.error,
            quotaError,
        );

        assert.equal(
            result.headers['Retry-After'],
            '900',
        );
    },
);

// ============================================================
// 7. NO ENVIAR TIEMPOS DE ESPERA INVALIDOS
// ============================================================

test(
    'does not set Retry-After for invalid retry durations',
    async () => {
        const invalidDurations = [
            undefined,
            null,
            0,
            -10,
            1.5,
            '300',
        ];

        for (const retryAfterSeconds of invalidDurations) {
            const quotaError =
                new Error('Invalid retry duration');

            quotaError.code =
                'EMAIL_CHANGE_RATE_LIMITED';

            quotaError.statusCode = 429;
            quotaError.retryAfterSeconds =
                retryAfterSeconds;

            const result = await executeMiddleware({
                consumeQuota: async () => {
                    throw quotaError;
                },
            });

            assert.equal(result.nextCalls, 1);

            assert.equal(
                result.error,
                quotaError,
            );

            assert.equal(
                result.headers['Retry-After'],
                undefined,
            );
        }
    },
);

// ============================================================
// 8. NO PERMITIR CONTINUAR CUANDO REDIS FALLA
// ============================================================

test(
    'propagates Redis failures without allowing the request',
    async () => {
        const redisError =
            new Error('Redis unavailable');

        const result = await executeMiddleware({
            consumeQuota: async () => {
                throw redisError;
            },
        });

        assert.equal(result.nextCalls, 1);

        assert.equal(
            result.error,
            redisError,
        );

        assert.equal(
            result.headers['Retry-After'],
            undefined,
        );
    },
);
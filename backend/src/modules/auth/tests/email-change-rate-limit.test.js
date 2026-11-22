import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
    consumeEmailChangeQuota,
    EmailChangeRateLimitError,
} from '../services/email-change-rate-limit.service.js';

// ============================================================
// DATOS DE PRUEBA
// ============================================================

const userId =
    '11111111-1111-4111-8111-111111111111';

const requestIp = '127.0.0.1';

const createOptions = (overrides = {}) => ({
    userId,
    requestIp,
    operation: 'request',
    ...overrides,
});

// ============================================================
// 1. PERMITIR SOLICITUDES DENTRO DEL LIMITE
// ============================================================

test(
    'allows an email change request within its Redis quota',
    async () => {
        let evalOptions = null;

        const client = {
            eval: async (_script, options) => {
                evalOptions = options;

                return [1, 0];
            },
        };

        const result = await consumeEmailChangeQuota(
            createOptions({ client }),
        );

        assert.equal(result.allowed, true);
        assert.equal(Object.isFrozen(result), true);

        assert.deepEqual(
            evalOptions.arguments,
            ['6', '60', '3600'],
        );

        assert.equal(evalOptions.keys.length, 2);

        assert.equal(
            evalOptions.keys[0],
            `learn2code:email-change:request:account:${userId}`,
        );

        const expectedIpHash =
            createHash('sha256')
                .update(requestIp)
                .digest('hex');

        assert.equal(
            evalOptions.keys[1],
            `learn2code:email-change:request:ip:${expectedIpHash}`,
        );

        assert.equal(
            evalOptions.keys[1].includes(requestIp),
            false,
        );
    },
);

// ============================================================
// 2. CONFIRMACION CON LIMITES INDEPENDIENTES
// ============================================================

test(
    'uses separate quotas for email change confirmation',
    async () => {
        const captured = [];

        const client = {
            eval: async (_script, options) => {
                captured.push(options);

                return [1, 0];
            },
        };

        const requestResult =
            await consumeEmailChangeQuota(
                createOptions({
                    operation: 'request',
                    client,
                }),
            );

        const confirmResult =
            await consumeEmailChangeQuota(
                createOptions({
                    operation: 'confirm',
                    client,
                }),
            );

        assert.equal(requestResult.allowed, true);
        assert.equal(confirmResult.allowed, true);

        assert.equal(captured.length, 2);

        assert.deepEqual(
            captured[0].arguments,
            ['6', '60', '3600'],
        );

        assert.deepEqual(
            captured[1].arguments,
            ['30', '300', '3600'],
        );

        assert.notEqual(
            captured[0].keys[0],
            captured[1].keys[0],
        );

        assert.notEqual(
            captured[0].keys[1],
            captured[1].keys[1],
        );

        // Las claves tampoco deben compartirse
        // con la verificacion inicial de correo.
        for (const entry of captured) {
            for (const key of entry.keys) {
                assert.equal(
                    key.startsWith(
                        'learn2code:verify-code:',
                    ),
                    false,
                );
            }
        }
    },
);

// ============================================================
// 3. BLOQUEAR CUANDO SE AGOTE EL LIMITE POR USUARIO
// ============================================================

test(
    'rejects requests when the account quota is exhausted',
    async () => {
        const client = {
            eval: async () => [-1, 1800],
        };

        await assert.rejects(
            () => consumeEmailChangeQuota(
                createOptions({ client }),
            ),
            (error) => {
                assert.ok(
                    error instanceof EmailChangeRateLimitError,
                );

                assert.equal(
                    error.code,
                    'EMAIL_CHANGE_RATE_LIMITED',
                );

                assert.equal(error.statusCode, 429);
                assert.equal(error.operation, 'request');
                assert.equal(error.scope, 'account');

                assert.equal(
                    error.retryAfterSeconds,
                    1800,
                );

                return true;
            },
        );
    },
);

// ============================================================
// 4. BLOQUEAR CUANDO SE AGOTE EL LIMITE POR IP
// ============================================================

test(
    'rejects confirmations when the IP quota is exhausted',
    async () => {
        const client = {
            eval: async () => [-2, 900],
        };

        await assert.rejects(
            () => consumeEmailChangeQuota(
                createOptions({
                    operation: 'confirm',
                    client,
                }),
            ),
            (error) => {
                assert.equal(error.statusCode, 429);

                assert.equal(
                    error.code,
                    'EMAIL_CHANGE_RATE_LIMITED',
                );

                assert.equal(error.operation, 'confirm');
                assert.equal(error.scope, 'ip');

                assert.equal(
                    error.retryAfterSeconds,
                    900,
                );

                return true;
            },
        );
    },
);

// ============================================================
// 5. RECHAZAR PARAMETROS INVALIDOS
// ============================================================

test(
    'requires a valid user, IP and operation',
    async () => {
        let redisCalled = false;

        const client = {
            eval: async () => {
                redisCalled = true;

                return [1, 0];
            },
        };

        const invalidOptions = [
            { userId: '' },
            { userId: null },
            { requestIp: '' },
            { requestIp: null },
            { operation: '' },
            { operation: 'unknown' },
            { operation: null },
        ];

        for (const overrides of invalidOptions) {
            await assert.rejects(
                () => consumeEmailChangeQuota(
                    createOptions({
                        ...overrides,
                        client,
                    }),
                ),
                TypeError,
            );
        }

        assert.equal(redisCalled, false);
    },
);

// ============================================================
// 6. RECHAZAR RESPUESTAS INVALIDAS DE REDIS
// ============================================================

test(
    'rejects malformed Redis quota responses',
    async () => {
        const invalidResponses = [
            null,
            undefined,
            [],
            [1],
            [1, 0, 0],
            'allowed',
        ];

        for (const redisResponse of invalidResponses) {
            const client = {
                eval: async () => redisResponse,
            };

            await assert.rejects(
                () => consumeEmailChangeQuota(
                    createOptions({ client }),
                ),
                {
                    message:
                        'Invalid Redis email change rate-limit response',
                },
            );
        }
    },
);

// ============================================================
// 7. RECHAZAR DECISIONES INESPERADAS DE REDIS
// ============================================================

test(
    'rejects unexpected Redis quota decisions',
    async () => {
        const client = {
            eval: async () => [2, 0],
        };

        await assert.rejects(
            () => consumeEmailChangeQuota(
                createOptions({ client }),
            ),
            {
                message:
                    'Unexpected Redis email change rate-limit decision',
            },
        );
    },
);

// ============================================================
// 8. NO PERMITIR SOLICITUDES SI REDIS FALLA
// ============================================================

test(
    'does not allow email changes when Redis fails',
    async () => {
        const redisError =
            new Error('Redis unavailable');

        const client = {
            eval: async () => {
                throw redisError;
            },
        };

        await assert.rejects(
            () => consumeEmailChangeQuota(
                createOptions({ client }),
            ),
            (error) => error === redisError,
        );
    },
);

import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createEmailVerificationCodeQuotaMiddleware,
} from '../middlewares/email-verification-code-rate-limit.middleware.js';

const userId =
    '11111111-1111-4111-8111-111111111111';

const requestIp = '127.0.0.1';

const executeMiddleware = async ({
    auth = { userId },
    consumeQuota,
} = {}) => {
    const headers = {};
    const received = {
        nextCalled: false,
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
        createEmailVerificationCodeQuotaMiddleware({
            consumeQuota,
        });

    await middleware(req, res, (error) => {
        received.nextCalled = true;
        received.error = error ?? null;
    });

    return received;
};

test(
    'allows requests within the Redis quota',
    async () => {
        let consumed = null;

        const result = await executeMiddleware({
            consumeQuota: async (options) => {
                consumed = options;

                return {
                    allowed: true,
                };
            },
        });

        assert.equal(result.nextCalled, true);
        assert.equal(result.error, null);

        assert.deepEqual(consumed, {
            userId,
            requestIp,
        });
    },
);

test(
    'blocks requests when the quota is exhausted',
    async () => {
        const quotaError =
            new Error('Rate limit exceeded');

        quotaError.code =
            'EMAIL_VERIFICATION_RATE_LIMITED';

        quotaError.statusCode = 429;
        quotaError.retryAfterSeconds = 3600;

        const result = await executeMiddleware({
            consumeQuota: async () => {
                throw quotaError;
            },
        });

        assert.equal(result.nextCalled, true);

        assert.equal(
            result.error,
            quotaError,
        );

        assert.equal(
            result.headers['Retry-After'],
            '3600',
        );
    },
);

test(
    'rejects requests without authentication',
    async () => {
        let quotaCalled = false;

        const result = await executeMiddleware({
            auth: null,

            consumeQuota: async () => {
                quotaCalled = true;
            },
        });

        assert.equal(quotaCalled, false);

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

test(
    'does not allow requests when Redis fails',
    async () => {
        const redisError =
            new Error('Redis unavailable');

        const result = await executeMiddleware({
            consumeQuota: async () => {
                throw redisError;
            },
        });

        assert.equal(result.nextCalled, true);

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

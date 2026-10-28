
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    consumeEmailVerificationCodeQuota,
} from '../services/email-verification-code-rate-limit.service.js';

const userId =
    '11111111-1111-4111-8111-111111111111';

const requestIp = '127.0.0.1';

test(
    'allows a verification request within quota',
    async () => {
        let evalOptions = null;

        const client = {
            eval: async (_script, options) => {
                evalOptions = options;
                return [1, 0];
            },
        };

        const result =
            await consumeEmailVerificationCodeQuota({
                userId,
                requestIp,
                client,
            });

        assert.equal(result.allowed, true);

        assert.equal(evalOptions.keys.length, 2);

        assert.deepEqual(
            evalOptions.arguments,
            ['12', '120', '86400'],
        );

        assert.ok(
            evalOptions.keys[0].includes(userId),
        );

        assert.ok(
            !evalOptions.keys[1].includes(requestIp),
        );
    },
);

test(
    'rejects a user who exceeds the account limit',
    async () => {
        const client = {
            eval: async () => [-1, 3600],
        };

        await assert.rejects(
            () => consumeEmailVerificationCodeQuota({
                userId,
                requestIp,
                client,
            }),

            (error) => {
                assert.equal(error.statusCode, 429);

                assert.equal(
                    error.code,
                    'EMAIL_VERIFICATION_RATE_LIMITED',
                );

                assert.equal(error.scope, 'account');

                assert.equal(
                    error.retryAfterSeconds,
                    3600,
                );

                return true;
            },
        );
    },
);

test(
    'rejects requests when the IP limit is reached',
    async () => {
        const client = {
            eval: async () => [-2, 7200],
        };

        await assert.rejects(
            () => consumeEmailVerificationCodeQuota({
                userId,
                requestIp,
                client,
            }),

            (error) => {
                assert.equal(error.statusCode, 429);
                assert.equal(error.scope, 'ip');

                return true;
            },
        );
    },
);

test(
    'requires a valid user and IP',
    async () => {
        await assert.rejects(
            () => consumeEmailVerificationCodeQuota({
                userId,
                requestIp: '',
            }),
            TypeError,
        );
    },
);

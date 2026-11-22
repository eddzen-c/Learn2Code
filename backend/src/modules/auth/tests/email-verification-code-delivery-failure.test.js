
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    requestEmailVerificationCode,
} from '../services/email-verification-code-flow.service.js';

const userId = '11111111-1111-4111-8111-111111111111';

const now = new Date('2026-10-24T18:00:00.000Z');

const expiresAt = new Date('2026-10-24T18:10:00.000Z');

const codeHash = 'a'.repeat(64);

const createRequestOptions = (overrides = {}) => ({
    userId,
    now,

    findUser: async () => ({
        id: userId,
        email: 'student@example.test',
        isActive: true,
        deletedAt: null,
        emailVerifiedAt: null,
    }),

    getSecret: () => 'test-only-secret',

    createCode: () => ({
        code: '012345',
        codeHash,
        expiresAt,
    }),

    saveCode: async () => ({
        userId,
        expiresAt,
    }),

    ...overrides,
});

test(
    'invalidates a verification code when email delivery fails',
    async () => {
        const providerError =
            new Error('Resend rejected the email');

        let invalidation = null;

        await assert.rejects(
            () => requestEmailVerificationCode(
                createRequestOptions({
                    sendMessage: async () => {
                        throw providerError;
                    },

                    markDeliveryFailed: async (params) => {
                        invalidation = params;
                        return true;
                    },
                }),
            ),
            (error) => error === providerError,
        );

        assert.ok(invalidation);

        assert.equal(
            invalidation.userId,
            userId,
        );

        assert.equal(
            invalidation.codeHash,
            codeHash,
        );

        assert.equal(
            invalidation.createdAt,
            now,
        );

        assert.ok(
            invalidation.failedAt instanceof Date,
        );
    },
);

test(
    'preserves the original delivery error when invalidation fails',
    async (context) => {
        const providerError =
            new Error('Email delivery failed');

        const databaseError =
            new Error('Database cleanup failed');

        const consoleSpy = context.mock.method(
            console,
            'error',
            () => { },
        );

        await assert.rejects(
            () => requestEmailVerificationCode(
                createRequestOptions({
                    sendMessage: async () => {
                        throw providerError;
                    },

                    markDeliveryFailed: async () => {
                        throw databaseError;
                    },
                }),
            ),
            (error) => error === providerError,
        );

        assert.equal(
            consoleSpy.mock.callCount(),
            1,
        );
    },
);

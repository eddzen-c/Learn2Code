import assert from 'node:assert/strict';
import test from 'node:test';

import {
    EmailVerificationUnavailableError,
    InvalidEmailVerificationTokenError,
} from '../errors/account-recovery.errors.js';

import {
    confirmEmailVerification,
    requestEmailVerification,
} from '../services/email-verification.service.js';

const createPool = () => {
    const commands = [];
    let released = false;

    const client = {
        query: async (command) => {
            commands.push(command);

            return {
                rows: [],
                rowCount: 0,
            };
        },

        release: () => {
            released = true;
        },
    };

    return {
        commands,
        client,

        pool: {
            connect: async () => client,
        },

        wasReleased: () => released,
    };
};

test(
    'requestEmailVerification creates and delivers a token',
    async () => {
        const now =
            new Date(
                '2026-08-04T12:00:00.000Z',
            );

        const context =
            createPool();

        let createdParameters;
        let deliveredParameters;

        const result =
            await requestEmailVerification({
                userId: 'user-1',
                now,
                pool: context.pool,

                findUser: async () => ({
                    id: 'user-1',
                    email:
                        'student@example.com',
                    emailVerifiedAt: null,
                }),

                createToken: () => ({
                    token:
                        'raw-verification-token',
                    tokenHash:
                        'verification-hash',
                }),

                deletePendingTokens:
                    async () => 1,

                createTokenRecord:
                    async (parameters) => {
                        createdParameters =
                            parameters;

                        return {
                            id:
                                'verification-1',
                        };
                    },

                sendMessage:
                    async (parameters) => {
                        deliveredParameters =
                            parameters;

                        return {
                            provider: 'mock',
                            accepted: true,
                        };
                    },
            });

        const expectedExpiration =
            new Date(
                '2026-08-05T12:00:00.000Z',
            );

        assert.equal(
            result.requested,
            true,
        );

        assert.equal(
            result.alreadyVerified,
            false,
        );

        assert.deepEqual(
            result.expiresAt,
            expectedExpiration,
        );

        assert.deepEqual(
            result.delivery,
            {
                provider: 'mock',
                accepted: true,
            },
        );

        assert.equal(
            'token' in result,
            false,
        );

        assert.equal(
            createdParameters.tokenHash,
            'verification-hash',
        );

        assert.deepEqual(
            deliveredParameters,
            {
                recipientEmail:
                    'student@example.com',
                token:
                    'raw-verification-token',
                expiresAt:
                    expectedExpiration,
            },
        );

        assert.deepEqual(
            context.commands,
            [
                'BEGIN',
                'COMMIT',
            ],
        );

        assert.equal(
            context.wasReleased(),
            true,
        );
    },
);

test(
    'requestEmailVerification is idempotent for a verified user',
    async () => {
        const context =
            createPool();

        const result =
            await requestEmailVerification({
                userId: 'user-1',
                pool: context.pool,

                findUser: async () => ({
                    id: 'user-1',
                    email:
                        'student@example.com',
                    emailVerifiedAt:
                        new Date(),
                }),

                createToken: () => {
                    throw new Error(
                        'Token should not be created',
                    );
                },
            });

        assert.deepEqual(
            result,
            {
                requested: false,
                alreadyVerified: true,
                expiresAt: null,
                delivery: null,
            },
        );

        assert.deepEqual(
            context.commands,
            [
                'BEGIN',
                'COMMIT',
            ],
        );
    },
);

test(
    'requestEmailVerification rolls back for a missing user',
    async () => {
        const context =
            createPool();

        await assert.rejects(
            requestEmailVerification({
                userId: 'missing-user',
                pool: context.pool,
                findUser:
                    async () => null,
            }),
            EmailVerificationUnavailableError,
        );

        assert.deepEqual(
            context.commands,
            [
                'BEGIN',
                'ROLLBACK',
            ],
        );

        assert.equal(
            context.wasReleased(),
            true,
        );
    },
);

test(
    'confirmEmailVerification verifies a valid token',
    async () => {
        const verifiedAt =
            new Date(
                '2026-08-04T12:30:00.000Z',
            );

        let verificationParameters;

        const result =
            await confirmEmailVerification({
                token:
                    'raw-verification-token',
                verifiedAt,

                hashToken: () =>
                    'verification-hash',

                verifyEmail:
                    async (parameters) => {
                        verificationParameters =
                            parameters;

                        return {
                            userId: 'user-1',
                            email:
                                'student@example.com',
                            emailVerifiedAt:
                                verifiedAt,
                        };
                    },
            });

        assert.equal(
            result.verified,
            true,
        );

        assert.deepEqual(
            result.user,
            {
                id: 'user-1',
                email:
                    'student@example.com',
                emailVerifiedAt:
                    verifiedAt,
            },
        );

        assert.equal(
            verificationParameters.tokenHash,
            'verification-hash',
        );
    },
);

test(
    'confirmEmailVerification rejects an invalid token',
    async () => {
        await assert.rejects(
            confirmEmailVerification({
                token: 'invalid-token',

                hashToken: () =>
                    'invalid-hash',

                verifyEmail:
                    async () => null,
            }),
            InvalidEmailVerificationTokenError,
        );
    },
);
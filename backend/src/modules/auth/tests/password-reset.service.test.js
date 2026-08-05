import assert from 'node:assert/strict';
import test from 'node:test';

import {
    InvalidPasswordResetTokenError,
} from '../errors/account-recovery.errors.js';

import {
    requestPasswordReset,
    resetPassword,
} from '../services/password-reset.service.js';

const createPool = () => {
    const commands = [];
    let released = false;

    const client = {
        query: async (command) => {
            commands.push(command);

            return {
                rows: [],
            };
        },

        release: () => {
            released = true;
        },
    };

    return {
        pool: {
            connect: async () => client,
        },
        client,
        commands,
        wasReleased: () => released,
    };
};

test(
    'requestPasswordReset creates and delivers a reset token',
    async () => {
        const {
            pool,
            commands,
            wasReleased,
        } = createPool();

        const calls = [];
        const now =
            new Date(
                '2026-08-04T12:00:00.000Z',
            );

        const result =
            await requestPasswordReset({
                email:
                    'student@example.com',
                requestedIp:
                    '127.0.0.1',
                now,
                pool,

                findUser: async ({
                    email,
                    client,
                }) => {
                    calls.push({
                        type: 'find',
                        email,
                        client,
                    });

                    return {
                        id: 'user-1',
                        email,
                        isActive: true,
                        deletedAt: null,
                    };
                },

                deletePendingRequests:
                    async (parameters) => {
                        calls.push({
                            type: 'delete',
                            parameters,
                        });
                    },

                createResetRequest:
                    async (parameters) => {
                        calls.push({
                            type: 'create',
                            parameters,
                        });

                        return {
                            id: 'request-1',
                        };
                    },

                createToken: () => ({
                    token:
                        'raw-reset-token',
                    tokenHash:
                        'reset-token-hash',
                }),

                sendResetMessage:
                    async (parameters) => {
                        calls.push({
                            type: 'send',
                            parameters,
                        });

                        return {
                            provider: 'mock',
                            accepted: true,
                        };
                    },
            });

        assert.deepEqual(result, {
            requested: true,
        });

        assert.deepEqual(
            commands,
            [
                'BEGIN',
                'COMMIT',
            ],
        );

        assert.equal(
            wasReleased(),
            true,
        );

        assert.equal(
            calls[2]
                .parameters
                .tokenHash,
            'reset-token-hash',
        );

        assert.equal(
            calls[2]
                .parameters
                .requestedIp,
            '127.0.0.1',
        );

        assert.deepEqual(
            calls[3].parameters,
            {
                recipientEmail:
                    'student@example.com',
                token:
                    'raw-reset-token',
                expiresAt:
                    new Date(
                        '2026-08-04T13:00:00.000Z',
                    ),
            },
        );

        assert.equal(
            'token' in result,
            false,
        );
    },
);

test(
    'requestPasswordReset hides an unavailable account',
    async () => {
        const {
            pool,
            commands,
            wasReleased,
        } = createPool();

        const result =
            await requestPasswordReset({
                email:
                    'missing@example.com',
                pool,

                findUser: async () => null,

                deletePendingRequests:
                    async () => {
                        throw new Error(
                            'Must not delete tokens',
                        );
                    },

                createResetRequest:
                    async () => {
                        throw new Error(
                            'Must not create a request',
                        );
                    },

                sendResetMessage:
                    async () => {
                        throw new Error(
                            'Must not send an email',
                        );
                    },
            });

        assert.deepEqual(result, {
            requested: true,
        });

        assert.deepEqual(
            commands,
            [
                'BEGIN',
                'COMMIT',
            ],
        );

        assert.equal(
            wasReleased(),
            true,
        );
    },
);

test(
    'requestPasswordReset rolls back when request creation fails',
    async () => {
        const {
            pool,
            commands,
            wasReleased,
        } = createPool();

        await assert.rejects(
            requestPasswordReset({
                email:
                    'student@example.com',
                pool,

                findUser:
                    async ({ email }) => ({
                        id: 'user-1',
                        email,
                        isActive: true,
                        deletedAt: null,
                    }),

                deletePendingRequests:
                    async () => { },

                createResetRequest:
                    async () => {
                        throw new Error(
                            'Database failure',
                        );
                    },
            }),
            /Database failure/,
        );

        assert.deepEqual(
            commands,
            [
                'BEGIN',
                'ROLLBACK',
            ],
        );

        assert.equal(
            wasReleased(),
            true,
        );
    },
);

test(
    'resetPassword replaces the password using a valid token',
    async () => {
        const calls = [];
        const now =
            new Date(
                '2026-08-04T12:00:00.000Z',
            );

        const result =
            await resetPassword({
                token:
                    'raw-reset-token',
                newPassword:
                    'NewPassword123!',
                now,
                client:
                    'database-client',

                hashToken: (token) => {
                    calls.push({
                        type: 'token',
                        token,
                    });

                    return 'reset-token-hash';
                },

                hashNewPassword:
                    async (password) => {
                        calls.push({
                            type: 'password',
                            password,
                        });

                        return 'new-password-hash';
                    },

                resetWithToken:
                    async (parameters) => {
                        calls.push({
                            type: 'reset',
                            parameters,
                        });

                        return {
                            userId: 'user-1',
                        };
                    },
            });

        assert.deepEqual(result, {
            reset: true,
        });

        assert.deepEqual(
            calls[2].parameters,
            {
                tokenHash:
                    'reset-token-hash',
                passwordHash:
                    'new-password-hash',
                usedAt: now,
                client:
                    'database-client',
            },
        );
    },
);

test(
    'resetPassword rejects an invalid or expired token',
    async () => {
        await assert.rejects(
            resetPassword({
                token:
                    'expired-token',
                newPassword:
                    'NewPassword123!',

                hashToken:
                    () => 'expired-hash',

                hashNewPassword:
                    async () => (
                        'new-password-hash'
                    ),

                resetWithToken:
                    async () => null,
            }),
            InvalidPasswordResetTokenError,
        );
    },
);
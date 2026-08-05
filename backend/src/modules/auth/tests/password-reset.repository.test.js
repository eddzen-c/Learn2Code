import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createPasswordResetRequestRecord,
    deletePendingPasswordResetRequests,
    resetPasswordWithTokenHash,
} from '../repositories/password-reset.repository.js';

const createClient = ({
    rows = [],
    rowCount = rows.length,
} = {}) => {
    const calls = [];

    return {
        calls,

        query: async (query) => {
            calls.push(query);

            return {
                rows,
                rowCount,
            };
        },
    };
};

test(
    'deletePendingPasswordResetRequests removes unused requests',
    async () => {
        const client =
            createClient({
                rowCount: 2,
            });

        const deleted =
            await deletePendingPasswordResetRequests({
                userId: 'user-1',
                client,
            });

        assert.equal(deleted, 2);

        assert.match(
            client.calls[0].text,
            /DELETE FROM\s+password_reset_requests/,
        );

        assert.deepEqual(
            client.calls[0].values,
            ['user-1'],
        );
    },
);

test(
    'createPasswordResetRequestRecord creates a request',
    async () => {
        const expiresAt =
            new Date(
                '2026-08-04T13:00:00.000Z',
            );

        const createdAt =
            new Date(
                '2026-08-04T12:00:00.000Z',
            );

        const client =
            createClient({
                rows: [{
                    id: 'reset-1',
                    user_id: 'user-1',
                    expires_at: expiresAt,
                    requested_ip:
                        '127.0.0.1',
                    created_at: createdAt,
                }],
            });

        const result =
            await createPasswordResetRequestRecord({
                userId: 'user-1',
                tokenHash: 'a'.repeat(64),
                expiresAt,
                requestedIp:
                    '127.0.0.1',
                client,
            });

        assert.deepEqual(
            result,
            {
                id: 'reset-1',
                userId: 'user-1',
                expiresAt,
                requestedIp:
                    '127.0.0.1',
                createdAt,
            },
        );

        assert.deepEqual(
            client.calls[0].values,
            [
                'user-1',
                'a'.repeat(64),
                expiresAt,
                '127.0.0.1',
            ],
        );
    },
);

test(
    'resetPasswordWithTokenHash updates the password and revokes sessions',
    async () => {
        const usedAt =
            new Date(
                '2026-08-04T12:30:00.000Z',
            );

        const client =
            createClient({
                rows: [{
                    id: 'user-1',
                    email:
                        'student@example.com',
                    updated_at: usedAt,
                }],
            });

        const result =
            await resetPasswordWithTokenHash({
                tokenHash: 'b'.repeat(64),
                passwordHash:
                    'new-password-hash',
                usedAt,
                client,
            });

        assert.deepEqual(
            result,
            {
                userId: 'user-1',
                email:
                    'student@example.com',
                passwordUpdatedAt:
                    usedAt,
            },
        );

        assert.match(
            client.calls[0].text,
            /WITH claimed_request AS/,
        );

        assert.match(
            client.calls[0].text,
            /DELETE FROM refresh_tokens/,
        );

        assert.deepEqual(
            client.calls[0].values,
            [
                'b'.repeat(64),
                'new-password-hash',
                usedAt,
            ],
        );
    },
);

test(
    'resetPasswordWithTokenHash returns null for an invalid token',
    async () => {
        const client =
            createClient();

        const result =
            await resetPasswordWithTokenHash({
                tokenHash: 'c'.repeat(64),
                passwordHash:
                    'new-password-hash',
                client,
            });

        assert.equal(result, null);
    },
);
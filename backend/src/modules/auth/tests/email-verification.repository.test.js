import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createEmailVerificationTokenRecord,
    deletePendingEmailVerificationTokens,
    verifyEmailWithTokenHash,
} from '../repositories/email-verification.repository.js';

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
    'deletePendingEmailVerificationTokens removes unused tokens',
    async () => {
        const client =
            createClient({
                rowCount: 2,
            });

        const deleted =
            await deletePendingEmailVerificationTokens({
                userId: 'user-1',
                client,
            });

        assert.equal(deleted, 2);

        assert.match(
            client.calls[0].text,
            /DELETE FROM\s+email_verification_tokens/,
        );

        assert.deepEqual(
            client.calls[0].values,
            ['user-1'],
        );
    },
);

test(
    'createEmailVerificationTokenRecord creates a token',
    async () => {
        const expiresAt =
            new Date(
                '2026-08-05T12:00:00.000Z',
            );

        const createdAt =
            new Date(
                '2026-08-04T12:00:00.000Z',
            );

        const client =
            createClient({
                rows: [{
                    id: 'verification-1',
                    user_id: 'user-1',
                    expires_at: expiresAt,
                    created_at: createdAt,
                }],
            });

        const result =
            await createEmailVerificationTokenRecord({
                userId: 'user-1',
                tokenHash: 'a'.repeat(64),
                expiresAt,
                client,
            });

        assert.deepEqual(
            result,
            {
                id: 'verification-1',
                userId: 'user-1',
                expiresAt,
                createdAt,
            },
        );

        assert.deepEqual(
            client.calls[0].values,
            [
                'user-1',
                'a'.repeat(64),
                expiresAt,
            ],
        );

        assert.equal(
            Object.isFrozen(result),
            true,
        );
    },
);

test(
    'verifyEmailWithTokenHash verifies the token and user',
    async () => {
        const verifiedAt =
            new Date(
                '2026-08-04T12:00:00.000Z',
            );

        const client =
            createClient({
                rows: [{
                    id: 'user-1',
                    email:
                        'student@example.com',
                    email_verified_at:
                        verifiedAt,
                }],
            });

        const result =
            await verifyEmailWithTokenHash({
                tokenHash: 'b'.repeat(64),
                verifiedAt,
                client,
            });

        assert.deepEqual(
            result,
            {
                userId: 'user-1',
                email:
                    'student@example.com',
                emailVerifiedAt:
                    verifiedAt,
            },
        );

        assert.match(
            client.calls[0].text,
            /WITH claimed_token AS/,
        );

        assert.match(
            client.calls[0].text,
            /UPDATE users/,
        );

        assert.deepEqual(
            client.calls[0].values,
            [
                'b'.repeat(64),
                verifiedAt,
            ],
        );
    },
);

test(
    'verifyEmailWithTokenHash returns null for an invalid token',
    async () => {
        const client =
            createClient();

        const result =
            await verifyEmailWithTokenHash({
                tokenHash: 'c'.repeat(64),
                client,
            });

        assert.equal(result, null);
    },
);
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import {
    closeDatabaseConnection,
    databasePool,
} from '../../src/config/database.js';
import {
    createRefreshSession,
    revokeRefreshSession,
    rotateRefreshSession,
} from '../../src/modules/auth/services/refresh-session.service.js';
import {
    hashRefreshToken,
} from '../../src/modules/auth/services/refresh-token.service.js';

test('refresh token lifecycle works with PostgreSQL', async () => {
    const userId = randomUUID();
    const email = `refresh-test-${randomUUID()}@example.test`;

    try {
        await databasePool.query({
            text: `
                INSERT INTO users (
                    id,
                    full_name,
                    email,
                    password_hash
                )
                VALUES ($1, $2, $3, $4)
            `,
            values: [
                userId,
                'Refresh Token Integration Test',
                email,
                'integration-test-password-hash',
            ],
        });

        const createdSession = await createRefreshSession({
            userId,
            createdByIp: '127.0.0.1',
            userAgent: 'Integration test',
        });

        const createdResult = await databasePool.query({
            text: `
                SELECT
                    token_hash,
                    revoked_at
                FROM refresh_tokens
                WHERE id = $1
            `,
            values: [createdSession.refreshTokenId],
        });

        assert.equal(createdResult.rows.length, 1);

        assert.equal(
            createdResult.rows[0].token_hash,
            hashRefreshToken(createdSession.refreshToken),
        );

        assert.notEqual(
            createdResult.rows[0].token_hash,
            createdSession.refreshToken,
        );

        assert.equal(
            createdResult.rows[0].revoked_at,
            null,
        );

        const rotatedSession = await rotateRefreshSession({
            refreshToken: createdSession.refreshToken,
            requestIp: '127.0.0.2',
            userAgent: 'Integration test rotation',
        });

        const rotatedResult = await databasePool.query({
            text: `
                SELECT
                    id,
                    revoked_at,
                    replaced_by_token_id
                FROM refresh_tokens
                WHERE id IN ($1, $2)
                ORDER BY created_at
            `,
            values: [
                createdSession.refreshTokenId,
                rotatedSession.refreshTokenId,
            ],
        });

        assert.equal(rotatedResult.rows.length, 2);

        const previousRecord = rotatedResult.rows.find(
            ({ id }) => id
                === createdSession.refreshTokenId,
        );

        assert.ok(previousRecord.revoked_at);

        assert.equal(
            previousRecord.replaced_by_token_id,
            rotatedSession.refreshTokenId,
        );

        const wasRevoked = await revokeRefreshSession({
            refreshToken: rotatedSession.refreshToken,
            requestIp: '127.0.0.3',
        });

        assert.equal(wasRevoked, true);

        const revokedResult = await databasePool.query({
            text: `
                SELECT revoked_at
                FROM refresh_tokens
                WHERE id = $1
            `,
            values: [rotatedSession.refreshTokenId],
        });

        assert.ok(revokedResult.rows[0].revoked_at);
    } finally {
        try {
            await databasePool.query({
                text: `
                    DELETE FROM users
                    WHERE id = $1
                `,
                values: [userId],
            });
        } finally {
            await closeDatabaseConnection();
        }
    }
});
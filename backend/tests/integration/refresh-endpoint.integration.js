import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import request from 'supertest';

import app from '../../src/app.js';

import {
    closeDatabaseConnection,
    databasePool,
} from '../../src/config/database.js';

import {
    hashRefreshToken,
} from '../../src/modules/auth/services/refresh-token.service.js';

const getRefreshCookie = (response) => {
    const setCookie = response.headers['set-cookie'];

    assert.ok(Array.isArray(setCookie));
    assert.equal(setCookie.length, 1);

    return setCookie[0].split(';')[0];
};

const getCookieValue = (cookie) => (
    decodeURIComponent(
        cookie.slice(cookie.indexOf('=') + 1),
    )
);

test('POST /api/v1/auth/refresh rotates the cookie', async () => {
    const email =
        `refresh-endpoint-${randomUUID()}@example.test`;

    const password = 'Learn2Code-Refresh-2026!';

    try {
        const registrationResponse = await request(app)
            .post('/api/v1/auth/register')
            .send({
                fullName: 'Refresh Integration Student',
                email,
                password,
            });

        assert.equal(registrationResponse.status, 201);

        const originalCookie =
            getRefreshCookie(registrationResponse);

        const originalRefreshToken =
            getCookieValue(originalCookie);

        const refreshResponse = await request(app)
            .post('/api/v1/auth/refresh')
            .set('Cookie', originalCookie)
            .set(
                'User-Agent',
                'Learn2Code refresh integration test',
            )
            .send();

        assert.equal(refreshResponse.status, 200);
        assert.equal(
            refreshResponse.body.status,
            'success',
        );

        assert.equal(
            refreshResponse.body.data.user.email,
            email,
        );

        assert.deepEqual(
            refreshResponse.body.data.user.roles,
            ['student'],
        );

        assert.equal(
            refreshResponse.body.data.accessToken
                .split('.').length,
            3,
        );

        const replacementCookie =
            getRefreshCookie(refreshResponse);

        const replacementRefreshToken =
            getCookieValue(replacementCookie);

        assert.notEqual(
            replacementRefreshToken,
            originalRefreshToken,
        );

        const tokenResult = await databasePool.query({
            text: `
                SELECT
                    refresh_tokens.id,
                    refresh_tokens.token_hash,
                    refresh_tokens.revoked_at,
                    refresh_tokens.replaced_by_token_id
                FROM refresh_tokens
                JOIN users
                    ON users.id = refresh_tokens.user_id
                WHERE users.email = $1
            `,
            values: [email],
        });

        assert.equal(tokenResult.rows.length, 2);

        const originalRecord =
            tokenResult.rows.find(
                (row) => (
                    row.token_hash
                    === hashRefreshToken(
                        originalRefreshToken,
                    )
                ),
            );

        const replacementRecord =
            tokenResult.rows.find(
                (row) => (
                    row.token_hash
                    === hashRefreshToken(
                        replacementRefreshToken,
                    )
                ),
            );

        assert.ok(originalRecord);
        assert.ok(replacementRecord);

        assert.ok(
            originalRecord.revoked_at instanceof Date,
        );

        assert.equal(
            originalRecord.replaced_by_token_id,
            replacementRecord.id,
        );

        assert.equal(
            replacementRecord.revoked_at,
            null,
        );

        const reuseResponse = await request(app)
            .post('/api/v1/auth/refresh')
            .set('Cookie', originalCookie)
            .send();

        assert.equal(reuseResponse.status, 401);

        assert.equal(
            reuseResponse.body.code,
            'REFRESH_TOKEN_REUSE_DETECTED',
        );

        const clearedCookie =
            reuseResponse.headers['set-cookie'];

        assert.ok(Array.isArray(clearedCookie));

        assert.match(
            clearedCookie[0],
            /^learn2code_refresh_token=;/,
        );

        const activeResult = await databasePool.query({
            text: `
                SELECT COUNT(*)::INTEGER AS active_tokens
                FROM refresh_tokens
                JOIN users
                    ON users.id = refresh_tokens.user_id
                WHERE users.email = $1
                  AND refresh_tokens.revoked_at IS NULL
            `,
            values: [email],
        });

        assert.equal(
            activeResult.rows[0].active_tokens,
            0,
        );

        const missingCookieResponse =
            await request(app)
                .post('/api/v1/auth/refresh')
                .send();

        assert.equal(
            missingCookieResponse.status,
            401,
        );

        assert.equal(
            missingCookieResponse.body.code,
            'INVALID_REFRESH_TOKEN',
        );
    } finally {
        try {
            await databasePool.query({
                text: `
                    DELETE FROM users
                    WHERE email = $1
                `,
                values: [email],
            });
        } finally {
            await closeDatabaseConnection();
        }
    }
});
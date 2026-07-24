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

test('POST /api/v1/auth/logout revokes the session', async () => {
    const email =
        `logout-${randomUUID()}@example.test`;

    const password = 'Learn2Code-Logout-2026!';

    try {
        const registrationResponse = await request(app)
            .post('/api/v1/auth/register')
            .send({
                fullName: 'Logout Integration Student',
                email,
                password,
            });

        assert.equal(registrationResponse.status, 201);

        const refreshCookie =
            getRefreshCookie(registrationResponse);

        const refreshToken =
            getCookieValue(refreshCookie);

        const logoutResponse = await request(app)
            .post('/api/v1/auth/logout')
            .set('Cookie', refreshCookie)
            .send();

        assert.equal(logoutResponse.status, 204);
        assert.equal(logoutResponse.text, '');

        const clearedCookie =
            logoutResponse.headers['set-cookie'];

        assert.ok(Array.isArray(clearedCookie));

        assert.match(
            clearedCookie[0],
            /^learn2code_refresh_token=;/,
        );

        assert.match(
            clearedCookie[0],
            /Path=\/api\/v1\/auth/,
        );

        const tokenResult = await databasePool.query({
            text: `
                SELECT
                    refresh_tokens.revoked_at
                FROM refresh_tokens
                JOIN users
                    ON users.id = refresh_tokens.user_id
                WHERE users.email = $1
                  AND refresh_tokens.token_hash = $2
            `,
            values: [
                email,
                hashRefreshToken(refreshToken),
            ],
        });

        assert.equal(tokenResult.rows.length, 1);

        assert.ok(
            tokenResult.rows[0].revoked_at
            instanceof Date,
        );

        const repeatedLogoutResponse =
            await request(app)
                .post('/api/v1/auth/logout')
                .set('Cookie', refreshCookie)
                .send();

        assert.equal(
            repeatedLogoutResponse.status,
            204,
        );

        const missingCookieResponse =
            await request(app)
                .post('/api/v1/auth/logout')
                .send();

        assert.equal(
            missingCookieResponse.status,
            204,
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
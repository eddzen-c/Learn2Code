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

test('POST /api/v1/auth/login authenticates a user', async () => {
    const email =
        `login-${randomUUID()}@example.test`;

    const password = 'Learn2Code-Login-2026!';

    try {
        const registrationResponse = await request(app)
            .post('/api/v1/auth/register')
            .send({
                fullName: 'Login Integration Student',
                email,
                password,
            });

        assert.equal(
            registrationResponse.status,
            201,
        );

        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .set(
                'User-Agent',
                'Learn2Code login integration test',
            )
            .send({
                email: email.toUpperCase(),
                password,
            });

        assert.equal(loginResponse.status, 200);
        assert.equal(
            loginResponse.body.status,
            'success',
        );

        assert.equal(
            loginResponse.body.data.user.email,
            email,
        );

        assert.equal(
            loginResponse.body.data.user.fullName,
            'Login Integration Student',
        );

        assert.deepEqual(
            loginResponse.body.data.user.roles,
            ['student'],
        );

        assert.equal(
            loginResponse.body.data.user.emailVerified,
            false,
        );

        assert.equal(
            loginResponse.body.data.accessToken
                .split('.').length,
            3,
        );

        const setCookie =
            loginResponse.headers['set-cookie'];

        assert.ok(Array.isArray(setCookie));
        assert.equal(setCookie.length, 1);

        assert.match(
            setCookie[0],
            /^learn2code_refresh_token=/,
        );

        assert.match(setCookie[0], /HttpOnly/);
        assert.match(setCookie[0], /SameSite=Lax/);

        assert.match(
            setCookie[0],
            /Path=\/api\/v1\/auth/,
        );

        const refreshToken = decodeURIComponent(
            setCookie[0]
                .split(';')[0]
                .split('=')[1],
        );

        const userResult = await databasePool.query({
            text: `
                SELECT
                    id,
                    last_login_at
                FROM users
                WHERE email = $1
            `,
            values: [email],
        });

        assert.equal(userResult.rows.length, 1);

        const user = userResult.rows[0];

        assert.ok(user.last_login_at instanceof Date);

        const refreshResult =
            await databasePool.query({
                text: `
                    SELECT
                        token_hash,
                        revoked_at
                    FROM refresh_tokens
                    WHERE user_id = $1
                    ORDER BY created_at
                `,
                values: [user.id],
            });

        assert.equal(refreshResult.rows.length, 2);

        assert.ok(
            refreshResult.rows.some(
                (row) => (
                    row.token_hash
                    === hashRefreshToken(refreshToken)
                ),
            ),
        );

        assert.ok(
            refreshResult.rows.every(
                (row) => row.revoked_at === null,
            ),
        );

        const incorrectPasswordResponse =
            await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email,
                    password:
                        'Incorrect-Password-2026!',
                });

        assert.equal(
            incorrectPasswordResponse.status,
            401,
        );

        assert.equal(
            incorrectPasswordResponse.body.code,
            'INVALID_CREDENTIALS',
        );

        const unknownEmailResponse =
            await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email:
                        `unknown-${randomUUID()
                        }@example.test`,
                    password,
                });

        assert.equal(
            unknownEmailResponse.status,
            401,
        );

        assert.equal(
            unknownEmailResponse.body.code,
            'INVALID_CREDENTIALS',
        );

        assert.equal(
            unknownEmailResponse.body.message,
            incorrectPasswordResponse.body.message,
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
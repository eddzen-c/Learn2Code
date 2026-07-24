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
    verifyPassword,
} from '../../src/modules/auth/services/password.service.js';
import {
    hashRefreshToken,
} from '../../src/modules/auth/services/refresh-token.service.js';

test('POST /api/v1/auth/register creates a student', async () => {
    const email =
        `register-${randomUUID()}@example.test`;

    const password = 'Learn2Code-Register-2026!';

    try {
        const response = await request(app)
            .post('/api/v1/auth/register')
            .set('User-Agent', 'Learn2Code integration test')
            .send({
                fullName: 'Integration Student',
                email,
                password,
            });

        assert.equal(response.status, 201);
        assert.equal(response.body.status, 'success');

        assert.equal(
            response.body.data.user.email,
            email,
        );

        assert.deepEqual(
            response.body.data.user.roles,
            ['student'],
        );

        assert.equal(
            response.body.data.user.emailVerified,
            false,
        );

        assert.equal(
            response.body.data.accessToken.split('.').length,
            3,
        );

        const setCookie = response.headers['set-cookie'];

        assert.ok(Array.isArray(setCookie));
        assert.equal(setCookie.length, 1);

        assert.match(
            setCookie[0],
            /^learn2code_refresh_token=/,
        );

        assert.match(setCookie[0], /HttpOnly/);
        assert.match(setCookie[0], /SameSite=Lax/);
        assert.match(setCookie[0], /Path=\/api\/v1\/auth/);

        const cookieValue = decodeURIComponent(
            setCookie[0]
                .split(';')[0]
                .split('=')[1],
        );

        const userResult = await databasePool.query({
            text: `
                SELECT
                    users.id,
                    users.password_hash,
                    roles.name AS role_name
                FROM users
                JOIN user_roles
                    ON user_roles.user_id = users.id
                JOIN roles
                    ON roles.id = user_roles.role_id
                WHERE users.email = $1
            `,
            values: [email],
        });

        assert.equal(userResult.rows.length, 1);

        const user = userResult.rows[0];

        assert.equal(user.role_name, 'student');
        assert.notEqual(user.password_hash, password);

        assert.equal(
            await verifyPassword(
                password,
                user.password_hash,
            ),
            true,
        );

        const refreshResult = await databasePool.query({
            text: `
                SELECT
                    token_hash,
                    revoked_at
                FROM refresh_tokens
                WHERE user_id = $1
            `,
            values: [user.id],
        });

        assert.equal(refreshResult.rows.length, 1);

        assert.equal(
            refreshResult.rows[0].token_hash,
            hashRefreshToken(cookieValue),
        );

        assert.equal(
            refreshResult.rows[0].revoked_at,
            null,
        );

        const duplicateResponse = await request(app)
            .post('/api/v1/auth/register')
            .send({
                fullName: 'Duplicate Student',
                email,
                password,
            });

        assert.equal(duplicateResponse.status, 409);

        assert.equal(
            duplicateResponse.body.code,
            'EMAIL_ALREADY_REGISTERED',
        );

        const invalidResponse = await request(app)
            .post('/api/v1/auth/register')
            .send({
                fullName: '',
                email: 'invalid-email',
                password: 'short',
            });

        assert.equal(invalidResponse.status, 400);

        assert.equal(
            invalidResponse.body.code,
            'VALIDATION_ERROR',
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
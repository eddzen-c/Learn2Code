import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import request from 'supertest';

import app from '../../src/app.js';

import {
    closeDatabaseConnection,
    databasePool,
} from '../../src/config/database.js';

test('GET /api/v1/auth/me returns the authenticated user', async () => {
    const email =
        `current-user-${randomUUID()}@example.test`;

    const password = 'Learn2Code-Current-User-2026!';

    try {
        const registrationResponse = await request(app)
            .post('/api/v1/auth/register')
            .send({
                fullName: 'Current User Student',
                email,
                password,
            });

        assert.equal(registrationResponse.status, 201);

        const accessToken =
            registrationResponse.body.data.accessToken;

        const currentUserResponse = await request(app)
            .get('/api/v1/auth/me')
            .set(
                'Authorization',
                `Bearer ${accessToken}`,
            );

        assert.equal(currentUserResponse.status, 200);

        assert.equal(
            currentUserResponse.body.status,
            'success',
        );

        assert.equal(
            currentUserResponse.body.data.user.email,
            email,
        );

        assert.equal(
            currentUserResponse.body.data.user.fullName,
            'Current User Student',
        );

        assert.deepEqual(
            currentUserResponse.body.data.user.roles,
            ['student'],
        );

        assert.equal(
            currentUserResponse.body.data.user.emailVerified,
            false,
        );

        assert.equal(
            'passwordHash'
            in currentUserResponse.body.data.user,
            false,
        );

        const missingTokenResponse = await request(app)
            .get('/api/v1/auth/me');

        assert.equal(
            missingTokenResponse.status,
            401,
        );

        assert.equal(
            missingTokenResponse.body.code,
            'AUTHENTICATION_REQUIRED',
        );

        const invalidTokenResponse = await request(app)
            .get('/api/v1/auth/me')
            .set(
                'Authorization',
                'Bearer invalid-token',
            );

        assert.equal(
            invalidTokenResponse.status,
            401,
        );

        assert.equal(
            invalidTokenResponse.body.code,
            'AUTHENTICATION_REQUIRED',
        );

        await databasePool.query({
            text: `
                UPDATE users
                SET is_active = FALSE
                WHERE email = $1
            `,
            values: [email],
        });

        const inactiveUserResponse = await request(app)
            .get('/api/v1/auth/me')
            .set(
                'Authorization',
                `Bearer ${accessToken}`,
            );

        assert.equal(
            inactiveUserResponse.status,
            401,
        );

        assert.equal(
            inactiveUserResponse.body.code,
            'AUTHENTICATION_REQUIRED',
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
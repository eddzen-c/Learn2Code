import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import request from 'supertest';

import app from '../../src/app.js';

import {
    closeDatabaseConnection,
    databasePool,
} from '../../src/config/database.js';

test('PATCH /api/v1/auth/me updates the profile', async () => {
    const email =
        `profile-${randomUUID()}@example.test`;

    const password =
        'Learn2Code-Profile-2026!';

    try {
        const registrationResponse = await request(app)
            .post('/api/v1/auth/register')
            .send({
                fullName: 'Original Student',
                email,
                password,
            });

        assert.equal(
            registrationResponse.status,
            201,
        );

        const accessToken =
            registrationResponse.body.data.accessToken;

        const updateResponse = await request(app)
            .patch('/api/v1/auth/me')
            .set(
                'Authorization',
                `Bearer ${accessToken}`,
            )
            .send({
                fullName: 'Updated Student',
                preferredLocale: 'en-US',
                preferredProgrammingLanguageId: 2,
            });

        assert.equal(updateResponse.status, 200);

        assert.equal(
            updateResponse.body.status,
            'success',
        );

        assert.equal(
            updateResponse.body.data.user.fullName,
            'Updated Student',
        );

        assert.equal(
            updateResponse.body.data.user
                .preferredLocale,
            'en-US',
        );

        assert.equal(
            updateResponse.body.data.user
                .preferredProgrammingLanguageId,
            2,
        );

        const databaseResult =
            await databasePool.query({
                text: `
                    SELECT
                        full_name,
                        preferred_locale,
                        preferred_programming_language_id
                    FROM users
                    WHERE email = $1
                `,
                values: [email],
            });

        assert.deepEqual(
            databaseResult.rows[0],
            {
                full_name: 'Updated Student',
                preferred_locale: 'en-US',
                preferred_programming_language_id:
                    2,
            },
        );

        const clearLanguageResponse =
            await request(app)
                .patch('/api/v1/auth/me')
                .set(
                    'Authorization',
                    `Bearer ${accessToken}`,
                )
                .send({
                    preferredProgrammingLanguageId:
                        null,
                });

        assert.equal(
            clearLanguageResponse.status,
            200,
        );

        assert.equal(
            clearLanguageResponse.body.data.user
                .preferredProgrammingLanguageId,
            null,
        );

        const invalidLanguageResponse =
            await request(app)
                .patch('/api/v1/auth/me')
                .set(
                    'Authorization',
                    `Bearer ${accessToken}`,
                )
                .send({
                    preferredProgrammingLanguageId:
                        999,
                });

        assert.equal(
            invalidLanguageResponse.status,
            400,
        );

        assert.equal(
            invalidLanguageResponse.body.code,
            'UNSUPPORTED_PROGRAMMING_LANGUAGE',
        );

        const emptyBodyResponse =
            await request(app)
                .patch('/api/v1/auth/me')
                .set(
                    'Authorization',
                    `Bearer ${accessToken}`,
                )
                .send({});

        assert.equal(emptyBodyResponse.status, 400);

        assert.equal(
            emptyBodyResponse.body.code,
            'VALIDATION_ERROR',
        );

        const anonymousResponse = await request(app)
            .patch('/api/v1/auth/me')
            .send({
                fullName: 'Unauthorized Update',
            });

        assert.equal(
            anonymousResponse.status,
            401,
        );

        assert.equal(
            anonymousResponse.body.code,
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
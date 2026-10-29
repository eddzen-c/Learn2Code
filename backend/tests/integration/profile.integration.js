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
    connectRedis,
    closeRedisConnection,
} from '../../src/config/redis.js';

test.before(async () => {
    await connectRedis();
});

test.after(async () => {
    await closeRedisConnection();
});

test('PATCH /api/v1/auth/me updates the profile', async () => {
    const email =
        `profile-${randomUUID()}@example.test`;

    const password =
        'Learn2Code-Profile-2026!';

    const username =
        `perfil_${randomUUID().replaceAll('-', '').slice(0, 12)}`;

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
                username,
                bio: 'Estoy aprendiendo desarrollo web.',
                githubUrl: 'https://github.com/learn2code',
                portfolioUrl: 'https://example.com/portfolio',
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


        assert.equal(
            updateResponse.body.data.user.username,
            username,
        );

        assert.equal(
            updateResponse.body.data.user.bio,
            'Estoy aprendiendo desarrollo web.',
        );

        assert.equal(
            updateResponse.body.data.user.githubUrl,
            'https://github.com/learn2code',
        );

        assert.equal(
            updateResponse.body.data.user.portfolioUrl,
            'https://example.com/portfolio',
        );

        // Volvemos a consultar el perfil desde la API.
        // Los datos deben seguir existiendo después del PATCH.
        const readResponse = await request(app)
            .get('/api/v1/auth/me')
            .set(
                'Authorization',
                `Bearer ${accessToken}`,
            );

        assert.equal(readResponse.status, 200);

        const savedUser = readResponse.body.data.user;

        assert.equal(savedUser.username, username);

        assert.equal(
            savedUser.bio,
            'Estoy aprendiendo desarrollo web.',
        );

        assert.equal(
            savedUser.githubUrl,
            'https://github.com/learn2code',
        );

        assert.equal(
            savedUser.portfolioUrl,
            'https://example.com/portfolio',
        );

        assert.equal(
            Object.hasOwn(savedUser, 'passwordHash'),
            false,
        );


        const databaseResult =
            await databasePool.query({
                text: `
                    SELECT
                        full_name,
                        preferred_locale,
                        preferred_programming_language_id,
                        username,
                        bio,
                        github_url,
                        portfolio_url
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
                preferred_programming_language_id: 2,
                username,
                bio: 'Estoy aprendiendo desarrollo web.',
                github_url: 'https://github.com/learn2code',
                portfolio_url: 'https://example.com/portfolio',
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
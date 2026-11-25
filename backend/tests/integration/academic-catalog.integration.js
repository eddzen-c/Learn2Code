
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import request from 'supertest';

import app from '../../src/app.js';

import {
    databasePool,
    closeDatabaseConnection,
} from '../../src/config/database.js';

import {
    connectRedis,
    closeRedisConnection,
} from '../../src/config/redis.js';

import {
    verifyIntegrationStudent,
} from '../helpers/verified-student.js';

test(
    'GET /api/v1/exercises/catalog consulta PostgreSQL y protege el acceso',
    async () => {
        const email =
            `academic-catalog-${randomUUID()}@example.test`;

        const password =
            'Learn2Code-Catalog-2026!';

        try {
            await connectRedis();

            const anonymousResponse = await request(app)
                .get('/api/v1/exercises/catalog');

            assert.equal(anonymousResponse.status, 401);
            assert.equal(
                anonymousResponse.body.code,
                'AUTHENTICATION_REQUIRED',
            );

            const registrationResponse = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    fullName: 'Catalog Integration Student',
                    email,
                    password,
                });

            assert.equal(
                registrationResponse.status,
                201,
                JSON.stringify(registrationResponse.body),
            );

            const {
                user,
                accessToken,
            } = registrationResponse.body.data;

            const authorization = `Bearer ${accessToken}`;

            const unverifiedResponse = await request(app)
                .get('/api/v1/exercises/catalog')
                .set('Authorization', authorization);

            assert.equal(unverifiedResponse.status, 403);
            assert.equal(
                unverifiedResponse.body.code,
                'EMAIL_NOT_VERIFIED',
            );

            await verifyIntegrationStudent({
                userId: user.id,
            });

            const response = await request(app)
                .get('/api/v1/exercises/catalog')
                .set('Authorization', authorization);

            assert.equal(
                response.status,
                200,
                JSON.stringify(response.body),
            );

            assert.equal(response.body.status, 'success');

            const catalog = response.body.data.specializations;

            assert.ok(Array.isArray(catalog));
            assert.equal(catalog.length, 4);

            const expected = await databasePool.query(`
                SELECT key, name
                FROM academic_specializations
                ORDER BY position
            `);

            assert.deepEqual(
                catalog.map(({ key, name }) => ({ key, name })),
                expected.rows,
            );

            const expectedStages = await databasePool.query(`
                SELECT
                    specialization_key,
                    COUNT(*)::INTEGER AS total
                FROM academic_stages
                WHERE status <> 'archived'
                GROUP BY specialization_key
            `);

            const stageCounts = new Map(
                expectedStages.rows.map(
                    (row) => [
                        row.specialization_key,
                        row.total,
                    ],
                ),
            );

            for (const specialization of catalog) {
                assert.equal(
                    specialization.stages.length,
                    stageCounts.get(specialization.key) ?? 0,
                );

                for (const stage of specialization.stages) {
                    assert.ok([
                        'planned',
                        'published',
                    ].includes(stage.status));

                    assert.ok(Array.isArray(stage.modules));

                    if (stage.status === 'planned') {
                        assert.equal(stage.modules.length, 0);
                    }
                }
            }

            const responseText = JSON.stringify(response.body);

            assert.doesNotMatch(
                responseText,
                /solutionCode|submittedCode|expectedOutput|passwordHash/,
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
                try {
                    await closeDatabaseConnection();
                } finally {
                    await closeRedisConnection();
                }
            }
        }
    },
);

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
    redisClient,
    connectRedis,
    closeRedisConnection,
} from '../../src/config/redis.js';

test(
    'registration consumes quota and resend respects account limit',
    async () => {
        const email =
            `quota-registration-${randomUUID()}@example.test`;

        let userId = null;

        try {
            await connectRedis();

            // 1. Registrar una cuenta temporal.
            const registration = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    fullName: 'Quota Test Student',
                    email,
                    password: 'Learn2Code-Test-2026!',
                });

            assert.equal(registration.status, 201);

            const {
                user,
                accessToken,
                emailVerification,
            } = registration.body.data;

            userId = user.id;

            assert.equal(user.emailVerified, false);
            assert.equal(emailVerification.requested, true);

            assert.equal(
                emailVerification.delivery.provider,
                'mock',
            );

            // 2. Comprobar que el registro
            // consumió una solicitud de Redis.
            const accountKey =
                `learn2code:verify-code:account:${userId}`;

            const accountCount =
                Number(await redisClient.get(accountKey));

            assert.equal(accountCount, 1);

            // 3. Simular una cuota agotada
            // sin hacer 11 solicitudes adicionales.
            await redisClient.set(
                accountKey,
                '12',
                { EX: 120 },
            );

            // 4. El reenvío debe ser rechazado
            // antes de generar otro código.
            const resend = await request(app)
                .post(
                    '/api/v1/auth/email-verification/code/request',
                )
                .set(
                    'Authorization',
                    `Bearer ${accessToken}`,
                )
                .send({});

            assert.equal(resend.status, 429);

            assert.equal(
                resend.body.code,
                'EMAIL_VERIFICATION_RATE_LIMITED',
            );

            assert.ok(
                Number(resend.headers['retry-after']) > 0,
            );

            // 5. El rechazo no debe aumentar
            // la cuota consumida.
            assert.equal(
                Number(await redisClient.get(accountKey)),
                12,
            );

            // 6. La cuenta debe permanecer
            // sin verificar.
            const userResult =
                await databasePool.query({
                    text: `
                        SELECT email_verified_at
                        FROM users
                        WHERE id = $1
                    `,
                    values: [userId],
                });

            assert.equal(
                userResult.rows[0].email_verified_at,
                null,
            );
        } finally {
            try {
                // Eliminar únicamente
                // los datos temporales de la prueba.
                await databasePool.query({
                    text: `
                        DELETE FROM users
                        WHERE email = $1
                    `,
                    values: [email],
                });

                if (redisClient.isOpen && userId) {
                    await redisClient.del(
                        `learn2code:verify-code:account:${userId}`,
                    );
                }
            } finally {
                await Promise.allSettled([
                    closeDatabaseConnection(),
                    closeRedisConnection(),
                ]);
            }
        }
    },
);

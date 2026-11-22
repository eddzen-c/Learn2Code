
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
    requestEmailVerificationCode,
} from '../../src/modules/auth/services/email-verification-code-flow.service.js';

test.before(async () => {
    await connectRedis();
});

test.after(async () => {
    await closeRedisConnection();
});

test(
    'learning resources require a verified email',
    async () => {
        const email =
            `verified-access-${randomUUID()}@example.test`;

        const protectedPaths = [
            '/api/v1/onboarding/options',
            '/api/v1/dashboard/summary',
            '/api/v1/diagnostics/current',
            '/api/v1/exercises/current',
            '/api/v1/gamification/badges',
        ];

        try {
            // Registrar una cuenta temporal.
            const registration = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    fullName: 'Verification Access Test',
                    email,
                    password: 'Learn2Code-Test-2026!',
                });

            assert.equal(registration.status, 201);

            const { user, accessToken } =
                registration.body.data;

            assert.equal(user.emailVerified, false);

            const authorization =
                `Bearer ${accessToken}`;

            // La cuenta pendiente debe poder
            // consultar su propio perfil.
            const profileBefore = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', authorization);

            assert.equal(profileBefore.status, 200);

            // Ninguna API de aprendizaje debe
            // permitir acceso antes de verificar.
            for (const path of protectedPaths) {
                const response = await request(app)
                    .get(path)
                    .set('Authorization', authorization);

                assert.equal(
                    response.status,
                    403,
                    `Expected 403 for ${path}. `
                    + `Received ${response.status}: `
                    + JSON.stringify(response.body),
                );

                assert.equal(
                    response.body.code,
                    'EMAIL_NOT_VERIFIED',
                );
            }

            // Preparar un código nuevo solamente
            // para esta cuenta temporal.
            await databasePool.query({
                text: `
                    DELETE FROM email_verification_codes
                    WHERE user_id = $1
                `,
                values: [user.id],
            });

            let verificationCode = null;

            await requestEmailVerificationCode({
                userId: user.id,

                sendMessage: async ({ code }) => {
                    verificationCode = code;

                    return {
                        provider: 'mock',
                        accepted: true,
                        simulated: true,
                    };
                },
            });

            assert.match(
                verificationCode,
                /^\d{6}$/,
            );

            // Confirmar la cuenta mediante el endpoint
            // real y el código correcto.
            const confirmation = await request(app)
                .post(
                    '/api/v1/auth/email-verification/code/confirm',
                )
                .set('Authorization', authorization)
                .send({
                    code: verificationCode,
                });

            assert.equal(confirmation.status, 200);

            assert.equal(
                confirmation.body.data.verified,
                true,
            );

            // El mismo token de acceso ya debe
            // permitir utilizar el onboarding.
            const onboarding = await request(app)
                .get('/api/v1/onboarding/options')
                .set('Authorization', authorization);

            assert.equal(onboarding.status, 200);
        } finally {
            // Limpiar solamente la cuenta temporal.
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
    },
);

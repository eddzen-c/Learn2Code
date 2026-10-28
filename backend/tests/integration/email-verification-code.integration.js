
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

import {
    hashEmailVerificationCode,
} from '../../src/modules/auth/services/email-verification-code.service.js';

import {
    getEmailVerificationCodeSecret,
} from '../../src/modules/auth/services/email-verification-code-secret.service.js';

const API = '/api/v1/auth';

test(
    'six-digit email verification works with PostgreSQL',
    async () => {
        // Esta prueba crea una cuenta temporal.
        // Solo debe ejecutarse con PostgreSQL local y correo mock.
        if (
            !['127.0.0.1', 'localhost'].includes(
                process.env.DB_HOST,
            )
            || (process.env.AUTH_EMAIL_PROVIDER ?? 'mock')
            !== 'mock'
            || process.env.NODE_ENV === 'production'
        ) {
            throw new Error(
                'Integration test requires local PostgreSQL, mock email and non-production mode',
            );
        }

        const email =
            `verification-code-${randomUUID()}@example.test`;

        let userId = null;

        try {
            await connectRedis();
            // 1. Registrar una cuenta temporal.
            const registration = await request(app)
                .post(`${API}/register`)
                .send({
                    fullName: 'Verification Code Test',
                    email,
                    password: 'Learn2Code-Integration-2026!',
                });

            assert.equal(
                registration.status,
                201,
                JSON.stringify(registration.body),
            );

            userId = registration.body.data.user.id;

            const accessToken =
                registration.body.data.accessToken;

            const authorization =
                `Bearer ${accessToken}`;

            // 2. Impedir solicitudes sin autenticación.
            const unauthorized = await request(app)
                .post(`${API}/email-verification/code/request`)
                .send({});

            assert.equal(unauthorized.status, 401);

            // 3. Solicitar un código.

            // 3. El registro debe solicitar el código
            // automáticamente, sin intervención del usuario.
            const initialVerification =
                registration.body.data.emailVerification;

            assert.equal(
                initialVerification.requested,
                true,
            );

            assert.equal(
                initialVerification.alreadyVerified,
                false,
            );

            assert.equal(
                initialVerification.delivery.provider,
                'mock',
            );

            assert.equal(
                initialVerification.delivery.simulated,
                true,
            );

            // El código nunca debe aparecer en la respuesta.
            assert.equal(
                'code' in initialVerification,
                false,
            );

            // La cuenta debe seguir sin verificar.
            const pendingUser = await request(app)
                .get(`${API}/me`)
                .set('Authorization', authorization);

            assert.equal(pendingUser.status, 200);

            assert.equal(
                pendingUser.body.data.user.emailVerified,
                false,
            );

            // Un enlace antiguo tampoco debe verificarla.
            const legacyAttempt = await request(app)
                .post(`${API}/email-verification/confirm`)
                .send({
                    token: 'old-verification-token',
                });

            assert.equal(legacyAttempt.status, 410);

            // 4. Comprobar el tiempo de espera de reenvío.
            const cooldown = await request(app)
                .post(`${API}/email-verification/code/request`)
                .set('Authorization', authorization)
                .send({});

            assert.equal(cooldown.status, 429);

            assert.equal(
                cooldown.body.code,
                'EMAIL_VERIFICATION_CODE_COOLDOWN',
            );

            // 5. Comprobar que PostgreSQL guardó una huella.
            const stored = await databasePool.query({
                text: `
                    SELECT
                        code_hash,
                        failed_attempts,
                        used_at
                    FROM email_verification_codes
                    WHERE user_id = $1
                `,
                values: [userId],
            });

            assert.equal(stored.rowCount, 1);

            assert.match(
                stored.rows[0].code_hash,
                /^[0-9a-f]{64}$/,
            );

            assert.equal(
                stored.rows[0].failed_attempts,
                0,
            );

            // En modo mock no recibimos el código por correo.
            // Asignamos uno conocido SOLO a esta cuenta temporal.
            const testCode = '000042';

            const testCodeHash =
                hashEmailVerificationCode({
                    userId,
                    code: testCode,
                    secret:
                        getEmailVerificationCodeSecret(),
                });

            await databasePool.query({
                text: `
                    UPDATE email_verification_codes
                    SET code_hash = $2
                    WHERE user_id = $1
                `,
                values: [
                    userId,
                    testCodeHash,
                ],
            });

            // 6. Rechazar un código incorrecto.
            const incorrect = await request(app)
                .post(`${API}/email-verification/code/confirm`)
                .set('Authorization', authorization)
                .send({
                    code: '999999',
                });

            assert.equal(incorrect.status, 400);

            assert.equal(
                incorrect.body.code,
                'INVALID_EMAIL_VERIFICATION_CODE',
            );

            const attemptResult =
                await databasePool.query({
                    text: `
                        SELECT failed_attempts
                        FROM email_verification_codes
                        WHERE user_id = $1
                    `,
                    values: [userId],
                });

            assert.equal(
                attemptResult.rows[0].failed_attempts,
                1,
            );


            // Comprobar el bloqueo después de cinco errores.
            for (let attempt = 0; attempt < 4; attempt++) {
                const failed = await request(app)
                    .post(`${API}/email-verification/code/confirm`)
                    .set('Authorization', authorization)
                    .send({ code: '999999' });

                assert.equal(failed.status, 400);
            }

            const blocked = await request(app)
                .post(`${API}/email-verification/code/confirm`)
                .set('Authorization', authorization)
                .send({ code: testCode });

            assert.equal(blocked.status, 400);

            const attempts = await databasePool.query({
                text: `
                    SELECT failed_attempts
                    FROM email_verification_codes
                    WHERE user_id = $1
                `,
                values: [userId],
            });

            assert.equal(
                attempts.rows[0].failed_attempts,
                5,
            );

            // Preparar un código vencido, solo para esta prueba.
            await databasePool.query({
                text: `
                    UPDATE email_verification_codes
                    SET
                        failed_attempts = 0,
                        created_at = NOW() - INTERVAL '20 minutes',
                        expires_at = NOW() - INTERVAL '10 minutes'
                    WHERE user_id = $1
                `,
                values: [userId],
            });

            const expired = await request(app)
                .post(`${API}/email-verification/code/confirm`)
                .set('Authorization', authorization)
                .send({ code: testCode });

            assert.equal(expired.status, 400);

            // Restaurar un código válido para la siguiente prueba.
            await databasePool.query({
                text: `
                    UPDATE email_verification_codes
                    SET
                        failed_attempts = 0,
                        created_at = NOW(),
                        expires_at = NOW() + INTERVAL '10 minutes'
                    WHERE user_id = $1
                `,
                values: [userId],
            });

            // 7. Confirmar el código correcto.

            // 7. Dos confirmaciones simultáneas:
            // solamente una debe ser aceptada.
            const confirmations = await Promise.all([
                request(app)
                    .post(`${API}/email-verification/code/confirm`)
                    .set('Authorization', authorization)
                    .send({ code: testCode }),

                request(app)
                    .post(`${API}/email-verification/code/confirm`)
                    .set('Authorization', authorization)
                    .send({ code: testCode }),
            ]);

            const statuses = confirmations
                .map((response) => response.status)
                .sort((a, b) => a - b);

            assert.deepEqual(statuses, [200, 400]);

            const confirmed = confirmations.find(
                (response) => response.status === 200,
            );

            assert.equal(
                confirmed.body.data.verified,
                true,
            );

            assert.equal(
                confirmed.body.data.user.email,
                email,
            );


            // 8. Impedir reutilizar el código.
            const reused = await request(app)
                .post(`${API}/email-verification/code/confirm`)
                .set('Authorization', authorization)
                .send({
                    code: testCode,
                });

            assert.equal(reused.status, 400);

            // 9. Comprobar el estado real de la cuenta.
            const currentUser = await request(app)
                .get(`${API}/me`)
                .set('Authorization', authorization);

            assert.equal(currentUser.status, 200);

            assert.equal(
                currentUser.body.data.user.emailVerified,
                true,
            );

            // 10. Una cuenta verificada no necesita otro código.
            const alreadyVerified = await request(app)
                .post(`${API}/email-verification/code/request`)
                .set('Authorization', authorization)
                .send({});

            assert.equal(alreadyVerified.status, 200);

            assert.equal(
                alreadyVerified.body.data.alreadyVerified,
                true,
            );
        } finally {
            // Eliminar la cuenta temporal incluso si falla
            // alguna de las comprobaciones.
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

        test.after(async () => {
            await closeRedisConnection();
        });
    },
);
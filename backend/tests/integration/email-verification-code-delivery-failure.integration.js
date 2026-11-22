
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
    requestEmailVerificationCode,
    confirmEmailVerificationCode,
} from '../../src/modules/auth/services/email-verification-code-flow.service.js';

import {
    markEmailVerificationCodeDeliveryFailed,
} from '../../src/modules/auth/repositories/email-verification-code.repository.js';

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

test(
    'failed email delivery allows a safe retry with PostgreSQL',
    async () => {
        const email =
            `delivery-test-${randomUUID()}@example.test`;

        let userId;

        try {
            // 1. Crear una cuenta temporal.
            const registration = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    fullName: 'Delivery Test Student',
                    email,
                    password: 'Learn2Code-Test-2026!',
                });

            assert.equal(registration.status, 201);

            userId = registration.body.data.user.id;

            assert.equal(
                registration.body.data.user.emailVerified,
                false,
            );

            // 2. Eliminar únicamente el código
            // automático de esta cuenta temporal.
            await databasePool.query({
                text: `
                    DELETE FROM email_verification_codes
                    WHERE user_id = $1
                `,
                values: [userId],
            });

            // 3. Simular que Resend rechaza un correo.
            const deliveryError =
                new Error('Simulated Resend rejection');

            let failedCode;

            const initialTime = new Date();

            await assert.rejects(
                () => requestEmailVerificationCode({
                    userId,
                    now: initialTime,

                    sendMessage: async ({ code }) => {
                        failedCode = code;
                        throw deliveryError;
                    },
                }),
                (error) => error === deliveryError,
            );

            assert.match(failedCode, /^\d{6}$/);

            // 4. Comprobar que PostgreSQL
            // invalidó el código fallido.
            const failedResult =
                await databasePool.query({
                    text: `
                        SELECT
                            code_hash,
                            created_at,
                            expires_at,
                            used_at
                        FROM email_verification_codes
                        WHERE user_id = $1
                    `,
                    values: [userId],
                });

            assert.equal(failedResult.rowCount, 1);

            const failedRecord =
                failedResult.rows[0];

            assert.equal(failedRecord.used_at, null);

            assert.ok(
                failedRecord.expires_at.getTime()
                <= Date.now(),
            );

            // El código rechazado no puede
            // verificar la cuenta.
            await assert.rejects(
                () => confirmEmailVerificationCode({
                    userId,
                    code: failedCode,
                }),
                (error) =>
                    error.code ===
                    'INVALID_EMAIL_VERIFICATION_CODE',
            );

            // 5. Simular un reintento antes
            // de cumplir los 10 segundos.
            const earlyTime = new Date(
                failedRecord.expires_at.getTime()
                + 9_000,
            );

            let unexpectedSend = false;

            await assert.rejects(
                () => requestEmailVerificationCode({
                    userId,
                    now: earlyTime,

                    sendMessage: async () => {
                        unexpectedSend = true;
                        return {
                            provider: 'mock',
                            accepted: true,
                            simulated: true,
                        };
                    },
                }),
                (error) =>
                    error.code ===
                    'EMAIL_VERIFICATION_CODE_COOLDOWN',
            );

            assert.equal(unexpectedSend, false);

            // 6. Simular el reintento después
            // de los 10 segundos.
            const retryTime = new Date(
                failedRecord.expires_at.getTime()
                + 11_000,
            );

            let newCode;

            const retry = await requestEmailVerificationCode({
                userId,
                now: retryTime,

                sendMessage: async ({ code }) => {
                    newCode = code;

                    return {
                        provider: 'mock',
                        accepted: true,
                        simulated: true,
                    };
                },
            });

            assert.equal(retry.requested, true);
            assert.equal(retry.delivery.accepted, true);
            assert.match(newCode, /^\d{6}$/);

            // 7. Un fallo atrasado no debe
            // invalidar el código más reciente.
            const staleInvalidation =
                await markEmailVerificationCodeDeliveryFailed({
                    userId,
                    codeHash: failedRecord.code_hash,
                    createdAt: failedRecord.created_at,
                    failedAt: new Date(
                        retryTime.getTime() + 1_000,
                    ),
                });

            assert.equal(staleInvalidation, false);

            // 8. Confirmar el nuevo código.
            const confirmation =
                await confirmEmailVerificationCode({
                    userId,
                    code: newCode,
                    now: new Date(
                        retryTime.getTime() + 2_000,
                    ),
                });

            assert.equal(confirmation.verified, true);

            const verifiedUser =
                await databasePool.query({
                    text: `
                        SELECT email_verified_at
                        FROM users
                        WHERE id = $1
                    `,
                    values: [userId],
                });

            assert.ok(
                verifiedUser.rows[0].email_verified_at
                instanceof Date,
            );
        } finally {
            // Eliminar exclusivamente
            // la cuenta temporal de esta prueba.
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

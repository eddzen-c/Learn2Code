import assert from 'node:assert/strict';

import {
    randomBytes,
    randomUUID,
} from 'node:crypto';

import test from 'node:test';

import {
    databasePool,
} from '../../../config/database.js';

import {
    createUserRecord,
} from '../repositories/user.repository.js';

import {
    createRefreshTokenRecord,
} from '../repositories/refresh-token.repository.js';

import {
    hashPassword,
} from '../services/password.service.js';

import {
    hashEmailChangeCode,
    requestCurrentUserEmailChange,
    confirmCurrentUserEmailChange,
} from '../services/email-change.service.js';

const CURRENT_PASSWORD = 'Integracion123!';

const TEST_SECRET =
    'learn2code-email-change-integration-secret-2026';

// Cerrar la conexión cuando terminen todas las pruebas.
test.after(async () => {
    await databasePool.end();
});

// ============================================================
// PRUEBA REAL CON POSTGRESQL
// ============================================================

test(
    'email change completes securely with PostgreSQL',
    async () => {
        const identifier = randomUUID();

        const currentEmail =
            `email-change-${identifier}@example.invalid`;

        const newEmail =
            `email-changed-${identifier}@example.invalid`;

        let userId = null;

        try {
            // ------------------------------------------------
            // 1. CREAR USUARIO TEMPORAL
            // ------------------------------------------------

            const passwordHash =
                await hashPassword(CURRENT_PASSWORD);

            const user = await createUserRecord({
                fullName: 'Prueba Temporal Cambio Correo',
                email: currentEmail,
                passwordHash,
            });

            userId = user.id;

            // Marcar la cuenta temporal como verificada.
            await databasePool.query({
                text: `
                    UPDATE users
                    SET email_verified_at = NOW()
                    WHERE id = $1
                `,
                values: [userId],
            });

            // Crear token de renovación temporal.
            const refreshToken =
                await createRefreshTokenRecord({
                    userId,
                    tokenHash: randomBytes(32).toString('hex'),
                    expiresAt: new Date(
                        Date.now() + 24 * 60 * 60 * 1000,
                    ),
                });

            assert.ok(refreshToken.id);

            // ------------------------------------------------
            // 2. SOLICITAR CAMBIO DE CORREO
            // ------------------------------------------------

            const sentMessages = [];

            const requested =
                await requestCurrentUserEmailChange({
                    userId,
                    newEmail,
                    currentPassword: CURRENT_PASSWORD,

                    getSecret: () => TEST_SECRET,

                    sendMessage: async (message) => {
                        sentMessages.push(message);

                        return {
                            provider: 'mock',
                            accepted: true,
                            simulated: true,
                        };
                    },
                });

            assert.equal(requested.requested, true);
            assert.equal(requested.newEmail, newEmail);
            assert.equal(sentMessages.length, 1);

            const code = sentMessages[0].code;

            assert.match(code, /^\d{6}$/);
            assert.equal(
                sentMessages[0].recipientEmail,
                newEmail,
            );

            // ------------------------------------------------
            // 3. VERIFICAR QUE NO SE CAMBIO EL CORREO AUN
            // ------------------------------------------------

            const beforeConfirmation =
                await databasePool.query({
                    text: `
                        SELECT email
                        FROM users
                        WHERE id = $1
                    `,
                    values: [userId],
                });

            assert.equal(
                beforeConfirmation.rows[0].email,
                currentEmail,
            );

            const pending =
                await databasePool.query({
                    text: `
                        SELECT
                            new_email,
                            code_hash,
                            failed_attempts,
                            used_at
                        FROM email_change_requests
                        WHERE user_id = $1
                    `,
                    values: [userId],
                });

            assert.equal(pending.rows.length, 1);

            assert.equal(
                pending.rows[0].new_email,
                newEmail,
            );

            assert.equal(
                pending.rows[0].code_hash,
                hashEmailChangeCode({
                    userId,
                    newEmail,
                    code,
                    secret: TEST_SECRET,
                }),
            );

            assert.equal(
                pending.rows[0].failed_attempts,
                0,
            );

            assert.equal(
                pending.rows[0].used_at,
                null,
            );

            // ------------------------------------------------
            // 4. INTENTAR CONFIRMAR CON UN CODIGO INCORRECTO
            // ------------------------------------------------

            const incorrectCode =
                code === '000000'
                    ? '999999'
                    : '000000';

            await assert.rejects(
                confirmCurrentUserEmailChange({
                    userId,
                    code: incorrectCode,
                    getSecret: () => TEST_SECRET,
                }),
                {
                    code: 'INVALID_EMAIL_CHANGE_CODE',
                    statusCode: 400,
                },
            );

            const failedAttempt =
                await databasePool.query({
                    text: `
                        SELECT failed_attempts
                        FROM email_change_requests
                        WHERE user_id = $1
                    `,
                    values: [userId],
                });

            assert.equal(
                failedAttempt.rows[0].failed_attempts,
                1,
            );

            // ------------------------------------------------
            // 5. CONFIRMAR CON EL CODIGO CORRECTO
            // ------------------------------------------------

            const confirmed =
                await confirmCurrentUserEmailChange({
                    userId,
                    code,
                    getSecret: () => TEST_SECRET,
                });

            assert.equal(confirmed.changed, true);
            assert.equal(confirmed.user.email, newEmail);

            const updatedUser =
                await databasePool.query({
                    text: `
                        SELECT
                            email,
                            email_verified_at
                        FROM users
                        WHERE id = $1
                    `,
                    values: [userId],
                });

            assert.equal(
                updatedUser.rows[0].email,
                newEmail,
            );

            assert.ok(
                updatedUser.rows[0].email_verified_at,
            );

            // ------------------------------------------------
            // 6. VERIFICAR QUE EL CODIGO QUEDO UTILIZADO
            // ------------------------------------------------

            const usedRequest =
                await databasePool.query({
                    text: `
                        SELECT used_at
                        FROM email_change_requests
                        WHERE user_id = $1
                    `,
                    values: [userId],
                });

            assert.ok(
                usedRequest.rows[0].used_at,
            );

            await assert.rejects(
                confirmCurrentUserEmailChange({
                    userId,
                    code,
                    getSecret: () => TEST_SECRET,
                }),
                {
                    code: 'INVALID_EMAIL_CHANGE_CODE',
                    statusCode: 400,
                },
            );

            // ------------------------------------------------
            // 7. COMPROBAR REVOCACION DEL TOKEN
            // ------------------------------------------------

            const tokenResult =
                await databasePool.query({
                    text: `
                        SELECT revoked_at
                        FROM refresh_tokens
                        WHERE id = $1
                    `,
                    values: [refreshToken.id],
                });

            assert.ok(
                tokenResult.rows[0].revoked_at,
            );
        } finally {
            // ------------------------------------------------
            // 8. ELIMINAR EXCLUSIVAMENTE LA CUENTA TEMPORAL
            // ------------------------------------------------

            if (userId) {
                await databasePool.query({
                    text: `
                        DELETE FROM users
                        WHERE id = $1
                          AND email IN (
                              $2::citext,
                              $3::citext
                          )
                    `,
                    values: [
                        userId,
                        currentEmail,
                        newEmail,
                    ],
                });
            }
        }
    },
);

// ============================================================
// PRUEBA DE INTEGRACION: CODIGO CADUCADO
// ============================================================

test(
    'expired email change codes cannot update the user in PostgreSQL',
    async () => {
        const identifier = randomUUID();

        const currentEmail =
            `email-expired-${identifier}@example.invalid`;

        const newEmail =
            `email-expired-new-${identifier}@example.invalid`;

        let userId = null;

        try {
            // ------------------------------------------------
            // 1. CREAR CUENTA TEMPORAL
            // ------------------------------------------------

            const passwordHash =
                await hashPassword(CURRENT_PASSWORD);

            const user = await createUserRecord({
                fullName: 'Prueba Temporal Correo Caducado',
                email: currentEmail,
                passwordHash,
            });

            userId = user.id;

            await databasePool.query({
                text: `
                    UPDATE users
                    SET email_verified_at = NOW()
                    WHERE id = $1
                `,
                values: [userId],
            });

            // ------------------------------------------------
            // 2. GENERAR SOLICITUD CON FECHA PASADA
            // ------------------------------------------------

            const twentyMinutesAgo =
                new Date(Date.now() - 20 * 60 * 1000);

            let generatedCode = null;

            const requested =
                await requestCurrentUserEmailChange({
                    userId,
                    newEmail,
                    currentPassword: CURRENT_PASSWORD,
                    now: twentyMinutesAgo,

                    getSecret: () => TEST_SECRET,

                    sendMessage: async (message) => {
                        generatedCode = message.code;

                        return {
                            provider: 'mock',
                            accepted: true,
                            simulated: true,
                        };
                    },
                });

            assert.equal(requested.requested, true);
            assert.match(generatedCode, /^\d{6}$/);

            assert.ok(
                requested.expiresAt.getTime()
                < Date.now(),
            );

            // ------------------------------------------------
            // 3. RECHAZAR CONFIRMACION CADUCADA
            // ------------------------------------------------

            await assert.rejects(
                confirmCurrentUserEmailChange({
                    userId,
                    code: generatedCode,
                    getSecret: () => TEST_SECRET,
                }),
                {
                    code: 'INVALID_EMAIL_CHANGE_CODE',
                    statusCode: 400,
                },
            );

            // ------------------------------------------------
            // 4. COMPROBAR EL CORREO ORIGINAL
            // ------------------------------------------------

            const userResult =
                await databasePool.query({
                    text: `
                        SELECT email
                        FROM users
                        WHERE id = $1
                    `,
                    values: [userId],
                });

            assert.equal(
                userResult.rows[0].email,
                currentEmail,
            );

            // ------------------------------------------------
            // 5. COMPROBAR QUE NO SE CONSUMIO EL CODIGO
            // ------------------------------------------------

            const pendingResult =
                await databasePool.query({
                    text: `
                        SELECT
                            used_at,
                            failed_attempts
                        FROM email_change_requests
                        WHERE user_id = $1
                    `,
                    values: [userId],
                });

            assert.equal(
                pendingResult.rows[0].used_at,
                null,
            );

            assert.equal(
                pendingResult.rows[0].failed_attempts,
                0,
            );
        } finally {
            // ------------------------------------------------
            // 6. ELIMINAR LA CUENTA TEMPORAL
            // ------------------------------------------------

            if (userId) {
                await databasePool.query({
                    text: `
                        DELETE FROM users
                        WHERE id = $1
                          AND email = $2::citext
                    `,
                    values: [
                        userId,
                        currentEmail,
                    ],
                });
            }
        }
    },
);

// ============================================================
// PRUEBA DE INTEGRACION: CORREO DUPLICADO
// ============================================================

test(
    'duplicate email conflicts roll back the change in PostgreSQL',
    async () => {
        const identifier = randomUUID();

        const currentEmail =
            `email-conflict-${identifier}@example.invalid`;

        const newEmail =
            `email-conflict-new-${identifier}@example.invalid`;

        let userId = null;
        let competingUserId = null;

        try {
            // ------------------------------------------------
            // 1. CREAR EL USUARIO QUE SOLICITA EL CAMBIO
            // ------------------------------------------------

            const passwordHash =
                await hashPassword(CURRENT_PASSWORD);

            const user = await createUserRecord({
                fullName: 'Prueba Temporal Conflicto A',
                email: currentEmail,
                passwordHash,
            });

            userId = user.id;

            await databasePool.query({
                text: `
                    UPDATE users
                    SET email_verified_at = NOW()
                    WHERE id = $1
                `,
                values: [userId],
            });

            // Crear una sesion que NO debe revocarse
            // cuando la confirmacion falle.
            const refreshToken =
                await createRefreshTokenRecord({
                    userId,
                    tokenHash: randomBytes(32).toString('hex'),
                    expiresAt: new Date(
                        Date.now() + 24 * 60 * 60 * 1000,
                    ),
                });

            assert.ok(refreshToken.id);

            // ------------------------------------------------
            // 2. SOLICITAR EL CAMBIO DE CORREO
            // ------------------------------------------------

            let generatedCode = null;

            const requested =
                await requestCurrentUserEmailChange({
                    userId,
                    newEmail,
                    currentPassword: CURRENT_PASSWORD,

                    getSecret: () => TEST_SECRET,

                    sendMessage: async (message) => {
                        generatedCode = message.code;

                        return {
                            provider: 'mock',
                            accepted: true,
                            simulated: true,
                        };
                    },
                });

            assert.equal(requested.requested, true);

            assert.match(
                generatedCode,
                /^\d{6}$/,
            );

            // ------------------------------------------------
            // 3. OTRO USUARIO REGISTRA EL CORREO PENDIENTE
            // ------------------------------------------------

            const competingUser =
                await createUserRecord({
                    fullName: 'Prueba Temporal Conflicto B',
                    email: newEmail,
                    passwordHash,
                });

            competingUserId = competingUser.id;

            // ------------------------------------------------
            // 4. RECHAZAR LA CONFIRMACION POR DUPLICADO
            // ------------------------------------------------

            await assert.rejects(
                confirmCurrentUserEmailChange({
                    userId,
                    code: generatedCode,
                    getSecret: () => TEST_SECRET,
                }),
                {
                    code: 'EMAIL_ALREADY_IN_USE',
                    statusCode: 409,
                },
            );

            // ------------------------------------------------
            // 5. VERIFICAR QUE NINGUN CORREO SE MODIFICO
            // ------------------------------------------------

            const userResult =
                await databasePool.query({
                    text: `
                        SELECT id, email
                        FROM users
                        WHERE id IN ($1, $2)
                    `,
                    values: [
                        userId,
                        competingUserId,
                    ],
                });

            assert.equal(userResult.rows.length, 2);

            const emailsById = new Map(
                userResult.rows.map((row) => [
                    row.id,
                    row.email,
                ]),
            );

            assert.equal(
                emailsById.get(userId),
                currentEmail,
            );

            assert.equal(
                emailsById.get(competingUserId),
                newEmail,
            );

            // ------------------------------------------------
            // 6. VERIFICAR QUE LA SOLICITUD NO SE CONSUMIO
            // ------------------------------------------------

            const pendingResult =
                await databasePool.query({
                    text: `
                        SELECT
                            used_at,
                            failed_attempts
                        FROM email_change_requests
                        WHERE user_id = $1
                    `,
                    values: [userId],
                });

            assert.equal(
                pendingResult.rows.length,
                1,
            );

            assert.equal(
                pendingResult.rows[0].used_at,
                null,
            );

            assert.equal(
                pendingResult.rows[0].failed_attempts,
                0,
            );

            // ------------------------------------------------
            // 7. VERIFICAR QUE NO SE REVOCARON LAS SESIONES
            // ------------------------------------------------

            const tokenResult =
                await databasePool.query({
                    text: `
                        SELECT revoked_at
                        FROM refresh_tokens
                        WHERE id = $1
                    `,
                    values: [refreshToken.id],
                });

            assert.equal(
                tokenResult.rows.length,
                1,
            );

            assert.equal(
                tokenResult.rows[0].revoked_at,
                null,
            );
        } finally {
            // ------------------------------------------------
            // 8. ELIMINAR EXCLUSIVAMENTE LOS USUARIOS DE PRUEBA
            // ------------------------------------------------

            if (competingUserId) {
                await databasePool.query({
                    text: `
                        DELETE FROM users
                        WHERE id = $1
                          AND email = $2::citext
                    `,
                    values: [
                        competingUserId,
                        newEmail,
                    ],
                });
            }

            if (userId) {
                await databasePool.query({
                    text: `
                        DELETE FROM users
                        WHERE id = $1
                          AND email = $2::citext
                    `,
                    values: [
                        userId,
                        currentEmail,
                    ],
                });
            }
        }
    },
);

// ============================================================
// PRUEBA DE INTEGRACION: LIMITE DE CINCO INTENTOS
// ============================================================

test(
    'email change is blocked after five incorrect codes in PostgreSQL',
    async () => {
        const identifier = randomUUID();

        const currentEmail =
            `email-attempts-${identifier}@example.invalid`;

        const newEmail =
            `email-attempts-new-${identifier}@example.invalid`;

        let userId = null;

        try {
            // ------------------------------------------------
            // 1. CREAR CUENTA TEMPORAL
            // ------------------------------------------------

            const passwordHash =
                await hashPassword(CURRENT_PASSWORD);

            const user = await createUserRecord({
                fullName: 'Prueba Temporal Limite Intentos',
                email: currentEmail,
                passwordHash,
            });

            userId = user.id;

            await databasePool.query({
                text: `
                    UPDATE users
                    SET email_verified_at = NOW()
                    WHERE id = $1
                `,
                values: [userId],
            });

            // ------------------------------------------------
            // 2. SOLICITAR CAMBIO DE CORREO
            // ------------------------------------------------

            let generatedCode = null;

            const requested =
                await requestCurrentUserEmailChange({
                    userId,
                    newEmail,
                    currentPassword: CURRENT_PASSWORD,

                    getSecret: () => TEST_SECRET,

                    sendMessage: async (message) => {
                        generatedCode = message.code;

                        return {
                            provider: 'mock',
                            accepted: true,
                            simulated: true,
                        };
                    },
                });

            assert.equal(requested.requested, true);

            assert.match(
                generatedCode,
                /^\d{6}$/,
            );

            // ------------------------------------------------
            // 3. PREPARAR UN CODIGO INCORRECTO
            // ------------------------------------------------

            const incorrectCode =
                generatedCode === '000000'
                    ? '999999'
                    : '000000';

            // ------------------------------------------------
            // 4. REALIZAR CINCO INTENTOS INCORRECTOS
            // ------------------------------------------------

            for (
                let attempt = 1;
                attempt <= 5;
                attempt += 1
            ) {
                await assert.rejects(
                    confirmCurrentUserEmailChange({
                        userId,
                        code: incorrectCode,
                        getSecret: () => TEST_SECRET,
                    }),
                    {
                        code: 'INVALID_EMAIL_CHANGE_CODE',
                        statusCode: 400,
                    },
                );

                const attemptResult =
                    await databasePool.query({
                        text: `
                            SELECT failed_attempts
                            FROM email_change_requests
                            WHERE user_id = $1
                        `,
                        values: [userId],
                    });

                assert.equal(
                    attemptResult.rows[0].failed_attempts,
                    attempt,
                );
            }

            // ------------------------------------------------
            // 5. INTENTAR UTILIZAR EL CODIGO CORRECTO
            // ------------------------------------------------

            await assert.rejects(
                confirmCurrentUserEmailChange({
                    userId,
                    code: generatedCode,
                    getSecret: () => TEST_SECRET,
                }),
                {
                    code: 'INVALID_EMAIL_CHANGE_CODE',
                    statusCode: 400,
                },
            );

            // ------------------------------------------------
            // 6. VERIFICAR QUE LA CUENTA NO CAMBIO
            // ------------------------------------------------

            const userResult =
                await databasePool.query({
                    text: `
                        SELECT email
                        FROM users
                        WHERE id = $1
                    `,
                    values: [userId],
                });

            assert.equal(
                userResult.rows[0].email,
                currentEmail,
            );

            // ------------------------------------------------
            // 7. CONFIRMAR QUE LA SOLICITUD SIGUE BLOQUEADA
            // ------------------------------------------------

            const pendingResult =
                await databasePool.query({
                    text: `
                        SELECT
                            failed_attempts,
                            used_at
                        FROM email_change_requests
                        WHERE user_id = $1
                    `,
                    values: [userId],
                });

            assert.equal(
                pendingResult.rows[0].failed_attempts,
                5,
            );

            assert.equal(
                pendingResult.rows[0].used_at,
                null,
            );
        } finally {
            // ------------------------------------------------
            // 8. ELIMINAR EXCLUSIVAMENTE LA CUENTA TEMPORAL
            // ------------------------------------------------

            if (userId) {
                await databasePool.query({
                    text: `
                        DELETE FROM users
                        WHERE id = $1
                          AND email = $2::citext
                    `,
                    values: [
                        userId,
                        currentEmail,
                    ],
                });
            }
        }
    },
);
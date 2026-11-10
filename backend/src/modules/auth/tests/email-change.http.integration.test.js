import 'dotenv/config';

import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import test from 'node:test';

import request from 'supertest';

// Configurar el proveedor simulado antes de importar
// los modulos de Learn2Code.
process.env.AUTH_EMAIL_PROVIDER = 'mock';

const { default: app } =
    await import('../../../app.js');

const { env } =
    await import('../../../config/env.js');

const { databasePool } =
    await import('../../../config/database.js');

const {
    connectRedis,
    closeRedisConnection,
} = await import('../../../config/redis.js');

const {
    createUserRecord,
} = await import('../repositories/user.repository.js');

const {
    createRefreshTokenRecord,
} = await import('../repositories/refresh-token.repository.js');

const {
    hashPassword,
} = await import('../services/password.service.js');

const {
    createAccessToken,
} = await import('../services/access-token.service.js');

const {
    hashEmailChangeCode,
} = await import('../services/email-change.service.js');

const {
    getEmailVerificationCodeSecret,
} = await import(
    '../services/email-verification-code-secret.service.js'
);

const requestEndpoint =
    '/api/v1/auth/me/email-change/request';

const confirmEndpoint =
    '/api/v1/auth/me/email-change/confirm';

const CURRENT_PASSWORD = 'IntegracionHTTP123!';

// ============================================================
// PREPARAR Y CERRAR CONEXIONES
// ============================================================

test.before(async () => {
    assert.equal(env.authEmail.provider, 'mock');
    await connectRedis();
});

test.after(async () => {
    try {
        await closeRedisConnection();
    } finally {
        await databasePool.end();
    }
});

// ============================================================
// RECORRIDO HTTP COMPLETO
// ============================================================

test(
    'email change succeeds over HTTP with PostgreSQL and Redis',
    async () => {
        const identifier = randomUUID();

        const currentEmail =
            `http-email-${identifier}@example.invalid`;

        const newEmail =
            `http-email-new-${identifier}@example.invalid`;

        const testCode = '042913';

        let userId = null;

        try {
            // 1. Crear usuario temporal.

            const passwordHash =
                await hashPassword(CURRENT_PASSWORD);

            const user = await createUserRecord({
                fullName: 'Prueba HTTP Cambio Correo',
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

            const token = await createAccessToken({
                userId,
                roles: ['student'],
            });

            const authorization = `Bearer ${token}`;

            // 2. Crear sesión temporal para comprobar
            // que se revoque al confirmar.

            const refreshToken =
                await createRefreshTokenRecord({
                    userId,
                    tokenHash: randomBytes(32).toString('hex'),
                    expiresAt: new Date(
                        Date.now() + 24 * 60 * 60 * 1000,
                    ),
                });

            assert.ok(refreshToken.id);

            // 3. Solicitar el cambio por HTTP.

            const requested = await request(app)
                .post(requestEndpoint)
                .set('Authorization', authorization)
                .send({
                    newEmail,
                    currentPassword: CURRENT_PASSWORD,
                });

            assert.equal(requested.status, 202);

            assert.equal(
                requested.body.data.requested,
                true,
            );

            assert.equal(
                requested.body.data.newEmail,
                newEmail,
            );

            assert.deepEqual(
                requested.body.data.delivery,
                {
                    provider: 'mock',
                    accepted: true,
                    simulated: true,
                },
            );

            assert.equal(
                requested.body.data.code,
                undefined,
            );

            // 4. Verificar que el correo original
            // permanezca intacto antes de confirmar.

            const before = await databasePool.query({
                text: `
                    SELECT email
                    FROM users
                    WHERE id = $1
                `,
                values: [userId],
            });

            assert.equal(
                before.rows[0].email,
                currentEmail,
            );

            // 5. Sustituir exclusivamente el hash
            // de la solicitud temporal por el hash
            // de un código conocido para esta prueba.
            //
            // El proveedor mock no envía ni expone
            // el código generado.

            const secret =
                getEmailVerificationCodeSecret();

            const codeHash = hashEmailChangeCode({
                userId,
                newEmail,
                code: testCode,
                secret,
            });

            const prepared = await databasePool.query({
                text: `
                    UPDATE email_change_requests
                    SET code_hash = $2
                    WHERE user_id = $1
                      AND used_at IS NULL
                      AND expires_at > NOW()
                    RETURNING user_id
                `,
                values: [userId, codeHash],
            });

            assert.equal(prepared.rowCount, 1);

            // 6. Confirmar el cambio mediante HTTP.

            const confirmed = await request(app)
                .post(confirmEndpoint)
                .set('Authorization', authorization)
                .send({
                    code: testCode,
                });

            assert.equal(confirmed.status, 200);

            assert.equal(
                confirmed.body.data.changed,
                true,
            );

            assert.equal(
                confirmed.body.data.user.email,
                newEmail,
            );

            // 7. Verificar que se eliminó la cookie
            // de renovación.

            const cookies =
                confirmed.headers['set-cookie'] ?? [];

            assert.ok(
                cookies.some(
                    (cookie) =>
                        cookie.startsWith(
                            'learn2code_refresh_token=',
                        )
                        && (
                            cookie.includes(
                                'Expires=Thu, 01 Jan 1970',
                            )
                            || cookie.includes('Max-Age=0')
                        ),
                ),
            );

            // 8. Confirmar que PostgreSQL cambió
            // el correo y conserva la verificación.

            const updated = await databasePool.query({
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
                updated.rows[0].email,
                newEmail,
            );

            assert.ok(
                updated.rows[0].email_verified_at,
            );

            // 9. Verificar que se revocó la sesión.

            const session = await databasePool.query({
                text: `
                    SELECT revoked_at
                    FROM refresh_tokens
                    WHERE id = $1
                `,
                values: [refreshToken.id],
            });

            assert.ok(
                session.rows[0].revoked_at,
            );

            // 10. Comprobar que el código ya no
            // puede utilizarse otra vez.

            const reused = await request(app)
                .post(confirmEndpoint)
                .set('Authorization', authorization)
                .send({
                    code: testCode,
                });

            assert.equal(reused.status, 400);

            assert.equal(
                reused.body.code,
                'INVALID_EMAIL_CHANGE_CODE',
            );
        } finally {
            // Eliminar exclusivamente la cuenta
            // temporal utilizada por esta prueba.

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
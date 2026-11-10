import {
    timingSafeEqual,
} from 'node:crypto';

import {
    databasePool,
} from '../../../config/database.js';

import {
    revokeAllUserRefreshTokens,
} from './refresh-token.repository.js';

// ============================================================
// GUARDAR SOLICITUD DE CAMBIO DE CORREO
// ============================================================

export const saveEmailChangeRequest = async ({
    userId,
    newEmail,
    codeHash,
    createdAt = new Date(),
    expiresAt,
    client = databasePool,
}) => {
    const result = await client.query({
        text: `
            INSERT INTO email_change_requests (
                user_id,
                new_email,
                code_hash,
                created_at,
                expires_at,
                used_at,
                failed_attempts
            )
            VALUES ($1, $2, $3, $4, $5, NULL, 0)

            ON CONFLICT (user_id)
            DO UPDATE SET
                new_email = EXCLUDED.new_email,
                code_hash = EXCLUDED.code_hash,
                created_at = EXCLUDED.created_at,
                expires_at = EXCLUDED.expires_at,
                used_at = NULL,
                failed_attempts = 0

            WHERE
                email_change_requests.created_at
                    <= EXCLUDED.created_at
                        - INTERVAL '60 seconds'

                OR (
                    email_change_requests.expires_at
                        <= EXCLUDED.created_at
                            - INTERVAL '10 seconds'
                    AND email_change_requests.used_at IS NULL
                )

            RETURNING
                user_id,
                new_email,
                created_at,
                expires_at
        `,
        values: [
            userId,
            newEmail,
            codeHash,
            createdAt,
            expiresAt,
        ],
    });

    const row = result.rows[0];

    if (!row) {
        return null;
    }

    return Object.freeze({
        userId: row.user_id,
        newEmail: row.new_email,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
    });
};

// ============================================================
// INVALIDAR SOLICITUD SI FALLA EL ENVIO
// ============================================================

export const markEmailChangeDeliveryFailed = async ({
    userId,
    codeHash,
    createdAt,
    failedAt = new Date(),
    client = databasePool,
}) => {
    if (
        typeof userId !== 'string'
        || !userId.trim()
        || typeof codeHash !== 'string'
        || !/^[0-9a-f]{64}$/.test(codeHash)
        || !(createdAt instanceof Date)
        || Number.isNaN(createdAt.getTime())
        || !(failedAt instanceof Date)
        || Number.isNaN(failedAt.getTime())
    ) {
        throw new TypeError(
            'Invalid email change delivery parameters',
        );
    }

    const result = await client.query({
        text: `
            UPDATE email_change_requests
            SET
                used_at = GREATEST(
                    $4::timestamptz,
                    created_at
                )
            WHERE user_id = $1
              AND code_hash = $2
              AND created_at = $3
              AND used_at IS NULL
            RETURNING user_id
        `,
        values: [
            userId,
            codeHash,
            createdAt,
            failedAt,
        ],
    });

    return result.rows.length === 1;
};

// ============================================================
// CONFIRMAR CAMBIO DE CORREO
// ============================================================

export const confirmEmailChangeRequest = async ({
    userId,
    code,
    confirmedAt = new Date(),
    hashCode,
    pool = databasePool,
    revokeSessions = revokeAllUserRefreshTokens,
}) => {
    if (
        typeof userId !== 'string'
        || !userId.trim()
        || typeof code !== 'string'
        || !/^\d{6}$/.test(code)
        || typeof hashCode !== 'function'
        || !(confirmedAt instanceof Date)
        || Number.isNaN(confirmedAt.getTime())
    ) {
        throw new TypeError(
            'Invalid email change confirmation parameters',
        );
    }

    const client = await pool.connect();
    let transactionOpen = false;

    try {
        await client.query('BEGIN');
        transactionOpen = true;

        // ----------------------------------------------------
        // BLOQUEAR LA SOLICITUD Y EL USUARIO
        // ----------------------------------------------------

        const result = await client.query({
            text: `
                SELECT
                    request.new_email,
                    request.code_hash,
                    request.expires_at,
                    request.used_at,
                    request.failed_attempts,
                    users.email AS current_email
                FROM email_change_requests request
                INNER JOIN users
                    ON users.id = request.user_id
                WHERE request.user_id = $1
                  AND users.is_active = TRUE
                  AND users.deleted_at IS NULL
                  AND users.email_verified_at IS NOT NULL
                FOR UPDATE OF request, users
            `,
            values: [userId],
        });

        const pendingRequest = result.rows[0];

        // ----------------------------------------------------
        // COMPROBAR DISPONIBILIDAD Y VIGENCIA
        // ----------------------------------------------------

        const unavailable =
            !pendingRequest
            || pendingRequest.used_at !== null
            || new Date(
                pendingRequest.expires_at,
            ).getTime() <= confirmedAt.getTime()
            || pendingRequest.failed_attempts >= 5
            || String(
                pendingRequest.new_email,
            ).toLowerCase() === String(
                pendingRequest.current_email,
            ).toLowerCase();

        if (unavailable) {
            await client.query('COMMIT');
            transactionOpen = false;

            return null;
        }

        // ----------------------------------------------------
        // COMPARAR EL CODIGO PROTEGIDO
        // ----------------------------------------------------

        const expectedHash = hashCode({
            userId,
            newEmail: pendingRequest.new_email,
            code,
        });

        if (
            typeof expectedHash !== 'string'
            || !/^[0-9a-f]{64}$/.test(expectedHash)
        ) {
            throw new TypeError(
                'Invalid email change code hash',
            );
        }

        const matches = timingSafeEqual(
            Buffer.from(
                pendingRequest.code_hash,
                'hex',
            ),
            Buffer.from(
                expectedHash,
                'hex',
            ),
        );

        if (!matches) {
            await client.query({
                text: `
                    UPDATE email_change_requests
                    SET failed_attempts =
                        failed_attempts + 1
                    WHERE user_id = $1
                      AND used_at IS NULL
                      AND failed_attempts < 5
                `,
                values: [userId],
            });

            await client.query('COMMIT');
            transactionOpen = false;

            return null;
        }

        // ----------------------------------------------------
        // ACTUALIZAR CORREO Y VERIFICACION
        // ----------------------------------------------------

        const updated = await client.query({
            text: `
                UPDATE users
                SET
                    email = $2,
                    email_verified_at = $3,
                    updated_at = $3
                WHERE id = $1
                  AND is_active = TRUE
                  AND deleted_at IS NULL
                  AND email_verified_at IS NOT NULL
                RETURNING
                    id,
                    email,
                    email_verified_at
            `,
            values: [
                userId,
                pendingRequest.new_email,
                confirmedAt,
            ],
        });

        const updatedUser = updated.rows[0];

        if (!updatedUser) {
            throw new Error(
                'Unable to complete email change',
            );
        }

        // ----------------------------------------------------
        // MARCAR EL CODIGO COMO UTILIZADO
        // ----------------------------------------------------

        await client.query({
            text: `
                UPDATE email_change_requests
                SET used_at = $2
                WHERE user_id = $1
                  AND used_at IS NULL
            `,
            values: [
                userId,
                confirmedAt,
            ],
        });

        // ----------------------------------------------------
        // REVOCAR SESIONES DE RENOVACION
        // ----------------------------------------------------

        await revokeSessions({
            userId,
            revokedAt: confirmedAt,
            client,
        });

        // ----------------------------------------------------
        // CONFIRMAR TODOS LOS CAMBIOS
        // ----------------------------------------------------

        await client.query('COMMIT');
        transactionOpen = false;

        return Object.freeze({
            changed: true,

            user: Object.freeze({
                id: updatedUser.id,
                email: updatedUser.email,
                emailVerifiedAt:
                    updatedUser.email_verified_at,
            }),
        });
    } catch (error) {
        if (transactionOpen) {
            try {
                await client.query('ROLLBACK');
            } catch {
                // Conservar el error original.
            }
        }

        throw error;
    } finally {
        client.release();
    }
};
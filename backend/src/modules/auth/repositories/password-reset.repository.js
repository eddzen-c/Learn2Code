import {
    databasePool,
} from '../../../config/database.js';

const mapPasswordResetRequestRow =
    (row) => {
        if (!row) {
            return null;
        }

        return Object.freeze({
            id: row.id,
            userId: row.user_id,
            expiresAt: row.expires_at,
            requestedIp:
                row.requested_ip,
            createdAt: row.created_at,
        });
    };

const mapUpdatedPasswordUserRow =
    (row) => {
        if (!row) {
            return null;
        }

        return Object.freeze({
            userId: row.id,
            email: row.email,
            passwordUpdatedAt:
                row.updated_at,
        });
    };

export const deletePendingPasswordResetRequests =
    async ({
        userId,
        client = databasePool,
    }) => {
        const result =
            await client.query({
                text: `
                    DELETE FROM
                        password_reset_requests
                    WHERE user_id = $1
                      AND used_at IS NULL
                `,
                values: [userId],
            });

        return result.rowCount ?? 0;
    };

export const createPasswordResetRequestRecord =
    async ({
        userId,
        tokenHash,
        expiresAt,
        requestedIp = null,
        client = databasePool,
    }) => {
        const result =
            await client.query({
                text: `
                    INSERT INTO
                        password_reset_requests (
                            user_id,
                            reset_token_hash,
                            expires_at,
                            requested_ip
                        )
                    VALUES ($1, $2, $3, $4)
                    RETURNING
                        id,
                        user_id,
                        expires_at,
                        requested_ip,
                        created_at
                `,
                values: [
                    userId,
                    tokenHash,
                    expiresAt,
                    requestedIp,
                ],
            });

        return mapPasswordResetRequestRow(
            result.rows[0],
        );
    };

export const resetPasswordWithTokenHash =
    async ({
        tokenHash,
        passwordHash,
        usedAt = new Date(),
        client = databasePool,
    }) => {
        const result =
            await client.query({
                text: `
                    WITH claimed_request AS (
                        UPDATE password_reset_requests
                        SET used_at = $3
                        WHERE reset_token_hash = $1
                          AND used_at IS NULL
                          AND expires_at > $3
                        RETURNING user_id
                    ),
                    updated_user AS (
                        UPDATE users
                        SET
                            password_hash = $2,
                            updated_at = $3
                        FROM claimed_request
                        WHERE users.id =
                            claimed_request.user_id
                          AND users.is_active = TRUE
                          AND users.deleted_at IS NULL
                        RETURNING
                            users.id,
                            users.email,
                            users.updated_at
                    ),
                    revoked_sessions AS (
                        DELETE FROM refresh_tokens
                        USING updated_user
                        WHERE refresh_tokens.user_id =
                            updated_user.id
                        RETURNING refresh_tokens.id
                    )
                    SELECT
                        id,
                        email,
                        updated_at
                    FROM updated_user
                `,
                values: [
                    tokenHash,
                    passwordHash,
                    usedAt,
                ],
            });

        return mapUpdatedPasswordUserRow(
            result.rows[0],
        );
    };
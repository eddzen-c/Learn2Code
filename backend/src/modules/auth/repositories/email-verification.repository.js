import {
    databasePool,
} from '../../../config/database.js';

const mapVerificationTokenRow =
    (row) => {
        if (!row) {
            return null;
        }

        return Object.freeze({
            id: row.id,
            userId: row.user_id,
            expiresAt: row.expires_at,
            createdAt: row.created_at,
        });
    };

const mapVerifiedUserRow =
    (row) => {
        if (!row) {
            return null;
        }

        return Object.freeze({
            userId: row.id,
            email: row.email,
            emailVerifiedAt:
                row.email_verified_at,
        });
    };

export const deletePendingEmailVerificationTokens =
    async ({
        userId,
        client = databasePool,
    }) => {
        const result =
            await client.query({
                text: `
                    DELETE FROM
                        email_verification_tokens
                    WHERE user_id = $1
                      AND verified_at IS NULL
                `,
                values: [userId],
            });

        return result.rowCount ?? 0;
    };

export const createEmailVerificationTokenRecord =
    async ({
        userId,
        tokenHash,
        expiresAt,
        client = databasePool,
    }) => {
        const result =
            await client.query({
                text: `
                    INSERT INTO
                        email_verification_tokens (
                            user_id,
                            token_hash,
                            expires_at
                        )
                    VALUES ($1, $2, $3)
                    RETURNING
                        id,
                        user_id,
                        expires_at,
                        created_at
                `,
                values: [
                    userId,
                    tokenHash,
                    expiresAt,
                ],
            });

        return mapVerificationTokenRow(
            result.rows[0],
        );
    };

export const verifyEmailWithTokenHash =
    async ({
        tokenHash,
        verifiedAt = new Date(),
        client = databasePool,
    }) => {
        const result =
            await client.query({
                text: `
                    WITH claimed_token AS (
                        UPDATE
                            email_verification_tokens
                        SET verified_at = $2
                        WHERE token_hash = $1
                            AND verified_at IS NULL
                            AND expires_at > $2
                        RETURNING user_id
                    )
                    UPDATE users
                    SET
                        email_verified_at =
                            COALESCE(
                                users.email_verified_at,
                                $2
                            ),
                        updated_at = $2
                    FROM claimed_token
                    WHERE users.id =
                        claimed_token.user_id
                        AND users.is_active = TRUE
                        AND users.deleted_at IS NULL
                    RETURNING
                        users.id,
                        users.email,
                        users.email_verified_at
                `,
                values: [
                    tokenHash,
                    verifiedAt,
                ],
            });

        return mapVerifiedUserRow(
            result.rows[0],
        );
    };
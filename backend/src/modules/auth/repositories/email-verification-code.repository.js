import {
    timingSafeEqual,
} from 'node:crypto';

import {
    databasePool,
} from '../../../config/database.js';

export const saveEmailVerificationCode =
    async ({
        userId,
        codeHash,
        createdAt = new Date(),
        expiresAt,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                INSERT INTO email_verification_codes (
                    user_id,
                    code_hash,
                    created_at,
                    expires_at,
                    used_at,
                    failed_attempts
                )
                VALUES ($1, $2, $3, $4, NULL, 0)

                ON CONFLICT (user_id)
                DO UPDATE SET
                    code_hash = EXCLUDED.code_hash,
                    created_at = EXCLUDED.created_at,
                    expires_at = EXCLUDED.expires_at,
                    used_at = NULL,
                    failed_attempts = 0


                WHERE
                    email_verification_codes.created_at
                        <= EXCLUDED.created_at
                            - INTERVAL '60 seconds'

                    OR (
                        email_verification_codes.expires_at
                            <= EXCLUDED.created_at
                                - INTERVAL '10 seconds'
                        AND email_verification_codes.used_at IS NULL
                    )


                RETURNING
                    user_id,
                    expires_at
            `,
            values: [
                userId,
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
            expiresAt: row.expires_at,
        });
    };


export const markEmailVerificationCodeDeliveryFailed =
    async ({
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
                'Invalid email delivery failure parameters',
            );
        }

        const result = await client.query({
            text: `
                UPDATE email_verification_codes
                SET
                    expires_at = LEAST(
                        expires_at,
                        $3::timestamptz
                    )
                WHERE user_id = $1
                    AND code_hash = $2
                    AND created_at = $4
                    AND used_at IS NULL
                RETURNING user_id
            `,
            values: [
                userId,
                codeHash,
                failedAt,
                createdAt,
            ],
        });

        return result.rows.length === 1;
    };


const MAX_VERIFICATION_ATTEMPTS = 5;

export const confirmEmailVerificationCodeRecord =
    async ({
        userId,
        codeHash,
        verifiedAt = new Date(),
        pool = databasePool,
    }) => {
        if (
            typeof userId !== 'string'
            || !userId.trim()
            || typeof codeHash !== 'string'
            || !/^[0-9a-f]{64}$/.test(codeHash)
        ) {
            throw new TypeError(
                'Invalid verification parameters',
            );
        }

        if (
            !(verifiedAt instanceof Date)
            || Number.isNaN(verifiedAt.getTime())
        ) {
            throw new TypeError(
                'Verification date is invalid',
            );
        }

        const client = await pool.connect();
        let transactionOpen = false;

        try {
            await client.query('BEGIN');
            transactionOpen = true;

            const result = await client.query({
                text: `
                    SELECT
                        c.code_hash,
                        c.expires_at,
                        c.used_at,
                        c.failed_attempts
                    FROM email_verification_codes c
                    INNER JOIN users u
                        ON u.id = c.user_id
                    WHERE c.user_id = $1
                      AND u.is_active = TRUE
                      AND u.deleted_at IS NULL
                      AND u.email_verified_at IS NULL
                    FOR UPDATE OF c
                `,
                values: [userId],
            });

            const record = result.rows[0];

            const isUnavailable =
                !record
                || record.used_at !== null
                || new Date(record.expires_at)
                    .getTime() <= verifiedAt.getTime()
                || record.failed_attempts
                >= MAX_VERIFICATION_ATTEMPTS;

            if (isUnavailable) {
                await client.query('COMMIT');
                transactionOpen = false;

                return null;
            }

            const matches = timingSafeEqual(
                Buffer.from(record.code_hash, 'hex'),
                Buffer.from(codeHash, 'hex'),
            );

            if (!matches) {
                await client.query({
                    text: `
                        UPDATE email_verification_codes
                        SET failed_attempts =
                            failed_attempts + 1
                        WHERE user_id = $1
                    `,
                    values: [userId],
                });

                await client.query('COMMIT');
                transactionOpen = false;

                return null;
            }

            await client.query({
                text: `
                    UPDATE email_verification_codes
                    SET used_at = $2
                    WHERE user_id = $1
                `,
                values: [
                    userId,
                    verifiedAt,
                ],
            });

            const verification = await client.query({
                text: `
                    UPDATE users
                    SET
                        email_verified_at =
                            COALESCE(
                                email_verified_at,
                                $2
                            ),
                        updated_at = $2
                    WHERE id = $1
                      AND is_active = TRUE
                      AND deleted_at IS NULL
                    RETURNING
                        id,
                        email,
                        email_verified_at
                `,
                values: [
                    userId,
                    verifiedAt,
                ],
            });

            const verifiedUser =
                verification.rows[0];

            if (!verifiedUser) {
                throw new Error(
                    'Unable to complete email verification',
                );
            }

            await client.query('COMMIT');
            transactionOpen = false;

            return Object.freeze({
                verified: true,

                user: Object.freeze({
                    id: verifiedUser.id,
                    email: verifiedUser.email,
                    emailVerifiedAt:
                        verifiedUser.email_verified_at,
                }),
            });
        } catch (error) {
            if (transactionOpen) {
                try {
                    await client.query('ROLLBACK');
                } catch {
                    // Preserve the original error.
                }
            }

            throw error;
        } finally {
            client.release();
        }
    };

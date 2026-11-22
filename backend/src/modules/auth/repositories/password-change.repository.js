
import {
    databasePool,
} from '../../../config/database.js';

export const findPasswordForUpdate = async ({
    userId,
    client = databasePool,
}) => {
    const result = await client.query({
        text: `
            SELECT
                id,
                password_hash
            FROM users
            WHERE id = $1
              AND is_active = TRUE
              AND deleted_at IS NULL
            FOR UPDATE
        `,
        values: [userId],
    });

    const row = result.rows[0];

    if (!row) {
        return null;
    }

    return Object.freeze({
        userId: row.id,
        passwordHash: row.password_hash,
    });
};

export const updatePasswordHash = async ({
    userId,
    passwordHash,
    updatedAt = new Date(),
    client = databasePool,
}) => {
    const result = await client.query({
        text: `
            UPDATE users
            SET
                password_hash = $2,
                updated_at = $3
            WHERE id = $1
                AND is_active = TRUE
                AND deleted_at IS NULL
            RETURNING id
        `,
        values: [
            userId,
            passwordHash,
            updatedAt,
        ],
    });

    return result.rows[0]
        ? Object.freeze({
            userId: result.rows[0].id,
        })
        : null;
};

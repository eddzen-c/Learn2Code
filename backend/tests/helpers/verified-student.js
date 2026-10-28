
import {
    databasePool,
} from '../../src/config/database.js';

// Exclusivo para pruebas de integración.
// No debe importarse desde código de producción.
export const verifyIntegrationStudent = async ({
    userId,
    client = databasePool,
}) => {
    if (
        typeof userId !== 'string'
        || !userId.trim()
    ) {
        throw new TypeError(
            'A valid test user ID is required',
        );
    }

    const result = await client.query({
        text: `
            UPDATE users
            SET email_verified_at =
                COALESCE(email_verified_at, NOW())
            WHERE id = $1
                AND is_active = TRUE
                AND deleted_at IS NULL
            RETURNING id, email_verified_at
        `,
        values: [userId],
    });

    if (result.rowCount !== 1) {
        throw new Error(
            'Unable to verify the temporary test user',
        );
    }

    return result.rows[0].email_verified_at;
};

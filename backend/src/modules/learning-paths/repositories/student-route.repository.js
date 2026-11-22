
import {
    databasePool,
} from '../../../config/database.js';

const mapSelection = (row) => ({
    userId: row.user_id,
    specializationKey: row.specialization_key,
    selectedAt: row.selected_at,
    updatedAt: row.updated_at,
});

export async function findStudentRouteSelection({
    userId,
    client = databasePool,
}) {
    const result = await client.query({
        text: `
            SELECT
                user_id,
                specialization_key,
                selected_at,
                updated_at
            FROM student_route_selections
            WHERE user_id = $1
        `,
        values: [userId],
    });

    return result.rows[0]
        ? mapSelection(result.rows[0])
        : null;
}

export async function saveStudentRouteSelection({
    userId,
    specializationKey,
    client = databasePool,
}) {
    const result = await client.query({
        text: `
            INSERT INTO student_route_selections (
                user_id,
                specialization_key
            )
            VALUES ($1, $2)

            ON CONFLICT (user_id)
            DO UPDATE SET
                specialization_key =
                    EXCLUDED.specialization_key,

                selected_at = CASE
                    WHEN student_route_selections.specialization_key
                        IS DISTINCT FROM
                        EXCLUDED.specialization_key
                    THEN NOW()
                    ELSE student_route_selections.selected_at
                END,

                updated_at = NOW()

            RETURNING
                user_id,
                specialization_key,
                selected_at,
                updated_at
        `,
        values: [
            userId,
            specializationKey,
        ],
    });

    return mapSelection(result.rows[0]);
}

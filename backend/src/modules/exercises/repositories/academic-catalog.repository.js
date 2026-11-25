
import {
    databasePool,
} from '../../../config/database.js';

export const listAcademicCatalog = async ({
    client = databasePool,
} = {}) => {
    const result = await client.query({
        text: `
            SELECT
                s.key AS specialization_key,
                s.name AS specialization_name,
                s.position AS specialization_position,

                st.id AS stage_id,
                st.position AS stage_position,
                st.title AS stage_title,
                st.status AS stage_status,

                m.id AS module_id,
                m.code AS module_code,
                m.position AS module_position,
                m.title AS module_title,
                m.description AS module_description,

                u.id AS unit_id,
                u.code AS unit_code,
                u.position AS unit_position,
                u.title AS unit_title,
                u.description AS unit_description

            FROM academic_specializations AS s

            LEFT JOIN academic_stages AS st
                ON st.specialization_key = s.key
                AND st.status <> 'archived'

            LEFT JOIN academic_modules AS m
                ON m.stage_id = st.id
                AND m.status = 'published'
                AND st.status = 'published'

            LEFT JOIN academic_units AS u
                ON u.module_id = m.id
                AND u.status = 'published'

            ORDER BY
                s.position,
                st.position NULLS LAST,
                m.position NULLS LAST,
                u.position NULLS LAST
        `,
        values: [],
    });

    const specializations = [];
    const specializationMap = new Map();
    const stageMap = new Map();
    const moduleMap = new Map();

    for (const row of result.rows) {
        let specialization = specializationMap.get(
            row.specialization_key,
        );

        if (!specialization) {
            specialization = {
                key: row.specialization_key,
                name: row.specialization_name,
                position: row.specialization_position,
                stages: [],
            };

            specializationMap.set(
                row.specialization_key,
                specialization,
            );

            specializations.push(specialization);
        }

        if (row.stage_id === null) {
            continue;
        }

        let stage = stageMap.get(row.stage_id);

        if (!stage) {
            stage = {
                id: row.stage_id,
                position: row.stage_position,
                title: row.stage_title,
                status: row.stage_status,
                modules: [],
            };

            stageMap.set(row.stage_id, stage);
            specialization.stages.push(stage);
        }

        if (row.module_id === null) {
            continue;
        }

        let academicModule = moduleMap.get(
            row.module_id,
        );

        if (!academicModule) {
            academicModule = {
                id: row.module_id,
                code: row.module_code,
                position: row.module_position,
                title: row.module_title,
                description: row.module_description,
                units: [],
            };

            moduleMap.set(
                row.module_id,
                academicModule,
            );

            stage.modules.push(academicModule);
        }

        if (row.unit_id !== null) {
            academicModule.units.push({
                id: row.unit_id,
                code: row.unit_code,
                position: row.unit_position,
                title: row.unit_title,
                description: row.unit_description,
            });
        }
    }

    return specializations;
};

export const listPublishedUnitExercises = async ({
    unitId,
    userId = null,
    client = databasePool,
}) => {
    const result = await client.query({
        text: `
            SELECT
                u.id AS unit_id,
                u.code AS unit_code,
                u.title AS unit_title,
                u.description AS unit_description,
                m.id AS module_id,
                s.id AS stage_id,
                s.specialization_key,

                e.id AS exercise_id,
                e.title AS exercise_title,
                e.statement AS exercise_statement,
                e.instructions AS exercise_instructions,
                e.estimated_minutes,
                t.name AS topic_name,
                e.difficulty_id,
                COALESCE(user_progress.completed, false) AS completed,
                user_progress.completed_at,
                COALESCE(user_progress.in_progress, false) AS in_progress,
                d.name AS difficulty_name,
                l.name AS language_name

            FROM academic_units AS u

            JOIN academic_modules AS m
                ON m.id = u.module_id
                AND m.status = 'published'

            JOIN academic_stages AS s
                ON s.id = m.stage_id
                AND s.status = 'published'

            LEFT JOIN academic_unit_exercises AS ue
                ON ue.unit_id = u.id

            LEFT JOIN exercises AS e
                ON e.id = ue.exercise_id
                AND e.status = 'published'
                AND e.generation_source = 'manual'
                AND e.created_by_user_id IS NULL

            LEFT JOIN topics AS t
                ON t.id = e.topic_id

            LEFT JOIN difficulty_levels AS d
                ON d.id = e.difficulty_id

            LEFT JOIN supported_languages AS l
                ON l.id = e.language_id

            LEFT JOIN LATERAL (
                SELECT
                    BOOL_OR(a.status = 'completed') AS completed,
                    MAX(a.completed_at) FILTER (
                        WHERE a.status = 'completed'
                    ) AS completed_at,
                    BOOL_OR(
                        a.status IN ('assigned', 'started')
                        AND (a.expires_at IS NULL OR a.expires_at > NOW())
                    ) AS in_progress
                FROM exercise_assignments AS a
                WHERE a.exercise_id = e.id
                  AND a.academic_unit_id = u.id
                  AND a.user_id = $2
            ) AS user_progress ON TRUE

            WHERE u.id = $1
                AND u.status = 'published'

            ORDER BY
                ue.position NULLS LAST
        `,
        values: [unitId, userId],
    })

    if (result.rows.length === 0) {
        return null
    }

    const first = result.rows[0]

    return {
        unit: {
            id: first.unit_id,
            code: first.unit_code,
            title: first.unit_title,
            description: first.unit_description,
            moduleId: first.module_id,
            stageId: first.stage_id,
            specializationKey: first.specialization_key,
        },
        exercises: result.rows
            .filter((row) => row.exercise_id !== null)
            .map((row) => ({
                id: row.exercise_id,
                title: row.exercise_title,
                statement: row.exercise_statement,
                instructions: row.exercise_instructions,
                estimatedMinutes: row.estimated_minutes,
                topic: row.topic_name,
                difficultyId: row.difficulty_id,
                difficulty: row.difficulty_name,
                completed: row.completed === true,
                completedAt: row.completed_at ?? null,
                inProgress: row.in_progress === true,
                language: row.language_name,
            })),
    }
}

export const findPublishedAcademicUnitExercise = async ({
    unitId,
    exerciseId,
    client = databasePool,
}) => {
    const result = await client.query({
        text: `
            SELECT
                ue.unit_id,
                ue.exercise_id

            FROM academic_unit_exercises AS ue

            JOIN academic_units AS u
                ON u.id = ue.unit_id
                AND u.status = 'published'

            JOIN academic_modules AS m
                ON m.id = u.module_id
                AND m.status = 'published'

            JOIN academic_stages AS s
                ON s.id = m.stage_id
                AND s.status = 'published'

            JOIN exercises AS e
                ON e.id = ue.exercise_id
                AND e.status = 'published'
                AND e.generation_source = 'manual'
                AND e.created_by_user_id IS NULL

            WHERE ue.unit_id = $1
                AND ue.exercise_id = $2

            LIMIT 1
        `,
        values: [
            unitId,
            exerciseId,
        ],
    })

    const row = result.rows[0]

    if (!row) {
        return null
    }

    return Object.freeze({
        unitId: row.unit_id,
        exerciseId: row.exercise_id,
    })
}

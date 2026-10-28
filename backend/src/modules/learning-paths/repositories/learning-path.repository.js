
import {
    databasePool,
} from '../../../config/database.js';

const mapPath = (row) => ({
    id: row.id,
    userId: row.user_id,
    assessmentId: row.diagnostic_assessment_id,
    languageId: row.language_id,
    difficultyId: row.difficulty_id,
    specializationKey: row.specialization_key,
    title: row.title,
    description: row.description,
    reason: row.reason,
    estimatedWeeks: row.estimated_weeks,
    generationMetadata:
        row.generation_metadata ?? {},
    status: row.status,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
});

const mapStep = (row) => ({
    id: row.id,
    topicId: row.topic_id,
    position: row.position,
    title: row.title,
    description: row.description,
    status: row.status,
    completedAt: row.completed_at,
});

/**
 * Recupera el plan de un estudiante para
 * un diagnóstico determinado.
 */
export async function findLearningPathByDiagnostic({
    userId,
    assessmentId,
    client = databasePool,
}) {
    const pathResult = await client.query({
        text: `
            SELECT *
            FROM learning_paths
            WHERE user_id = $1
              AND diagnostic_assessment_id = $2
            LIMIT 1
        `,
        values: [userId, assessmentId],
    });

    const row = pathResult.rows[0];

    if (!row) {
        return null;
    }

    const stepsResult = await client.query({
        text: `
            SELECT
                id,
                topic_id,
                position,
                title,
                description,
                status,
                completed_at
            FROM learning_path_steps
            WHERE path_id = $1
            ORDER BY position
        `,
        values: [row.id],
    });

    return {
        ...mapPath(row),
        steps: stepsResult.rows.map(mapStep),
    };
}

/**
 * Guarda el plan y todos sus pasos de forma atómica.
 *
 * Si ya existe un plan para ese diagnóstico,
 * recupera el existente en lugar de sobrescribirlo.
 */
export async function saveGeneratedLearningPath({
    userId,
    context,
    generation,
    pool = databasePool,
}) {
    const plan = generation?.plan;

    if (
        !userId
        || context?.state !== 'ready'
        || !context.assessmentId
        || !context.languageId
        || !context.difficultyId
        || generation?.provider !== 'openai'
        || !plan
        || !Array.isArray(plan.steps)
        || plan.steps.length < 3
        || plan.steps.length > 5
    ) {
        throw new TypeError(
            'Los datos del plan no son válidos.',
        );
    }

    const allowedTopics = new Set(
        context.topics.map((topic) => topic.id),
    );

    if (
        plan.steps.some(
            (step) => !allowedTopics.has(step.topicId),
        )
    ) {
        throw new TypeError(
            'El plan contiene temas no disponibles.',
        );
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Serializa el guardado para el mismo
        // estudiante y diagnóstico.
        await client.query({
            text: `
                SELECT pg_advisory_xact_lock(
                    hashtext($1)
                )
            `,
            values: [
                `learning-plan:${userId}:${context.assessmentId}`,
            ],
        });

        const existing =
            await findLearningPathByDiagnostic({
                userId,
                assessmentId: context.assessmentId,
                client,
            });

        if (existing) {
            await client.query('COMMIT');
            return existing;
        }

        const metadata = {
            provider: generation.provider,
            model: generation.model ?? null,
            responseId: generation.responseId ?? null,
        };

        const pathResult = await client.query({
            text: `
                INSERT INTO learning_paths (
                    user_id,
                    diagnostic_assessment_id,
                    language_id,
                    difficulty_id,
                    specialization_key,
                    title,
                    description,
                    reason,
                    estimated_weeks,
                    generation_metadata
                )
                VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9, $10::jsonb
                )
                RETURNING id
            `,
            values: [
                userId,
                context.assessmentId,
                context.languageId,
                context.difficultyId,
                plan.specializationKey,
                plan.title,
                plan.description,
                plan.reason,
                plan.estimatedWeeks,
                JSON.stringify(metadata),
            ],
        });

        const pathId = pathResult.rows[0].id;

        for (const [index, step] of plan.steps.entries()) {
            await client.query({
                text: `
                    INSERT INTO learning_path_steps (
                        path_id,
                        topic_id,
                        position,
                        title,
                        description
                    )
                    VALUES ($1, $2, $3, $4, $5)
                `,
                values: [
                    pathId,
                    step.topicId,
                    index + 1,
                    step.title,
                    step.description,
                ],
            });
        }

        const saved =
            await findLearningPathByDiagnostic({
                userId,
                assessmentId: context.assessmentId,
                client,
            });

        await client.query('COMMIT');

        return saved;
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch {
            // Conservar el error original.
        }

        throw error;
    } finally {
        client.release();
    }
}


/**
 * Confirma únicamente el plan perteneciente
 * al estudiante y al diagnóstico indicado.
 */
export async function confirmLearningPath({
    userId,
    assessmentId,
    pathId,
    client = databasePool,
}) {
    const result = await client.query({
        text: `
            UPDATE learning_paths
            SET
                confirmed_at = COALESCE(
                    confirmed_at,
                    NOW()
                ),
                updated_at = NOW()
            WHERE id = $1
                AND user_id = $2
                AND diagnostic_assessment_id = $3
            RETURNING id
        `,
        values: [
            pathId,
            userId,
            assessmentId,
        ],
    });

    if (result.rows.length === 0) {
        return null;
    }

    return findLearningPathByDiagnostic({
        userId,
        assessmentId,
        client,
    });
}

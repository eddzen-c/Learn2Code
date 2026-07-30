import {
    databasePool,
} from '../../../config/database.js';

const mapGenerationLogRow = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        id: row.id,
        userId: row.user_id,
        exerciseId: row.exercise_id,
        promptVersionId:
            row.prompt_version_id,
        modelName: row.model_name,
        generationParams: Object.freeze({
            ...(row.generation_params ?? {}),
        }),
        promptTokens:
            row.prompt_tokens,
        completionTokens:
            row.completion_tokens,
        latencyMs: row.latency_ms,
        success: row.success,
        errorMessage: row.error_message,
        createdAt: row.created_at,
    });
};

export const createExerciseGenerationLogRecord =
    async ({
        userId = null,
        exerciseId = null,
        promptVersionId = null,
        modelName = null,
        generationParams = {},
        promptTokens = null,
        completionTokens = null,
        latencyMs = null,
        success = true,
        errorMessage = null,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                INSERT INTO exercise_generation_logs (
                    user_id,
                    exercise_id,
                    prompt_version_id,
                    model_name,
                    generation_params,
                    prompt_tokens,
                    completion_tokens,
                    latency_ms,
                    success,
                    error_message
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9,
                    $10
                )
                RETURNING
                    id,
                    user_id,
                    exercise_id,
                    prompt_version_id,
                    model_name,
                    generation_params,
                    prompt_tokens,
                    completion_tokens,
                    latency_ms,
                    success,
                    error_message,
                    created_at
            `,
            values: [
                userId,
                exerciseId,
                promptVersionId,
                modelName,
                generationParams,
                promptTokens,
                completionTokens,
                latencyMs,
                success,
                errorMessage,
            ],
        });

        return mapGenerationLogRow(
            result.rows[0],
        );
    };
import {
    databasePool,
} from '../../../config/database.js';

const ACTIVE_DIAGNOSTIC_STATUSES = [
    'pending',
    'generating',
    'in_progress',
    'evaluating',
];

const mapDiagnosticAssessment = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        id: row.id,
        userId: row.user_id,
        languageId: row.language_id,
        promptVersionId: row.prompt_version_id,
        attemptNumber: row.attempt_number,
        status: row.status,
        questionCount: row.question_count,
        answeredCount: row.answered_count,
        overallScore:
            row.overall_score === null
                ? null
                : Number(row.overall_score),
        resultingDifficultyId:
            row.resulting_difficulty_id,
        modelName: row.model_name,
        generationMetadata:
            row.generation_metadata ?? {},
        startedAt: row.started_at,
        completedAt: row.completed_at,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
};

const assessmentReturningColumns = `
    id,
    user_id,
    language_id,
    prompt_version_id,
    attempt_number,
    status,
    question_count,
    answered_count,
    overall_score,
    resulting_difficulty_id,
    model_name,
    generation_metadata,
    started_at,
    completed_at,
    expires_at,
    created_at,
    updated_at
`;

export const findActiveDiagnosticAssessmentByUserId =
    async ({
        userId,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                SELECT
                    ${assessmentReturningColumns}
                FROM diagnostic_assessments
                WHERE user_id = $1
                  AND status = ANY($2::VARCHAR[])
                ORDER BY created_at DESC
                LIMIT 1
            `,
            values: [
                userId,
                ACTIVE_DIAGNOSTIC_STATUSES,
            ],
        });

        return mapDiagnosticAssessment(
            result.rows[0],
        );
    };

export const findLatestDiagnosticAssessmentByUserId =
    async ({
        userId,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                SELECT
                    ${assessmentReturningColumns}
                FROM diagnostic_assessments
                WHERE user_id = $1
                ORDER BY
                    attempt_number DESC,
                    created_at DESC
                LIMIT 1
            `,
            values: [userId],
        });

        return mapDiagnosticAssessment(
            result.rows[0],
        );
    };

export const getNextDiagnosticAttemptNumber =
    async ({
        userId,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                SELECT
                    COALESCE(
                        MAX(attempt_number),
                        0
                    ) + 1 AS attempt_number
                FROM diagnostic_assessments
                WHERE user_id = $1
            `,
            values: [userId],
        });

        return Number(
            result.rows[0].attempt_number,
        );
    };

export const createDiagnosticAssessmentRecord =
    async ({
        userId,
        languageId,
        attemptNumber,
        modelName = null,
        generationMetadata = {},
        expiresAt = null,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                INSERT INTO diagnostic_assessments (
                    user_id,
                    language_id,
                    attempt_number,
                    status,
                    model_name,
                    generation_metadata,
                    expires_at
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    'generating',
                    $4,
                    $5::JSONB,
                    $6
                )
                RETURNING
                    ${assessmentReturningColumns}
            `,
            values: [
                userId,
                languageId,
                attemptNumber,
                modelName,
                JSON.stringify(
                    generationMetadata,
                ),
                expiresAt,
            ],
        });

        return mapDiagnosticAssessment(
            result.rows[0],
        );
    };

export const markDiagnosticAssessmentInProgress =
    async ({
        assessmentId,
        userId,
        questionCount,
        modelName = null,
        generationMetadata = {},
        startedAt = new Date(),
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                UPDATE diagnostic_assessments
                SET
                    status = 'in_progress',
                    question_count = $3,
                    started_at =
                        GREATEST(
                            $4,
                        created_at
                        ),
                    updated_at =
                        GREATEST(
                            $4,
                        created_at
                        ),
                    model_name =
                        COALESCE(
                            $5,
                            model_name
                        ),
                    generation_metadata =
                        generation_metadata
                        || $6::JSONB
                WHERE id = $1
                  AND user_id = $2
                  AND status = 'generating'
                RETURNING
                    ${assessmentReturningColumns}
            `,
            values: [
                assessmentId,
                userId,
                questionCount,
                startedAt,
                modelName,
                JSON.stringify(
                    generationMetadata,
                ),
            ],
        });

        return mapDiagnosticAssessment(
            result.rows[0],
        );
    };

export const markDiagnosticAssessmentFailed =
    async ({
        assessmentId,
        userId,
        failureMetadata = {},
        failedAt = new Date(),
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                UPDATE diagnostic_assessments
                SET
                    status = 'failed',
                    generation_metadata =
                        generation_metadata
                        || $3::JSONB,
                    updated_at = $4
                WHERE id = $1
                    AND user_id = $2
                    AND status IN (
                        'pending',
                        'generating'
                    )
                RETURNING
                    ${assessmentReturningColumns}
            `,
            values: [
                assessmentId,
                userId,
                JSON.stringify(
                    failureMetadata,
                ),
                failedAt,
            ],
        });

        return mapDiagnosticAssessment(
            result.rows[0],
        );
    };

export const incrementDiagnosticAnsweredCount =
    async ({
        assessmentId,
        userId,
        updatedAt = new Date(),
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                UPDATE diagnostic_assessments
                SET
                    answered_count =
                        answered_count + 1,
                    updated_at = $3
                WHERE id = $1
                  AND user_id = $2
                  AND status = 'in_progress'
                  AND answered_count
                      < question_count
                RETURNING
                    ${assessmentReturningColumns}
            `,
            values: [
                assessmentId,
                userId,
                updatedAt,
            ],
        });

        return mapDiagnosticAssessment(
            result.rows[0],
        );
    };
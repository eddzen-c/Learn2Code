import {
    databasePool,
} from '../../../config/database.js';

export const getDiagnosticScoreSummary =
    async ({
        assessmentId,
        userId,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                SELECT
                    COUNT(*) FILTER (
                        WHERE diagnostic_responses.status
                            = 'evaluated'
                    ) AS evaluated_count,

                    COALESCE(
                        ROUND(
                            AVG(
                                diagnostic_responses.score
                            ),
                            2
                        ),
                        0
                    ) AS overall_score
                FROM diagnostic_questions
                LEFT JOIN diagnostic_responses
                    ON diagnostic_responses.question_id =
                        diagnostic_questions.id
                   AND diagnostic_responses.user_id =
                        diagnostic_questions.user_id
                WHERE diagnostic_questions.assessment_id = $1
                  AND diagnostic_questions.user_id = $2
            `,
            values: [
                assessmentId,
                userId,
            ],
        });

        return Object.freeze({
            evaluatedCount: Number(
                result.rows[0].evaluated_count,
            ),

            overallScore: Number(
                result.rows[0].overall_score,
            ),
        });
    };

export const listDiagnosticTopicScores =
    async ({
        assessmentId,
        userId,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                SELECT
                    diagnostic_questions.topic_id,

                    COUNT(
                        diagnostic_responses.id
                    ) AS evaluated_count,

                    COALESCE(
                        ROUND(
                            AVG(
                                diagnostic_responses.score
                            ),
                            2
                        ),
                        0
                    ) AS mastery_score
                FROM diagnostic_questions
                JOIN diagnostic_responses
                    ON diagnostic_responses.question_id =
                        diagnostic_questions.id
                   AND diagnostic_responses.user_id =
                        diagnostic_questions.user_id
                   AND diagnostic_responses.status =
                        'evaluated'
                WHERE diagnostic_questions.assessment_id = $1
                  AND diagnostic_questions.user_id = $2
                GROUP BY
                    diagnostic_questions.topic_id
                ORDER BY
                    diagnostic_questions.topic_id
            `,
            values: [
                assessmentId,
                userId,
            ],
        });

        return Object.freeze(
            result.rows.map((row) => (
                Object.freeze({
                    topicId: row.topic_id,
                    evaluatedCount: Number(
                        row.evaluated_count,
                    ),
                    masteryScore: Number(
                        row.mastery_score,
                    ),
                })
            )),
        );
    };

export const upsertKnowledgeStateRecord =
    async ({
        userId,
        topicId,
        masteryScore,
        confidenceScore,
        attemptsCount,
        evaluatedAt = new Date(),
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                INSERT INTO knowledge_states (
                    user_id,
                    topic_id,
                    mastery_score,
                    confidence_score,
                    attempts_count,
                    last_evaluated_at
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6
                )
                ON CONFLICT (
                    user_id,
                    topic_id
                )
                DO UPDATE SET
                    mastery_score =
                        EXCLUDED.mastery_score,

                    confidence_score =
                        GREATEST(
                            knowledge_states
                                .confidence_score,
                            EXCLUDED.confidence_score
                        ),

                    attempts_count =
                        knowledge_states
                            .attempts_count
                        + EXCLUDED.attempts_count,

                    last_evaluated_at =
                        EXCLUDED.last_evaluated_at
                RETURNING
                    id,
                    user_id,
                    topic_id,
                    mastery_score,
                    confidence_score,
                    attempts_count,
                    last_evaluated_at
            `,
            values: [
                userId,
                topicId,
                masteryScore,
                confidenceScore,
                attemptsCount,
                evaluatedAt,
            ],
        });

        const row = result.rows[0];

        return Object.freeze({
            id: row.id,
            userId: row.user_id,
            topicId: row.topic_id,
            masteryScore: Number(
                row.mastery_score,
            ),
            confidenceScore: Number(
                row.confidence_score,
            ),
            attemptsCount:
                row.attempts_count,
            lastEvaluatedAt:
                row.last_evaluated_at,
        });
    };

export const completeDiagnosticAssessmentRecord =
    async ({
        assessmentId,
        userId,
        overallScore,
        resultingDifficultyId,
        completedAt = new Date(),
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                UPDATE diagnostic_assessments
                SET
                    status = 'completed',
                    overall_score = $3,
                    resulting_difficulty_id = $4,
                    completed_at =
                        GREATEST(
                            $5,
                            started_at,
                            created_at
                        ),
                    updated_at =
                        GREATEST(
                            $5,
                            started_at,
                            created_at
                        )
                WHERE id = $1
                  AND user_id = $2
                  AND status = 'in_progress'
                  AND question_count > 0
                  AND answered_count =
                      question_count
                RETURNING
                    id,
                    user_id,
                    status,
                    question_count,
                    answered_count,
                    overall_score,
                    resulting_difficulty_id,
                    completed_at
            `,
            values: [
                assessmentId,
                userId,
                overallScore,
                resultingDifficultyId,
                completedAt,
            ],
        });

        const row = result.rows[0];

        if (!row) {
            return null;
        }

        return Object.freeze({
            id: row.id,
            userId: row.user_id,
            status: row.status,
            questionCount:
                row.question_count,
            answeredCount:
                row.answered_count,
            overallScore: Number(
                row.overall_score,
            ),
            resultingDifficultyId:
                row.resulting_difficulty_id,
            completedAt: row.completed_at,
        });
    };

export const upsertLearningProfileFromDiagnostic =
    async ({
        userId,
        difficultyId,
        assessmentId,
        completedAt = new Date(),
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                INSERT INTO learning_profiles (
                    user_id,
                    current_difficulty_id,
                    diagnostic_completed_at,
                    last_diagnostic_assessment_id,
                    updated_at
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $3
                )
                ON CONFLICT (user_id)
                DO UPDATE SET
                    current_difficulty_id =
                        EXCLUDED.current_difficulty_id,
                    diagnostic_completed_at =
                        EXCLUDED.diagnostic_completed_at,
                    last_diagnostic_assessment_id =
                        EXCLUDED
                            .last_diagnostic_assessment_id,
                    updated_at =
                        EXCLUDED.updated_at
                RETURNING
                    user_id,
                    current_difficulty_id,
                    diagnostic_completed_at,
                    last_diagnostic_assessment_id,
                    updated_at
            `,
            values: [
                userId,
                difficultyId,
                completedAt,
                assessmentId,
            ],
        });

        const row = result.rows[0];

        return Object.freeze({
            userId: row.user_id,
            currentDifficultyId:
                row.current_difficulty_id,
            diagnosticCompletedAt:
                row.diagnostic_completed_at,
            lastDiagnosticAssessmentId:
                row.last_diagnostic_assessment_id,
            updatedAt: row.updated_at,
        });
    };
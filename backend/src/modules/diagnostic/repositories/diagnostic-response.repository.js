import {
    databasePool,
} from '../../../config/database.js';

const mapQuestionForEvaluation = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        id: row.id,
        assessmentId: row.assessment_id,
        userId: row.user_id,
        topicId: row.topic_id,
        difficultyId: row.difficulty_id,
        position: row.position,
        questionType: row.question_type,
        expectedAnswer: row.expected_answer,
        evaluationCriteria:
            row.evaluation_criteria ?? {},
        explanation: row.explanation,
        maxScore: Number(row.max_score),
        assessmentStatus:
            row.assessment_status,
        assessmentExpiresAt:
            row.assessment_expires_at,
    });
};

const mapDiagnosticResponse = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        id: row.id,
        questionId: row.question_id,
        userId: row.user_id,
        answer: row.answer,
        submittedCode: row.submitted_code,
        status: row.status,
        isCorrect: row.is_correct,
        score:
            row.score === null
                ? null
                : Number(row.score),
        feedback: row.feedback,
        evaluationSource:
            row.evaluation_source,
        evaluationPromptVersionId:
            row.evaluation_prompt_version_id,
        evaluationMetadata:
            row.evaluation_metadata ?? {},
        submittedAt: row.submitted_at,
        evaluatedAt: row.evaluated_at,
    });
};

const responseReturningColumns = `
    id,
    question_id,
    user_id,
    answer,
    submitted_code,
    status,
    is_correct,
    score,
    feedback,
    evaluation_source,
    evaluation_prompt_version_id,
    evaluation_metadata,
    submitted_at,
    evaluated_at
`;

export const findDiagnosticQuestionForEvaluation =
    async ({
        assessmentId,
        questionId,
        userId,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                SELECT
                    diagnostic_questions.id,
                    diagnostic_questions.assessment_id,
                    diagnostic_questions.user_id,
                    diagnostic_questions.topic_id,
                    diagnostic_questions.difficulty_id,
                    diagnostic_questions.position,
                    diagnostic_questions.question_type,
                    diagnostic_questions.expected_answer,
                    diagnostic_questions.evaluation_criteria,
                    diagnostic_questions.explanation,
                    diagnostic_questions.max_score,
                    diagnostic_assessments.status
                        AS assessment_status,
                    diagnostic_assessments.expires_at
                        AS assessment_expires_at
                FROM diagnostic_questions
                JOIN diagnostic_assessments
                    ON diagnostic_assessments.id =
                        diagnostic_questions.assessment_id
                   AND diagnostic_assessments.user_id =
                        diagnostic_questions.user_id
                WHERE diagnostic_questions.id = $1
                  AND diagnostic_questions.assessment_id = $2
                  AND diagnostic_questions.user_id = $3
            `,
            values: [
                questionId,
                assessmentId,
                userId,
            ],
        });

        return mapQuestionForEvaluation(
            result.rows[0],
        );
    };

export const createEvaluatedDiagnosticResponseRecord =
    async ({
        questionId,
        userId,
        answer,
        submittedCode = null,
        isCorrect,
        score,
        feedback,
        evaluationSource = 'automatic',
        evaluationMetadata = {},
        evaluatedAt = new Date(),
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                INSERT INTO diagnostic_responses (
                    question_id,
                    user_id,
                    answer,
                    submitted_code,
                    status,
                    is_correct,
                    score,
                    feedback,
                    evaluation_source,
                    evaluation_metadata,
                    submitted_at,
                    evaluated_at
                )
                VALUES (
                    $1,
                    $2,
                    $3::JSONB,
                    $4,
                    'evaluated',
                    $5,
                    $6,
                    $7,
                    $8,
                    $9::JSONB,
                    $10,
                    $10
                )
                ON CONFLICT (question_id)
                DO NOTHING
                RETURNING
                    ${responseReturningColumns}
            `,
            values: [
                questionId,
                userId,
                JSON.stringify(answer),
                submittedCode,
                isCorrect,
                score,
                feedback,
                evaluationSource,
                JSON.stringify(
                    evaluationMetadata,
                ),
                evaluatedAt,
            ],
        });

        return mapDiagnosticResponse(
            result.rows[0],
        );
    };

export const listDiagnosticResponsesByAssessment =
    async ({
        assessmentId,
        userId,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                SELECT
                    diagnostic_responses.id,
                    diagnostic_responses.question_id,
                    diagnostic_responses.user_id,
                    diagnostic_responses.answer,
                    diagnostic_responses.submitted_code,
                    diagnostic_responses.status,
                    diagnostic_responses.is_correct,
                    diagnostic_responses.score,
                    diagnostic_responses.feedback,
                    diagnostic_responses.evaluation_source,
                    diagnostic_responses.evaluation_prompt_version_id,
                    diagnostic_responses.evaluation_metadata,
                    diagnostic_responses.submitted_at,
                    diagnostic_responses.evaluated_at
                FROM diagnostic_responses
                JOIN diagnostic_questions
                    ON diagnostic_questions.id =
                        diagnostic_responses.question_id
                WHERE diagnostic_questions.assessment_id = $1
                  AND diagnostic_responses.user_id = $2
                ORDER BY diagnostic_questions.position
            `,
            values: [
                assessmentId,
                userId,
            ],
        });

        return Object.freeze(
            result.rows.map(
                mapDiagnosticResponse,
            ),
        );
    };
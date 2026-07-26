import {
    databasePool,
} from '../../../config/database.js';

const mapCreatedQuestion = (row) => {
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
        prompt: row.prompt,
        options: Object.freeze([
            ...(row.options ?? []),
        ]),
        starterCode: row.starter_code,
        expectedAnswer: row.expected_answer,
        evaluationCriteria:
            row.evaluation_criteria ?? {},
        explanation: row.explanation,
        contentFingerprint:
            row.content_fingerprint,
        maxScore: Number(row.max_score),
        generationMetadata:
            row.generation_metadata ?? {},
        createdAt: row.created_at,
    });
};

const mapStudentQuestion = (row) => (
    Object.freeze({
        id: row.id,
        position: row.position,
        questionType: row.question_type,
        prompt: row.prompt,
        options: Object.freeze([
            ...(row.options ?? []),
        ]),
        starterCode: row.starter_code,
        maxScore: Number(row.max_score),

        topic: Object.freeze({
            id: row.topic_id,
            name: row.topic_name,
        }),

        difficulty: Object.freeze({
            id: row.difficulty_id,
            name: row.difficulty_name,
        }),
    })
);

const questionReturningColumns = `
    id,
    assessment_id,
    user_id,
    topic_id,
    difficulty_id,
    position,
    question_type,
    prompt,
    options,
    starter_code,
    expected_answer,
    evaluation_criteria,
    explanation,
    content_fingerprint,
    max_score,
    generation_metadata,
    created_at
`;

export const createDiagnosticQuestionRecord =
    async ({
        assessmentId,
        userId,
        question,
        generationMetadata = {},
        client = databasePool,
    }) => {
        const maximumScore =
            question.evaluationCriteria
                ?.maximumScore
            ?? 100;

        const result = await client.query({
            text: `
                INSERT INTO diagnostic_questions (
                    assessment_id,
                    user_id,
                    topic_id,
                    difficulty_id,
                    position,
                    question_type,
                    prompt,
                    options,
                    starter_code,
                    expected_answer,
                    evaluation_criteria,
                    explanation,
                    content_fingerprint,
                    max_score,
                    generation_metadata
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8::JSONB,
                    $9,
                    $10::JSONB,
                    $11::JSONB,
                    $12,
                    $13,
                    $14,
                    $15::JSONB
                )
                RETURNING
                    ${questionReturningColumns}
            `,
            values: [
                assessmentId,
                userId,
                question.topicId,
                question.difficultyLevelId,
                question.position,
                question.questionType,
                question.prompt,
                JSON.stringify(
                    question.options ?? [],
                ),
                question.starterCode ?? null,
                JSON.stringify(
                    question.expectedAnswer,
                ),
                JSON.stringify(
                    question.evaluationCriteria
                    ?? {},
                ),
                question.explanation ?? null,
                question.contentFingerprint,
                maximumScore,
                JSON.stringify(
                    generationMetadata,
                ),
            ],
        });

        return mapCreatedQuestion(
            result.rows[0],
        );
    };

export const createDiagnosticQuestionRecords =
    async ({
        assessmentId,
        userId,
        questions,
        generationMetadata = {},
        client = databasePool,
    }) => {
        const records = [];

        for (const question of questions) {
            const record =
                await createDiagnosticQuestionRecord({
                    assessmentId,
                    userId,
                    question,
                    generationMetadata,
                    client,
                });

            records.push(record);
        }

        return Object.freeze(records);
    };

export const listDiagnosticQuestionsForStudent =
    async ({
        assessmentId,
        userId,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                SELECT
                    diagnostic_questions.id,
                    diagnostic_questions.position,
                    diagnostic_questions.question_type,
                    diagnostic_questions.prompt,
                    diagnostic_questions.options,
                    diagnostic_questions.starter_code,
                    diagnostic_questions.max_score,
                    diagnostic_questions.topic_id,
                    topics.name AS topic_name,
                    diagnostic_questions.difficulty_id,
                    difficulty_levels.name
                        AS difficulty_name
                FROM diagnostic_questions
                JOIN topics
                    ON topics.id =
                        diagnostic_questions.topic_id
                JOIN difficulty_levels
                    ON difficulty_levels.id =
                        diagnostic_questions.difficulty_id
                WHERE diagnostic_questions.assessment_id = $1
                  AND diagnostic_questions.user_id = $2
                ORDER BY diagnostic_questions.position
            `,
            values: [
                assessmentId,
                userId,
            ],
        });

        return Object.freeze(
            result.rows.map(
                mapStudentQuestion,
            ),
        );
    };
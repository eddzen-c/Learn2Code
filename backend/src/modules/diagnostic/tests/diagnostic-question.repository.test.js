import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createDiagnosticQuestionRecord,
    createDiagnosticQuestionRecords,
    listDiagnosticQuestionsForStudent,
} from '../repositories/diagnostic-question.repository.js';

const question = {
    topicId: 1,
    difficultyLevelId: 1,
    position: 1,
    questionType: 'code_output',
    prompt: '¿Qué resultado muestra el código?',
    options: [
        '5',
        '6',
        '7',
    ],
    starterCode: null,
    expectedAnswer: '5',
    evaluationCriteria: {
        mode: 'exact_match',
        caseSensitive: false,
        maximumScore: 100,
    },
    explanation:
        'El resultado correcto es 5.',
    contentFingerprint: 'a'.repeat(64),
};

const createdQuestionRow = (
    overrides = {},
) => ({
    id: 'question-1',
    assessment_id: 'assessment-1',
    user_id: 'user-1',
    topic_id: 1,
    difficulty_id: 1,
    position: 1,
    question_type: 'code_output',
    prompt: question.prompt,
    options: question.options,
    starter_code: null,
    expected_answer: '5',
    evaluation_criteria:
        question.evaluationCriteria,
    explanation: question.explanation,
    content_fingerprint: 'a'.repeat(64),
    max_score: '100',
    generation_metadata: {
        provider: 'mock',
    },
    created_at:
        new Date('2026-07-25T15:00:00Z'),
    ...overrides,
});

const createClient = (handler) => {
    const calls = [];

    return {
        calls,

        query: async (query) => {
            calls.push(query);

            return handler(
                query,
                calls.length - 1,
            );
        },
    };
};

test(
    'createDiagnosticQuestionRecord inserts and maps a question',
    async () => {
        const client = createClient(
            async () => ({
                rows: [
                    createdQuestionRow(),
                ],
            }),
        );

        const record =
            await createDiagnosticQuestionRecord({
                assessmentId: 'assessment-1',
                userId: 'user-1',
                question,
                generationMetadata: {
                    provider: 'mock',
                },
                client,
            });

        assert.equal(
            record.id,
            'question-1',
        );

        assert.equal(record.maxScore, 100);

        assert.deepEqual(
            record.options,
            ['5', '6', '7'],
        );

        const values = client.calls[0].values;

        assert.equal(
            values[7],
            JSON.stringify(question.options),
        );

        assert.equal(
            values[9],
            JSON.stringify(
                question.expectedAnswer,
            ),
        );

        assert.equal(
            values[10],
            JSON.stringify(
                question.evaluationCriteria,
            ),
        );

        assert.ok(Object.isFrozen(record));
    },
);

test(
    'createDiagnosticQuestionRecords inserts every question',
    async () => {
        const questions = [
            question,
            {
                ...question,
                position: 2,
                topicId: 2,
                expectedAnswer: 'Aprobado',
                contentFingerprint:
                    'b'.repeat(64),
            },
        ];

        const client = createClient(
            async (_query, index) => ({
                rows: [
                    createdQuestionRow({
                        id: `question-${index + 1}`,
                        position: index + 1,
                        topic_id:
                            questions[index].topicId,
                        expected_answer:
                            questions[index]
                                .expectedAnswer,
                        content_fingerprint:
                            questions[index]
                                .contentFingerprint,
                    }),
                ],
            }),
        );

        const records =
            await createDiagnosticQuestionRecords({
                assessmentId: 'assessment-1',
                userId: 'user-1',
                questions,
                generationMetadata: {
                    provider: 'mock',
                },
                client,
            });

        assert.equal(records.length, 2);
        assert.equal(client.calls.length, 2);

        assert.equal(
            records[1].expectedAnswer,
            'Aprobado',
        );

        assert.ok(Object.isFrozen(records));
    },
);

test(
    'listDiagnosticQuestionsForStudent hides correct answers',
    async () => {
        const client = createClient(
            async () => ({
                rows: [
                    {
                        id: 'question-1',
                        position: 1,
                        question_type:
                            'code_output',
                        prompt: question.prompt,
                        options: question.options,
                        starter_code: null,
                        max_score: '100',
                        topic_id: 1,
                        topic_name: 'variables',
                        difficulty_id: 1,
                        difficulty_name: 'básico',
                    },
                ],
            }),
        );

        const questions =
            await listDiagnosticQuestionsForStudent({
                assessmentId: 'assessment-1',
                userId: 'user-1',
                client,
            });

        assert.equal(questions.length, 1);

        assert.deepEqual(
            questions[0].topic,
            {
                id: 1,
                name: 'variables',
            },
        );

        assert.deepEqual(
            questions[0].difficulty,
            {
                id: 1,
                name: 'básico',
            },
        );

        assert.equal(
            'expectedAnswer' in questions[0],
            false,
        );

        assert.equal(
            'evaluationCriteria' in questions[0],
            false,
        );

        assert.equal(
            'explanation' in questions[0],
            false,
        );
    },
);

test(
    'listDiagnosticQuestionsForStudent returns an empty list',
    async () => {
        const client = createClient(
            async () => ({
                rows: [],
            }),
        );

        const questions =
            await listDiagnosticQuestionsForStudent({
                assessmentId: 'assessment-1',
                userId: 'user-1',
                client,
            });

        assert.deepEqual(questions, []);
        assert.ok(Object.isFrozen(questions));
    },
);
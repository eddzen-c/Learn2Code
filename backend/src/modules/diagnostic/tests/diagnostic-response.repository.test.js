import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createEvaluatedDiagnosticResponseRecord,
    findDiagnosticQuestionForEvaluation,
    listDiagnosticResponsesByAssessment,
} from '../repositories/diagnostic-response.repository.js';

const evaluatedAt =
    new Date('2026-07-25T17:00:00Z');

const responseRow = (overrides = {}) => ({
    id: 'response-1',
    question_id: 'question-1',
    user_id: 'user-1',
    answer: '5',
    submitted_code: null,
    status: 'evaluated',
    is_correct: true,
    score: '100',
    feedback: 'Respuesta correcta.',
    evaluation_source: 'automatic',
    evaluation_prompt_version_id: null,
    evaluation_metadata: {
        mode: 'exact_match',
    },
    submitted_at: evaluatedAt,
    evaluated_at: evaluatedAt,
    ...overrides,
});

const createClient = (rows) => {
    const calls = [];

    return {
        calls,

        query: async (query) => {
            calls.push(query);

            return {
                rows,
            };
        },
    };
};

test(
    'findDiagnosticQuestionForEvaluation maps a question',
    async () => {
        const client = createClient([
            {
                id: 'question-1',
                assessment_id: 'assessment-1',
                user_id: 'user-1',
                topic_id: 1,
                difficulty_id: 1,
                position: 1,
                question_type: 'code_output',
                expected_answer: '5',
                evaluation_criteria: {
                    mode: 'exact_match',
                    caseSensitive: false,
                },
                explanation:
                    'La respuesta correcta es 5.',
                max_score: '100',
                assessment_status:
                    'in_progress',
                assessment_expires_at:
                    new Date(
                        '2026-07-25T17:30:00Z',
                    ),
            },
        ]);

        const question =
            await findDiagnosticQuestionForEvaluation({
                assessmentId: 'assessment-1',
                questionId: 'question-1',
                userId: 'user-1',
                client,
            });

        assert.equal(
            question.expectedAnswer,
            '5',
        );

        assert.equal(question.maxScore, 100);

        assert.equal(
            question.assessmentStatus,
            'in_progress',
        );

        assert.deepEqual(
            client.calls[0].values,
            [
                'question-1',
                'assessment-1',
                'user-1',
            ],
        );

        assert.ok(Object.isFrozen(question));
    },
);

test(
    'findDiagnosticQuestionForEvaluation returns null',
    async () => {
        const client = createClient([]);

        const question =
            await findDiagnosticQuestionForEvaluation({
                assessmentId: 'assessment-1',
                questionId: 'missing-question',
                userId: 'user-1',
                client,
            });

        assert.equal(question, null);
    },
);

test(
    'createEvaluatedDiagnosticResponseRecord inserts a response',
    async () => {
        const client = createClient([
            responseRow(),
        ]);

        const response =
            await createEvaluatedDiagnosticResponseRecord({
                questionId: 'question-1',
                userId: 'user-1',
                answer: '5',
                isCorrect: true,
                score: 100,
                feedback:
                    'Respuesta correcta.',
                evaluationMetadata: {
                    mode: 'exact_match',
                },
                evaluatedAt,
                client,
            });

        assert.equal(response.isCorrect, true);
        assert.equal(response.score, 100);

        assert.equal(
            client.calls[0].values[2],
            JSON.stringify('5'),
        );

        assert.equal(
            client.calls[0].values[8],
            JSON.stringify({
                mode: 'exact_match',
            }),
        );

        assert.equal(
            client.calls[0].values[9],
            evaluatedAt,
        );

        assert.ok(Object.isFrozen(response));
    },
);

test(
    'createEvaluatedDiagnosticResponseRecord returns null for a duplicate',
    async () => {
        const client = createClient([]);

        const response =
            await createEvaluatedDiagnosticResponseRecord({
                questionId: 'question-1',
                userId: 'user-1',
                answer: '5',
                isCorrect: true,
                score: 100,
                feedback:
                    'Respuesta correcta.',
                evaluatedAt,
                client,
            });

        assert.equal(response, null);
    },
);

test(
    'listDiagnosticResponsesByAssessment returns responses',
    async () => {
        const client = createClient([
            responseRow(),
            responseRow({
                id: 'response-2',
                question_id: 'question-2',
                answer: 'Repaso',
                is_correct: false,
                score: '0',
                feedback:
                    'Revisa las condiciones.',
            }),
        ]);

        const responses =
            await listDiagnosticResponsesByAssessment({
                assessmentId: 'assessment-1',
                userId: 'user-1',
                client,
            });

        assert.equal(responses.length, 2);

        assert.equal(
            responses[0].score,
            100,
        );

        assert.equal(
            responses[1].score,
            0,
        );

        assert.equal(
            responses[1].isCorrect,
            false,
        );

        assert.ok(Object.isFrozen(responses));
    },
);
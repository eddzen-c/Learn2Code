import assert from 'node:assert/strict';
import test from 'node:test';

import {
    DiagnosticExpiredError,
    DiagnosticNotInProgressError,
    DiagnosticQuestionAlreadyAnsweredError,
    DiagnosticQuestionNotFoundError,
} from '../errors/diagnostic.errors.js';

import {
    submitDiagnosticAnswer,
} from '../services/submit-diagnostic-answer.service.js';

const now =
    new Date('2026-07-25T19:00:00Z');

const question = Object.freeze({
    id: 'question-1',
    assessmentId: 'assessment-1',
    userId: 'user-1',
    topicId: 1,
    difficultyId: 1,
    position: 1,
    questionType: 'code_output',
    expectedAnswer: '5',
    evaluationCriteria: Object.freeze({
        mode: 'exact_match',
        caseSensitive: false,
    }),
    explanation:
        'El resultado correcto es 5.',
    maxScore: 100,
    assessmentStatus: 'in_progress',
    assessmentExpiresAt:
        new Date('2026-07-25T19:30:00Z'),
});

const evaluatedResponse = Object.freeze({
    id: 'response-1',
    questionId: 'question-1',
    userId: 'user-1',
    answer: '5',
    submittedCode: null,
    status: 'evaluated',
    isCorrect: true,
    score: 100,
    feedback: 'Respuesta correcta.',
    evaluationSource: 'automatic',
    evaluationMetadata: Object.freeze({
        mode: 'exact_match',
    }),
    submittedAt: now,
    evaluatedAt: now,
});

const assessmentProgress = Object.freeze({
    id: 'assessment-1',
    userId: 'user-1',
    status: 'in_progress',
    questionCount: 8,
    answeredCount: 2,
});

const createPool = () => {
    const statements = [];
    let releases = 0;

    const client = {
        query: async (query) => {
            const text = typeof query === 'string'
                ? query
                : query.text;

            statements.push(text.trim());

            return {
                rows: [],
            };
        },

        release: () => {
            releases += 1;
        },
    };

    return {
        statements,

        connect: async () => client,

        get releaseCount() {
            return releases;
        },
    };
};

const createDependencies = (
    overrides = {},
) => ({
    findDiagnosticQuestionForEvaluation:
        async () => question,

    createEvaluatedDiagnosticResponseRecord:
        async () => evaluatedResponse,

    incrementDiagnosticAnsweredCount:
        async () => assessmentProgress,

    ...overrides,
});

test(
    'submitDiagnosticAnswer evaluates and stores an answer',
    async () => {
        const pool = createPool();

        const result =
            await submitDiagnosticAnswer({
                assessmentId: 'assessment-1',
                questionId: 'question-1',
                userId: 'user-1',
                answer: ' 5 ',
                now,
                pool,
                dependencies:
                    createDependencies(),
            });

        assert.equal(
            result.response.isCorrect,
            true,
        );

        assert.equal(
            result.response.score,
            100,
        );

        assert.equal(
            result.progress.answeredCount,
            2,
        );

        assert.equal(
            result.progress.questionCount,
            8,
        );

        assert.equal(
            result.progress.allAnswered,
            false,
        );

        assert.ok(
            pool.statements.includes(
                'COMMIT',
            ),
        );

        assert.equal(pool.releaseCount, 1);
    },
);

test(
    'submitDiagnosticAnswer rejects a missing question',
    async () => {
        const pool = createPool();

        await assert.rejects(
            () => submitDiagnosticAnswer({
                assessmentId: 'assessment-1',
                questionId: 'question-404',
                userId: 'user-1',
                answer: '5',
                now,
                pool,
                dependencies:
                    createDependencies({
                        findDiagnosticQuestionForEvaluation:
                            async () => null,
                    }),
            }),
            DiagnosticQuestionNotFoundError,
        );

        assert.ok(
            pool.statements.includes(
                'ROLLBACK',
            ),
        );
    },
);

test(
    'submitDiagnosticAnswer rejects an inactive diagnostic',
    async () => {
        const pool = createPool();

        await assert.rejects(
            () => submitDiagnosticAnswer({
                assessmentId: 'assessment-1',
                questionId: 'question-1',
                userId: 'user-1',
                answer: '5',
                now,
                pool,
                dependencies:
                    createDependencies({
                        findDiagnosticQuestionForEvaluation:
                            async () => ({
                                ...question,
                                assessmentStatus:
                                    'completed',
                            }),
                    }),
            }),
            DiagnosticNotInProgressError,
        );
    },
);

test(
    'submitDiagnosticAnswer rejects an expired diagnostic',
    async () => {
        const pool = createPool();

        await assert.rejects(
            () => submitDiagnosticAnswer({
                assessmentId: 'assessment-1',
                questionId: 'question-1',
                userId: 'user-1',
                answer: '5',
                now,
                pool,
                dependencies:
                    createDependencies({
                        findDiagnosticQuestionForEvaluation:
                            async () => ({
                                ...question,
                                assessmentExpiresAt:
                                    new Date(
                                        '2026-07-25T18:59:59Z',
                                    ),
                            }),
                    }),
            }),
            DiagnosticExpiredError,
        );
    },
);

test(
    'submitDiagnosticAnswer rejects an answered question',
    async () => {
        const pool = createPool();
        let incrementCalled = false;

        await assert.rejects(
            () => submitDiagnosticAnswer({
                assessmentId: 'assessment-1',
                questionId: 'question-1',
                userId: 'user-1',
                answer: '5',
                now,
                pool,
                dependencies:
                    createDependencies({
                        createEvaluatedDiagnosticResponseRecord:
                            async () => null,

                        incrementDiagnosticAnsweredCount:
                            async () => {
                                incrementCalled = true;

                                return assessmentProgress;
                            },
                    }),
            }),
            DiagnosticQuestionAlreadyAnsweredError,
        );

        assert.equal(
            incrementCalled,
            false,
        );

        assert.ok(
            pool.statements.includes(
                'ROLLBACK',
            ),
        );
    },
);

test(
    'submitDiagnosticAnswer completes the last response',
    async () => {
        const pool = createPool();
        let completionInput;

        const completedResult =
            Object.freeze({
                assessment: Object.freeze({
                    id: 'assessment-1',
                    status: 'completed',
                    overallScore: 75,
                }),

                resultingDifficulty:
                    Object.freeze({
                        id: 2,
                        name: 'intermedio',
                    }),

                topicScores:
                    Object.freeze([
                        Object.freeze({
                            topicId: 1,
                            evaluatedCount: 2,
                            masteryScore: 75,
                        }),
                    ]),
            });

        const result =
            await submitDiagnosticAnswer({
                assessmentId:
                    'assessment-1',
                questionId:
                    'question-8',
                userId:
                    'user-1',
                answer:
                    '5',
                now,
                pool,

                dependencies:
                    createDependencies({
                        incrementDiagnosticAnsweredCount:
                            async () => ({
                                ...assessmentProgress,
                                answeredCount: 8,
                                questionCount: 8,
                            }),
                    }),

                diagnosticCompleter:
                    async (input) => {
                        completionInput = input;

                        return completedResult;
                    },
            });

        assert.equal(
            result.progress.allAnswered,
            true,
        );

        assert.equal(
            result.completion.status,
            'completed',
        );

        assert.equal(
            result.completion.overallScore,
            75,
        );

        assert.equal(
            result
                .completion
                .resultingDifficulty
                .name,
            'intermedio',
        );

        assert.equal(
            completionInput.assessmentId,
            'assessment-1',
        );

        assert.equal(
            completionInput.userId,
            'user-1',
        );
    },
);
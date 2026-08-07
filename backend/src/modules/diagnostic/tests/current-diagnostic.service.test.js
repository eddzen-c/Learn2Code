import assert from 'node:assert/strict';
import test from 'node:test';

import {
    getCurrentDiagnostic,
} from '../services/current-diagnostic.service.js';

const assessment = Object.freeze({
    id: 'assessment-1',
    userId: 'user-1',
    languageId: 1,
    attemptNumber: 1,
    status: 'in_progress',
    questionCount: 8,
    answeredCount: 1,
    overallScore: null,
    resultingDifficultyId: null,
    startedAt:
        new Date('2026-07-25T22:00:00Z'),
    completedAt: null,
    expiresAt:
        new Date('2026-07-25T22:30:00Z'),
});

const activeRequestTime =
    new Date('2026-07-25T22:15:00Z');

const question = Object.freeze({
    id: 'question-1',
    position: 1,
    questionType: 'code_output',
    prompt: '¿Qué resultado muestra?',
    options: Object.freeze([
        '4',
        '5',
        '6',
    ]),
    starterCode: null,
    maxScore: 100,
    topic: Object.freeze({
        id: 1,
        name: 'variables',
    }),
    difficulty: Object.freeze({
        id: 1,
        name: 'básico',
    }),
});

const response = Object.freeze({
    id: 'response-1',
    questionId: 'question-1',
    userId: 'user-1',
    answer: '5',
    submittedCode: null,
    status: 'evaluated',
    isCorrect: true,
    score: 100,
    feedback: 'Respuesta correcta.',
    evaluatedAt:
        new Date('2026-07-25T22:05:00Z'),
});

const createDependencies = (
    overrides = {},
) => ({
    findLatestDiagnosticAssessmentByUserId:
        async () => assessment,

    markDiagnosticAssessmentExpired:
        async () => ({
            ...assessment,
            status: 'expired',
        }),

    listDiagnosticQuestionsForStudent:
        async () => Object.freeze([
            question,
        ]),

    listDiagnosticResponsesByAssessment:
        async () => Object.freeze([
            response,
        ]),

    listDifficultyLevels:
        async () => Object.freeze([
            {
                id: 1,
                name: 'básico',
            },
            {
                id: 2,
                name: 'intermedio',
            },
            {
                id: 3,
                name: 'avanzado',
            },
        ]),

    ...overrides,
});

test(
    'getCurrentDiagnostic returns not started',
    async () => {
        const result =
            await getCurrentDiagnostic({
                userId: 'user-1',
                client: {},
                dependencies:
                    createDependencies({
                        findLatestDiagnosticAssessmentByUserId:
                            async () => null,
                    }),
            });

        assert.equal(
            result.state,
            'not_started',
        );

        assert.equal(
            result.assessment,
            null,
        );

        assert.deepEqual(
            result.questions,
            [],
        );

        assert.equal(result.result, null);
    },
);

test(
    'getCurrentDiagnostic returns an active diagnostic',
    async () => {
        const result =
            await getCurrentDiagnostic({
                userId: 'user-1',
                now: activeRequestTime,
                client: {},
                dependencies:
                    createDependencies(),
            });

        assert.equal(
            result.state,
            'in_progress',
        );

        assert.equal(
            result.assessment.answeredCount,
            1,
        );

        assert.equal(
            result.questions.length,
            1,
        );

        assert.equal(
            result
                .questions[0]
                .response
                .isCorrect,
            true,
        );

        assert.equal(result.result, null);

        assert.equal(
            'expectedAnswer'
            in result.questions[0],
            false,
        );
    },
);

test(
    'getCurrentDiagnostic marks an expired diagnostic as available',
    async () => {
        const requestTime =
            new Date(
                '2026-07-25T22:31:00Z',
            );

        let expirationInput;

        const result =
            await getCurrentDiagnostic({
                userId: 'user-1',
                now: requestTime,
                client: {},
                dependencies:
                    createDependencies({
                        markDiagnosticAssessmentExpired:
                            async (input) => {
                                expirationInput =
                                    input;

                                return {
                                    ...assessment,
                                    status: 'expired',
                                };
                            },
                    }),
            });

        assert.equal(
            result.state,
            'available',
        );

        assert.equal(
            result.assessment.status,
            'expired',
        );

        assert.equal(
            expirationInput.assessmentId,
            'assessment-1',
        );

        assert.equal(
            expirationInput.userId,
            'user-1',
        );

        assert.equal(
            expirationInput.expiredAt,
            requestTime,
        );
    },
);

test(
    'getCurrentDiagnostic returns a completed result',
    async () => {
        const completedAt =
            new Date('2026-07-25T22:20:00Z');

        const result =
            await getCurrentDiagnostic({
                userId: 'user-1',
                client: {},
                dependencies:
                    createDependencies({
                        findLatestDiagnosticAssessmentByUserId:
                            async () => ({
                                ...assessment,
                                status: 'completed',
                                answeredCount: 8,
                                overallScore: 75,
                                resultingDifficultyId: 2,
                                completedAt,
                            }),
                    }),
            });

        assert.equal(
            result.state,
            'completed',
        );

        assert.equal(
            result.result.overallScore,
            75,
        );

        assert.deepEqual(
            result
                .result
                .resultingDifficulty,
            {
                id: 2,
                name: 'intermedio',
            },
        );

        assert.equal(
            result.result.completedAt,
            completedAt,
        );
    },
);

test(
    'getCurrentDiagnostic allows retry after failure',
    async () => {
        const result =
            await getCurrentDiagnostic({
                userId: 'user-1',
                client: {},
                dependencies:
                    createDependencies({
                        findLatestDiagnosticAssessmentByUserId:
                            async () => ({
                                ...assessment,
                                status: 'failed',
                            }),
                    }),
            });

        assert.equal(
            result.state,
            'available',
        );

        assert.equal(
            result.assessment.status,
            'failed',
        );
    },
);
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    ActiveDiagnosticAssessmentError,
    UnsupportedDiagnosticLanguageError,
} from '../errors/diagnostic.errors.js';

import {
    StudentOnboardingRequiredError,
} from '../../onboarding/errors/student-onboarding.errors.js';

import {
    startDiagnosticAssessment,
} from '../services/start-diagnostic.service.js';

const now =
    new Date('2026-08-06T16:00:00Z');

const language = Object.freeze({
    id: 1,
    name: 'JavaScript',
    fileExtension: '.js',
    sandboxImage:
        'learn2code-sandbox-node:20',
    isActive: true,
});

const topics = Object.freeze([
    Object.freeze({
        id: 1,
        name: 'variables',
    }),
]);

const difficultyLevels = Object.freeze([
    Object.freeze({
        id: 1,
        name: 'básico',
    }),
    Object.freeze({
        id: 2,
        name: 'intermedio',
    }),
    Object.freeze({
        id: 3,
        name: 'avanzado',
    }),
]);

const onboarding = Object.freeze({
    userId: 'user-1',
    language,

    selfAssessedDifficulty:
        Object.freeze({
            id: 1,
            name: 'básico',
        }),

    learningGoal:
        'web_development',

    studyPace:
        'student',

    interestKeys: Object.freeze([
        'music',
        'video_games',
    ]),

    topics,
});

const generatingAssessment = Object.freeze({
    id: 'assessment-1',
    userId: 'user-1',
    languageId: 1,
    attemptNumber: 1,
    status: 'generating',
    questionCount: 0,
    answeredCount: 0,
    startedAt: null,
    expiresAt:
        new Date('2026-08-06T16:30:00Z'),
});

const activeAssessment = Object.freeze({
    ...generatingAssessment,
    status: 'in_progress',
    questionCount: 1,
    startedAt: now,
});

const generatedQuestion = Object.freeze({
    topicId: 1,
    difficultyLevelId: 1,
    position: 1,
    questionType: 'code_output',
    prompt:
        '¿Qué resultado muestra el código?',
    options: Object.freeze([
        '2',
        '3',
        '4',
    ]),
    starterCode: null,
    expectedAnswer: '3',
    evaluationCriteria: Object.freeze({
        mode: 'exact_match',
        maximumScore: 100,
    }),
    explanation:
        'La respuesta correcta es 3.',
    contentFingerprint:
        'a'.repeat(64),
});

const studentQuestion = Object.freeze({
    id: 'question-1',
    position: 1,
    questionType: 'code_output',
    prompt: generatedQuestion.prompt,
    options: generatedQuestion.options,
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

const createPool = () => {
    const statements = [];
    let releases = 0;

    const client = {
        query: async (query) => {
            const text =
                typeof query === 'string'
                    ? query
                    : query.text;

            statements.push(
                text.trim(),
            );

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
    findActiveDiagnosticAssessmentByUserId:
        async () => null,

    findStudentOnboardingByUserId:
        async () => onboarding,

    findActiveSupportedLanguageById:
        async () => language,

    listActiveTopics:
        async () => topics,

    listDifficultyLevels:
        async () => difficultyLevels,

    getNextDiagnosticAttemptNumber:
        async () => 1,

    createDiagnosticAssessmentRecord:
        async () => generatingAssessment,

    createDiagnosticQuestionRecords:
        async () => Object.freeze([]),

    markDiagnosticAssessmentInProgress:
        async () => activeAssessment,

    markDiagnosticAssessmentExpired:
        async () => ({
            ...activeAssessment,
            status: 'expired',
        }),

    listDiagnosticQuestionsForStudent:
        async () => Object.freeze([
            studentQuestion,
        ]),

    markDiagnosticAssessmentFailed:
        async () => generatingAssessment,

    ...overrides,
});

const successfulGenerator =
    async () => ({
        provider: 'mock',

        model:
            'learn2code-mock-diagnostic-v1',

        questions: Object.freeze([
            generatedQuestion,
        ]),
    });

test(
    'startDiagnosticAssessment creates a personalized diagnostic',
    async () => {
        const pool = createPool();
        let generatorInput;

        const result =
            await startDiagnosticAssessment({
                userId: 'user-1',
                now,
                pool,

                dependencies:
                    createDependencies(),

                questionGenerator:
                    async (input) => {
                        generatorInput =
                            input;

                        return successfulGenerator();
                    },
            });

        assert.equal(
            result.assessment.status,
            'in_progress',
        );

        assert.equal(
            result.assessment.questionCount,
            1,
        );

        assert.equal(
            result.questions.length,
            1,
        );

        assert.equal(
            result.generation.simulated,
            true,
        );

        assert.equal(
            generatorInput.variationKey,
            'user-1:attempt-1',
        );

        assert.deepEqual(
            generatorInput.onboardingContext,
            {
                learningGoal:
                    'web_development',

                studyPace:
                    'student',

                interestKeys: [
                    'music',
                    'video_games',
                ],

                selfAssessedDifficultyId:
                    1,

                topicIds: [
                    1,
                ],
            },
        );

        assert.deepEqual(
            generatorInput.topics,
            topics,
        );

        assert.deepEqual(
            generatorInput.difficultyLevels,
            [
                difficultyLevels[0],
                difficultyLevels[1],
            ],
        );

        assert.equal(
            pool.statements.filter(
                (statement) => (
                    statement === 'BEGIN'
                ),
            ).length,
            2,
        );

        assert.equal(
            pool.releaseCount,
            2,
        );
    },
);

test(
    'startDiagnosticAssessment requires a completed onboarding',
    async () => {
        const pool = createPool();

        await assert.rejects(
            () => (
                startDiagnosticAssessment({
                    userId: 'user-1',
                    now,
                    pool,

                    dependencies:
                        createDependencies({
                            findStudentOnboardingByUserId:
                                async () => null,
                        }),

                    questionGenerator:
                        successfulGenerator,
                })
            ),
            StudentOnboardingRequiredError,
        );

        assert.ok(
            pool.statements.includes(
                'ROLLBACK',
            ),
        );

        assert.equal(
            pool.releaseCount,
            1,
        );
    },
);

test(
    'startDiagnosticAssessment rejects an active diagnostic',
    async () => {
        const pool = createPool();

        await assert.rejects(
            () => (
                startDiagnosticAssessment({
                    userId: 'user-1',
                    now,
                    pool,

                    dependencies:
                        createDependencies({
                            findActiveDiagnosticAssessmentByUserId:
                                async () => (
                                    activeAssessment
                                ),
                        }),

                    questionGenerator:
                        successfulGenerator,
                })
            ),
            ActiveDiagnosticAssessmentError,
        );

        assert.ok(
            pool.statements.includes(
                'ROLLBACK',
            ),
        );

        assert.equal(
            pool.releaseCount,
            1,
        );
    },
);

test(
    'startDiagnosticAssessment replaces an expired diagnostic',
    async () => {
        const pool = createPool();
        let expirationInput;

        const result =
            await startDiagnosticAssessment({
                userId: 'user-1',
                now,
                pool,

                dependencies:
                    createDependencies({
                        findActiveDiagnosticAssessmentByUserId:
                            async () => ({
                                ...activeAssessment,

                                expiresAt:
                                    new Date(
                                        now.getTime()
                                        - 1000,
                                    ),
                            }),

                        markDiagnosticAssessmentExpired:
                            async (input) => {
                                expirationInput =
                                    input;

                                return {
                                    ...activeAssessment,
                                    status:
                                        'expired',
                                };
                            },
                    }),

                questionGenerator:
                    successfulGenerator,
            });

        assert.equal(
            result.assessment.status,
            'in_progress',
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
            now,
        );

        assert.equal(
            pool.statements.filter(
                (statement) => (
                    statement === 'ROLLBACK'
                ),
            ).length,
            0,
        );

        assert.equal(
            pool.releaseCount,
            2,
        );
    },
);

test(
    'startDiagnosticAssessment rejects an unavailable onboarding language',
    async () => {
        const pool = createPool();

        await assert.rejects(
            () => (
                startDiagnosticAssessment({
                    userId: 'user-1',
                    now,
                    pool,

                    dependencies:
                        createDependencies({
                            findActiveSupportedLanguageById:
                                async () => null,
                        }),

                    questionGenerator:
                        successfulGenerator,
                })
            ),
            UnsupportedDiagnosticLanguageError,
        );

        assert.ok(
            pool.statements.includes(
                'ROLLBACK',
            ),
        );
    },
);

test(
    'startDiagnosticAssessment marks generation failures',
    async () => {
        const pool = createPool();
        let failureInput;

        const generationError =
            new Error(
                'Generation failed',
            );

        const dependencies =
            createDependencies({
                markDiagnosticAssessmentFailed:
                    async (input) => {
                        failureInput = input;

                        return {
                            ...generatingAssessment,
                            status: 'failed',
                        };
                    },
            });

        await assert.rejects(
            () => (
                startDiagnosticAssessment({
                    userId: 'user-1',
                    now,
                    pool,
                    dependencies,

                    questionGenerator:
                        async () => {
                            throw generationError;
                        },
                })
            ),
            generationError,
        );

        assert.equal(
            failureInput.assessmentId,
            'assessment-1',
        );

        assert.equal(
            failureInput.userId,
            'user-1',
        );

        assert.equal(
            failureInput
                .failureMetadata
                .failureCode,
            'DIAGNOSTIC_GENERATION_FAILED',
        );
    },
);
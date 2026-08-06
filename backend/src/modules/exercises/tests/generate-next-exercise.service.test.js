import assert from 'node:assert/strict';
import {
    randomUUID,
} from 'node:crypto';
import test from 'node:test';

import {
    DiagnosticRequiredForExerciseError,
    ExerciseGenerationFailedError,
} from '../errors/exercise.errors.js';

import {
    generateNextExercise,
} from '../services/generate-next-exercise.service.js';

const createContext = ({
    userId,
    assessmentId,
}) => ({
    userId,
    diagnosticAssessmentId:
        assessmentId,
    diagnosticCompletedAt:
        new Date(
            '2026-07-28T10:00:00.000Z',
        ),

    difficulty: {
        id: 2,
        name: 'intermedio',
    },

    language: {
        id: 1,
        name: 'JavaScript',
        fileExtension: '.js',
    },

    weakestTopic: {
        id: 3,
        name: 'ciclos',
        description:
            'Estructuras de repetición',
        masteryScore: 42,
        confidenceScore: 60,
        attemptsCount: 2,
    },

    generationSequence: 0,
});

const createOnboarding = ({
    userId,
}) => ({
    userId,

    learningGoal:
        'build_product',

    studyPace:
        'student',

    interestKeys: [
        'music',
        'video_games',
    ],
});

const createPool = () => {
    const commands = [];
    let released = false;

    const client = {
        query: async (command) => {
            commands.push(command);

            return {
                rows: [],
            };
        },

        release: () => {
            released = true;
        },
    };

    return {
        pool: {
            connect: async () => client,
        },

        commands,

        wasReleased: () => released,
    };
};

test(
    'generateNextExercise creates and returns a safe personalized exercise',
    async () => {
        const userId = randomUUID();
        const assessmentId = randomUUID();
        const exerciseId = randomUUID();
        const assignmentId = randomUUID();

        const now = new Date(
            '2026-07-28T12:00:00.000Z',
        );

        const {
            pool,
            commands,
            wasReleased,
        } = createPool();

        let receivedGenerationInput = null;
        let receivedExerciseInput = null;
        let receivedAssignmentInput = null;
        let receivedLogInput = null;

        const result =
            await generateNextExercise({
                userId,
                now,
                pool,

                findActiveAssignment:
                    async () => null,

                findContext: async () => (
                    createContext({
                        userId,
                        assessmentId,
                    })
                ),

                findOnboarding:
                    async () => (
                        createOnboarding({
                            userId,
                        })
                    ),

                generateExercise:
                    async (input) => {
                        receivedGenerationInput =
                            input;

                        return {
                            provider: 'mock',
                            model:
                                'learn2code-mock-exercise-v1',

                            exercise: {
                                topicId: 3,
                                difficultyId: 2,
                                languageId: 1,
                                title:
                                    'Suma acumulada',
                                statement:
                                    'Suma del 1 hasta N.',
                                instructions:
                                    'Muestra el resultado.',
                                starterCode:
                                    '// Starter',
                                solutionCode:
                                    '// Private solution',
                                estimatedMinutes:
                                    16,

                                testCases: [
                                    {
                                        position: 1,
                                        input: '4',
                                        expectedOutput:
                                            '10',
                                        isHidden: false,
                                        weight: 1,
                                    },
                                    {
                                        position: 2,
                                        input: '6',
                                        expectedOutput:
                                            '21',
                                        isHidden: true,
                                        weight: 1,
                                    },
                                ],
                            },
                        };
                    },

                createExercise:
                    async (input) => {
                        receivedExerciseInput =
                            input;

                        return {
                            id: exerciseId,
                            topicId: 3,
                            difficultyId: 2,
                            languageId: 1,
                            createdByUserId:
                                userId,
                            title:
                                input.title,
                            statement:
                                input.statement,
                            instructions:
                                input.instructions,
                            starterCode:
                                input.starterCode,
                            solutionCode:
                                input.solutionCode,
                            estimatedMinutes:
                                input
                                    .estimatedMinutes,
                            generationSource:
                                'ai',
                            status:
                                'published',
                        };
                    },

                createTestCases:
                    async () => ([
                        {
                            id: randomUUID(),
                            exerciseId,
                            position: 1,
                            input: '4',
                            expectedOutput:
                                '10',
                            isHidden: false,
                            weight: 1,
                        },
                        {
                            id: randomUUID(),
                            exerciseId,
                            position: 2,
                            input: '6',
                            expectedOutput:
                                '21',
                            isHidden: true,
                            weight: 1,
                        },
                    ]),

                createAssignment:
                    async (input) => {
                        receivedAssignmentInput =
                            input;

                        return {
                            id: assignmentId,
                            userId,
                            exerciseId,
                            source:
                                'adaptive_ai',
                            status: 'assigned',
                            assignedAt: now,
                            startedAt: null,
                            completedAt: null,
                            expiresAt:
                                input.expiresAt,
                            metadata:
                                input.metadata,
                        };
                    },

                createGenerationLog:
                    async (input) => {
                        receivedLogInput = input;

                        return {
                            id: randomUUID(),
                            success: true,
                        };
                    },
            });

        assert.deepEqual(
            commands,
            ['BEGIN', 'COMMIT'],
        );

        assert.equal(
            wasReleased(),
            true,
        );

        assert.equal(
            receivedGenerationInput
                .variationKey,
            `${assessmentId}:1:3`,
        );

        assert.deepEqual(
            receivedGenerationInput
                .personalizationContext,
            {
                learningGoal:
                    'build_product',

                studyPace:
                    'student',

                interestKeys: [
                    'music',
                    'video_games',
                ],
            },
        );

        assert.deepEqual(
            receivedAssignmentInput
                .metadata
                .personalizationContext,
            receivedGenerationInput
                .personalizationContext,
        );

        assert.deepEqual(
            receivedLogInput
                .generationParams
                .personalizationContext,
            receivedGenerationInput
                .personalizationContext,
        );

        assert.equal(
            receivedExerciseInput
                .solutionCode,
            '// Private solution',
        );

        assert.equal(
            receivedAssignmentInput
                .expiresAt
                .toISOString(),
            '2026-08-04T12:00:00.000Z',
        );

        assert.equal(
            receivedLogInput.success,
            true,
        );

        assert.equal(
            receivedLogInput
                .generationParams
                .topicId,
            3,
        );

        assert.equal(result.created, true);

        assert.equal(
            result.assignment.id,
            assignmentId,
        );

        assert.equal(
            result.exercise.id,
            exerciseId,
        );

        assert.equal(
            result.exercise
                .publicTestCases.length,
            1,
        );

        assert.equal(
            'solutionCode'
            in result.exercise,
            false,
        );
    },
);

test(
    'generateNextExercise reuses an active assignment',
    async () => {
        const {
            pool,
            commands,
            wasReleased,
        } = createPool();

        const activeAssignment = {
            assignment: {
                id: randomUUID(),
            },

            exercise: {
                id: randomUUID(),
            },
        };

        let contextRequested = false;
        let generationRequested = false;
        let onboardingRequested = false;

        const result =
            await generateNextExercise({
                userId: randomUUID(),
                pool,

                findActiveAssignment:
                    async () => (
                        activeAssignment
                    ),

                findContext: async () => {
                    contextRequested = true;

                    return null;
                },

                generateExercise:
                    async () => {
                        generationRequested = true;

                        return null;
                    },

                findOnboarding:
                    async () => {
                        onboardingRequested = true;

                        return null;
                    },
            });

        assert.equal(result.created, false);

        assert.equal(
            result.assignment,
            activeAssignment.assignment,
        );

        assert.equal(
            contextRequested,
            false,
        );

        assert.equal(
            onboardingRequested,
            false,
        );

        assert.equal(
            generationRequested,
            false,
        );

        assert.deepEqual(
            commands,
            ['BEGIN', 'COMMIT'],
        );

        assert.equal(
            wasReleased(),
            true,
        );
    },
);

test(
    'generateNextExercise requires a completed diagnostic',
    async () => {
        const userId = randomUUID();

        const {
            pool,
            commands,
            wasReleased,
        } = createPool();

        await assert.rejects(
            () => generateNextExercise({
                userId,
                pool,

                findActiveAssignment:
                    async () => null,

                findContext: async () => ({
                    ...createContext({
                        userId,
                        assessmentId: null,
                    }),
                    diagnosticCompletedAt:
                        null,
                }),
            }),
            (error) => {
                assert.ok(
                    error instanceof
                    DiagnosticRequiredForExerciseError,
                );

                assert.equal(
                    error.statusCode,
                    409,
                );

                return true;
            },
        );

        assert.deepEqual(
            commands,
            ['BEGIN', 'ROLLBACK'],
        );

        assert.equal(
            wasReleased(),
            true,
        );
    },
);

test(
    'generateNextExercise rejects an invalid provider result',
    async () => {
        const userId = randomUUID();

        const {
            pool,
            commands,
            wasReleased,
        } = createPool();

        await assert.rejects(
            () => generateNextExercise({
                userId,
                pool,

                findActiveAssignment:
                    async () => null,

                findContext: async () => (
                    createContext({
                        userId,
                        assessmentId:
                            randomUUID(),
                    })
                ),

                findOnboarding:
                    async () => (
                        createOnboarding({
                            userId,
                        })
                    ),

                generateExercise:
                    async () => ({
                        provider: 'mock',
                        exercise: null,
                    }),
            }),
            (error) => {
                assert.ok(
                    error instanceof
                    ExerciseGenerationFailedError,
                );

                return true;
            },
        );

        assert.deepEqual(
            commands,
            ['BEGIN', 'ROLLBACK'],
        );

        assert.equal(
            wasReleased(),
            true,
        );
    },
);
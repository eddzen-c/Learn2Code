import {
    databasePool,
} from '../../../config/database.js';

import {
    AuthenticationRequiredError,
} from '../../auth/errors/access-token.errors.js';

import {
    findStudentOnboardingByUserId,
} from '../../onboarding/repositories/student-onboarding.repository.js';

import {
    AdaptiveExerciseContextUnavailableError,
    DiagnosticRequiredForExerciseError,
    ExerciseGenerationFailedError,
} from '../errors/exercise.errors.js';

import {
    findAdaptiveExerciseContextByUserId,
} from '../repositories/adaptive-exercise-context.repository.js';

import {
    createExerciseGenerationLogRecord,
} from '../repositories/exercise-generation-log.repository.js';

import {
    createExerciseAssignmentRecord,
    createExerciseRecord,
    createExerciseTestCaseRecords,
    findActiveExerciseAssignmentByUserId,
} from '../repositories/exercise.repository.js';

import {
    generatePersonalizedExercise,
} from './exercise-generator.service.js';

const EXERCISE_EXPIRATION_DAYS = 7;

const createExpirationDate = (now) => (
    new Date(
        now.getTime()
        + EXERCISE_EXPIRATION_DAYS
        * 24
        * 60
        * 60
        * 1000,
    )
);

const validateAdaptiveContext = (context) => {
    if (!context) {
        throw new AuthenticationRequiredError();
    }

    if (
        !context.diagnosticAssessmentId
        || !context.diagnosticCompletedAt
    ) {
        throw new DiagnosticRequiredForExerciseError();
    }

    if (
        !context.difficulty
        || !context.language
        || !context.weakestTopic
    ) {
        throw new AdaptiveExerciseContextUnavailableError();
    }
};

const validateGenerationResult = (result) => {
    if (
        !result
        || typeof result !== 'object'
        || !result.exercise
        || typeof result.exercise !== 'object'
        || !Array.isArray(
            result.exercise.testCases,
        )
        || result.exercise.testCases.length === 0
    ) {
        throw new ExerciseGenerationFailedError();
    }
};

const createPublicExercise = ({
    exercise,
    testCases,
    context,
}) => (
    Object.freeze({
        id: exercise.id,
        title: exercise.title,
        statement: exercise.statement,
        instructions: exercise.instructions,
        starterCode: exercise.starterCode,
        estimatedMinutes:
            exercise.estimatedMinutes,

        topic: Object.freeze({
            id: context.weakestTopic.id,
            name: context.weakestTopic.name,
            masteryScore:
                context
                    .weakestTopic
                    .masteryScore,
        }),

        difficulty: Object.freeze({
            ...context.difficulty,
        }),

        language: Object.freeze({
            ...context.language,
        }),

        publicTestCases: Object.freeze(
            testCases
                .filter(
                    (testCase) => (
                        !testCase.isHidden
                    ),
                )
                .map(
                    (testCase) => (
                        Object.freeze({
                            id: testCase.id,
                            position:
                                testCase.position,
                            input: testCase.input,
                            expectedOutput:
                                testCase
                                    .expectedOutput,
                            weight:
                                testCase.weight,
                        })
                    ),
                ),
        ),
    })
);

export const generateNextExercise =
    async ({
        userId,
        now = new Date(),
        pool = databasePool,
        findContext =
        findAdaptiveExerciseContextByUserId,

        findActiveAssignment =
        findActiveExerciseAssignmentByUserId,

        findOnboarding =
        findStudentOnboardingByUserId,

        generateExercise =
        generatePersonalizedExercise,

        createExercise =
        createExerciseRecord,

        createTestCases =
        createExerciseTestCaseRecords,

        createAssignment =
        createExerciseAssignmentRecord,

        createGenerationLog =
        createExerciseGenerationLogRecord,
    }) => {
        const client = await pool.connect();

        let transactionCompleted = false;

        try {
            await client.query('BEGIN');

            const activeAssignment =
                await findActiveAssignment({
                    userId,
                    client,
                });

            if (activeAssignment) {
                await client.query('COMMIT');
                transactionCompleted = true;

                return Object.freeze({
                    created: false,
                    ...activeAssignment,
                });
            }

            const context = await findContext({
                userId,
                client,
            });

            validateAdaptiveContext(context);

            const onboarding =
                await findOnboarding({
                    userId,
                    client,
                });

            if (!onboarding) {
                throw new AdaptiveExerciseContextUnavailableError();
            }

            const personalizationContext =
                Object.freeze({
                    learningGoal:
                        onboarding.learningGoal,

                    studyPace:
                        onboarding.studyPace,

                    interestKeys:
                        Object.freeze([
                            ...onboarding
                                .interestKeys,
                        ]),
                });

            const variationKey = [
                context
                    .diagnosticAssessmentId,
                context.generationSequence + 1,
                context.weakestTopic.id,
            ].join(':');

            const generationStartedAt =
                Date.now();

            const generation =
                await generateExercise({
                    userId,
                    variationKey,
                    language: context.language,
                    difficulty:
                        context.difficulty,
                    topic:
                        context.weakestTopic,
                    personalizationContext,
                });

            const generationLatencyMs =
                Math.max(
                    0,
                    Date.now()
                    - generationStartedAt,
                );

            validateGenerationResult(
                generation,
            );

            const generatedExercise =
                generation.exercise;

            const exercise =
                await createExercise({
                    topicId:
                        generatedExercise.topicId,
                    difficultyId:
                        generatedExercise
                            .difficultyId,
                    languageId:
                        generatedExercise
                            .languageId,
                    createdByUserId: userId,
                    title:
                        generatedExercise.title,
                    statement:
                        generatedExercise.statement,
                    instructions:
                        generatedExercise
                            .instructions,
                    starterCode:
                        generatedExercise
                            .starterCode,
                    solutionCode:
                        generatedExercise
                            .solutionCode,
                    estimatedMinutes:
                        generatedExercise
                            .estimatedMinutes,
                    generationSource: 'ai',
                    status: 'published',
                    client,
                });

            const testCases =
                await createTestCases({
                    exerciseId: exercise.id,
                    testCases:
                        generatedExercise
                            .testCases,
                    client,
                });

            const expiresAt =
                createExpirationDate(now);

            const assignment =
                await createAssignment({
                    userId,
                    exerciseId: exercise.id,
                    source: 'adaptive_ai',
                    status: 'assigned',
                    expiresAt,
                    metadata: {
                        provider:
                            generation.provider,
                        model:
                            generation.model,
                        variationKey,
                        diagnosticAssessmentId:
                            context
                                .diagnosticAssessmentId,
                        topicId:
                            context.weakestTopic.id,
                        masteryScore:
                            context
                                .weakestTopic
                                .masteryScore,
                        confidenceScore:
                            context
                                .weakestTopic
                                .confidenceScore,
                        personalizationContext,
                    },
                    client,
                });

            await createGenerationLog({
                userId,
                exerciseId: exercise.id,
                promptVersionId: null,
                modelName:
                    generation.model,
                generationParams: {
                    provider:
                        generation.provider,
                    variationKey,
                    diagnosticAssessmentId:
                        context
                            .diagnosticAssessmentId,
                    topicId:
                        context.weakestTopic.id,
                    difficultyId:
                        context.difficulty.id,
                    languageId:
                        context.language.id,
                    masteryScore:
                        context
                            .weakestTopic
                            .masteryScore,
                    confidenceScore:
                        context
                            .weakestTopic
                            .confidenceScore,
                    personalizationContext,
                },
                latencyMs:
                    generationLatencyMs,
                success: true,
                client,
            });

            await client.query('COMMIT');
            transactionCompleted = true;

            return Object.freeze({
                created: true,
                assignment,
                exercise:
                    createPublicExercise({
                        exercise,
                        testCases,
                        context,
                    }),
            });
        } catch (error) {
            if (!transactionCompleted) {
                try {
                    await client.query(
                        'ROLLBACK',
                    );
                } catch {
                    // Preserve the original error.
                }
            }

            throw error;
        } finally {
            client.release();
        }
    };
import {
    databasePool,
} from '../../../config/database.js';

import {
    ActiveDiagnosticAssessmentError,
    DiagnosticCatalogUnavailableError,
    UnsupportedDiagnosticLanguageError,
} from '../errors/diagnostic.errors.js';

import {
    StudentOnboardingRequiredError,
} from '../../onboarding/errors/student-onboarding.errors.js';

import {
    findStudentOnboardingByUserId,
} from '../../onboarding/repositories/student-onboarding.repository.js';

import {
    createDiagnosticAssessmentRecord,
    findActiveDiagnosticAssessmentByUserId,
    getNextDiagnosticAttemptNumber,
    markDiagnosticAssessmentExpired,
    markDiagnosticAssessmentFailed,
    markDiagnosticAssessmentInProgress,
} from '../repositories/diagnostic-assessment.repository.js';

import {
    findActiveSupportedLanguageById,
    listActiveTopics,
    listDifficultyLevels,
} from '../repositories/diagnostic-catalog.repository.js';

import {
    createDiagnosticQuestionRecords,
    listDiagnosticQuestionsForStudent,
} from '../repositories/diagnostic-question.repository.js';

import {
    generateDiagnosticQuestions,
} from './diagnostic-generator.service.js';

const DIAGNOSTIC_DURATION_MINUTES = 30;

const defaultDependencies = Object.freeze({
    findActiveDiagnosticAssessmentByUserId,
    findActiveSupportedLanguageById,
    listActiveTopics,
    listDifficultyLevels,
    getNextDiagnosticAttemptNumber,
    createDiagnosticAssessmentRecord,
    createDiagnosticQuestionRecords,
    markDiagnosticAssessmentInProgress,
    listDiagnosticQuestionsForStudent,
    markDiagnosticAssessmentFailed,
    findStudentOnboardingByUserId,
    markDiagnosticAssessmentExpired,
});

const runInTransaction = async (
    pool,
    callback,
) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await callback(client);

        await client.query('COMMIT');

        return result;
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch {
            // The original error remains the priority.
        }

        throw error;
    } finally {
        client.release();
    }
};

const validateInput = ({
    userId,
}) => {
    if (
        typeof userId !== 'string'
        || userId.trim().length === 0
    ) {
        throw new TypeError(
            'User ID must be a non-empty string',
        );
    }
};

export const startDiagnosticAssessment =
    async ({
        userId,
        now = new Date(),
        pool = databasePool,
        questionGenerator =
        generateDiagnosticQuestions,
        dependencies = defaultDependencies,
    }) => {
        validateInput({
            userId,
        });

        const expiresAt = new Date(
            now.getTime()
            + (
                DIAGNOSTIC_DURATION_MINUTES
                * 60
                * 1000
            ),
        );

        const preparation = await runInTransaction(
            pool,
            async (client) => {
                await client.query({
                    text: `
                        SELECT
                            pg_advisory_xact_lock(
                                hashtext($1)
                            )
                    `,
                    values: [
                        `diagnostic:${userId}`,
                    ],
                });

                let activeAssessment =
                    await dependencies.findActiveDiagnosticAssessmentByUserId({
                        userId,
                        client,
                    });

                if (
                    activeAssessment
                    && activeAssessment.expiresAt
                    instanceof Date
                    && activeAssessment
                        .expiresAt
                        .getTime()
                    <= now.getTime()
                ) {
                    const expiredAssessment =
                        await dependencies
                            .markDiagnosticAssessmentExpired({
                                assessmentId:
                                    activeAssessment.id,
                                userId,
                                expiredAt: now,
                                client,
                            });

                    if (expiredAssessment) {
                        activeAssessment = null;
                    }
                }

                if (activeAssessment) {
                    throw new ActiveDiagnosticAssessmentError();
                }

                const onboarding =
                    await dependencies
                        .findStudentOnboardingByUserId({
                            userId,
                            client,
                        });

                if (!onboarding) {
                    throw new StudentOnboardingRequiredError();
                }

                const languageId =
                    onboarding.language.id;

                const language =
                    await dependencies
                        .findActiveSupportedLanguageById({
                            languageId,
                            client,
                        });

                if (!language) {
                    throw new UnsupportedDiagnosticLanguageError();
                }

                const activeTopics =
                    await dependencies.listActiveTopics({
                        client,
                    });

                const selectedTopicIds =
                    new Set(
                        onboarding.topics.map(
                            (topic) => topic.id,
                        ),
                    );

                const topics =
                    activeTopics.filter(
                        (topic) => (
                            selectedTopicIds.has(
                                topic.id,
                            )
                        ),
                    );

                const allDifficultyLevels =
                    await dependencies
                        .listDifficultyLevels({
                            client,
                        });

                const selfAssessedDifficultyId =
                    onboarding
                        .selfAssessedDifficulty
                        .id;

                const difficultyLevels =
                    allDifficultyLevels.filter(
                        (difficulty) => (
                            Math.abs(
                                difficulty.id
                                - selfAssessedDifficultyId,
                            ) <= 1
                        ),
                    );

                if (
                    topics.length === 0
                    || difficultyLevels.length === 0
                ) {
                    throw new DiagnosticCatalogUnavailableError();
                }

                const onboardingContext =
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

                        selfAssessedDifficultyId,

                        topicIds: Object.freeze(
                            topics.map(
                                (topic) => topic.id,
                            ),
                        ),
                    });

                const attemptNumber =
                    await dependencies.getNextDiagnosticAttemptNumber({
                        userId,
                        client,
                    });

                const assessment =
                    await dependencies.createDiagnosticAssessmentRecord({
                        userId,
                        languageId,
                        attemptNumber,
                        modelName: null,
                        generationMetadata: {
                            phase: 'generating',
                        },
                        expiresAt,
                        client,
                    });

                return {
                    assessment,
                    language,
                    topics,
                    difficultyLevels,
                    attemptNumber,
                    onboardingContext,
                };
            },
        );

        try {
            const generation =
                await questionGenerator({
                    userId,
                    variationKey:
                        `${userId}:attempt-${preparation.attemptNumber}`,
                    language:
                        preparation.language,
                    topics:
                        preparation.topics,
                    difficultyLevels:
                        preparation.difficultyLevels,
                    onboardingContext:
                        preparation.onboardingContext,
                });

            if (
                !generation
                || !Array.isArray(
                    generation.questions,
                )
                || generation.questions.length === 0
            ) {
                throw new Error(
                    'The diagnostic provider returned no questions',
                );
            }

            const generationMetadata = {
                provider: generation.provider,
                model: generation.model,
                simulated:
                    generation.provider === 'mock',
                onboardingContext:
                    preparation.onboardingContext,
            };

            return await runInTransaction(
                pool,
                async (client) => {
                    await dependencies.createDiagnosticQuestionRecords({
                        assessmentId:
                            preparation.assessment.id,
                        userId,
                        questions:
                            generation.questions,
                        generationMetadata,
                        client,
                    });

                    const assessment =
                        await dependencies.markDiagnosticAssessmentInProgress({
                            assessmentId:
                                preparation.assessment.id,
                            userId,
                            questionCount:
                                generation.questions.length,
                            modelName:
                                generation.model,
                            generationMetadata,
                            startedAt: new Date(),
                            client,
                        });

                    if (!assessment) {
                        throw new Error(
                            'Diagnostic assessment could not be started',
                        );
                    }

                    const questions =
                        await dependencies.listDiagnosticQuestionsForStudent({
                            assessmentId:
                                assessment.id,
                            userId,
                            client,
                        });

                    return Object.freeze({
                        assessment: Object.freeze({
                            id: assessment.id,
                            attemptNumber:
                                assessment.attemptNumber,
                            status: assessment.status,
                            questionCount:
                                assessment.questionCount,
                            answeredCount:
                                assessment.answeredCount,
                            startedAt:
                                assessment.startedAt,
                            expiresAt:
                                assessment.expiresAt,
                        }),

                        language:
                            preparation.language,

                        questions,

                        generation: Object.freeze({
                            provider:
                                generation.provider,
                            model:
                                generation.model,
                            simulated:
                                generation.provider
                                === 'mock',
                        }),
                    });
                },
            );
        } catch (error) {
            try {
                await dependencies.markDiagnosticAssessmentFailed({
                    assessmentId:
                        preparation.assessment.id,
                    userId,
                    failureMetadata: {
                        failureCode:
                            error.code
                            ?? 'DIAGNOSTIC_GENERATION_FAILED',
                    },
                    failedAt: new Date(),
                    client: pool,
                });
            } catch {
                // The original generation error remains the priority.
            }

            throw error;
        }
    };
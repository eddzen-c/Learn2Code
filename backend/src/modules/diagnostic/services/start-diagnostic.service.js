import {
    databasePool,
} from '../../../config/database.js';

import {
    ActiveDiagnosticAssessmentError,
    DiagnosticCatalogUnavailableError,
    UnsupportedDiagnosticLanguageError,
} from '../errors/diagnostic.errors.js';

import {
    createDiagnosticAssessmentRecord,
    findActiveDiagnosticAssessmentByUserId,
    getNextDiagnosticAttemptNumber,
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
    languageId,
}) => {
    if (
        typeof userId !== 'string'
        || userId.trim().length === 0
    ) {
        throw new TypeError(
            'User ID must be a non-empty string',
        );
    }

    if (
        !Number.isInteger(languageId)
        || languageId <= 0
    ) {
        throw new TypeError(
            'Language ID must be a positive integer',
        );
    }
};

export const startDiagnosticAssessment =
    async ({
        userId,
        languageId,
        now = new Date(),
        pool = databasePool,
        questionGenerator =
        generateDiagnosticQuestions,
        dependencies = defaultDependencies,
    }) => {
        validateInput({
            userId,
            languageId,
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

                const activeAssessment =
                    await dependencies.findActiveDiagnosticAssessmentByUserId({
                        userId,
                        client,
                    });

                if (activeAssessment) {
                    throw new ActiveDiagnosticAssessmentError();
                }

                const language =
                    await dependencies.findActiveSupportedLanguageById({
                        languageId,
                        client,
                    });

                if (!language) {
                    throw new UnsupportedDiagnosticLanguageError();
                }

                const topics =
                    await dependencies.listActiveTopics({
                        client,
                    });

                const difficultyLevels =
                    await dependencies.listDifficultyLevels({
                        client,
                    });

                if (
                    topics.length === 0
                    || difficultyLevels.length === 0
                ) {
                    throw new DiagnosticCatalogUnavailableError();
                }

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
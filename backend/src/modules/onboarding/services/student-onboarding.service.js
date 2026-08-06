import {
    databasePool,
} from '../../../config/database.js';

import {
    LEARNING_GOALS,
    MAX_ONBOARDING_INTERESTS,
    MAX_ONBOARDING_TOPICS,
    ONBOARDING_INTERESTS,
    STUDY_PACES,
} from '../constants/onboarding.constants.js';

import {
    OnboardingCatalogUnavailableError,
    StudentOnboardingUnavailableError,
    UnsupportedOnboardingDifficultyError,
    UnsupportedOnboardingLanguageError,
    UnsupportedOnboardingTopicError,
} from '../errors/student-onboarding.errors.js';

import {
    findActiveSupportedLanguageById,
    listActiveSupportedLanguages,
    listActiveTopics,
    listDifficultyLevels,
} from '../../diagnostic/repositories/diagnostic-catalog.repository.js';

import {
    findStudentOnboardingByUserId,
    replaceStudentOnboardingInterests,
    replaceStudentOnboardingTopics,
    updateUserPreferredProgrammingLanguage,
    upsertStudentOnboardingProfile,
} from '../repositories/student-onboarding.repository.js';

const defaultDependencies = Object.freeze({
    findActiveSupportedLanguageById,
    listActiveSupportedLanguages,
    listActiveTopics,
    listDifficultyLevels,
    findStudentOnboardingByUserId,
    replaceStudentOnboardingInterests,
    replaceStudentOnboardingTopics,
    updateUserPreferredProgrammingLanguage,
    upsertStudentOnboardingProfile,
});

const validateUserId = (userId) => {
    if (
        typeof userId !== 'string'
        || userId.trim().length === 0
    ) {
        throw new TypeError(
            'User ID must be a non-empty string',
        );
    }
};

const valuesAreUnique = (values) => (
    new Set(values).size
    === values.length
);

const validateCompletionInput = ({
    userId,
    languageId,
    selfAssessedDifficultyId,
    learningGoal,
    studyPace,
    interestKeys,
    topicIds,
    now,
}) => {
    validateUserId(userId);

    if (
        !Number.isInteger(languageId)
        || languageId <= 0
    ) {
        throw new TypeError(
            'Language ID must be a positive integer',
        );
    }

    if (
        !Number.isInteger(
            selfAssessedDifficultyId,
        )
        || selfAssessedDifficultyId <= 0
    ) {
        throw new TypeError(
            'Difficulty ID must be a positive integer',
        );
    }

    if (
        !LEARNING_GOALS.includes(
            learningGoal,
        )
    ) {
        throw new TypeError(
            'Learning goal is invalid',
        );
    }

    if (
        !STUDY_PACES.includes(
            studyPace,
        )
    ) {
        throw new TypeError(
            'Study pace is invalid',
        );
    }

    if (
        !Array.isArray(interestKeys)
        || interestKeys.length === 0
        || interestKeys.length
        > MAX_ONBOARDING_INTERESTS
        || interestKeys.some(
            (interestKey) => (
                !ONBOARDING_INTERESTS.includes(
                    interestKey,
                )
            ),
        )
        || !valuesAreUnique(interestKeys)
    ) {
        throw new TypeError(
            'Interest keys are invalid',
        );
    }

    if (
        !Array.isArray(topicIds)
        || topicIds.length === 0
        || topicIds.length
        > MAX_ONBOARDING_TOPICS
        || topicIds.some(
            (topicId) => (
                !Number.isInteger(topicId)
                || topicId <= 0
            ),
        )
        || !valuesAreUnique(topicIds)
    ) {
        throw new TypeError(
            'Topic IDs are invalid',
        );
    }

    if (
        !(now instanceof Date)
        || Number.isNaN(now.getTime())
    ) {
        throw new TypeError(
            'Completion date is invalid',
        );
    }
};

const runInTransaction = async (
    pool,
    callback,
) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result =
            await callback(client);

        await client.query('COMMIT');

        return result;
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch {
            // Preserve the original error.
        }

        throw error;
    } finally {
        client.release();
    }
};

export const getStudentOnboardingOptions =
    async ({
        client = databasePool,
        dependencies = defaultDependencies,
    } = {}) => {
        const languages =
            await dependencies
                .listActiveSupportedLanguages({
                    client,
                });

        const difficulties =
            await dependencies
                .listDifficultyLevels({
                    client,
                });

        const topics =
            await dependencies.listActiveTopics({
                client,
            });

        if (
            languages.length === 0
            || difficulties.length === 0
            || topics.length === 0
        ) {
            throw new OnboardingCatalogUnavailableError();
        }

        return Object.freeze({
            languages,
            difficulties,
            topics,

            learningGoals:
                Object.freeze([
                    ...LEARNING_GOALS,
                ]),

            interests:
                Object.freeze([
                    ...ONBOARDING_INTERESTS,
                ]),

            studyPaces:
                Object.freeze([
                    ...STUDY_PACES,
                ]),
        });
    };

export const getCurrentStudentOnboarding =
    async ({
        userId,
        client = databasePool,
        dependencies = defaultDependencies,
    }) => {
        validateUserId(userId);

        const onboarding =
            await dependencies
                .findStudentOnboardingByUserId({
                    userId,
                    client,
                });

        return Object.freeze({
            state: onboarding
                ? 'completed'
                : 'pending',

            onboarding,
        });
    };

export const completeStudentOnboarding =
    async ({
        userId,
        languageId,
        selfAssessedDifficultyId,
        learningGoal,
        studyPace,
        interestKeys,
        topicIds,
        now = new Date(),
        pool = databasePool,
        dependencies = defaultDependencies,
    }) => {
        validateCompletionInput({
            userId,
            languageId,
            selfAssessedDifficultyId,
            learningGoal,
            studyPace,
            interestKeys,
            topicIds,
            now,
        });

        return runInTransaction(
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
                        `onboarding:${userId}`,
                    ],
                });

                const language =
                    await dependencies
                        .findActiveSupportedLanguageById({
                            languageId,
                            client,
                        });

                if (!language) {
                    throw new UnsupportedOnboardingLanguageError();
                }

                const difficulties =
                    await dependencies
                        .listDifficultyLevels({
                            client,
                        });

                const difficultyIsAvailable =
                    difficulties.some(
                        (difficulty) => (
                            difficulty.id
                            === selfAssessedDifficultyId
                        ),
                    );

                if (!difficultyIsAvailable) {
                    throw new UnsupportedOnboardingDifficultyError();
                }

                const availableTopics =
                    await dependencies
                        .listActiveTopics({
                            client,
                        });

                const availableTopicIds =
                    new Set(
                        availableTopics.map(
                            (topic) => topic.id,
                        ),
                    );

                const topicsAreAvailable =
                    topicIds.every(
                        (topicId) => (
                            availableTopicIds.has(
                                topicId,
                            )
                        ),
                    );

                if (!topicsAreAvailable) {
                    throw new UnsupportedOnboardingTopicError();
                }

                const student =
                    await dependencies
                        .updateUserPreferredProgrammingLanguage({
                            userId,
                            languageId,
                            updatedAt: now,
                            client,
                        });

                if (!student) {
                    throw new StudentOnboardingUnavailableError();
                }

                const profile =
                    await dependencies
                        .upsertStudentOnboardingProfile({
                            userId,
                            selfAssessedDifficultyId,
                            learningGoal,
                            studyPace,
                            completedAt: now,
                            client,
                        });

                if (!profile) {
                    throw new StudentOnboardingUnavailableError();
                }

                const savedTopicIds =
                    await dependencies
                        .replaceStudentOnboardingTopics({
                            userId,
                            topicIds,
                            client,
                        });

                if (
                    savedTopicIds.length
                    !== topicIds.length
                ) {
                    throw new StudentOnboardingUnavailableError();
                }

                const savedInterestKeys =
                    await dependencies
                        .replaceStudentOnboardingInterests({
                            userId,
                            interestKeys,
                            client,
                        });

                if (
                    savedInterestKeys.length
                    !== interestKeys.length
                ) {
                    throw new StudentOnboardingUnavailableError();
                }

                const onboarding =
                    await dependencies
                        .findStudentOnboardingByUserId({
                            userId,
                            client,
                        });

                if (!onboarding) {
                    throw new StudentOnboardingUnavailableError();
                }

                return Object.freeze({
                    state: 'completed',
                    onboarding,
                });
            },
        );
    };
import {
    databasePool,
} from '../../../config/database.js';

import {
    LEARNING_STYLES,
    MAX_PROJECT_IDEA_LENGTH,
    MAX_TECHNOLOGY_INTERESTS,
    PRIMARY_LEARNING_GOALS,
    TECHNOLOGY_INTERESTS,
    WEEKLY_TIME_COMMITMENTS,
} from '../constants/onboarding.constants.js';

import {
    OnboardingCatalogUnavailableError,
    StudentOnboardingUnavailableError,
    UnsupportedOnboardingDifficultyError,
    UnsupportedOnboardingLanguageError,
} from '../errors/student-onboarding.errors.js';

import {
    findActiveSupportedLanguageById,
    listActiveSupportedLanguages,
    listActiveTopics,
    listDifficultyLevels,
} from '../../diagnostic/repositories/diagnostic-catalog.repository.js';

import {
    findStudentOnboardingByUserId,
    replaceStudentOnboardingTechnologyInterests,
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
    replaceStudentOnboardingTechnologyInterests,
    replaceStudentOnboardingTopics,
    updateUserPreferredProgrammingLanguage,
    upsertStudentOnboardingProfile,
});

const STUDY_PACE_BY_WEEKLY_TIME =
    Object.freeze({
        less_than_5:
            'casual',

        five_to_ten:
            'student',

        ten_to_twenty:
            'intensive',

        more_than_twenty:
            'intensive',
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
    weeklyTimeCommitment,
    learningStyle,
    technologyInterestKeys,
    projectIdea,
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
        !PRIMARY_LEARNING_GOALS.includes(
            learningGoal,
        )
    ) {
        throw new TypeError(
            'Learning goal is invalid',
        );
    }

    if (
        !WEEKLY_TIME_COMMITMENTS.includes(
            weeklyTimeCommitment,
        )
    ) {
        throw new TypeError(
            'Weekly time commitment is invalid',
        );
    }

    if (
        !LEARNING_STYLES.includes(
            learningStyle,
        )
    ) {
        throw new TypeError(
            'Learning style is invalid',
        );
    }

    if (
        !Array.isArray(
            technologyInterestKeys,
        )
        || technologyInterestKeys.length
        === 0
        || technologyInterestKeys.length
        > MAX_TECHNOLOGY_INTERESTS
        || technologyInterestKeys.some(
            (technologyKey) => (
                !TECHNOLOGY_INTERESTS.includes(
                    technologyKey,
                )
            ),
        )
        || !valuesAreUnique(
            technologyInterestKeys,
        )
    ) {
        throw new TypeError(
            'Technology interest keys are invalid',
        );
    }

    if (
        projectIdea !== null
        && (
            typeof projectIdea
            !== 'string'
            || projectIdea.trim().length
            === 0
            || projectIdea.trim().length
            > MAX_PROJECT_IDEA_LENGTH
        )
    ) {
        throw new TypeError(
            'Project idea is invalid',
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
                    ...PRIMARY_LEARNING_GOALS,
                ]),

            technologyInterests:
                Object.freeze([
                    ...TECHNOLOGY_INTERESTS,
                ]),

            weeklyTimeCommitments:
                Object.freeze([
                    ...WEEKLY_TIME_COMMITMENTS,
                ]),

            learningStyles:
                Object.freeze([
                    ...LEARNING_STYLES,
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
        weeklyTimeCommitment,
        learningStyle,
        technologyInterestKeys,
        projectIdea,
        now = new Date(),
        pool = databasePool,
        dependencies = defaultDependencies,
    }) => {
        validateCompletionInput({
            userId,
            languageId,
            selfAssessedDifficultyId,
            learningGoal,
            weeklyTimeCommitment,
            learningStyle,
            technologyInterestKeys,
            projectIdea,
            now,
        });

        const studyPace =
            STUDY_PACE_BY_WEEKLY_TIME[
            weeklyTimeCommitment
            ];

        const normalizedProjectIdea =
            projectIdea === null
                ? null
                : projectIdea.trim();

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

                if (
                    availableTopics.length
                    === 0
                ) {
                    throw new OnboardingCatalogUnavailableError();
                }

                const topicIds =
                    Object.freeze(
                        availableTopics.map(
                            (topic) => topic.id,
                        ),
                    );

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
                            weeklyTimeCommitment,
                            learningStyle,
                            projectIdea:
                                normalizedProjectIdea,
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

                const savedTechnologyKeys =
                    await dependencies
                        .replaceStudentOnboardingTechnologyInterests({
                            userId,
                            technologyInterestKeys,
                            client,
                        });

                if (
                    savedTechnologyKeys.length
                    !== technologyInterestKeys.length
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
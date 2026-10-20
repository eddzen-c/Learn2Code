import assert from 'node:assert/strict';
import test from 'node:test';

import {
    OnboardingCatalogUnavailableError,
    UnsupportedOnboardingDifficultyError,
    UnsupportedOnboardingLanguageError,
} from '../errors/student-onboarding.errors.js';

import {
    completeStudentOnboarding,
    getCurrentStudentOnboarding,
    getStudentOnboardingOptions,
} from '../services/student-onboarding.service.js';

const userId =
    '11111111-1111-4111-8111-111111111111';

const now =
    new Date(
        '2026-08-06T12:00:00.000Z',
    );

const validInput = {
    userId,
    languageId: 1,

    selfAssessedDifficultyId: 1,

    learningGoal:
        'build_product',

    weeklyTimeCommitment:
        'five_to_ten',

    learningStyle:
        'practical',

    technologyInterestKeys: [
        'javascript',
        'react',
        'nodejs',
    ],

    projectIdea:
        '  Crear una aplicación web  ',

    now,
};


const onboarding = {
    userId,

    language: {
        id: 1,
        name: 'JavaScript',
        fileExtension: '.js',
    },

    selfAssessedDifficulty: {
        id: 1,
        name: 'básico',
    },

    learningGoal:
        'build_product',

    studyPace:
        'student',

    weeklyTimeCommitment:
        'five_to_ten',

    learningStyle:
        'practical',

    projectIdea:
        'Crear una aplicación web',

    technologyInterestKeys: [
        'javascript',
        'nodejs',
        'react',
    ],

    interestKeys: [
        'music',
        'video_games',
    ],

    topics: [{
        id: 1,
        name: 'variables',
        description:
            'Declaración y asignación',
    }, {
        id: 4,
        name: 'funciones',
        description:
            'Parámetros y retorno',
    }],

    completedAt: now,
    createdAt: now,
    updatedAt: now,
};

const createTransactionPool = () => {
    const queries = [];
    let released = false;

    const client = {
        query: async (query) => {
            queries.push(query);

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

        queries,

        wasReleased: () => released,
    };
};

test(
    'getStudentOnboardingOptions returns the available catalog',
    async () => {
        const result =
            await getStudentOnboardingOptions({
                client: 'database-client',

                dependencies: {
                    listActiveSupportedLanguages:
                        async () => [{
                            id: 1,
                            name:
                                'JavaScript',
                        }],

                    listDifficultyLevels:
                        async () => [{
                            id: 1,
                            name: 'básico',
                        }],

                    listActiveTopics:
                        async () => [{
                            id: 1,
                            name: 'variables',
                        }],
                },
            });

        assert.deepEqual(
            result.languages,
            [{
                id: 1,
                name: 'JavaScript',
            }],
        );

        assert.deepEqual(
            result.difficulties,
            [{
                id: 1,
                name: 'básico',
            }],
        );

        assert.deepEqual(
            result.topics,
            [{
                id: 1,
                name: 'variables',
            }],
        );

        assert.deepEqual(
            result.learningGoals,
            [
                'career_preparation',
                'professional_growth',
                'build_product',
                'personal_interest',
            ],
        );

        assert.deepEqual(
            result.technologyInterests,
            [
                'javascript',
                'python',
                'react',
                'html_css',
                'nodejs',
                'typescript',
                'java',
                'sql',
                'other',
            ],
        );

        assert.deepEqual(
            result.weeklyTimeCommitments,
            [
                'less_than_5',
                'five_to_ten',
                'ten_to_twenty',
                'more_than_twenty',
            ],
        );

        assert.deepEqual(
            result.learningStyles,
            [
                'practical',
                'visual',
                'reading',
                'guided',
            ],
        );
    },
);

test(
    'getCurrentStudentOnboarding returns a pending state',
    async () => {
        const result =
            await getCurrentStudentOnboarding({
                userId,
                client: 'database-client',

                dependencies: {
                    findStudentOnboardingByUserId:
                        async () => null,
                },
            });

        assert.deepEqual(result, {
            state: 'pending',
            onboarding: null,
        });
    },
);

test(
    'getCurrentStudentOnboarding returns a completed state',
    async () => {
        const result =
            await getCurrentStudentOnboarding({
                userId,
                client: 'database-client',

                dependencies: {
                    findStudentOnboardingByUserId:
                        async () => onboarding,
                },
            });

        assert.deepEqual(result, {
            state: 'completed',
            onboarding,
        });
    },
);

test(
    'completeStudentOnboarding saves the complete student preferences',
    async () => {
        const transaction =
            createTransactionPool();

        const calls = [];

        const result =
            await completeStudentOnboarding({
                ...validInput,
                pool: transaction.pool,

                dependencies: {
                    findActiveSupportedLanguageById:
                        async (parameters) => {
                            calls.push({
                                type: 'language',
                                parameters,
                            });

                            return {
                                id: 1,
                                name:
                                    'JavaScript',
                            };
                        },

                    listDifficultyLevels:
                        async () => [{
                            id: 1,
                            name: 'básico',
                        }],

                    listActiveTopics:
                        async () => [{
                            id: 1,
                            name: 'variables',
                        }, {
                            id: 4,
                            name: 'funciones',
                        }],

                    updateUserPreferredProgrammingLanguage:
                        async (parameters) => {
                            calls.push({
                                type:
                                    'update-language',
                                parameters,
                            });

                            return {
                                id: userId,
                            };
                        },

                    upsertStudentOnboardingProfile:
                        async (parameters) => {
                            calls.push({
                                type:
                                    'upsert-profile',
                                parameters,
                            });

                            return {
                                user_id:
                                    userId,
                            };
                        },

                    replaceStudentOnboardingTopics:
                        async (parameters) => {
                            calls.push({
                                type:
                                    'replace-topics',
                                parameters,
                            });

                            return [
                                1,
                                4,
                            ];
                        },

                    replaceStudentOnboardingTechnologyInterests:
                        async (parameters) => {
                            calls.push({
                                type:
                                    'replace-technologies',
                                parameters,
                            });

                            return [
                                'javascript',
                                'react',
                                'nodejs',
                            ];
                        },

                    findStudentOnboardingByUserId:
                        async () => onboarding,
                },
            });

        assert.deepEqual(result, {
            state: 'completed',
            onboarding,
        });

        assert.equal(
            transaction.queries[0],
            'BEGIN',
        );

        assert.equal(
            transaction.queries.at(-1),
            'COMMIT',
        );

        assert.equal(
            transaction.wasReleased(),
            true,
        );

        assert.deepEqual(
            calls.map(
                (call) => call.type,
            ),
            [
                'language',
                'update-language',
                'upsert-profile',
                'replace-topics',
                'replace-technologies',
            ],
        );

        assert.equal(
            calls[1].parameters.languageId,
            1,
        );

        assert.equal(
            calls[2].parameters.studyPace,
            'student',
        );


        assert.equal(
            calls[2]
                .parameters
                .weeklyTimeCommitment,
            'five_to_ten',
        );

        assert.equal(
            calls[2]
                .parameters
                .learningStyle,
            'practical',
        );

        assert.equal(
            calls[2]
                .parameters
                .projectIdea,
            'Crear una aplicación web',
        );

        assert.deepEqual(
            calls[3].parameters.topicIds,
            [
                1,
                4,
            ],
        );

        assert.deepEqual(
            calls[4]
                .parameters
                .technologyInterestKeys,
            [
                'javascript',
                'react',
                'nodejs',
            ],
        );
    },
);

test(
    'completeStudentOnboarding rejects invalid technologies',
    async () => {
        await assert.rejects(
            () => (
                completeStudentOnboarding({
                    ...validInput,

                    technologyInterestKeys:
                        [],
                })
            ),
            TypeError,
        );
    },
);


test(
    'completeStudentOnboarding rejects an invalid weekly time commitment',
    async () => {
        await assert.rejects(
            () => (
                completeStudentOnboarding({
                    ...validInput,

                    weeklyTimeCommitment:
                        'unsupported_time',
                })
            ),
            TypeError,
        );
    },
);


test(
    'completeStudentOnboarding rejects an unavailable language',
    async () => {
        const transaction =
            createTransactionPool();

        await assert.rejects(
            () => (
                completeStudentOnboarding({
                    ...validInput,
                    pool:
                        transaction.pool,

                    dependencies: {
                        findActiveSupportedLanguageById:
                            async () => null,
                    },
                })
            ),
            UnsupportedOnboardingLanguageError,
        );

        assert.equal(
            transaction.queries.at(-1),
            'ROLLBACK',
        );

        assert.equal(
            transaction.wasReleased(),
            true,
        );
    },
);

test(
    'completeStudentOnboarding rejects an unavailable difficulty',
    async () => {
        const transaction =
            createTransactionPool();

        await assert.rejects(
            () => (
                completeStudentOnboarding({
                    ...validInput,
                    selfAssessedDifficultyId:
                        3,
                    pool:
                        transaction.pool,

                    dependencies: {
                        findActiveSupportedLanguageById:
                            async () => ({
                                id: 1,
                            }),

                        listDifficultyLevels:
                            async () => [{
                                id: 1,
                                name:
                                    'básico',
                            }],
                    },
                })
            ),
            UnsupportedOnboardingDifficultyError,
        );

        assert.equal(
            transaction.queries.at(-1),
            'ROLLBACK',
        );
    },
);

test(
    'completeStudentOnboarding rejects an empty topic catalog',
    async () => {
        const transaction =
            createTransactionPool();

        await assert.rejects(
            () => (
                completeStudentOnboarding({
                    ...validInput,

                    pool:
                        transaction.pool,

                    dependencies: {
                        findActiveSupportedLanguageById:
                            async () => ({
                                id: 1,
                            }),

                        listDifficultyLevels:
                            async () => [{
                                id: 1,
                            }],

                        listActiveTopics:
                            async () => [],
                    },
                })
            ),
            OnboardingCatalogUnavailableError,
        );

        assert.equal(
            transaction.queries.at(-1),
            'ROLLBACK',
        );
    },
);
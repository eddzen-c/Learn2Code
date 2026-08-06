import assert from 'node:assert/strict';
import test from 'node:test';

import {
    findStudentOnboardingByUserId,
    replaceStudentOnboardingInterests,
    replaceStudentOnboardingTopics,
    updateUserPreferredProgrammingLanguage,
    upsertStudentOnboardingProfile,
} from '../repositories/student-onboarding.repository.js';

const userId =
    '11111111-1111-4111-8111-111111111111';

test(
    'findStudentOnboardingByUserId returns the complete onboarding',
    async () => {
        const completedAt =
            new Date(
                '2026-08-06T12:00:00.000Z',
            );

        const calls = [];

        const client = {
            query: async (query) => {
                calls.push(query);

                return {
                    rows: [{
                        user_id: userId,
                        language_id: 1,
                        language_name:
                            'JavaScript',
                        language_file_extension:
                            '.js',
                        difficulty_id: 1,
                        difficulty_name:
                            'básico',
                        learning_goal:
                            'build_product',
                        study_pace:
                            'intensive',

                        interest_keys: [
                            'finance_crypto',
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

                        completed_at:
                            completedAt,
                        created_at:
                            completedAt,
                        updated_at:
                            completedAt,
                    }],
                };
            },
        };

        const result =
            await findStudentOnboardingByUserId({
                userId,
                client,
            });

        assert.deepEqual(
            calls[0].values,
            [userId],
        );

        assert.match(
            calls[0].text,
            /student_onboarding_profiles/,
        );

        assert.match(
            calls[0].text,
            /student_onboarding_interests/,
        );

        assert.deepEqual(result, {
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
                'intensive',

            interestKeys: [
                'finance_crypto',
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

            completedAt,
            createdAt: completedAt,
            updatedAt: completedAt,
        });
    },
);

test(
    'findStudentOnboardingByUserId returns null when onboarding is unavailable',
    async () => {
        const client = {
            query: async () => ({
                rows: [],
            }),
        };

        const result =
            await findStudentOnboardingByUserId({
                userId,
                client,
            });

        assert.equal(result, null);
    },
);

test(
    'updateUserPreferredProgrammingLanguage updates the user language',
    async () => {
        const updatedAt =
            new Date(
                '2026-08-06T12:10:00.000Z',
            );

        let receivedQuery = null;

        const client = {
            query: async (query) => {
                receivedQuery = query;

                return {
                    rows: [{
                        id: userId,
                    }],
                };
            },
        };

        const result =
            await updateUserPreferredProgrammingLanguage({
                userId,
                languageId: 2,
                updatedAt,
                client,
            });

        assert.deepEqual(
            receivedQuery.values,
            [
                userId,
                2,
                updatedAt,
            ],
        );

        assert.match(
            receivedQuery.text,
            /UPDATE users/,
        );

        assert.deepEqual(result, {
            id: userId,
        });
    },
);

test(
    'upsertStudentOnboardingProfile creates or updates the profile',
    async () => {
        const completedAt =
            new Date(
                '2026-08-06T12:20:00.000Z',
            );

        let receivedQuery = null;

        const client = {
            query: async (query) => {
                receivedQuery = query;

                return {
                    rows: [{
                        user_id: userId,
                    }],
                };
            },
        };

        const result =
            await upsertStudentOnboardingProfile({
                userId,
                selfAssessedDifficultyId: 2,
                learningGoal:
                    'career_preparation',
                studyPace:
                    'casual',
                completedAt,
                client,
            });

        assert.deepEqual(
            receivedQuery.values,
            [
                userId,
                2,
                'career_preparation',
                'casual',
                completedAt,
            ],
        );

        assert.match(
            receivedQuery.text,
            /ON CONFLICT \(user_id\)/,
        );

        assert.match(
            receivedQuery.text,
            /study_pace/,
        );

        assert.deepEqual(result, {
            user_id: userId,
        });
    },
);

test(
    'replaceStudentOnboardingTopics replaces all selected topics',
    async () => {
        const calls = [];

        const client = {
            query: async (query) => {
                calls.push(query);

                if (calls.length === 1) {
                    return {
                        rows: [],
                    };
                }

                return {
                    rows: [{
                        topic_id: 1,
                    }, {
                        topic_id: 4,
                    }],
                };
            },
        };

        const result =
            await replaceStudentOnboardingTopics({
                userId,
                topicIds: [
                    1,
                    4,
                ],
                client,
            });

        assert.equal(
            calls.length,
            2,
        );

        assert.match(
            calls[0].text,
            /DELETE FROM/,
        );

        assert.deepEqual(
            calls[0].values,
            [userId],
        );

        assert.match(
            calls[1].text,
            /INSERT INTO/,
        );

        assert.deepEqual(
            calls[1].values,
            [
                userId,
                [
                    1,
                    4,
                ],
            ],
        );

        assert.deepEqual(
            result,
            [
                1,
                4,
            ],
        );
    },
);

test(
    'replaceStudentOnboardingInterests replaces all selected interests',
    async () => {
        const calls = [];

        const client = {
            query: async (query) => {
                calls.push(query);

                if (calls.length === 1) {
                    return {
                        rows: [],
                    };
                }

                return {
                    rows: [{
                        interest_key:
                            'video_games',
                    }, {
                        interest_key:
                            'music',
                    }],
                };
            },
        };

        const interestKeys = [
            'video_games',
            'music',
        ];

        const result =
            await replaceStudentOnboardingInterests({
                userId,
                interestKeys,
                client,
            });

        assert.equal(
            calls.length,
            2,
        );

        assert.match(
            calls[0].text,
            /student_onboarding_interests/,
        );

        assert.deepEqual(
            calls[0].values,
            [userId],
        );

        assert.match(
            calls[1].text,
            /INSERT INTO/,
        );

        assert.deepEqual(
            calls[1].values,
            [
                userId,
                interestKeys,
            ],
        );

        assert.deepEqual(
            result,
            interestKeys,
        );
    },
);
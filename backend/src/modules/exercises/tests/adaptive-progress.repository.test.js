import {
    randomUUID,
} from 'node:crypto';

import assert from 'node:assert/strict';
import test from 'node:test';

import {
    findExerciseProgressContext,
    updateKnowledgeStateFromExerciseAttempt,
    createExerciseCompletionXpTransaction,
    updateUserXpFromExerciseCompletion,
    updateUserStreakFromExerciseCompletion,
} from '../repositories/adaptive-progress.repository.js';

test(
    'findExerciseProgressContext returns the exercise topic and difficulty',
    async () => {
        const executedQueries = [];

        const client = {
            query: async (query) => {
                executedQueries.push(query);

                return {
                    rows: [{
                        exercise_id: 'exercise-1',
                        topic_id: 2,
                        topic_name: 'condicionales',
                        difficulty_id: 1,
                        difficulty_name: 'básico',
                    }],
                };
            },
        };

        const result =
            await findExerciseProgressContext({
                exerciseId: 'exercise-1',
                client,
            });

        assert.deepEqual(
            result,
            {
                exerciseId: 'exercise-1',

                topic: {
                    id: 2,
                    name: 'condicionales',
                },

                difficulty: {
                    id: 1,
                    name: 'básico',
                },
            },
        );

        assert.equal(
            Object.isFrozen(result),
            true,
        );

        assert.equal(
            Object.isFrozen(result.topic),
            true,
        );

        assert.equal(
            Object.isFrozen(result.difficulty),
            true,
        );

        assert.equal(
            executedQueries.length,
            1,
        );

        assert.deepEqual(
            executedQueries[0].values,
            ['exercise-1'],
        );

        assert.match(
            executedQueries[0].text,
            /JOIN topics/,
        );

        assert.match(
            executedQueries[0].text,
            /JOIN difficulty_levels/,
        );
    },
);

test(
    'findExerciseProgressContext returns null when the exercise is unavailable',
    async () => {
        const client = {
            query: async () => ({
                rows: [],
            }),
        };

        const result =
            await findExerciseProgressContext({
                exerciseId: 'missing-exercise',
                client,
            });

        assert.equal(result, null);
    },
);

test(
    'updateKnowledgeStateFromExerciseAttempt stores the adaptive mastery result',
    async () => {
        const evaluatedAt =
            new Date(
                '2026-08-01T12:30:00.000Z',
            );

        const executedQueries = [];

        const client = {
            query: async (query) => {
                executedQueries.push(query);

                return {
                    rows: [{
                        id: 'knowledge-state-1',
                        user_id: 'user-1',
                        topic_id: 2,
                        mastery_score: '62.50',
                        confidence_score: '55.00',
                        attempts_count: 4,
                        last_evaluated_at:
                            evaluatedAt,
                    }],
                };
            },
        };

        const result =
            await updateKnowledgeStateFromExerciseAttempt({
                userId: 'user-1',
                topicId: 2,
                score: 80,
                evaluatedAt,
                client,
            });

        assert.deepEqual(
            result,
            {
                id: 'knowledge-state-1',
                userId: 'user-1',
                topicId: 2,
                masteryScore: 62.5,
                confidenceScore: 55,
                attemptsCount: 4,
                lastEvaluatedAt:
                    evaluatedAt,
            },
        );

        assert.equal(
            Object.isFrozen(result),
            true,
        );

        assert.equal(
            executedQueries.length,
            1,
        );

        assert.deepEqual(
            executedQueries[0].values,
            [
                'user-1',
                2,
                80,
                evaluatedAt,
            ],
        );

        assert.match(
            executedQueries[0].text,
            /INSERT INTO knowledge_states/,
        );

        assert.match(
            executedQueries[0].text,
            /ON CONFLICT/,
        );

        assert.match(
            executedQueries[0].text,
            /attempts_count/,
        );
    },
);

test(
    'updateKnowledgeStateFromExerciseAttempt returns null when no state is returned',
    async () => {
        const client = {
            query: async () => ({
                rows: [],
            }),
        };

        const result =
            await updateKnowledgeStateFromExerciseAttempt({
                userId: 'user-1',
                topicId: 2,
                score: 0,
                client,
            });

        assert.equal(result, null);
    },
);

test(
    'createExerciseCompletionXpTransaction creates an idempotent XP transaction',
    async () => {
        const userId =
            '11111111-1111-4111-8111-111111111111'

        const assignmentId =
            '22222222-2222-4222-8222-222222222222'

        const exerciseId =
            '33333333-3333-4333-8333-333333333333'

        const transactionId =
            '44444444-4444-4444-8444-444444444444'

        const awardedAt =
            new Date(
                '2026-08-01T12:00:00.000Z',
            )

        const queries = []

        const client = {
            query: async (query) => {
                queries.push(query)

                return {
                    rows: [
                        {
                            id: transactionId,
                            user_id: userId,
                            amount: 75,
                            reason:
                                'Ejercicio personalizado completado',
                            source_type:
                                'exercise_assignment',
                            source_id:
                                assignmentId,
                            metadata: {
                                exerciseId,
                                difficulty:
                                    'intermedio',
                            },
                            created_at:
                                awardedAt,
                        },
                    ],
                }
            },
        }

        const result =
            await createExerciseCompletionXpTransaction({
                userId,
                assignmentId,
                exerciseId,
                difficultyName:
                    'intermedio',
                amount: 75,
                awardedAt,
                client,
            })

        assert.equal(
            queries.length,
            1,
        )

        assert.match(
            queries[0].text,
            /ON CONFLICT/,
        )

        assert.match(
            queries[0].text,
            /DO NOTHING/,
        )

        assert.deepEqual(
            queries[0].values,
            [
                userId,
                75,
                'Ejercicio personalizado completado',
                assignmentId,
                {
                    exerciseId,
                    difficulty:
                        'intermedio',
                },
                awardedAt,
            ],
        )

        assert.deepEqual(
            result,
            {
                id: transactionId,
                userId,
                amount: 75,
                reason:
                    'Ejercicio personalizado completado',
                sourceType:
                    'exercise_assignment',
                sourceId:
                    assignmentId,
                metadata: {
                    exerciseId,
                    difficulty:
                        'intermedio',
                },
                createdAt:
                    awardedAt,
            },
        )

        assert.equal(
            Object.isFrozen(result),
            true,
        )
    },
)

test(
    'createExerciseCompletionXpTransaction returns null when XP was already awarded',
    async () => {
        const client = {
            query: async (query) => {
                assert.match(
                    query.text,
                    /ON CONFLICT/,
                )

                assert.match(
                    query.text,
                    /DO NOTHING/,
                )

                return {
                    rows: [],
                }
            },
        }

        const result =
            await createExerciseCompletionXpTransaction({
                userId:
                    '11111111-1111-4111-8111-111111111111',
                assignmentId:
                    '22222222-2222-4222-8222-222222222222',
                exerciseId:
                    '33333333-3333-4333-8333-333333333333',
                difficultyName:
                    'intermedio',
                amount: 75,
                client,
            })

        assert.equal(
            result,
            null,
        )
    },
)

test(
    'updateUserXpFromExerciseCompletion creates the initial XP record',
    async () => {
        const userId =
            '11111111-1111-4111-8111-111111111111'

        const updatedAt =
            new Date(
                '2026-08-01T15:00:00.000Z',
            )

        const queries = []

        const client = {
            query: async (query) => {
                queries.push(query)

                return {
                    rows: [
                        {
                            user_id: userId,
                            total_xp: 75,
                            current_level_id: 1,
                            updated_at:
                                updatedAt,
                        },
                    ],
                }
            },
        }

        const result =
            await updateUserXpFromExerciseCompletion({
                userId,
                amount: 75,
                updatedAt,
                client,
            })

        assert.equal(
            queries.length,
            1,
        )

        assert.match(
            queries[0].text,
            /INSERT INTO user_xp/,
        )

        assert.match(
            queries[0].text,
            /ON CONFLICT \(user_id\)/,
        )

        assert.match(
            queries[0].text,
            /levels\.min_xp/,
        )

        assert.deepEqual(
            queries[0].values,
            [
                userId,
                75,
                updatedAt,
            ],
        )

        assert.deepEqual(
            result,
            {
                userId,
                totalXp: 75,
                currentLevelId: 1,
                updatedAt,
            },
        )

        assert.equal(
            Object.isFrozen(result),
            true,
        )
    },
)

test(
    'updateUserXpFromExerciseCompletion accumulates XP and recalculates the level',
    async () => {
        const userId =
            '11111111-1111-4111-8111-111111111111'

        const updatedAt =
            new Date(
                '2026-08-02T15:00:00.000Z',
            )

        const client = {
            query: async (query) => {
                assert.match(
                    query.text,
                    /user_xp\.total_xp\s*\+\s*EXCLUDED\.total_xp/,
                )

                assert.match(
                    query.text,
                    /ORDER BY levels\.min_xp DESC/,
                )

                return {
                    rows: [
                        {
                            user_id: userId,
                            total_xp: 350,
                            current_level_id: 2,
                            updated_at:
                                updatedAt,
                        },
                    ],
                }
            },
        }

        const result =
            await updateUserXpFromExerciseCompletion({
                userId,
                amount: 75,
                updatedAt,
                client,
            })

        assert.deepEqual(
            result,
            {
                userId,
                totalXp: 350,
                currentLevelId: 2,
                updatedAt,
            },
        )
    },
)
test(
    'updateUserStreakFromExerciseCompletion creates the initial streak',
    async () => {
        const userId = randomUUID();
        const activeDate = '2026-08-01';

        const queries = [];

        const client = {
            query: async (query) => {
                queries.push(query);

                return {
                    rows: [
                        {
                            user_id: userId,
                            current_streak: 1,
                            longest_streak: 1,
                            last_active_date:
                                activeDate,
                        },
                    ],
                };
            },
        };

        const result =
            await updateUserStreakFromExerciseCompletion({
                userId,
                activeDate,
                client,
            });

        assert.equal(queries.length, 1);

        assert.match(
            queries[0].text,
            /INSERT INTO streaks/,
        );

        assert.match(
            queries[0].text,
            /ON CONFLICT \(user_id\)/,
        );

        assert.deepEqual(
            queries[0].values,
            [
                userId,
                activeDate,
            ],
        );

        assert.deepEqual(result, {
            userId,
            currentStreak: 1,
            longestStreak: 1,
            lastActiveDate: activeDate,
        });

        assert.equal(
            Object.isFrozen(result),
            true,
        );
    },
);

test(
    'updateUserStreakFromExerciseCompletion increments consecutive activity',
    async () => {
        const userId = randomUUID();
        const activeDate = '2026-08-02';

        let capturedQuery;

        const client = {
            query: async (query) => {
                capturedQuery = query;

                return {
                    rows: [
                        {
                            user_id: userId,
                            current_streak: 4,
                            longest_streak: 6,
                            last_active_date:
                                activeDate,
                        },
                    ],
                };
            },
        };

        const result =
            await updateUserStreakFromExerciseCompletion({
                userId,
                activeDate,
                client,
            });

        assert.match(
            capturedQuery.text,
            /streaks\.last_active_date \+ 1/,
        );

        assert.match(
            capturedQuery.text,
            /streaks\.current_streak \+ 1/,
        );

        assert.match(
            capturedQuery.text,
            /GREATEST/,
        );

        assert.equal(
            result.currentStreak,
            4,
        );

        assert.equal(
            result.longestStreak,
            6,
        );
    },
);

test(
    'updateUserStreakFromExerciseCompletion protects the streak from repeated or older dates',
    async () => {
        const userId = randomUUID();
        const activeDate = '2026-08-01';

        let capturedQuery;

        const client = {
            query: async (query) => {
                capturedQuery = query;

                return {
                    rows: [
                        {
                            user_id: userId,
                            current_streak: 5,
                            longest_streak: 8,
                            last_active_date:
                                '2026-08-03',
                        },
                    ],
                };
            },
        };

        const result =
            await updateUserStreakFromExerciseCompletion({
                userId,
                activeDate,
                client,
            });

        assert.match(
            capturedQuery.text,
            /EXCLUDED\.last_active_date\s*<=\s*streaks\.last_active_date/,
        );

        assert.match(
            capturedQuery.text,
            /EXCLUDED\.last_active_date\s*>\s*streaks\.last_active_date/,
        );

        assert.equal(
            result.currentStreak,
            5,
        );

        assert.equal(
            result.longestStreak,
            8,
        );

        assert.equal(
            result.lastActiveDate,
            '2026-08-03',
        );
    },
);
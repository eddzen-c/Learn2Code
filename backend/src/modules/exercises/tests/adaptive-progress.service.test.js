import assert from 'node:assert/strict';
import test from 'node:test';

import {
    applyAdaptiveProgressFromExerciseCompletion,
    calculateExerciseXpReward,
} from '../services/adaptive-progress.service.js';

test(
    'calculateExerciseXpReward returns the configured rewards',
    () => {
        assert.equal(
            calculateExerciseXpReward('básico'),
            50,
        );

        assert.equal(
            calculateExerciseXpReward('BASICO'),
            50,
        );

        assert.equal(
            calculateExerciseXpReward('intermedio'),
            75,
        );

        assert.equal(
            calculateExerciseXpReward('avanzado'),
            100,
        );

        assert.equal(
            calculateExerciseXpReward('desconocido'),
            50,
        );
    },
);

test(
    'calculateExerciseXpReward rejects an invalid difficulty',
    () => {
        assert.throws(
            () => calculateExerciseXpReward(''),
            {
                name: 'TypeError',
                message:
                    'Difficulty name must be a non-empty string',
            },
        );

        assert.throws(
            () => calculateExerciseXpReward(null),
            {
                name: 'TypeError',
                message:
                    'Difficulty name must be a non-empty string',
            },
        );
    },
);

test(
    'applyAdaptiveProgressFromExerciseCompletion updates the complete progress',
    async () => {
        const userId =
            '11111111-1111-4111-8111-111111111111';

        const assignmentId =
            '22222222-2222-4222-8222-222222222222';

        const exerciseId =
            '33333333-3333-4333-8333-333333333333';

        const completedAt =
            new Date(
                '2026-08-01T15:30:00.000Z',
            );

        const client = {};
        const calls = [];

        const knowledgeState = {
            masteryScore: 82,
        };

        const userXp = {
            totalXp: 375,
        };

        const streak = {
            currentStreak: 4,
        };

        const result =
            await applyAdaptiveProgressFromExerciseCompletion({
                userId,
                assignmentId,
                exerciseId,
                score: 80,
                completedAt,
                client,

                findProgressContext:
                    async (parameters) => {
                        calls.push({
                            operation: 'context',
                            parameters,
                        });

                        return {
                            topic: {
                                id: 3,
                            },
                            difficulty: {
                                name: 'intermedio',
                            },
                        };
                    },

                createXpTransaction:
                    async (parameters) => {
                        calls.push({
                            operation: 'transaction',
                            parameters,
                        });

                        return {
                            id: 'xp-transaction',
                        };
                    },

                updateKnowledgeState:
                    async (parameters) => {
                        calls.push({
                            operation: 'knowledge',
                            parameters,
                        });

                        return knowledgeState;
                    },

                updateUserXp:
                    async (parameters) => {
                        calls.push({
                            operation: 'xp',
                            parameters,
                        });

                        return userXp;
                    },

                updateUserStreak:
                    async (parameters) => {
                        calls.push({
                            operation: 'streak',
                            parameters,
                        });

                        return streak;
                    },
            });

        assert.deepEqual(
            calls.map(
                (call) => call.operation,
            ),
            [
                'context',
                'transaction',
                'knowledge',
                'xp',
                'streak',
            ],
        );

        assert.equal(
            calls[1].parameters.amount,
            75,
        );

        assert.equal(
            calls[2].parameters.topicId,
            3,
        );

        assert.equal(
            calls[2].parameters.score,
            80,
        );

        assert.equal(
            calls[3].parameters.amount,
            75,
        );

        assert.equal(
            calls[4].parameters.activeDate,
            '2026-08-01',
        );

        assert.deepEqual(result, {
            applied: true,
            xpAwarded: 75,
            knowledgeState,
            userXp,
            streak,
        });

        assert.equal(
            Object.isFrozen(result),
            true,
        );
    },
);

test(
    'applyAdaptiveProgressFromExerciseCompletion avoids duplicate progress',
    async () => {
        let knowledgeUpdated = false;
        let xpUpdated = false;
        let streakUpdated = false;

        const result =
            await applyAdaptiveProgressFromExerciseCompletion({
                userId: 'user-id',
                assignmentId: 'assignment-id',
                exerciseId: 'exercise-id',
                score: 100,
                completedAt:
                    new Date(
                        '2026-08-01T10:00:00.000Z',
                    ),
                client: {},

                findProgressContext:
                    async () => ({
                        topic: {
                            id: 1,
                        },
                        difficulty: {
                            name: 'avanzado',
                        },
                    }),

                createXpTransaction:
                    async () => null,

                updateKnowledgeState:
                    async () => {
                        knowledgeUpdated = true;
                    },

                updateUserXp:
                    async () => {
                        xpUpdated = true;
                    },

                updateUserStreak:
                    async () => {
                        streakUpdated = true;
                    },
            });

        assert.deepEqual(result, {
            applied: false,
            xpAwarded: 0,
            knowledgeState: null,
            userXp: null,
            streak: null,
        });

        assert.equal(knowledgeUpdated, false);
        assert.equal(xpUpdated, false);
        assert.equal(streakUpdated, false);
    },
);

test(
    'applyAdaptiveProgressFromExerciseCompletion rejects an unavailable context',
    async () => {
        let transactionCreated = false;

        await assert.rejects(
            () => (
                applyAdaptiveProgressFromExerciseCompletion({
                    userId: 'user-id',
                    assignmentId:
                        'assignment-id',
                    exerciseId: 'exercise-id',
                    score: 90,
                    completedAt:
                        new Date(
                            '2026-08-01T10:00:00.000Z',
                        ),
                    client: {},

                    findProgressContext:
                        async () => null,

                    createXpTransaction:
                        async () => {
                            transactionCreated = true;
                        },
                })
            ),
            {
                message:
                    'Exercise progress context is unavailable',
            },
        );

        assert.equal(
            transactionCreated,
            false,
        );
    },
);

test(
    'applyAdaptiveProgressFromExerciseCompletion validates the completion date before updating progress',
    async () => {
        let contextRequested = false;

        await assert.rejects(
            () => (
                applyAdaptiveProgressFromExerciseCompletion({
                    userId: 'user-id',
                    assignmentId:
                        'assignment-id',
                    exerciseId: 'exercise-id',
                    score: 90,
                    completedAt:
                        'invalid-date',
                    client: {},

                    findProgressContext:
                        async () => {
                            contextRequested = true;

                            return null;
                        },
                })
            ),
            {
                name: 'TypeError',
                message:
                    'Completion date must be valid',
            },
        );

        assert.equal(
            contextRequested,
            false,
        );
    },
);
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    findDashboardSummaryByUserId,
    findRecentXpTransactionsByUserId,
} from '../repositories/dashboard.repository.js';

const userId =
    '11111111-1111-4111-8111-111111111111';

test(
    'findDashboardSummaryByUserId maps dashboard data',
    async () => {
        const lastActivityAt =
            new Date('2026-07-24T12:00:00.000Z');

        const client = {
            query: async (query) => {
                assert.deepEqual(
                    query.values,
                    [userId],
                );

                return {
                    rows: [{
                        user_id: userId,
                        total_exercises_attempted: 10,
                        total_exercises_solved: 7,
                        total_code_executions: 15,
                        last_activity_at: lastActivityAt,
                        total_xp: 350,
                        current_level_id: 2,
                        current_level_name: 'Apprentice',
                        current_level_min_xp: 250,
                        next_level_id: 3,
                        next_level_name: 'Developer',
                        next_level_min_xp: 750,
                        current_streak: 4,
                        longest_streak: 9,
                        last_active_date: '2026-07-24',
                        badges_earned: 3,
                    }],
                };
            },
        };

        const summary =
            await findDashboardSummaryByUserId({
                userId,
                client,
            });

        assert.deepEqual(summary, {
            userId,

            progress: {
                exercisesAttempted: 10,
                exercisesSolved: 7,
                codeExecutions: 15,
                lastActivityAt,
            },

            gamification: {
                totalXp: 350,

                currentLevel: {
                    id: 2,
                    name: 'Apprentice',
                    minimumXp: 250,
                },

                nextLevel: {
                    id: 3,
                    name: 'Developer',
                    minimumXp: 750,
                },

                currentStreak: 4,
                longestStreak: 9,
                lastActiveDate: '2026-07-24',
                badgesEarned: 3,
            },
        });
    },
);

test(
    'findDashboardSummaryByUserId returns null for a missing user',
    async () => {
        const client = {
            query: async () => ({
                rows: [],
            }),
        };

        const summary =
            await findDashboardSummaryByUserId({
                userId,
                client,
            });

        assert.equal(summary, null);
    },
);

test(
    'findRecentXpTransactionsByUserId maps recent activity',
    async () => {
        const createdAt =
            new Date('2026-07-24T12:30:00.000Z');

        const transactionId =
            '22222222-2222-4222-8222-222222222222';

        const sourceId =
            '33333333-3333-4333-8333-333333333333';

        const client = {
            query: async (query) => {
                assert.deepEqual(
                    query.values,
                    [userId, 5],
                );

                return {
                    rows: [{
                        id: transactionId,
                        amount: 50,
                        reason: 'Exercise completed',
                        source_type: 'exercise',
                        source_id: sourceId,
                        created_at: createdAt,
                    }],
                };
            },
        };

        const transactions =
            await findRecentXpTransactionsByUserId({
                userId,
                client,
            });

        assert.deepEqual(transactions, [{
            id: transactionId,
            amount: 50,
            reason: 'Exercise completed',
            sourceType: 'exercise',
            sourceId,
            createdAt,
        }]);
    },
);
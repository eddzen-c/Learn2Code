import assert from 'node:assert/strict';
import test from 'node:test';

import {
    getDashboardSummary,
} from '../services/dashboard.service.js';

const userId =
    '11111111-1111-4111-8111-111111111111';

const createSummaryRow = ({
    attempted = 10,
    solved = 7,
    totalXp = 350,
    currentLevelId = 2,
    currentLevelName = 'Apprentice',
    currentLevelMinimumXp = 250,
    nextLevelId = 3,
    nextLevelName = 'Developer',
    nextLevelMinimumXp = 750,
} = {}) => ({
    user_id: userId,
    total_exercises_attempted: attempted,
    total_exercises_solved: solved,
    total_code_executions: 15,
    last_activity_at:
        new Date('2026-07-24T12:00:00.000Z'),
    total_xp: totalXp,
    current_level_id: currentLevelId,
    current_level_name: currentLevelName,
    current_level_min_xp:
        currentLevelMinimumXp,
    next_level_id: nextLevelId,
    next_level_name: nextLevelName,
    next_level_min_xp:
        nextLevelMinimumXp,
    current_streak: 4,
    longest_streak: 9,
    last_active_date: '2026-07-24',
    badges_earned: 3,
});

const createClient = ({
    summaryRows,
    activityRows = [],
}) => ({
    query: async ({ text }) => {
        if (text.includes('FROM xp_transactions')) {
            return {
                rows: activityRows,
            };
        }

        return {
            rows: summaryRows,
        };
    },
});

test(
    'getDashboardSummary calculates dashboard metrics',
    async () => {
        const activityCreatedAt =
            new Date('2026-07-24T13:00:00.000Z');

        const client = createClient({
            summaryRows: [
                createSummaryRow(),
            ],

            activityRows: [{
                id:
                    '22222222-2222-4222-8222-222222222222',
                amount: 50,
                reason: 'Exercise completed',
                source_type: 'exercise',
                source_id: null,
                created_at: activityCreatedAt,
            }],
        });

        const summary =
            await getDashboardSummary({
                userId,
                client,
            });

        assert.equal(
            summary.progress.completionRate,
            70,
        );

        assert.equal(
            summary
                .gamification
                .levelProgressPercentage,
            20,
        );

        assert.equal(
            summary.gamification.xpToNextLevel,
            400,
        );

        assert.equal(
            summary.recentActivity.length,
            1,
        );

        assert.deepEqual(
            summary.recentActivity[0],
            {
                id:
                    '22222222-2222-4222-8222-222222222222',
                amount: 50,
                reason: 'Exercise completed',
                sourceType: 'exercise',
                sourceId: null,
                createdAt: activityCreatedAt,
            },
        );
    },
);

test(
    'getDashboardSummary handles a user without progress',
    async () => {
        const client = createClient({
            summaryRows: [
                createSummaryRow({
                    attempted: 0,
                    solved: 0,
                    totalXp: 0,
                    currentLevelId: 1,
                    currentLevelName: 'Beginner',
                    currentLevelMinimumXp: 0,
                    nextLevelId: 2,
                    nextLevelName: 'Apprentice',
                    nextLevelMinimumXp: 250,
                }),
            ],
        });

        const summary =
            await getDashboardSummary({
                userId,
                client,
            });

        assert.equal(
            summary.progress.completionRate,
            0,
        );

        assert.equal(
            summary
                .gamification
                .levelProgressPercentage,
            0,
        );

        assert.equal(
            summary.gamification.xpToNextLevel,
            250,
        );
    },
);

test(
    'getDashboardSummary handles the highest level',
    async () => {
        const client = createClient({
            summaryRows: [
                createSummaryRow({
                    totalXp: 2000,
                    currentLevelId: 4,
                    currentLevelName: 'Expert',
                    currentLevelMinimumXp: 1500,
                    nextLevelId: null,
                    nextLevelName: null,
                    nextLevelMinimumXp: null,
                }),
            ],
        });

        const summary =
            await getDashboardSummary({
                userId,
                client,
            });

        assert.equal(
            summary
                .gamification
                .levelProgressPercentage,
            100,
        );

        assert.equal(
            summary.gamification.xpToNextLevel,
            null,
        );
    },
);

test(
    'getDashboardSummary rejects an unavailable user',
    async () => {
        const client = createClient({
            summaryRows: [],
        });

        await assert.rejects(
            () => getDashboardSummary({
                userId,
                client,
            }),
            (error) => {
                assert.equal(
                    error.code,
                    'AUTHENTICATION_REQUIRED',
                );

                return true;
            },
        );
    },
);
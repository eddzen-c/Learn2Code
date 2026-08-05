import assert from 'node:assert/strict';
import test from 'node:test';

import {
    awardEligibleBadgesForUser,
    findBadgeCatalogForUser,
} from '../repositories/badge.repository.js';

test(
    'awardEligibleBadgesForUser awards and maps eligible badges',
    async () => {
        const userId =
            '11111111-1111-4111-8111-111111111111';

        const earnedAt =
            new Date(
                '2026-08-02T12:00:00.000Z',
            );

        let capturedQuery;

        const client = {
            query: async (query) => {
                capturedQuery = query;

                return {
                    rows: [
                        {
                            user_badge_id:
                                '22222222-2222-4222-8222-222222222222',

                            user_id: userId,
                            earned_at: earnedAt,

                            metadata: {
                                criteriaType:
                                    'exercises_completed',
                                threshold: 1,
                                value: 1,
                            },

                            badge_id:
                                '33333333-3333-4333-8333-333333333333',

                            badge_name:
                                'Primer paso',

                            badge_description:
                                'Completa tu primer ejercicio personalizado.',

                            badge_icon_url: null,

                            criteria_type:
                                'exercises_completed',

                            criteria_value: {
                                threshold: 1,
                            },
                        },
                    ],
                };
            },
        };

        const result =
            await awardEligibleBadgesForUser({
                userId,
                earnedAt,
                client,
            });

        assert.deepEqual(
            capturedQuery.values,
            [
                userId,
                earnedAt,
            ],
        );

        assert.equal(result.length, 1);

        assert.equal(
            result[0].badge.name,
            'Primer paso',
        );

        assert.equal(
            result[0].metadata.value,
            1,
        );

        assert.deepEqual(
            result[0].badge.criteriaValue,
            {
                threshold: 1,
            },
        );

        assert.equal(
            Object.isFrozen(result),
            true,
        );

        assert.equal(
            Object.isFrozen(result[0]),
            true,
        );

        assert.equal(
            Object.isFrozen(
                result[0].metadata,
            ),
            true,
        );

        assert.equal(
            Object.isFrozen(
                result[0].badge,
            ),
            true,
        );

        assert.equal(
            Object.isFrozen(
                result[0]
                    .badge
                    .criteriaValue,
            ),
            true,
        );
    },
);

test(
    'awardEligibleBadgesForUser returns an empty frozen collection',
    async () => {
        const client = {
            query: async () => ({
                rows: [],
            }),
        };

        const result =
            await awardEligibleBadgesForUser({
                userId: 'user-id',
                client,
            });

        assert.deepEqual(result, []);

        assert.equal(
            Object.isFrozen(result),
            true,
        );
    },
);

test(
    'awardEligibleBadgesForUser evaluates every progress metric idempotently',
    async () => {
        let capturedQuery;

        const client = {
            query: async (query) => {
                capturedQuery = query;

                return {
                    rows: [],
                };
            },
        };

        await awardEligibleBadgesForUser({
            userId: 'user-id',
            client,
        });

        assert.match(
            capturedQuery.text,
            /status = 'completed'/,
        );

        assert.match(
            capturedQuery.text,
            /FROM user_xp/,
        );

        assert.match(
            capturedQuery.text,
            /FROM streaks/,
        );

        assert.match(
            capturedQuery.text,
            /WHEN 'exercises_completed'/,
        );

        assert.match(
            capturedQuery.text,
            /WHEN 'total_xp'/,
        );

        assert.match(
            capturedQuery.text,
            /WHEN 'current_level'/,
        );

        assert.match(
            capturedQuery.text,
            /WHEN 'current_streak'/,
        );

        assert.match(
            capturedQuery.text,
            /ON CONFLICT\s*\(\s*user_id,\s*badge_id\s*\)/,
        );

        assert.match(
            capturedQuery.text,
            /DO NOTHING/,
        );

        assert.equal(
            capturedQuery.values[1]
            instanceof Date,
            true,
        );
    },
);

test(
    'findBadgeCatalogForUser maps earned and pending badges',
    async () => {
        const earnedAt =
            new Date(
                '2026-08-02T15:00:00.000Z',
            );

        const client = {
            query: async () => ({
                rows: [
                    {
                        badge_id: 'badge-1',
                        badge_name:
                            'Primer paso',
                        badge_description:
                            'Completa tu primer ejercicio personalizado.',
                        badge_icon_url: null,
                        criteria_type:
                            'exercises_completed',
                        criteria_value: {
                            threshold: 1,
                        },
                        threshold: '1',
                        current_value: '1',
                        progress_percentage:
                            '100.00',
                        user_badge_id:
                            'user-badge-1',
                        earned_at: earnedAt,
                    },
                    {
                        badge_id: 'badge-2',
                        badge_name:
                            'En práctica',
                        badge_description:
                            'Completa cinco ejercicios personalizados.',
                        badge_icon_url: null,
                        criteria_type:
                            'exercises_completed',
                        criteria_value: {
                            threshold: 5,
                        },
                        threshold: '5',
                        current_value: '1',
                        progress_percentage:
                            '20.00',
                        user_badge_id: null,
                        earned_at: null,
                    },
                ],
            }),
        };

        const result =
            await findBadgeCatalogForUser({
                userId: 'user-id',
                client,
            });

        assert.equal(result.length, 2);

        assert.equal(
            result[0].earned,
            true,
        );

        assert.equal(
            result[0].earnedAt,
            earnedAt,
        );

        assert.equal(
            result[0].progressPercentage,
            100,
        );

        assert.equal(
            result[1].earned,
            false,
        );

        assert.equal(
            result[1].currentValue,
            1,
        );

        assert.equal(
            result[1].threshold,
            5,
        );

        assert.equal(
            result[1].progressPercentage,
            20,
        );

        assert.equal(
            Object.isFrozen(result),
            true,
        );

        assert.equal(
            Object.isFrozen(result[0]),
            true,
        );

        assert.equal(
            Object.isFrozen(
                result[0].criteriaValue,
            ),
            true,
        );
    },
);

test(
    'findBadgeCatalogForUser returns an empty frozen catalog',
    async () => {
        const client = {
            query: async () => ({
                rows: [],
            }),
        };

        const result =
            await findBadgeCatalogForUser({
                userId: 'user-id',
                client,
            });

        assert.deepEqual(result, []);

        assert.equal(
            Object.isFrozen(result),
            true,
        );
    },
);

test(
    'findBadgeCatalogForUser calculates progress for every badge type',
    async () => {
        let capturedQuery;

        const client = {
            query: async (query) => {
                capturedQuery = query;

                return {
                    rows: [],
                };
            },
        };

        await findBadgeCatalogForUser({
            userId: 'user-id',
            client,
        });

        assert.deepEqual(
            capturedQuery.values,
            [
                'user-id',
            ],
        );

        assert.match(
            capturedQuery.text,
            /status = 'completed'/,
        );

        assert.match(
            capturedQuery.text,
            /FROM user_xp/,
        );

        assert.match(
            capturedQuery.text,
            /FROM streaks/,
        );

        assert.match(
            capturedQuery.text,
            /LEFT JOIN user_badges/,
        );

        assert.match(
            capturedQuery.text,
            /progress_percentage/,
        );

        assert.match(
            capturedQuery.text,
            /LEAST\(/,
        );
    },
);
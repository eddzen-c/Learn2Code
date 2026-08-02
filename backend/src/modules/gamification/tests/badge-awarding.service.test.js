import assert from 'node:assert/strict';
import test from 'node:test';

import {
    awardProgressBadges,
} from '../services/badge-awarding.service.js';

test(
    'awardProgressBadges returns newly awarded badges',
    async () => {
        const earnedAt =
            new Date(
                '2026-08-02T14:00:00.000Z',
            );

        const client = {};
        let capturedParameters;

        const badge = Object.freeze({
            id: 'user-badge-id',

            badge: Object.freeze({
                id: 'badge-id',
                name: 'Primer paso',
            }),
        });

        const result =
            await awardProgressBadges({
                userId: 'user-id',
                earnedAt,
                client,

                awardEligibleBadges:
                    async (parameters) => {
                        capturedParameters =
                            parameters;

                        return [
                            badge,
                        ];
                    },
            });

        assert.equal(
            capturedParameters.userId,
            'user-id',
        );

        assert.equal(
            capturedParameters.earnedAt,
            earnedAt,
        );

        assert.equal(
            capturedParameters.client,
            client,
        );

        assert.equal(
            result.awarded,
            true,
        );

        assert.equal(
            result.count,
            1,
        );

        assert.equal(
            result.badges[0],
            badge,
        );

        assert.equal(
            Object.isFrozen(result),
            true,
        );

        assert.equal(
            Object.isFrozen(
                result.badges,
            ),
            true,
        );
    },
);

test(
    'awardProgressBadges returns no awards when no badge is eligible',
    async () => {
        const result =
            await awardProgressBadges({
                userId: 'user-id',

                awardEligibleBadges:
                    async () => [],
            });

        assert.deepEqual(result, {
            awarded: false,
            count: 0,
            badges: [],
        });

        assert.equal(
            Object.isFrozen(
                result.badges,
            ),
            true,
        );
    },
);

test(
    'awardProgressBadges rejects an invalid user identifier',
    async () => {
        await assert.rejects(
            () => awardProgressBadges({
                userId: '',
            }),
            {
                name: 'TypeError',
                message:
                    'User identifier must be a non-empty string',
            },
        );

        await assert.rejects(
            () => awardProgressBadges({
                userId: null,
            }),
            {
                name: 'TypeError',
                message:
                    'User identifier must be a non-empty string',
            },
        );
    },
);

test(
    'awardProgressBadges validates the earned date before querying',
    async () => {
        let repositoryCalled = false;

        await assert.rejects(
            () => awardProgressBadges({
                userId: 'user-id',
                earnedAt: 'invalid-date',

                awardEligibleBadges:
                    async () => {
                        repositoryCalled = true;

                        return [];
                    },
            }),
            {
                name: 'TypeError',
                message:
                    'Badge earned date must be valid',
            },
        );

        assert.equal(
            repositoryCalled,
            false,
        );
    },
);
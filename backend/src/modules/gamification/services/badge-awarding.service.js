import {
    databasePool,
} from '../../../config/database.js';

import {
    awardEligibleBadgesForUser,
} from '../repositories/badge.repository.js';

export const awardProgressBadges =
    async ({
        userId,
        earnedAt = new Date(),
        client = databasePool,
        awardEligibleBadges =
        awardEligibleBadgesForUser,
    }) => {
        if (
            typeof userId !== 'string'
            || userId.trim().length === 0
        ) {
            throw new TypeError(
                'User identifier must be a non-empty string',
            );
        }

        const normalizedEarnedAt =
            earnedAt instanceof Date
                ? earnedAt
                : new Date(earnedAt);

        if (
            Number.isNaN(
                normalizedEarnedAt.getTime(),
            )
        ) {
            throw new TypeError(
                'Badge earned date must be valid',
            );
        }

        const awardedBadges =
            await awardEligibleBadges({
                userId,
                earnedAt:
                    normalizedEarnedAt,
                client,
            });

        const badges =
            Object.freeze([
                ...awardedBadges,
            ]);

        return Object.freeze({
            awarded:
                badges.length > 0,
            count:
                badges.length,
            badges,
        });
    };
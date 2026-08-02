import {
    databasePool,
} from '../../../config/database.js';

import {
    findBadgeCatalogForUser,
} from '../repositories/badge.repository.js';

export const getUserBadgeCatalog =
    async ({
        userId,
        client = databasePool,
        findBadgeCatalog =
        findBadgeCatalogForUser,
    }) => {
        if (
            typeof userId !== 'string'
            || userId.trim().length === 0
        ) {
            throw new TypeError(
                'User identifier must be a non-empty string',
            );
        }

        const badgeRecords =
            await findBadgeCatalog({
                userId,
                client,
            });

        const badges =
            Object.freeze([
                ...badgeRecords,
            ]);

        const earnedCount =
            badges.filter(
                (badge) => badge.earned,
            ).length;

        return Object.freeze({
            total: badges.length,
            earnedCount,
            pendingCount:
                badges.length
                - earnedCount,
            badges,
        });
    };
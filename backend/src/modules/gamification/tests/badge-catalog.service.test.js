import assert from 'node:assert/strict';
import test from 'node:test';

import {
    getUserBadgeCatalog,
} from '../services/badge-catalog.service.js';

test(
    'getUserBadgeCatalog summarizes earned and pending badges',
    async () => {
        const client = {};
        let capturedParameters;

        const badgeRecords = [
            {
                id: 'badge-1',
                earned: true,
            },
            {
                id: 'badge-2',
                earned: false,
            },
            {
                id: 'badge-3',
                earned: false,
            },
        ];

        const result =
            await getUserBadgeCatalog({
                userId: 'user-id',
                client,

                findBadgeCatalog:
                    async (parameters) => {
                        capturedParameters =
                            parameters;

                        return badgeRecords;
                    },
            });

        assert.equal(
            capturedParameters.userId,
            'user-id',
        );

        assert.equal(
            capturedParameters.client,
            client,
        );

        assert.deepEqual(result, {
            total: 3,
            earnedCount: 1,
            pendingCount: 2,
            badges: badgeRecords,
        });

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
    'getUserBadgeCatalog returns an empty summary',
    async () => {
        const result =
            await getUserBadgeCatalog({
                userId: 'user-id',

                findBadgeCatalog:
                    async () => [],
            });

        assert.deepEqual(result, {
            total: 0,
            earnedCount: 0,
            pendingCount: 0,
            badges: [],
        });
    },
);

test(
    'getUserBadgeCatalog rejects an invalid user identifier',
    async () => {
        let repositoryCalled = false;

        await assert.rejects(
            () => getUserBadgeCatalog({
                userId: '',

                findBadgeCatalog:
                    async () => {
                        repositoryCalled = true;

                        return [];
                    },
            }),
            {
                name: 'TypeError',
                message:
                    'User identifier must be a non-empty string',
            },
        );

        assert.equal(
            repositoryCalled,
            false,
        );
    },
);

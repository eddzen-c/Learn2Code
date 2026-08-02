import assert from 'node:assert/strict';
import {
    randomUUID,
} from 'node:crypto';
import test from 'node:test';

import request from 'supertest';

import app from '../../src/app.js';

import {
    closeDatabaseConnection,
    databasePool,
} from '../../src/config/database.js';

test(
    'GET /api/v1/gamification/badges returns the authenticated user catalog',
    async () => {
        const email =
            `badges-${randomUUID()}@example.test`;

        const password =
            'Learn2Code-Badges-2026!';

        let userId = null;

        try {
            const registrationResponse =
                await request(app)
                    .post('/api/v1/auth/register')
                    .send({
                        fullName:
                            'Gamification Student',
                        email,
                        password,
                    });

            assert.equal(
                registrationResponse.status,
                201,
            );

            userId =
                registrationResponse
                    .body.data.user.id;

            const accessToken =
                registrationResponse
                    .body.data.accessToken;

            await databasePool.query({
                text: `
                    INSERT INTO user_xp (
                        user_id,
                        total_xp,
                        current_level_id,
                        updated_at
                    )
                    VALUES ($1, 350, 2, NOW())

                    ON CONFLICT (user_id)
                    DO UPDATE SET
                        total_xp = 350,
                        current_level_id = 2,
                        updated_at = NOW()
                `,
                values: [userId],
            });

            await databasePool.query({
                text: `
                    INSERT INTO streaks (
                        user_id,
                        current_streak,
                        longest_streak,
                        last_active_date
                    )
                    VALUES (
                        $1,
                        3,
                        3,
                        CURRENT_DATE
                    )

                    ON CONFLICT (user_id)
                    DO UPDATE SET
                        current_streak = 3,
                        longest_streak =
                            GREATEST(
                                streaks.longest_streak,
                                3
                            ),
                        last_active_date =
                            CURRENT_DATE
                `,
                values: [userId],
            });

            await databasePool.query({
                text: `
                    INSERT INTO user_badges (
                        user_id,
                        badge_id,
                        metadata
                    )

                    SELECT
                        $1,
                        badges.id,
                        JSONB_BUILD_OBJECT(
                            'source',
                            'integration_test'
                        )

                    FROM badges

                    WHERE badges.name IN (
                        'Primeros 300 XP',
                        'Tres días seguidos',
                        'Nivel Junior'
                    )

                    ON CONFLICT (
                        user_id,
                        badge_id
                    )
                    DO NOTHING
                `,
                values: [userId],
            });

            const response =
                await request(app)
                    .get(
                        '/api/v1/gamification/badges',
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    );

            assert.equal(
                response.status,
                200,
            );

            assert.equal(
                response.body.status,
                'success',
            );

            const catalog =
                response.body.data;

            assert.equal(
                catalog.total,
                10,
            );

            assert.equal(
                catalog.earnedCount,
                3,
            );

            assert.equal(
                catalog.pendingCount,
                7,
            );

            assert.equal(
                catalog.badges.length,
                10,
            );

            const xpBadge =
                catalog.badges.find(
                    (badge) => (
                        badge.name
                        === 'Primeros 300 XP'
                    ),
                );

            assert.equal(
                xpBadge.earned,
                true,
            );

            assert.equal(
                xpBadge.currentValue,
                350,
            );

            assert.equal(
                xpBadge.threshold,
                300,
            );

            assert.equal(
                xpBadge.progressPercentage,
                100,
            );

            const streakBadge =
                catalog.badges.find(
                    (badge) => (
                        badge.name
                        === 'Tres días seguidos'
                    ),
                );

            assert.equal(
                streakBadge.earned,
                true,
            );

            assert.equal(
                streakBadge.currentValue,
                3,
            );

            const pendingBadge =
                catalog.badges.find(
                    (badge) => (
                        badge.name
                        === 'En práctica'
                    ),
                );

            assert.equal(
                pendingBadge.earned,
                false,
            );

            assert.equal(
                pendingBadge.currentValue,
                0,
            );

            assert.equal(
                pendingBadge.progressPercentage,
                0,
            );

            const unauthorizedResponse =
                await request(app)
                    .get(
                        '/api/v1/gamification/badges',
                    );

            assert.equal(
                unauthorizedResponse.status,
                401,
            );

            assert.equal(
                unauthorizedResponse.body.code,
                'AUTHENTICATION_REQUIRED',
            );
        } finally {
            try {
                if (userId) {
                    await databasePool.query({
                        text: `
                            DELETE FROM users
                            WHERE id = $1
                        `,
                        values: [userId],
                    });
                } else {
                    await databasePool.query({
                        text: `
                            DELETE FROM users
                            WHERE email = $1
                        `,
                        values: [email],
                    });
                }
            } finally {
                await closeDatabaseConnection();
            }
        }
    },
);
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import request from 'supertest';

import app from '../../src/app.js';

import {
    closeDatabaseConnection,
    databasePool,
} from '../../src/config/database.js';

test(
    'GET /api/v1/dashboard/summary returns user progress',
    async () => {
        const email =
            `dashboard-${randomUUID()}@example.test`;

        const password =
            'Learn2Code-Dashboard-2026!';

        try {
            const registrationResponse =
                await request(app)
                    .post('/api/v1/auth/register')
                    .send({
                        fullName:
                            'Dashboard Student',
                        email,
                        password,
                    });

            assert.equal(
                registrationResponse.status,
                201,
            );

            const {
                accessToken,
                user,
            } = registrationResponse.body.data;

            await Promise.all([
                databasePool.query({
                    text: `
                        INSERT INTO user_progress_stats (
                            user_id,
                            total_exercises_attempted,
                            total_exercises_solved,
                            total_code_executions,
                            last_activity_at
                        )
                        VALUES (
                            $1,
                            10,
                            7,
                            15,
                            now()
                        )
                    `,
                    values: [user.id],
                }),

                databasePool.query({
                    text: `
                        INSERT INTO user_xp (
                            user_id,
                            total_xp,
                            current_level_id
                        )
                        VALUES (
                            $1,
                            450,
                            2
                        )
                    `,
                    values: [user.id],
                }),

                databasePool.query({
                    text: `
                        INSERT INTO streaks (
                            user_id,
                            current_streak,
                            longest_streak,
                            last_active_date
                        )
                        VALUES (
                            $1,
                            4,
                            9,
                            CURRENT_DATE
                        )
                    `,
                    values: [user.id],
                }),

                databasePool.query({
                    text: `
                        INSERT INTO xp_transactions (
                            user_id,
                            amount,
                            reason,
                            source_type
                        )
                        VALUES (
                            $1,
                            50,
                            'Exercise completed',
                            'exercise'
                        )
                    `,
                    values: [user.id],
                }),
            ]);

            const response = await request(app)
                .get('/api/v1/dashboard/summary')
                .set(
                    'Authorization',
                    `Bearer ${accessToken}`,
                );

            assert.equal(response.status, 200);

            assert.equal(
                response.body.status,
                'success',
            );

            const {
                summary,
            } = response.body.data;

            assert.deepEqual(
                summary.progress,
                {
                    exercisesAttempted: 10,
                    exercisesSolved: 7,
                    codeExecutions: 15,
                    lastActivityAt:
                        summary
                            .progress
                            .lastActivityAt,
                    completionRate: 70,
                },
            );

            assert.equal(
                summary.gamification.totalXp,
                450,
            );

            assert.deepEqual(
                summary
                    .gamification
                    .currentLevel,
                {
                    id: 2,
                    name: 'Programador Junior',
                    minimumXp: 300,
                },
            );

            assert.deepEqual(
                summary
                    .gamification
                    .nextLevel,
                {
                    id: 3,
                    name:
                        'Programador Intermedio',
                    minimumXp: 1000,
                },
            );

            assert.equal(
                summary
                    .gamification
                    .levelProgressPercentage,
                21.43,
            );

            assert.equal(
                summary
                    .gamification
                    .xpToNextLevel,
                550,
            );

            assert.equal(
                summary
                    .gamification
                    .currentStreak,
                4,
            );

            assert.equal(
                summary
                    .gamification
                    .longestStreak,
                9,
            );

            assert.equal(
                summary
                    .gamification
                    .badgesEarned,
                0,
            );

            assert.equal(
                summary.recentActivity.length,
                1,
            );

            assert.equal(
                summary.recentActivity[0].amount,
                50,
            );

            assert.equal(
                summary.recentActivity[0].reason,
                'Exercise completed',
            );

            const missingTokenResponse =
                await request(app)
                    .get(
                        '/api/v1/dashboard/summary',
                    );

            assert.equal(
                missingTokenResponse.status,
                401,
            );

            assert.equal(
                missingTokenResponse.body.code,
                'AUTHENTICATION_REQUIRED',
            );
        } finally {
            try {
                await databasePool.query({
                    text: `
                        DELETE FROM users
                        WHERE email = $1
                    `,
                    values: [email],
                });
            } finally {
                await closeDatabaseConnection();
            }
        }
    },
);
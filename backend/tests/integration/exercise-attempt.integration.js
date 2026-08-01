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
    'exercise attempt lifecycle works with PostgreSQL',
    async () => {
        const email =
            `attempt-${randomUUID()}@example.test`;

        const password =
            'Learn2Code-Attempt-2026!';

        let userId = null;

        try {
            const registrationResponse =
                await request(app)
                    .post('/api/v1/auth/register')
                    .send({
                        fullName:
                            'Exercise Attempt Student',
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

            const diagnosticResult =
                await databasePool.query({
                    text: `
                        INSERT INTO diagnostic_assessments (
                            user_id,
                            language_id,
                            attempt_number,
                            status,
                            question_count,
                            answered_count,
                            overall_score,
                            resulting_difficulty_id,
                            started_at,
                            completed_at
                        )
                        VALUES (
                            $1,
                            1,
                            1,
                            'completed',
                            1,
                            1,
                            60,
                            2,
                            NOW(),
                            NOW()
                        )
                        RETURNING id
                    `,
                    values: [userId],
                });

            const assessmentId =
                diagnosticResult.rows[0].id;

            await databasePool.query({
                text: `
                    INSERT INTO learning_profiles (
                        user_id,
                        current_difficulty_id,
                        diagnostic_completed_at,
                        last_diagnostic_assessment_id,
                        updated_at
                    )
                    VALUES (
                        $1,
                        2,
                        NOW(),
                        $2,
                        NOW()
                    )
                    ON CONFLICT (user_id)
                    DO UPDATE SET
                        current_difficulty_id = 2,
                        diagnostic_completed_at =
                            NOW(),
                        last_diagnostic_assessment_id =
                            $2,
                        updated_at = NOW()
                `,
                values: [
                    userId,
                    assessmentId,
                ],
            });

            await databasePool.query({
                text: `
                    INSERT INTO knowledge_states (
                        user_id,
                        topic_id,
                        mastery_score,
                        confidence_score,
                        attempts_count
                    )
                    VALUES
                        ($1, 1, 75, 80, 1),
                        ($1, 3, 25, 50, 1)
                `,
                values: [userId],
            });

            const generationResponse =
                await request(app)
                    .post('/api/v1/exercises/next')
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    )
                    .send({});

            assert.equal(
                generationResponse.status,
                201,
            );

            const generatedData =
                generationResponse.body.data;

            const exerciseId =
                generatedData.exercise.id;

            const assignmentId =
                generatedData.assignment.id;

            const solutionResult =
                await databasePool.query({
                    text: `
                        SELECT
                            topic_id,
                            difficulty_id,
                            solution_code
                        FROM exercises
                        WHERE id = $1
                    `,
                    values: [exerciseId],
                });

            assert.equal(
                solutionResult.rows.length,
                1,
            );

            const solutionCode =
                solutionResult
                    .rows[0]
                    .solution_code;

            const topicId =
                solutionResult
                    .rows[0]
                    .topic_id;

            assert.equal(
                solutionResult
                    .rows[0]
                    .difficulty_id,
                2,
            );

            const failedResponse =
                await request(app)
                    .post(
                        `/api/v1/exercises/assignments/${assignmentId}/attempts`,
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        submittedCode:
                            'console.log("incorrect");',
                    });

            assert.equal(
                failedResponse.status,
                201,
            );

            assert.equal(
                failedResponse.body.status,
                'success',
            );

            assert.equal(
                failedResponse
                    .body.data.attempt.passed,
                false,
            );

            assert.equal(
                failedResponse
                    .body.data.attempt.score,
                0,
            );

            assert.equal(
                failedResponse
                    .body.data.assignment.status,
                'started',
            );

            assert.equal(
                failedResponse
                    .body.data.attempt.testsTotal,
                3,
            );

            assert.equal(
                failedResponse
                    .body.data.results.length,
                2,
            );

            assert.equal(
                failedResponse
                    .body.data.progress,
                null,
            );

            const progressAfterFailure =
                await databasePool.query({
                    text: `
                        SELECT
                            mastery_score,
                            confidence_score,
                            attempts_count
                        FROM knowledge_states
                        WHERE user_id = $1
                            AND topic_id = $2
                    `,
                    values: [
                        userId,
                        topicId,
                    ],
                });

            assert.equal(
                progressAfterFailure.rows.length,
                1,
            );

            assert.equal(
                Number(
                    progressAfterFailure
                        .rows[0]
                        .mastery_score,
                ),
                25,
            );

            assert.equal(
                Number(
                    progressAfterFailure
                        .rows[0]
                        .confidence_score,
                ),
                50,
            );

            assert.equal(
                progressAfterFailure
                    .rows[0]
                    .attempts_count,
                1,
            );

            const rewardsAfterFailure =
                await databasePool.query({
                    text: `
                        SELECT
                            (
                                SELECT COUNT(*)::INTEGER
                                FROM user_xp
                                WHERE user_id = $1
                            ) AS user_xp_count,

                            (
                                SELECT COUNT(*)::INTEGER
                                FROM streaks
                                WHERE user_id = $1
                            ) AS streak_count,

                            (
                                SELECT COUNT(*)::INTEGER
                                FROM xp_transactions
                                WHERE user_id = $1
                                    AND source_type =
                                    'exercise_assignment'
                            ) AS transaction_count
                    `,
                    values: [userId],
                });

            assert.equal(
                rewardsAfterFailure
                    .rows[0]
                    .user_xp_count,
                0,
            );

            assert.equal(
                rewardsAfterFailure
                    .rows[0]
                    .streak_count,
                0,
            );

            assert.equal(
                rewardsAfterFailure
                    .rows[0]
                    .transaction_count,
                0,
            );

            const passingResponse =
                await request(app)
                    .post(
                        `/api/v1/exercises/assignments/${assignmentId}/attempts`,
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        submittedCode:
                            solutionCode,
                    });

            assert.equal(
                passingResponse.status,
                201,
            );

            assert.equal(
                passingResponse
                    .body.data.attempt.passed,
                true,
            );

            assert.equal(
                passingResponse
                    .body.data.attempt.score,
                100,
            );

            assert.equal(
                passingResponse
                    .body.data.assignment.status,
                'completed',
            );

            assert.equal(
                passingResponse
                    .body.data.attempt.testsPassed,
                3,
            );

            assert.equal(
                passingResponse
                    .body.data.attempt.testsTotal,
                3,
            );

            assert.equal(
                passingResponse
                    .body.data.results.length,
                2,
            );

            assert.equal(
                passingResponse
                    .body.data.progress.applied,
                true,
            );

            assert.equal(
                passingResponse
                    .body.data.progress.xpAwarded,
                75,
            );

            assert.equal(
                'solutionCode'
                in passingResponse.body.data,
                false,
            );

            const repeatedResponse =
                await request(app)
                    .post(
                        `/api/v1/exercises/assignments/${assignmentId}/attempts`,
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        submittedCode:
                            solutionCode,
                    });

            assert.equal(
                repeatedResponse.status,
                409,
            );

            assert.equal(
                repeatedResponse.body.code,
                'EXERCISE_ASSIGNMENT_UNAVAILABLE',
            );

            const invalidResponse =
                await request(app)
                    .post(
                        `/api/v1/exercises/assignments/${assignmentId}/attempts`,
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        submittedCode: '',
                    });

            assert.equal(
                invalidResponse.status,
                400,
            );

            assert.equal(
                invalidResponse.body.code,
                'VALIDATION_ERROR',
            );

            const unauthorizedResponse =
                await request(app)
                    .post(
                        `/api/v1/exercises/assignments/${assignmentId}/attempts`,
                    )
                    .send({
                        submittedCode:
                            solutionCode,
                    });

            assert.equal(
                unauthorizedResponse.status,
                401,
            );

            const databaseResult =
                await databasePool.query({
                    text: `
                        SELECT
                            exercise_assignments.status,

                            COUNT(
                                DISTINCT exercise_attempts.id
                            )::INTEGER
                                AS attempt_count,

                            COUNT(
                                exercise_attempt_results.id
                            )::INTEGER
                                AS result_count

                        FROM exercise_assignments

                        LEFT JOIN exercise_attempts
                            ON exercise_attempts.assignment_id =
                                exercise_assignments.id

                        LEFT JOIN exercise_attempt_results
                            ON exercise_attempt_results.attempt_id =
                                exercise_attempts.id

                        WHERE exercise_assignments.id = $1

                        GROUP BY
                            exercise_assignments.status
                    `,
                    values: [assignmentId],
                });

            assert.equal(
                databaseResult.rows.length,
                1,
            );

            assert.equal(
                databaseResult.rows[0].status,
                'completed',
            );

            assert.equal(
                databaseResult
                    .rows[0].attempt_count,
                2,
            );

            assert.equal(
                databaseResult
                    .rows[0].result_count,
                6,
            );
            const progressResult =
                await databasePool.query({
                    text: `
                        SELECT
                            knowledge_states.mastery_score,
                            knowledge_states.confidence_score,
                            knowledge_states.attempts_count,

                            user_xp.total_xp,
                            user_xp.current_level_id,

                            streaks.current_streak,
                            streaks.longest_streak,
                            streaks.last_active_date

                        FROM knowledge_states

                        JOIN user_xp
                            ON user_xp.user_id =
                                knowledge_states.user_id

                        JOIN streaks
                            ON streaks.user_id =
                                knowledge_states.user_id

                        WHERE knowledge_states.user_id = $1
                            AND knowledge_states.topic_id = $2
                    `,
                    values: [
                        userId,
                        topicId,
                    ],
                });

            assert.equal(
                progressResult.rows.length,
                1,
            );

            assert.equal(
                Number(
                    progressResult
                        .rows[0]
                        .mastery_score,
                ),
                43.75,
            );

            assert.equal(
                Number(
                    progressResult
                        .rows[0]
                        .confidence_score,
                ),
                55,
            );

            assert.equal(
                progressResult
                    .rows[0]
                    .attempts_count,
                2,
            );

            assert.equal(
                progressResult
                    .rows[0]
                    .total_xp,
                75,
            );

            assert.equal(
                progressResult
                    .rows[0]
                    .current_level_id,
                1,
            );

            assert.equal(
                progressResult
                    .rows[0]
                    .current_streak,
                1,
            );

            assert.equal(
                progressResult
                    .rows[0]
                    .longest_streak,
                1,
            );

            assert.notEqual(
                progressResult
                    .rows[0]
                    .last_active_date,
                null,
            );

            const xpTransactionResult =
                await databasePool.query({
                    text: `
                        SELECT
                            COUNT(*)::INTEGER
                                AS transaction_count,

                            COALESCE(
                                SUM(amount),
                                0
                            )::INTEGER
                                AS awarded_xp

                        FROM xp_transactions

                        WHERE user_id = $1
                            AND source_type =
                            'exercise_assignment'
                            AND source_id = $2
                    `,
                    values: [
                        userId,
                        assignmentId,
                    ],
                });

            assert.equal(
                xpTransactionResult
                    .rows[0]
                    .transaction_count,
                1,
            );

            assert.equal(
                xpTransactionResult
                    .rows[0]
                    .awarded_xp,
                75,
            );

        } finally {
            try {
                if (userId) {
                    await databasePool.query({
                        text: `
                            DELETE FROM exercise_attempts
                            WHERE user_id = $1
                        `,
                        values: [userId],
                    });

                    await databasePool.query({
                        text: `
                            DELETE FROM
                                exercise_generation_logs
                            WHERE user_id = $1
                        `,
                        values: [userId],
                    });

                    await databasePool.query({
                        text: `
                            DELETE FROM exercises
                            WHERE created_by_user_id =
                                $1
                        `,
                        values: [userId],
                    });

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
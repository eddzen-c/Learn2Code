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
    'adaptive exercise lifecycle works with PostgreSQL',
    async () => {
        const email =
            `adaptive-${randomUUID()}@example.test`;

        const password =
            'Learn2Code-Adaptive-2026!';

        let userId = null;

        try {
            const registrationResponse =
                await request(app)
                    .post(
                        '/api/v1/auth/register',
                    )
                    .send({
                        fullName:
                            'Adaptive Student',
                        email,
                        password,
                    });

            assert.equal(
                registrationResponse.status,
                201,
            );

            userId =
                registrationResponse
                    .body
                    .data
                    .user
                    .id;

            const accessToken =
                registrationResponse
                    .body
                    .data
                    .accessToken;

            const missingDiagnosticResponse =
                await request(app)
                    .post(
                        '/api/v1/exercises/next',
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    )
                    .send({});

            assert.equal(
                missingDiagnosticResponse.status,
                409,
            );

            assert.equal(
                missingDiagnosticResponse
                    .body
                    .code,
                'DIAGNOSTIC_REQUIRED_FOR_EXERCISE',
            );

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

            const emptyResponse =
                await request(app)
                    .get(
                        '/api/v1/exercises/current',
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    );

            assert.equal(
                emptyResponse.status,
                200,
            );

            assert.equal(
                emptyResponse
                    .body
                    .data
                    .state,
                'none',
            );

            const generationResponse =
                await request(app)
                    .post(
                        '/api/v1/exercises/next',
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    )
                    .send({});

            assert.equal(
                generationResponse.status,
                201,
            );

            assert.equal(
                generationResponse
                    .body
                    .status,
                'success',
            );

            assert.equal(
                generationResponse
                    .body
                    .data
                    .created,
                true,
            );

            const generatedData =
                generationResponse
                    .body
                    .data;

            assert.equal(
                generatedData
                    .exercise
                    .topic
                    .id,
                3,
            );

            assert.equal(
                generatedData
                    .exercise
                    .difficulty
                    .id,
                2,
            );

            assert.equal(
                generatedData
                    .exercise
                    .language
                    .id,
                1,
            );

            assert.equal(
                generatedData
                    .exercise
                    .publicTestCases
                    .length,
                2,
            );

            assert.equal(
                'solutionCode'
                in generatedData.exercise,
                false,
            );

            const exerciseId =
                generatedData.exercise.id;

            const assignmentId =
                generatedData.assignment.id;

            const databaseResult =
                await databasePool.query({
                    text: `
                        SELECT
                            exercises.generation_source,
                            exercises.status,

                            (
                                SELECT COUNT(*)::INTEGER
                                FROM exercise_test_cases
                                WHERE exercise_id =
                                    exercises.id
                            ) AS test_case_count,

                            (
                                SELECT COUNT(*)::INTEGER
                                FROM exercise_test_cases
                                WHERE exercise_id =
                                    exercises.id
                                  AND is_hidden = TRUE
                            ) AS hidden_test_count,

                            (
                                SELECT COUNT(*)::INTEGER
                                FROM exercise_assignments
                                WHERE exercise_id =
                                    exercises.id
                                  AND user_id = $2
                            ) AS assignment_count,

                            (
                                SELECT COUNT(*)::INTEGER
                                FROM exercise_generation_logs
                                WHERE exercise_id =
                                    exercises.id
                                  AND user_id = $2
                                  AND success = TRUE
                            ) AS generation_log_count

                        FROM exercises
                        WHERE exercises.id = $1
                    `,
                    values: [
                        exerciseId,
                        userId,
                    ],
                });

            assert.equal(
                databaseResult.rows.length,
                1,
            );

            assert.equal(
                databaseResult
                    .rows[0]
                    .generation_source,
                'ai',
            );

            assert.equal(
                databaseResult.rows[0].status,
                'published',
            );

            assert.equal(
                databaseResult
                    .rows[0]
                    .test_case_count,
                3,
            );

            assert.equal(
                databaseResult
                    .rows[0]
                    .hidden_test_count,
                1,
            );

            assert.equal(
                databaseResult
                    .rows[0]
                    .assignment_count,
                1,
            );

            assert.equal(
                databaseResult
                    .rows[0]
                    .generation_log_count,
                1,
            );

            const repeatedResponse =
                await request(app)
                    .post(
                        '/api/v1/exercises/next',
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    )
                    .send({});

            assert.equal(
                repeatedResponse.status,
                200,
            );

            assert.equal(
                repeatedResponse
                    .body
                    .data
                    .created,
                false,
            );

            assert.equal(
                repeatedResponse
                    .body
                    .data
                    .exercise
                    .id,
                exerciseId,
            );

            assert.equal(
                repeatedResponse
                    .body
                    .data
                    .assignment
                    .id,
                assignmentId,
            );

            const currentResponse =
                await request(app)
                    .get(
                        '/api/v1/exercises/current',
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    );

            assert.equal(
                currentResponse.status,
                200,
            );

            assert.equal(
                currentResponse
                    .body
                    .data
                    .state,
                'assigned',
            );

            assert.equal(
                currentResponse
                    .body
                    .data
                    .exercise
                    .id,
                exerciseId,
            );

            const unauthorizedResponse =
                await request(app)
                    .post(
                        '/api/v1/exercises/next',
                    )
                    .send({});

            assert.equal(
                unauthorizedResponse.status,
                401,
            );
        } finally {
            try {
                if (userId) {
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
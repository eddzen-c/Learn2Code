import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import request from 'supertest';

import app from '../../src/app.js';

import {
    closeDatabaseConnection,
    databasePool,
} from '../../src/config/database.js';

import {
    submitExerciseAttempt,
} from '../../src/modules/exercises/services/submit-exercise-attempt.service.js';

import {
    ExerciseAssignmentUnavailableError,
    ExerciseEvaluationFailedError,
} from '../../src/modules/exercises/errors/exercise.errors.js';

import {
    evaluateExerciseSubmission,
} from '../../src/modules/exercises/services/exercise-evaluator.service.js';

test(
    'Docker persists results and hides private cases from the student',
    { timeout: 120_000 },
    async () => {
        const email = `docker-attempt-${randomUUID()}@example.test`;
        let userId = null;

        try {
            const registration = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    fullName: 'Docker Evaluation Student',
                    email,
                    password: 'Learn2Code-Docker-2026!',
                });

            assert.equal(
                registration.status,
                201,
                JSON.stringify(registration.body),
            );

            userId = registration.body.data.user.id;
            const accessToken = registration.body.data.accessToken;

            const onboarding = await request(app)
                .put('/api/v1/onboarding')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    languageId: 1,
                    selfAssessedDifficultyId: 2,
                    learningGoal: 'build_product',
                    weeklyTimeCommitment: 'five_to_ten',
                    learningStyle: 'practical',
                    technologyInterestKeys: [
                        'javascript',
                        'react',
                        'nodejs',
                    ],
                    projectIdea: 'Crear una aplicación web',
                });

            assert.equal(
                onboarding.status,
                200,
                JSON.stringify(onboarding.body),
            );

            const diagnostic = await databasePool.query({
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
            $1, 1, 1, 'completed',
            1, 1, 60, 2, NOW(), NOW()
          )
          RETURNING id
        `,
                values: [userId],
            });

            await databasePool.query({
                text: `
          INSERT INTO learning_profiles (
            user_id,
            current_difficulty_id,
            diagnostic_completed_at,
            last_diagnostic_assessment_id,
            updated_at
          )
          VALUES ($1, 2, NOW(), $2, NOW())
          ON CONFLICT (user_id)
          DO UPDATE SET
            current_difficulty_id = 2,
            diagnostic_completed_at = NOW(),
            last_diagnostic_assessment_id = $2,
            updated_at = NOW()
        `,
                values: [
                    userId,
                    diagnostic.rows[0].id,
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

            const generation = await request(app)
                .post('/api/v1/exercises/next')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({});

            assert.equal(
                generation.status,
                201,
                JSON.stringify(generation.body),
            );

            const exerciseId = generation.body.data.exercise.id;
            const assignmentId = generation.body.data.assignment.id;

            const exercise = await databasePool.query({
                text: `
          SELECT solution_code
          FROM exercises
          WHERE id = $1
        `,
                values: [exerciseId],
            });

            assert.equal(exercise.rows.length, 1);

            const cases = await databasePool.query({
                text: `
          SELECT id, is_hidden
          FROM exercise_test_cases
          WHERE exercise_id = $1
          ORDER BY position
        `,
                values: [exerciseId],
            });

            assert.equal(cases.rows.length, 3);

            const hiddenCases = cases.rows.filter(
                (item) => item.is_hidden,
            );

            const publicCases = cases.rows.filter(
                (item) => !item.is_hidden,
            );

            assert.equal(hiddenCases.length, 1);
            assert.equal(publicCases.length, 2);

            const submittedCode = `
${exercise.rows[0].solution_code}

// Entrega ejecutada por Docker.
      `;

            // Un fallo de infraestructura debe conservar el intento
            // sin calificación y permitir otro envío.
            await assert.rejects(
                () => submitExerciseAttempt({
                    userId,
                    assignmentId,
                    submittedCode,
                    evaluatorName: 'docker',
                    evaluate: async () => {
                        throw new Error('Simulated Docker infrastructure failure');
                    },
                }),
                ExerciseEvaluationFailedError,
            );

            const failedAttempts = await databasePool.query({
                text: `
          SELECT
            attempts.id,
            attempts.status,
            attempts.score,
            attempts.completed_at,
            (
              SELECT COUNT(*)::INTEGER
              FROM exercise_attempt_results results
              WHERE results.attempt_id = attempts.id
            ) AS result_count
          FROM exercise_attempts attempts
          WHERE attempts.assignment_id = $1
            AND attempts.user_id = $2
        `,
                values: [assignmentId, userId],
            });

            assert.equal(failedAttempts.rows.length, 1);
            assert.equal(failedAttempts.rows[0].status, 'failed');
            assert.equal(failedAttempts.rows[0].score, null);
            assert.notEqual(failedAttempts.rows[0].completed_at, null);
            assert.equal(failedAttempts.rows[0].result_count, 0);

            const rewardsBeforeRetry = await databasePool.query({
                text: `
          SELECT COUNT(*)::INTEGER AS total
          FROM xp_transactions
          WHERE user_id = $1
            AND source_type = 'exercise_assignment'
            AND source_id = $2
        `,
                values: [userId, assignmentId],
            });

            assert.equal(rewardsBeforeRetry.rows[0].total, 0);

            const result = await submitExerciseAttempt({
                userId,
                assignmentId,
                submittedCode,
                evaluatorName: 'docker',

                evaluate: async (parameters) => {
                    // Otra conexión debe ver la reserva ya confirmada.
                    const activeAttempts = await databasePool.query({
                        text: `
              SELECT id
              FROM exercise_attempts
              WHERE assignment_id = $1
                AND user_id = $2
                AND status = 'evaluating'
            `,
                        values: [assignmentId, userId],
                    });

                    assert.equal(activeAttempts.rows.length, 1);

                    // Otra transacción debe poder bloquear la asignación
                    // inmediatamente: la reserva ya liberó su bloqueo.
                    const lockClient = await databasePool.connect();

                    try {
                        await lockClient.query('BEGIN');

                        const unlockedAssignment = await lockClient.query({
                            text: `
                SELECT id
                FROM exercise_assignments
                WHERE id = $1
                  AND user_id = $2
                FOR UPDATE NOWAIT
              `,
                            values: [assignmentId, userId],
                        });

                        assert.equal(unlockedAssignment.rows.length, 1);
                    } finally {
                        try {
                            await lockClient.query('ROLLBACK');
                        } finally {
                            lockClient.release();
                        }
                    }

                    // Un segundo envío debe rechazarse antes de evaluar.
                    await assert.rejects(
                        () => submitExerciseAttempt({
                            userId,
                            assignmentId,
                            submittedCode,
                            evaluatorName: 'docker',
                            evaluate: async () => {
                                assert.fail('A second evaluator must not run');
                            },
                        }),
                        ExerciseAssignmentUnavailableError,
                    );

                    // Continúa la primera entrega con Docker real.
                    return evaluateExerciseSubmission(parameters);
                },
            });

            const attemptCounts = await databasePool.query({
                text: `
          SELECT
            COUNT(*)::INTEGER AS total,
            COUNT(*) FILTER (
              WHERE status = 'failed'
            )::INTEGER AS failed,
            COUNT(*) FILTER (
              WHERE status = 'completed'
            )::INTEGER AS completed,
            COUNT(*) FILTER (
              WHERE status = 'evaluating'
            )::INTEGER AS evaluating
          FROM exercise_attempts
          WHERE assignment_id = $1
            AND user_id = $2
        `,
                values: [assignmentId, userId],
            });

            assert.deepEqual(attemptCounts.rows[0], {
                total: 2,
                failed: 1,
                completed: 1,
                evaluating: 0,
            });

            assert.equal(result.evaluator.provider, 'docker');
            assert.equal(result.attempt.status, 'completed');
            assert.equal(result.attempt.passed, true);
            assert.equal(result.attempt.score, 100);
            assert.equal(result.attempt.testsPassed, 3);
            assert.equal(result.attempt.testsTotal, 3);
            assert.equal(result.assignment.status, 'completed');

            assert.equal(result.progress.applied, true);
            assert.equal(result.progress.xpAwarded, 75);

            assert.equal(result.results.length, 2);

            assert.deepEqual(
                result.results.map((item) => item.testCaseId).sort(),
                publicCases.map((item) => item.id).sort(),
            );

            assert.equal('solutionCode' in result, false);

            for (const item of result.results) {
                assert.equal(item.passed, true);
                assert.equal('expectedOutput' in item, false);
            }

            const storedAttempt = await databasePool.query({
                text: `
          SELECT
            status,
            passed,
            score,
            tests_passed,
            tests_total,
            completed_at
          FROM exercise_attempts
          WHERE id = $1
            AND user_id = $2
            AND assignment_id = $3
        `,
                values: [
                    result.attempt.id,
                    userId,
                    assignmentId,
                ],
            });

            assert.equal(storedAttempt.rows.length, 1);

            const saved = storedAttempt.rows[0];

            assert.equal(saved.status, 'completed');
            assert.equal(saved.passed, true);
            assert.equal(Number(saved.score), 100);
            assert.equal(saved.tests_passed, 3);
            assert.equal(saved.tests_total, 3);
            assert.notEqual(saved.completed_at, null);

            const storedResults = await databasePool.query({
                text: `
          SELECT test_case_id, passed, actual_output
          FROM exercise_attempt_results
          WHERE attempt_id = $1
        `,
                values: [result.attempt.id],
            });

            assert.equal(storedResults.rows.length, 3);

            assert.deepEqual(
                storedResults.rows.map((item) => item.test_case_id).sort(),
                cases.rows.map((item) => item.id).sort(),
            );

            for (const item of storedResults.rows) {
                assert.equal(item.passed, true);
                assert.equal(typeof item.actual_output, 'string');
            }

            const rewards = await databasePool.query({
                text: `
          SELECT
            COUNT(*)::INTEGER AS transaction_count,
            COALESCE(SUM(amount), 0)::INTEGER AS awarded_xp
          FROM xp_transactions
          WHERE user_id = $1
            AND source_type = 'exercise_assignment'
            AND source_id = $2
        `,
                values: [userId, assignmentId],
            });

            assert.equal(rewards.rows[0].transaction_count, 1);
            assert.equal(rewards.rows[0].awarded_xp, 75);
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
                DELETE FROM exercise_generation_logs
                WHERE user_id = $1
            `,
                        values: [userId],
                    });

                    await databasePool.query({
                        text: `
                DELETE FROM exercises
                WHERE created_by_user_id = $1
            `,
                        values: [userId],
                    });

                    await databasePool.query({
                        text: 'DELETE FROM users WHERE id = $1',
                        values: [userId],
                    });
                } else {
                    await databasePool.query({
                        text: 'DELETE FROM users WHERE email = $1',
                        values: [email],
                    });
                }
            } finally {
                await closeDatabaseConnection();
            }
        }
    },
);
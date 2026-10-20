import { databasePool } from '../../../config/database.js';

import {
    ExerciseAssignmentNotFoundError,
    ExerciseAssignmentUnavailableError,
    ExerciseEvaluationFailedError,
    ExerciseLanguageUnsupportedError,
} from '../errors/exercise.errors.js';

import {
    completeExerciseAttemptRecord,
    createExerciseAttemptRecord,
    createExerciseAttemptResultRecords,
    findEvaluatingExerciseAttemptRecord,
    findExerciseAssignmentForAttempt,
    markExerciseAssignmentCompleted,
    markExerciseAssignmentExpired,
    markExerciseAssignmentStarted,
    markExerciseAttemptFailed,
    markStaleExerciseAttemptsTimedOut,
} from '../repositories/exercise-attempt.repository.js';

import {
    evaluateExerciseSubmission,
} from './exercise-evaluator.service.js';

import {
    applyAdaptiveProgressFromExerciseCompletion,
} from './adaptive-progress.service.js';

const ACTIVE_ASSIGNMENT_STATUSES = new Set([
    'assigned',
    'started',
]);

const EVALUATION_STALE_AFTER_MS = 5 * 60 * 1000;

const createPublicTestResults = ({
    evaluationResults,
    testCases,
}) => {
    const casesById = new Map(
        testCases.map((item) => [item.id, item]),
    );

    const results = [];

    for (const result of evaluationResults) {
        const testCase = casesById.get(result.testCaseId);

        if (!testCase || testCase.isHidden) {
            continue;
        }

        results.push(Object.freeze({
            testCaseId: result.testCaseId,
            position: testCase.position,
            passed: result.passed,
            actualOutput: result.actualOutput,
            errorMessage: result.errorMessage,
            executionTimeMs: result.executionTimeMs,
        }));
    }

    return Object.freeze(results);
};

const withAttemptTransaction = async (pool, operation) => {
    const client = await pool.connect();
    let transactionOpen = false;

    try {
        await client.query('BEGIN');
        transactionOpen = true;

        const result = await operation(client);

        await client.query('COMMIT');
        transactionOpen = false;

        return result;
    } catch (error) {
        if (transactionOpen) {
            try {
                await client.query('ROLLBACK');
            } catch {
                // Preserve the original error.
            }
        }

        throw error;
    } finally {
        client.release();
    }
};

export const submitExerciseAttempt = async ({
    userId,
    assignmentId,
    submittedCode,
    now = new Date(),
    clock = () => new Date(),
    evaluatorName = 'mock',
    evaluate = evaluateExerciseSubmission,
    pool = databasePool,
    applyProgress = applyAdaptiveProgressFromExerciseCompletion,
}) => {
    const completionTime = () => new Date(
        Math.max(now.getTime(), clock().getTime()),
    );

    let reservation;

    try {
        reservation = await withAttemptTransaction(
            pool,
            async (client) => {
                const context = await findExerciseAssignmentForAttempt({
                    assignmentId,
                    userId,
                    forUpdate: true,
                    client,
                });

                if (!context) {
                    throw new ExerciseAssignmentNotFoundError();
                }

                if (!ACTIVE_ASSIGNMENT_STATUSES.has(
                    context.assignment.status,
                )) {
                    throw new ExerciseAssignmentUnavailableError();
                }

                const expiresAt = context.assignment.expiresAt;

                if (
                    expiresAt !== null
                    && expiresAt.getTime() <= now.getTime()
                ) {
                    await markExerciseAssignmentExpired({
                        assignmentId,
                        client,
                    });

                    return null;
                }

                if (
                    evaluatorName === 'docker'
                    && context.exercise.languageId !== 1
                ) {
                    throw new ExerciseLanguageUnsupportedError();
                }

                await markStaleExerciseAttemptsTimedOut({
                    assignmentId,
                    userId,
                    attemptedBefore: new Date(
                        now.getTime() - EVALUATION_STALE_AFTER_MS,
                    ),
                    completedAt: now,
                    client,
                });

                const activeAttempt =
                    await findEvaluatingExerciseAttemptRecord({
                        assignmentId,
                        userId,
                        client,
                    });

                if (activeAttempt) {
                    throw new ExerciseAssignmentUnavailableError();
                }

                const assignment = await markExerciseAssignmentStarted({
                    assignmentId,
                    startedAt: now,
                    client,
                });

                if (!assignment) {
                    throw new ExerciseAssignmentUnavailableError();
                }

                const attempt = await createExerciseAttemptRecord({
                    userId,
                    assignmentId,
                    exerciseId: context.exercise.id,
                    languageId: context.exercise.languageId,
                    submittedCode,
                    attemptedAt: now,
                    client,
                });

                if (!attempt) {
                    throw new ExerciseEvaluationFailedError();
                }

                return { context, attempt };
            },
        );
    } catch (error) {
        if (
            error.code === '23505'
            && error.constraint === 'uq_attempts_evaluating_assignment'
        ) {
            throw new ExerciseAssignmentUnavailableError();
        }

        throw error;
    }

    if (!reservation) {
        throw new ExerciseAssignmentUnavailableError();
    }

    try {
        let evaluation;

        try {
            evaluation = await evaluate({
                submittedCode,
                evaluatorName,
                languageId: reservation.context.exercise.languageId,
                solutionCode: reservation.context.exercise.solutionCode,
                testCases: reservation.context.exercise.testCases,
            });
        } catch (error) {
            if (error instanceof ExerciseEvaluationFailedError) {
                throw error;
            }

            const failure = new ExerciseEvaluationFailedError();
            failure.cause = error;
            throw failure;
        }

        return await withAttemptTransaction(pool, async (client) => {
            const context = await findExerciseAssignmentForAttempt({
                assignmentId,
                userId,
                forUpdate: true,
                client,
            });

            if (!context) {
                throw new ExerciseAssignmentNotFoundError();
            }

            if (
                !ACTIVE_ASSIGNMENT_STATUSES.has(context.assignment.status)
                || context.exercise.id !== reservation.context.exercise.id
            ) {
                throw new ExerciseAssignmentUnavailableError();
            }

            const activeAttempt =
                await findEvaluatingExerciseAttemptRecord({
                    assignmentId,
                    userId,
                    client,
                });

            if (activeAttempt?.id !== reservation.attempt.id) {
                throw new ExerciseAssignmentUnavailableError();
            }

            const completedAt = completionTime();

            await createExerciseAttemptResultRecords({
                attemptId: reservation.attempt.id,
                results: evaluation.results,
                client,
            });

            const attempt = await completeExerciseAttemptRecord({
                attemptId: reservation.attempt.id,
                passed: evaluation.passed,
                score: evaluation.score,
                testsPassed: evaluation.testsPassed,
                testsTotal: evaluation.testsTotal,
                executionTimeMs: evaluation.executionTimeMs,
                feedback: evaluation.feedback,
                completedAt,
                client,
            });

            if (!attempt) {
                throw new ExerciseEvaluationFailedError();
            }

            let assignment = context.assignment;
            let progress = null;

            if (evaluation.passed) {
                assignment = await markExerciseAssignmentCompleted({
                    assignmentId,
                    completedAt,
                    client,
                });

                if (!assignment) {
                    throw new ExerciseAssignmentUnavailableError();
                }

                progress = await applyProgress({
                    userId,
                    assignmentId,
                    exerciseId: reservation.context.exercise.id,
                    score: evaluation.score,
                    completedAt,
                    client,
                });
            }

            return Object.freeze({
                attempt: Object.freeze({
                    id: attempt.id,
                    status: attempt.status,
                    passed: attempt.passed,
                    score: attempt.score,
                    testsPassed: attempt.testsPassed,
                    testsTotal: attempt.testsTotal,
                    executionTimeMs: attempt.executionTimeMs,
                    feedback: attempt.feedback,
                    attemptedAt: attempt.attemptedAt,
                    completedAt: attempt.completedAt,
                }),

                assignment: Object.freeze({
                    id: assignment.id,
                    status: assignment.status,
                    startedAt: assignment.startedAt,
                    completedAt: assignment.completedAt,
                }),

                evaluator: Object.freeze({
                    provider: evaluation.provider,
                    name: evaluation.evaluator,
                }),

                progress,

                results: createPublicTestResults({
                    evaluationResults: evaluation.results,
                    testCases: reservation.context.exercise.testCases,
                }),
            });
        });
    } catch (error) {
        try {
            await withAttemptTransaction(pool, async (client) => {
                // Use the same lock order as reservation and completion.
                await findExerciseAssignmentForAttempt({
                    assignmentId,
                    userId,
                    forUpdate: true,
                    client,
                });

                await markExerciseAttemptFailed({
                    attemptId: reservation.attempt.id,
                    assignmentId,
                    userId,
                    completedAt: completionTime(),
                    client,
                });
            });
        } catch (cleanupError) {
            const failure = new ExerciseEvaluationFailedError();

            failure.cause = new AggregateError(
                [error, cleanupError],
                'Evaluation failed and its pending attempt could not be closed',
            );

            throw failure;
        }

        throw error;
    }
};
import {
    databasePool,
} from '../../../config/database.js';

import {
    ExerciseAssignmentNotFoundError,
    ExerciseAssignmentUnavailableError,
    ExerciseEvaluationFailedError,
} from '../errors/exercise.errors.js';

import {
    completeExerciseAttemptRecord,
    createExerciseAttemptRecord,
    createExerciseAttemptResultRecords,
    findExerciseAssignmentForAttempt,
    markExerciseAssignmentCompleted,
    markExerciseAssignmentExpired,
    markExerciseAssignmentStarted,
} from '../repositories/exercise-attempt.repository.js';

import {
    evaluateExerciseSubmission,
} from './exercise-evaluator.service.js';

const ACTIVE_ASSIGNMENT_STATUSES =
    new Set([
        'assigned',
        'started',
    ]);

const createPublicTestResults = ({
    evaluationResults,
    testCases,
}) => {
    const testCasesById = new Map(
        testCases.map(
            (testCase) => [
                testCase.id,
                testCase,
            ],
        ),
    );

    const publicResults = [];

    for (
        const evaluationResult
        of evaluationResults
    ) {
        const testCase =
            testCasesById.get(
                evaluationResult.testCaseId,
            );

        if (
            !testCase
            || testCase.isHidden
        ) {
            continue;
        }

        publicResults.push(
            Object.freeze({
                testCaseId:
                    evaluationResult.testCaseId,
                position:
                    testCase.position,
                passed:
                    evaluationResult.passed,
                actualOutput:
                    evaluationResult.actualOutput,
                errorMessage:
                    evaluationResult.errorMessage,
                executionTimeMs:
                    evaluationResult.executionTimeMs,
            }),
        );
    }

    return Object.freeze(publicResults);
};

export const submitExerciseAttempt =
    async ({
        userId,
        assignmentId,
        submittedCode,
        now = new Date(),
        evaluatorName = 'mock',
        pool = databasePool,
    }) => {
        const client = await pool.connect();

        let transactionCompleted = false;

        try {
            await client.query('BEGIN');

            const assignmentContext =
                await findExerciseAssignmentForAttempt({
                    assignmentId,
                    userId,
                    forUpdate: true,
                    client,
                });

            if (!assignmentContext) {
                throw new ExerciseAssignmentNotFoundError();
            }

            if (
                !ACTIVE_ASSIGNMENT_STATUSES.has(
                    assignmentContext
                        .assignment.status,
                )
            ) {
                throw new ExerciseAssignmentUnavailableError();
            }

            const expiresAt =
                assignmentContext
                    .assignment.expiresAt;

            if (
                expiresAt !== null
                && expiresAt.getTime()
                <= now.getTime()
            ) {
                await markExerciseAssignmentExpired({
                    assignmentId,
                    client,
                });

                await client.query('COMMIT');
                transactionCompleted = true;

                throw new ExerciseAssignmentUnavailableError();
            }

            const startedAssignment =
                await markExerciseAssignmentStarted({
                    assignmentId,
                    startedAt: now,
                    client,
                });

            if (!startedAssignment) {
                throw new ExerciseAssignmentUnavailableError();
            }

            const attempt =
                await createExerciseAttemptRecord({
                    userId,
                    exerciseId:
                        assignmentContext.exercise.id,
                    assignmentId,
                    languageId:
                        assignmentContext
                            .exercise.languageId,
                    submittedCode,
                    attemptedAt: now,
                    client,
                });

            if (!attempt) {
                throw new ExerciseEvaluationFailedError();
            }

            let evaluation;

            try {
                evaluation =
                    await evaluateExerciseSubmission({
                        submittedCode,
                        solutionCode:
                            assignmentContext
                                .exercise.solutionCode,
                        testCases:
                            assignmentContext
                                .exercise.testCases,
                        evaluatorName,
                    });
            } catch (error) {
                if (
                    error
                    instanceof ExerciseEvaluationFailedError
                ) {
                    throw error;
                }

                throw new ExerciseEvaluationFailedError();
            }

            await createExerciseAttemptResultRecords({
                attemptId: attempt.id,
                results: evaluation.results,
                client,
            });

            const completedAttempt =
                await completeExerciseAttemptRecord({
                    attemptId: attempt.id,
                    passed: evaluation.passed,
                    score: evaluation.score,
                    testsPassed:
                        evaluation.testsPassed,
                    testsTotal:
                        evaluation.testsTotal,
                    executionTimeMs:
                        evaluation.executionTimeMs,
                    feedback:
                        evaluation.feedback,
                    completedAt: now,
                    client,
                });

            if (!completedAttempt) {
                throw new ExerciseEvaluationFailedError();
            }

            let assignmentState =
                startedAssignment;

            if (evaluation.passed) {
                assignmentState =
                    await markExerciseAssignmentCompleted({
                        assignmentId,
                        completedAt: now,
                        client,
                    });

                if (!assignmentState) {
                    throw new ExerciseAssignmentUnavailableError();
                }
            }

            await client.query('COMMIT');
            transactionCompleted = true;

            return Object.freeze({
                attempt: Object.freeze({
                    id:
                        completedAttempt.id,
                    status:
                        completedAttempt.status,
                    passed:
                        completedAttempt.passed,
                    score:
                        completedAttempt.score,
                    testsPassed:
                        completedAttempt
                            .testsPassed,
                    testsTotal:
                        completedAttempt
                            .testsTotal,
                    executionTimeMs:
                        completedAttempt
                            .executionTimeMs,
                    feedback:
                        completedAttempt.feedback,
                    attemptedAt:
                        completedAttempt
                            .attemptedAt,
                    completedAt:
                        completedAttempt
                            .completedAt,
                }),

                assignment: Object.freeze({
                    id:
                        assignmentState.id,
                    status:
                        assignmentState.status,
                    startedAt:
                        assignmentState
                            .startedAt,
                    completedAt:
                        assignmentState
                            .completedAt,
                }),

                evaluator: Object.freeze({
                    provider:
                        evaluation.provider,
                    name:
                        evaluation.evaluator,
                }),

                results:
                    createPublicTestResults({
                        evaluationResults:
                            evaluation.results,
                        testCases:
                            assignmentContext
                                .exercise.testCases,
                    }),
            });
        } catch (error) {
            if (!transactionCompleted) {
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
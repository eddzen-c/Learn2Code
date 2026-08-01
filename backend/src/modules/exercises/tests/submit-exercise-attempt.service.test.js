import assert from 'node:assert/strict';
import {
    randomUUID,
} from 'node:crypto';
import test from 'node:test';

import {
    ExerciseAssignmentNotFoundError,
    ExerciseAssignmentUnavailableError,
    ExerciseEvaluationFailedError,
} from '../errors/exercise.errors.js';

import {
    submitExerciseAttempt,
} from '../services/submit-exercise-attempt.service.js';

const createTestContext = ({
    assignmentStatus = 'assigned',
    expiresAt =
    new Date('2026-08-01T12:00:00.000Z'),
    missingAssignment = false,
} = {}) => {
    const ids = {
        userId: randomUUID(),
        exerciseId: randomUUID(),
        assignmentId: randomUUID(),
        attemptId: randomUUID(),
        visibleTestCaseId: randomUUID(),
        hiddenTestCaseId: randomUUID(),
    };

    const now =
        new Date('2026-07-30T12:00:00.000Z');

    const solutionCode =
        'function sum(a, b) {\n    return a + b;\n}';

    const queryLog = [];

    const state = {
        released: false,
    };

    const client = {
        query: async (query) => {
            const text =
                typeof query === 'string'
                    ? query
                    : query.text;

            const values =
                typeof query === 'string'
                    ? []
                    : query.values;

            queryLog.push({
                text,
                values,
            });

            if (
                text === 'BEGIN'
                || text === 'COMMIT'
                || text === 'ROLLBACK'
            ) {
                return {
                    rows: [],
                };
            }

            if (
                text.includes(
                    'FROM exercise_assignments',
                )
            ) {
                if (missingAssignment) {
                    return {
                        rows: [],
                    };
                }

                return {
                    rows: [
                        {
                            assignment_id:
                                ids.assignmentId,
                            user_id: ids.userId,
                            exercise_id:
                                ids.exerciseId,
                            assignment_status:
                                assignmentStatus,
                            assigned_at:
                                new Date(
                                    '2026-07-29T12:00:00.000Z',
                                ),
                            started_at: null,
                            completed_at: null,
                            expires_at:
                                expiresAt,
                            exercise_title:
                                'Suma personalizada',
                            language_id: 1,
                            solution_code:
                                solutionCode,
                            test_cases: [
                                {
                                    id:
                                        ids.visibleTestCaseId,
                                    position: 1,
                                    input: {
                                        a: 1,
                                        b: 2,
                                    },
                                    expectedOutput: 3,
                                    isHidden: false,
                                    weight: 50,
                                },
                                {
                                    id:
                                        ids.hiddenTestCaseId,
                                    position: 2,
                                    input: {
                                        a: 2,
                                        b: 3,
                                    },
                                    expectedOutput: 5,
                                    isHidden: true,
                                    weight: 50,
                                },
                            ],
                        },
                    ],
                };
            }

            if (
                text.includes(
                    'UPDATE exercise_assignments',
                )
                && text.includes(
                    "status = 'started'",
                )
            ) {
                return {
                    rows: [
                        {
                            id: ids.assignmentId,
                            status: 'started',
                            started_at: now,
                            completed_at: null,
                            expires_at:
                                expiresAt,
                        },
                    ],
                };
            }

            if (
                text.includes(
                    'INSERT INTO exercise_attempts',
                )
            ) {
                return {
                    rows: [
                        {
                            id: ids.attemptId,
                            user_id: ids.userId,
                            exercise_id:
                                ids.exerciseId,
                            assignment_id:
                                ids.assignmentId,
                            language_id: 1,
                            submitted_code:
                                values[4],
                            status:
                                'evaluating',
                            passed: null,
                            score: null,
                            tests_passed: null,
                            tests_total: null,
                            execution_time_ms:
                                null,
                            feedback: null,
                            attempted_at: now,
                            completed_at: null,
                        },
                    ],
                };
            }

            if (
                text.includes(
                    'INSERT INTO exercise_attempt_results',
                )
            ) {
                return {
                    rows: [
                        {
                            id: randomUUID(),
                            attempt_id:
                                ids.attemptId,
                            test_case_id:
                                values[1],
                            passed: values[2],
                            actual_output:
                                values[3],
                            error_message:
                                values[4],
                            execution_time_ms:
                                values[5],
                            created_at: now,
                        },
                    ],
                };
            }

            if (
                text.includes(
                    'UPDATE exercise_attempts',
                )
            ) {
                return {
                    rows: [
                        {
                            id: ids.attemptId,
                            user_id: ids.userId,
                            exercise_id:
                                ids.exerciseId,
                            assignment_id:
                                ids.assignmentId,
                            language_id: 1,
                            submitted_code:
                                solutionCode,
                            status: 'completed',
                            passed: values[1],
                            score:
                                String(values[2]),
                            tests_passed:
                                values[3],
                            tests_total:
                                values[4],
                            execution_time_ms:
                                values[5],
                            feedback:
                                values[6],
                            attempted_at: now,
                            completed_at:
                                values[7],
                        },
                    ],
                };
            }

            if (
                text.includes(
                    'UPDATE exercise_assignments',
                )
                && text.includes(
                    "status = 'completed'",
                )
            ) {
                return {
                    rows: [
                        {
                            id: ids.assignmentId,
                            status: 'completed',
                            started_at: now,
                            completed_at: now,
                            expires_at:
                                expiresAt,
                        },
                    ],
                };
            }
            if (
                text.includes(
                    'UPDATE exercise_assignments',
                )
                && text.includes(
                    "status = 'expired'",
                )
            ) {
                return {
                    rows: [
                        {
                            id: ids.assignmentId,
                            status: 'expired',
                            started_at: null,
                            completed_at: null,
                            expires_at:
                                expiresAt,
                        },
                    ],
                };
            }

            throw new Error(
                `Unexpected query: ${text}`,
            );
        },

        release: () => {
            state.released = true;
        },
    };

    return {
        ids,
        now,
        solutionCode,
        queryLog,
        state,

        pool: {
            connect: async () => client,
        },
    };
};

test(
    'submitExerciseAttempt completes a passing assignment',
    async () => {
        const context =
            createTestContext();

        const progressResult =
            Object.freeze({
                applied: true,
                xpAwarded: 75,
            });

        let progressParameters = null;

        const result =
            await submitExerciseAttempt({
                userId:
                    context.ids.userId,
                assignmentId:
                    context.ids.assignmentId,
                submittedCode:
                    context.solutionCode,
                now: context.now,
                pool: context.pool,

                applyProgress:
                    async (parameters) => {
                        progressParameters =
                            parameters;

                        return progressResult;
                    },
            });

        assert.equal(
            progressParameters.userId,
            context.ids.userId,
        );

        assert.equal(
            progressParameters.assignmentId,
            context.ids.assignmentId,
        );

        assert.equal(
            progressParameters.exerciseId,
            context.ids.exerciseId,
        );

        assert.equal(
            progressParameters.score,
            100,
        );

        assert.equal(
            progressParameters.completedAt,
            context.now,
        );

        assert.equal(
            result.progress,
            progressResult,
        );

        assert.equal(
            result.attempt.passed,
            true,
        );

        assert.equal(
            result.attempt.score,
            100,
        );

        assert.equal(
            result.assignment.status,
            'completed',
        );

        assert.equal(
            result.results.length,
            1,
        );

        assert.equal(
            result.results[0].testCaseId,
            context.ids.visibleTestCaseId,
        );

        assert.equal(
            result.evaluator.provider,
            'mock',
        );

        assert.equal(
            context.queryLog.at(-1).text,
            'COMMIT',
        );

        assert.equal(
            context.state.released,
            true,
        );
    },
);

test(
    'submitExerciseAttempt keeps a failed assignment started',
    async () => {
        const context =
            createTestContext();

        let progressApplied = false;

        const result =
            await submitExerciseAttempt({
                userId:
                    context.ids.userId,
                assignmentId:
                    context.ids.assignmentId,
                submittedCode:
                    'function sum() { return 0; }',
                now: context.now,
                pool: context.pool,
                applyProgress:
                    async () => {
                        progressApplied = true;

                        return null;
                    },
            });

        assert.equal(
            progressApplied,
            false,
        );

        assert.equal(
            result.progress,
            null,
        );

        assert.equal(
            result.attempt.passed,
            false,
        );

        assert.equal(
            result.attempt.score,
            0,
        );

        assert.equal(
            result.assignment.status,
            'started',
        );

        assert.equal(
            context.queryLog.some(
                ({ text }) => (
                    text.includes(
                        'UPDATE exercise_assignments',
                    )
                    && text.includes(
                        "status = 'completed'",
                    )
                ),
            ),
            false,
        );
    },
);

test(
    'submitExerciseAttempt rejects a missing assignment',
    async () => {
        const context =
            createTestContext({
                missingAssignment: true,
            });

        await assert.rejects(
            () => submitExerciseAttempt({
                userId:
                    context.ids.userId,
                assignmentId:
                    context.ids.assignmentId,
                submittedCode:
                    context.solutionCode,
                now: context.now,
                pool: context.pool,
            }),
            ExerciseAssignmentNotFoundError,
        );

        assert.equal(
            context.queryLog.at(-1).text,
            'ROLLBACK',
        );

        assert.equal(
            context.state.released,
            true,
        );
    },
);

test(
    'submitExerciseAttempt expires an outdated assignment',
    async () => {
        const context =
            createTestContext({
                expiresAt:
                    new Date(
                        '2026-07-30T11:00:00.000Z',
                    ),
            });

        await assert.rejects(
            () => submitExerciseAttempt({
                userId:
                    context.ids.userId,
                assignmentId:
                    context.ids.assignmentId,
                submittedCode:
                    context.solutionCode,
                now: context.now,
                pool: context.pool,
            }),
            ExerciseAssignmentUnavailableError,
        );

        assert.equal(
            context.queryLog.some(
                ({ text }) => (
                    text.includes(
                        "status = 'expired'",
                    )
                ),
            ),
            true,
        );

        assert.equal(
            context.queryLog.at(-1).text,
            'COMMIT',
        );
    },
);

test(
    'submitExerciseAttempt rejects a completed assignment',
    async () => {
        const context =
            createTestContext({
                assignmentStatus:
                    'completed',
            });

        await assert.rejects(
            () => submitExerciseAttempt({
                userId:
                    context.ids.userId,
                assignmentId:
                    context.ids.assignmentId,
                submittedCode:
                    context.solutionCode,
                now: context.now,
                pool: context.pool,
            }),
            ExerciseAssignmentUnavailableError,
        );

        assert.equal(
            context.queryLog.at(-1).text,
            'ROLLBACK',
        );
    },
);

test(
    'submitExerciseAttempt rolls back when the evaluator is unavailable',
    async () => {
        const context =
            createTestContext();

        await assert.rejects(
            () => submitExerciseAttempt({
                userId:
                    context.ids.userId,
                assignmentId:
                    context.ids.assignmentId,
                submittedCode:
                    context.solutionCode,
                evaluatorName:
                    'unavailable',
                now: context.now,
                pool: context.pool,
            }),
            ExerciseEvaluationFailedError,
        );

        assert.equal(
            context.queryLog.at(-1).text,
            'ROLLBACK',
        );

        assert.equal(
            context.state.released,
            true,
        );
    },
);

test(
    'submitExerciseAttempt rolls back when the progress update fails',
    async () => {
        const context =
            createTestContext();

        const progressError =
            new Error(
                'Progress update failed',
            );

        await assert.rejects(
            () => submitExerciseAttempt({
                userId:
                    context.ids.userId,
                assignmentId:
                    context.ids.assignmentId,
                submittedCode:
                    context.solutionCode,
                now: context.now,
                pool: context.pool,

                applyProgress:
                    async () => {
                        throw progressError;
                    },
            }),
            progressError,
        );

        assert.equal(
            context.queryLog.at(-1).text,
            'ROLLBACK',
        );

        assert.equal(
            context.queryLog.some(
                ({ text }) => (
                    text === 'COMMIT'
                ),
            ),
            false,
        );
    },
);
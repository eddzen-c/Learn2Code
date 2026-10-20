import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import {
    ExerciseAssignmentNotFoundError,
    ExerciseAssignmentUnavailableError,
    ExerciseEvaluationFailedError,
    ExerciseLanguageUnsupportedError,
} from '../errors/exercise.errors.js';

import {
    submitExerciseAttempt,
} from '../services/submit-exercise-attempt.service.js';

import {
    evaluateExerciseSubmission,
} from '../services/exercise-evaluator.service.js';

const createTestContext = ({
    assignmentStatus = 'assigned',
    languageId = 1,
    expiresAt = new Date('2026-08-01T12:00:00.000Z'),
    missingAssignment = false,
} = {}) => {
    const ids = Object.fromEntries([
        'userId',
        'exerciseId',
        'assignmentId',
        'attemptId',
        'visibleTestCaseId',
        'hiddenTestCaseId',
    ].map((key) => [key, randomUUID()]));

    const now = new Date('2026-07-30T12:00:00.000Z');

    const solutionCode =
        'function sum(a, b) {\n    return a + b;\n}';

    const queryLog = [];

    const state = {
        released: false,
        releaseCount: 0,
        transactionOpen: false,
        assignmentStatus,
        startedAt: null,
        completedAt: null,
        attempt: null,
        resultCount: 0,
        staleAttempts: 0,
    };

    const dataKeys = [
        'assignmentStatus',
        'startedAt',
        'completedAt',
        'attempt',
        'resultCount',
        'staleAttempts',
    ];

    let snapshot;

    const rows = (...items) => ({ rows: items });

    const assignmentRow = () => ({
        id: ids.assignmentId,
        status: state.assignmentStatus,
        started_at: state.startedAt,
        completed_at: state.completedAt,
        expires_at: expiresAt,
    });

    const client = {
        query: async (query) => {
            const text = typeof query === 'string' ? query : query.text;
            const values = typeof query === 'string' ? [] : query.values;

            queryLog.push({ text, values });

            if (text === 'BEGIN') {
                assert.equal(state.transactionOpen, false);

                snapshot = structuredClone(Object.fromEntries(
                    dataKeys.map((key) => [key, state[key]]),
                ));

                state.transactionOpen = true;
                state.released = false;

                return rows();
            }

            if (text === 'COMMIT' || text === 'ROLLBACK') {
                assert.equal(state.transactionOpen, true);

                if (text === 'ROLLBACK') {
                    Object.assign(state, snapshot);
                }

                state.transactionOpen = false;
                return rows();
            }

            if (text.includes('FROM exercise_assignments')) {
                if (missingAssignment) {
                    return rows();
                }

                return rows({
                    assignment_id: ids.assignmentId,
                    user_id: ids.userId,
                    exercise_id: ids.exerciseId,
                    assignment_status: state.assignmentStatus,
                    assigned_at: new Date('2026-07-29T12:00:00.000Z'),
                    started_at: state.startedAt,
                    completed_at: state.completedAt,
                    expires_at: expiresAt,
                    exercise_title: 'Suma personalizada',
                    language_id: languageId,
                    solution_code: solutionCode,
                    test_cases: [
                        {
                            id: ids.visibleTestCaseId,
                            position: 1,
                            input: { a: 1, b: 2 },
                            expectedOutput: 3,
                            isHidden: false,
                            weight: 50,
                        },
                        {
                            id: ids.hiddenTestCaseId,
                            position: 2,
                            input: { a: 2, b: 3 },
                            expectedOutput: 5,
                            isHidden: true,
                            weight: 50,
                        },
                    ],
                });
            }

            if (text.includes('FROM exercise_attempts')) {
                return state.attempt?.status === 'evaluating'
                    ? rows(state.attempt)
                    : rows();
            }

            if (text.includes('INSERT INTO exercise_attempts')) {
                state.attempt = {
                    id: ids.attemptId,
                    user_id: ids.userId,
                    exercise_id: ids.exerciseId,
                    assignment_id: ids.assignmentId,
                    language_id: languageId,
                    submitted_code: values[4],
                    status: 'evaluating',
                    passed: null,
                    score: null,
                    tests_passed: null,
                    tests_total: null,
                    execution_time_ms: null,
                    feedback: null,
                    attempted_at: now,
                    completed_at: null,
                };

                return rows(state.attempt);
            }

            if (text.includes('INSERT INTO exercise_attempt_results')) {
                state.resultCount += 1;

                return rows({
                    id: randomUUID(),
                    attempt_id: values[0],
                    test_case_id: values[1],
                    passed: values[2],
                    actual_output: values[3],
                    error_message: values[4],
                    execution_time_ms: values[5],
                    created_at: now,
                });
            }

            if (text.includes('UPDATE exercise_attempts')) {
                if (state.attempt?.status !== 'evaluating') {
                    return rows();
                }

                if (text.includes("status = 'timed_out'")) {
                    if (state.attempt.attempted_at > values[2]) {
                        return rows();
                    }

                    state.staleAttempts += 1;

                    state.attempt = {
                        ...state.attempt,
                        status: 'timed_out',
                        completed_at: values[3],
                    };
                } else if (text.includes("status = 'failed'")) {
                    if (state.attempt.id !== values[0]) {
                        return rows();
                    }

                    state.attempt = {
                        ...state.attempt,
                        status: 'failed',
                        completed_at: values[3],
                    };
                } else {
                    if (state.attempt.id !== values[0]) {
                        return rows();
                    }

                    state.attempt = {
                        ...state.attempt,
                        status: 'completed',
                        passed: values[1],
                        score: String(values[2]),
                        tests_passed: values[3],
                        tests_total: values[4],
                        execution_time_ms: values[5],
                        feedback: values[6],
                        completed_at: values[7],
                    };
                }

                return rows(state.attempt);
            }

            if (text.includes('UPDATE exercise_assignments')) {
                if (text.includes("status = 'started'")) {
                    state.assignmentStatus = 'started';
                    state.startedAt ??= values[1];
                } else if (text.includes("status = 'completed'")) {
                    state.assignmentStatus = 'completed';
                    state.completedAt = values[1];
                } else if (text.includes("status = 'expired'")) {
                    state.assignmentStatus = 'expired';
                }

                return rows(assignmentRow());
            }

            throw new Error(`Unexpected query: ${text}`);
        },

        release: () => {
            assert.equal(state.transactionOpen, false);
            state.released = true;
            state.releaseCount += 1;
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

const submit = (context, options = {}) => submitExerciseAttempt({
    userId: context.ids.userId,
    assignmentId: context.ids.assignmentId,
    submittedCode: context.solutionCode,
    now: context.now,
    pool: context.pool,
    applyProgress: async () => ({
        applied: true,
        xpAwarded: 75,
    }),
    ...options,
});

const transactionCommands = (context) => context.queryLog
    .filter(({ text }) => [
        'BEGIN',
        'COMMIT',
        'ROLLBACK',
    ].includes(text))
    .map(({ text }) => text);

test('submitExerciseAttempt completes a passing assignment', async () => {
    const context = createTestContext();
    let progressParameters;

    const progress = {
        applied: true,
        xpAwarded: 75,
    };

    const result = await submit(context, {
        applyProgress: async (parameters) => {
            progressParameters = parameters;
            return progress;
        },
    });

    assert.equal(result.attempt.passed, true);
    assert.equal(result.attempt.score, 100);
    assert.equal(result.assignment.status, 'completed');
    assert.equal(result.evaluator.provider, 'mock');
    assert.equal(result.progress, progress);
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0].testCaseId, context.ids.visibleTestCaseId);

    assert.equal(progressParameters.userId, context.ids.userId);
    assert.equal(progressParameters.assignmentId, context.ids.assignmentId);
    assert.equal(progressParameters.exerciseId, context.ids.exerciseId);
    assert.equal(progressParameters.score, 100);
    assert.equal(progressParameters.completedAt, result.attempt.completedAt);

    assert.deepEqual(transactionCommands(context), [
        'BEGIN', 'COMMIT', 'BEGIN', 'COMMIT',
    ]);

    assert.equal(context.state.releaseCount, 2);
});

test('submitExerciseAttempt keeps a failed assignment started', async () => {
    const context = createTestContext();
    let progressApplied = false;

    const result = await submit(context, {
        submittedCode: 'function sum() { return 0; }',
        applyProgress: async () => {
            progressApplied = true;
        },
    });

    assert.equal(progressApplied, false);
    assert.equal(result.progress, null);
    assert.equal(result.attempt.passed, false);
    assert.equal(result.attempt.score, 0);
    assert.equal(result.attempt.status, 'completed');
    assert.equal(result.assignment.status, 'started');
});

for (const scenario of [
    {
        name: 'missing',
        options: { missingAssignment: true },
        error: ExerciseAssignmentNotFoundError,
        end: 'ROLLBACK',
    },
    {
        name: 'expired',
        options: {
            expiresAt: new Date('2026-07-30T11:00:00.000Z'),
        },
        error: ExerciseAssignmentUnavailableError,
        end: 'COMMIT',
    },
    {
        name: 'completed',
        options: { assignmentStatus: 'completed' },
        error: ExerciseAssignmentUnavailableError,
        end: 'ROLLBACK',
    },
]) {
    test(`submitExerciseAttempt rejects a ${scenario.name} assignment`, async () => {
        const context = createTestContext(scenario.options);

        await assert.rejects(
            () => submit(context),
            scenario.error,
        );

        assert.equal(context.queryLog.at(-1).text, scenario.end);
        assert.equal(context.state.released, true);
        assert.equal(context.state.attempt, null);

        if (scenario.name === 'expired') {
            assert.equal(context.state.assignmentStatus, 'expired');
        }
    });
}

test('submitExerciseAttempt records a failure when the evaluator is unavailable', async () => {
    const context = createTestContext();

    await assert.rejects(
        () => submit(context, {
            evaluatorName: 'unavailable',
        }),
        ExerciseEvaluationFailedError,
    );

    assert.equal(context.state.attempt.status, 'failed');
    assert.equal(context.state.attempt.score, null);
    assert.equal(context.state.resultCount, 0);
    assert.equal(context.state.assignmentStatus, 'started');
    assert.equal(context.state.released, true);

    assert.deepEqual(transactionCommands(context), [
        'BEGIN', 'COMMIT', 'BEGIN', 'COMMIT',
    ]);
});

test('submitExerciseAttempt rolls back finalization when progress fails', async () => {
    const context = createTestContext();
    const progressError = new Error('Progress update failed');

    await assert.rejects(
        () => submit(context, {
            applyProgress: async () => {
                throw progressError;
            },
        }),
        progressError,
    );

    assert.equal(context.state.attempt.status, 'failed');
    assert.equal(context.state.attempt.score, null);
    assert.equal(context.state.resultCount, 0);
    assert.equal(context.state.assignmentStatus, 'started');
    assert.equal(context.state.released, true);

    assert.deepEqual(transactionCommands(context), [
        'BEGIN', 'COMMIT',
        'BEGIN', 'ROLLBACK',
        'BEGIN', 'COMMIT',
    ]);
});

test('submitExerciseAttempt passes the stored language to the evaluator', async () => {
    const context = createTestContext();
    let captured;

    await submit(context, {
        evaluate: async (parameters) => {
            captured = parameters;
            return evaluateExerciseSubmission(parameters);
        },
    });

    assert.equal(captured.languageId, 1);
    assert.equal(captured.submittedCode, context.solutionCode);
});

test('submitExerciseAttempt releases the connection before evaluating', async () => {
    const context = createTestContext();

    await submit(context, {
        evaluate: async (parameters) => {
            assert.equal(context.state.transactionOpen, false);
            assert.equal(context.state.released, true);
            assert.equal(context.state.releaseCount, 1);
            assert.equal(context.state.attempt.status, 'evaluating');
            assert.equal(context.queryLog.at(-1).text, 'COMMIT');

            return evaluateExerciseSubmission(parameters);
        },
    });

    assert.equal(context.state.releaseCount, 2);
});

test('submitExerciseAttempt rejects another submission while evaluating', async () => {
    const context = createTestContext();
    let progressCount = 0;

    await submit(context, {
        evaluate: async (parameters) => {
            await assert.rejects(
                () => submit(context, {
                    evaluate: async () => {
                        assert.fail('A second evaluator must not run');
                    },
                }),
                ExerciseAssignmentUnavailableError,
            );

            return evaluateExerciseSubmission(parameters);
        },

        applyProgress: async () => {
            progressCount += 1;

            return {
                applied: true,
                xpAwarded: 75,
            };
        },
    });

    assert.equal(progressCount, 1);

    assert.equal(context.queryLog.filter(
        ({ text }) => text.includes('INSERT INTO exercise_attempts'),
    ).length, 1);
});

test('submitExerciseAttempt recovers a stale evaluating attempt', async () => {
    const context = createTestContext();

    context.state.attempt = {
        id: randomUUID(),
        status: 'evaluating',
        attempted_at: new Date(
            context.now.getTime() - 6 * 60 * 1000,
        ),
        completed_at: null,
    };

    const result = await submit(context);

    assert.equal(context.state.staleAttempts, 1);
    assert.equal(result.attempt.id, context.ids.attemptId);
    assert.equal(result.attempt.passed, true);
});

test('submitExerciseAttempt cannot finalize a replaced reservation', async () => {
    const context = createTestContext();
    const replacementId = randomUUID();
    let progressApplied = false;

    await assert.rejects(
        () => submit(context, {
            evaluate: async (parameters) => {
                context.state.attempt = {
                    ...context.state.attempt,
                    id: replacementId,
                };

                return evaluateExerciseSubmission(parameters);
            },

            applyProgress: async () => {
                progressApplied = true;
            },
        }),
        ExerciseAssignmentUnavailableError,
    );

    assert.equal(progressApplied, false);
    assert.equal(context.state.resultCount, 0);
    assert.equal(context.state.attempt.id, replacementId);
    assert.equal(context.state.attempt.status, 'evaluating');
});

test('submitExerciseAttempt rejects an unsupported language before reserving an attempt', async () => {
    const context = createTestContext({
        languageId: 2,
    });

    await assert.rejects(
        () => submit(context, {
            evaluatorName: 'docker',
            evaluate: async () => {
                assert.fail('An unsupported language must not execute');
            },
        }),
        (error) => {
            assert.ok(
                error instanceof ExerciseLanguageUnsupportedError,
            );

            assert.equal(
                error.code,
                'EXERCISE_LANGUAGE_UNSUPPORTED',
            );

            assert.equal(error.statusCode, 422);
            return true;
        },
    );

    assert.equal(context.state.attempt, null);
    assert.equal(context.state.assignmentStatus, 'assigned');
    assert.equal(context.state.released, true);
    assert.equal(context.queryLog.at(-1).text, 'ROLLBACK');
});
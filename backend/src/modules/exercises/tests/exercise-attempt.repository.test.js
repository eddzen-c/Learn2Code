import assert from 'node:assert/strict';
import {
    randomUUID,
} from 'node:crypto';
import test from 'node:test';

import {
    completeExerciseAttemptRecord,
    createExerciseAttemptRecord,
    createExerciseAttemptResultRecords,
    findExerciseAssignmentForAttempt,
    markExerciseAssignmentCompleted,
    markExerciseAssignmentExpired,
    markExerciseAssignmentStarted,
} from '../repositories/exercise-attempt.repository.js';

test(
    'findExerciseAssignmentForAttempt maps the assignment context',
    async () => {
        const assignmentId = randomUUID();
        const userId = randomUUID();
        const exerciseId = randomUUID();
        const testCaseId = randomUUID();

        const assignedAt =
            new Date('2026-07-30T12:00:00.000Z');

        const expiresAt =
            new Date('2026-07-31T12:00:00.000Z');

        let receivedQuery;

        const client = {
            query: async (query) => {
                receivedQuery = query;

                return {
                    rows: [
                        {
                            assignment_id:
                                assignmentId,
                            user_id: userId,
                            exercise_id:
                                exerciseId,
                            assignment_status:
                                'assigned',
                            assigned_at:
                                assignedAt,
                            started_at: null,
                            completed_at: null,
                            expires_at:
                                expiresAt,
                            exercise_title:
                                'Suma personalizada',
                            language_id: 1,
                            solution_code:
                                'return a + b;',
                            test_cases: [
                                {
                                    id: testCaseId,
                                    position: 1,
                                    input: {
                                        a: 1,
                                        b: 2,
                                    },
                                    expectedOutput: 3,
                                    isHidden: false,
                                    weight: '100',
                                },
                            ],
                        },
                    ],
                };
            },
        };

        const result =
            await findExerciseAssignmentForAttempt({
                assignmentId,
                userId,
                forUpdate: true,
                client,
            });

        assert.deepEqual(
            receivedQuery.values,
            [
                assignmentId,
                userId,
            ],
        );

        assert.match(
            receivedQuery.text,
            /FOR UPDATE OF exercise_assignments/,
        );

        assert.equal(
            result.assignment.id,
            assignmentId,
        );

        assert.equal(
            result.assignment.status,
            'assigned',
        );

        assert.equal(
            result.exercise.id,
            exerciseId,
        );

        assert.equal(
            result.exercise.solutionCode,
            'return a + b;',
        );

        assert.deepEqual(
            result.exercise.testCases,
            [
                {
                    id: testCaseId,
                    position: 1,
                    input: {
                        a: 1,
                        b: 2,
                    },
                    expectedOutput: 3,
                    isHidden: false,
                    weight: 100,
                },
            ],
        );

        assert.equal(
            Object.isFrozen(result),
            true,
        );

        assert.equal(
            Object.isFrozen(
                result.exercise.testCases[0],
            ),
            true,
        );
    },
);

test(
    'findExerciseAssignmentForAttempt returns null when missing',
    async () => {
        let receivedQuery;

        const client = {
            query: async (query) => {
                receivedQuery = query;

                return {
                    rows: [],
                };
            },
        };

        const result =
            await findExerciseAssignmentForAttempt({
                assignmentId: randomUUID(),
                userId: randomUUID(),
                client,
            });

        assert.equal(result, null);

        assert.doesNotMatch(
            receivedQuery.text,
            /FOR UPDATE OF exercise_assignments/,
        );
    },
);

test(
    'createExerciseAttemptRecord creates an evaluating attempt',
    async () => {
        const attemptId = randomUUID();
        const userId = randomUUID();
        const exerciseId = randomUUID();
        const assignmentId = randomUUID();

        const attemptedAt =
            new Date('2026-07-30T13:00:00.000Z');

        let receivedQuery;

        const client = {
            query: async (query) => {
                receivedQuery = query;

                return {
                    rows: [
                        {
                            id: attemptId,
                            user_id: userId,
                            exercise_id:
                                exerciseId,
                            assignment_id:
                                assignmentId,
                            language_id: 1,
                            submitted_code:
                                'return a + b;',
                            status:
                                'evaluating',
                            passed: null,
                            score: null,
                            tests_passed: null,
                            tests_total: null,
                            execution_time_ms:
                                null,
                            feedback: null,
                            attempted_at:
                                attemptedAt,
                            completed_at: null,
                        },
                    ],
                };
            },
        };

        const result =
            await createExerciseAttemptRecord({
                userId,
                exerciseId,
                assignmentId,
                languageId: 1,
                submittedCode:
                    'return a + b;',
                attemptedAt,
                client,
            });

        assert.deepEqual(
            receivedQuery.values,
            [
                userId,
                exerciseId,
                assignmentId,
                1,
                'return a + b;',
                attemptedAt,
            ],
        );

        assert.match(
            receivedQuery.text,
            /INSERT INTO exercise_attempts/,
        );

        assert.equal(
            result.id,
            attemptId,
        );

        assert.equal(
            result.status,
            'evaluating',
        );

        assert.equal(
            result.score,
            null,
        );

        assert.equal(
            Object.isFrozen(result),
            true,
        );
    },
);

test(
    'markExerciseAssignmentStarted preserves its first start time',
    async () => {
        const assignmentId = randomUUID();

        const startedAt =
            new Date('2026-07-30T13:05:00.000Z');

        let receivedQuery;

        const client = {
            query: async (query) => {
                receivedQuery = query;

                return {
                    rows: [
                        {
                            id: assignmentId,
                            status: 'started',
                            started_at:
                                startedAt,
                            completed_at: null,
                            expires_at: null,
                        },
                    ],
                };
            },
        };

        const result =
            await markExerciseAssignmentStarted({
                assignmentId,
                startedAt,
                client,
            });

        assert.deepEqual(
            receivedQuery.values,
            [
                assignmentId,
                startedAt,
            ],
        );

        assert.match(
            receivedQuery.text,
            /COALESCE/,
        );

        assert.equal(
            result.status,
            'started',
        );

        assert.equal(
            result.startedAt,
            startedAt,
        );
    },
);

test(
    'completeExerciseAttemptRecord stores the evaluation',
    async () => {
        const attemptId = randomUUID();

        const completedAt =
            new Date('2026-07-30T14:00:00.000Z');

        let receivedQuery;

        const client = {
            query: async (query) => {
                receivedQuery = query;

                return {
                    rows: [
                        {
                            id: attemptId,
                            user_id: randomUUID(),
                            exercise_id:
                                randomUUID(),
                            assignment_id:
                                randomUUID(),
                            language_id: 1,
                            submitted_code:
                                'return a + b;',
                            status: 'completed',
                            passed: true,
                            score: '100.00',
                            tests_passed: 2,
                            tests_total: 2,
                            execution_time_ms: 0,
                            feedback:
                                'Correcto',
                            attempted_at:
                                new Date(),
                            completed_at:
                                completedAt,
                        },
                    ],
                };
            },
        };

        const result =
            await completeExerciseAttemptRecord({
                attemptId,
                passed: true,
                score: 100,
                testsPassed: 2,
                testsTotal: 2,
                executionTimeMs: 0,
                feedback: 'Correcto',
                completedAt,
                client,
            });

        assert.deepEqual(
            receivedQuery.values,
            [
                attemptId,
                true,
                100,
                2,
                2,
                0,
                'Correcto',
                completedAt,
            ],
        );

        assert.equal(
            result.status,
            'completed',
        );

        assert.equal(result.score, 100);
        assert.equal(result.passed, true);
    },
);

test(
    'createExerciseAttemptResultRecords serializes outputs',
    async () => {
        const attemptId = randomUUID();
        const testCaseId = randomUUID();
        const resultId = randomUUID();

        const receivedQueries = [];

        const client = {
            query: async (query) => {
                receivedQueries.push(query);

                return {
                    rows: [
                        {
                            id: resultId,
                            attempt_id:
                                attemptId,
                            test_case_id:
                                testCaseId,
                            passed: true,
                            actual_output:
                                '{"value":3}',
                            error_message: null,
                            execution_time_ms: 0,
                            created_at:
                                new Date(),
                        },
                    ],
                };
            },
        };

        const records =
            await createExerciseAttemptResultRecords({
                attemptId,
                results: [
                    {
                        testCaseId,
                        passed: true,
                        actualOutput: {
                            value: 3,
                        },
                        errorMessage: null,
                        executionTimeMs: 0,
                    },
                ],
                client,
            });

        assert.equal(
            receivedQueries.length,
            1,
        );

        assert.deepEqual(
            receivedQueries[0].values,
            [
                attemptId,
                testCaseId,
                true,
                '{"value":3}',
                null,
                0,
            ],
        );

        assert.equal(records.length, 1);

        assert.equal(
            records[0].testCaseId,
            testCaseId,
        );

        assert.equal(
            Object.isFrozen(records),
            true,
        );
    },
);

test(
    'markExerciseAssignmentCompleted completes an active assignment',
    async () => {
        const assignmentId = randomUUID();

        const completedAt =
            new Date('2026-07-30T14:10:00.000Z');

        const client = {
            query: async () => ({
                rows: [
                    {
                        id: assignmentId,
                        status: 'completed',
                        started_at:
                            completedAt,
                        completed_at:
                            completedAt,
                        expires_at: null,
                    },
                ],
            }),
        };

        const result =
            await markExerciseAssignmentCompleted({
                assignmentId,
                completedAt,
                client,
            });

        assert.equal(
            result.status,
            'completed',
        );

        assert.equal(
            result.completedAt,
            completedAt,
        );
    },
);

test(
    'markExerciseAssignmentExpired expires an active assignment',
    async () => {
        const assignmentId = randomUUID();

        let receivedQuery;

        const client = {
            query: async (query) => {
                receivedQuery = query;

                return {
                    rows: [
                        {
                            id: assignmentId,
                            status: 'expired',
                            started_at: null,
                            completed_at: null,
                            expires_at:
                                new Date(),
                        },
                    ],
                };
            },
        };

        const result =
            await markExerciseAssignmentExpired({
                assignmentId,
                client,
            });

        assert.deepEqual(
            receivedQuery.values,
            [assignmentId],
        );

        assert.equal(
            result.status,
            'expired',
        );
    },
);
import {
    databasePool,
} from '../../../config/database.js';

const mapAssignmentForAttemptRow = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        assignment: Object.freeze({
            id: row.assignment_id,
            userId: row.user_id,
            exerciseId: row.exercise_id,
            status:
                row.assignment_status,
            assignedAt: row.assigned_at,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            expiresAt: row.expires_at,
        }),

        exercise: Object.freeze({
            id: row.exercise_id,
            title: row.exercise_title,
            languageId: row.language_id,
            solutionCode:
                row.solution_code,

            testCases: Object.freeze(
                (
                    row.test_cases ?? []
                ).map(
                    (testCase) => (
                        Object.freeze({
                            id: testCase.id,
                            position:
                                testCase.position,
                            input:
                                testCase.input,
                            expectedOutput:
                                testCase
                                    .expectedOutput,
                            isHidden:
                                testCase.isHidden,
                            weight: Number(
                                testCase.weight,
                            ),
                        })
                    ),
                ),
            ),
        }),
    });
};

export const findExerciseAssignmentForAttempt =
    async ({
        assignmentId,
        userId,
        forUpdate = false,
        client = databasePool,
    }) => {
        const lockClause =
            forUpdate
                ? 'FOR UPDATE OF exercise_assignments'
                : '';

        const result = await client.query({
            text: `
                SELECT
                    exercise_assignments.id
                        AS assignment_id,
                    exercise_assignments.user_id,
                    exercise_assignments.exercise_id,
                    exercise_assignments.status
                        AS assignment_status,
                    exercise_assignments.assigned_at,
                    exercise_assignments.started_at,
                    exercise_assignments.completed_at,
                    exercise_assignments.expires_at,

                    exercises.title
                        AS exercise_title,
                    exercises.language_id,
                    exercises.solution_code,

                    exercise_tests.test_cases

                FROM exercise_assignments

                JOIN exercises
                    ON exercises.id =
                        exercise_assignments.exercise_id
                   AND exercises.status =
                        'published'

                LEFT JOIN LATERAL (
                    SELECT
                        COALESCE(
                            JSONB_AGG(
                                JSONB_BUILD_OBJECT(
                                    'id',
                                    exercise_test_cases.id,

                                    'position',
                                    exercise_test_cases.position,

                                    'input',
                                    exercise_test_cases.input,

                                    'expectedOutput',
                                    exercise_test_cases
                                        .expected_output,

                                    'isHidden',
                                    exercise_test_cases.is_hidden,

                                    'weight',
                                    exercise_test_cases.weight
                                )
                                ORDER BY
                                    exercise_test_cases.position
                            ),
                            '[]'::JSONB
                        ) AS test_cases

                    FROM exercise_test_cases

                    WHERE exercise_test_cases.exercise_id =
                        exercises.id
                ) AS exercise_tests
                    ON TRUE

                WHERE exercise_assignments.id = $1
                  AND exercise_assignments.user_id = $2

                ${lockClause}
            `,
            values: [
                assignmentId,
                userId,
            ],
        });

        return mapAssignmentForAttemptRow(
            result.rows[0],
        );
    };

const mapExerciseAttemptRow = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        id: row.id,
        userId: row.user_id,
        exerciseId: row.exercise_id,
        assignmentId: row.assignment_id,
        languageId: row.language_id,
        submittedCode: row.submitted_code,
        status: row.status,
        passed: row.passed,
        score:
            row.score === null
                ? null
                : Number(row.score),
        testsPassed: row.tests_passed,
        testsTotal: row.tests_total,
        executionTimeMs:
            row.execution_time_ms,
        feedback: row.feedback,
        attemptedAt: row.attempted_at,
        completedAt: row.completed_at,
    });
};

const mapAssignmentStateRow = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        id: row.id,
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        expiresAt: row.expires_at,
    });
};

export const createExerciseAttemptRecord =
    async ({
        userId,
        exerciseId,
        assignmentId,
        languageId,
        submittedCode,
        attemptedAt = new Date(),
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                INSERT INTO exercise_attempts (
                    user_id,
                    exercise_id,
                    assignment_id,
                    language_id,
                    submitted_code,
                    status,
                    attempted_at
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    'evaluating',
                    $6
                )
                RETURNING
                    id,
                    user_id,
                    exercise_id,
                    assignment_id,
                    language_id,
                    submitted_code,
                    status,
                    passed,
                    score,
                    tests_passed,
                    tests_total,
                    execution_time_ms,
                    feedback,
                    attempted_at,
                    completed_at
            `,
            values: [
                userId,
                exerciseId,
                assignmentId,
                languageId,
                submittedCode,
                attemptedAt,
            ],
        });

        return mapExerciseAttemptRow(
            result.rows[0],
        );
    };

export const markExerciseAssignmentStarted =
    async ({
        assignmentId,
        startedAt = new Date(),
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                UPDATE exercise_assignments
                SET
                    status = 'started',
                    started_at = COALESCE(
                        started_at,
                        $2
                    )
                WHERE id = $1
                  AND status IN (
                      'assigned',
                      'started'
                  )
                RETURNING
                    id,
                    status,
                    started_at,
                    completed_at,
                    expires_at
            `,
            values: [
                assignmentId,
                startedAt,
            ],
        });

        return mapAssignmentStateRow(
            result.rows[0],
        );
    };

const mapExerciseAttemptResultRow = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        id: row.id,
        attemptId: row.attempt_id,
        testCaseId: row.test_case_id,
        passed: row.passed,
        actualOutput: row.actual_output,
        errorMessage: row.error_message,
        executionTimeMs:
            row.execution_time_ms,
        createdAt: row.created_at,
    });
};

const serializeActualOutput = (value) => {
    if (
        value === null
        || value === undefined
    ) {
        return null;
    }

    if (typeof value === 'string') {
        return value;
    }

    return JSON.stringify(value);
};

export const completeExerciseAttemptRecord =
    async ({
        attemptId,
        passed,
        score,
        testsPassed,
        testsTotal,
        executionTimeMs,
        feedback,
        completedAt = new Date(),
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                UPDATE exercise_attempts
                SET
                    status = 'completed',
                    passed = $2,
                    score = $3,
                    tests_passed = $4,
                    tests_total = $5,
                    execution_time_ms = $6,
                    feedback = $7,
                    completed_at = $8
                WHERE id = $1
                  AND status = 'evaluating'
                RETURNING
                    id,
                    user_id,
                    exercise_id,
                    assignment_id,
                    language_id,
                    submitted_code,
                    status,
                    passed,
                    score,
                    tests_passed,
                    tests_total,
                    execution_time_ms,
                    feedback,
                    attempted_at,
                    completed_at
            `,
            values: [
                attemptId,
                passed,
                score,
                testsPassed,
                testsTotal,
                executionTimeMs,
                feedback,
                completedAt,
            ],
        });

        return mapExerciseAttemptRow(
            result.rows[0],
        );
    };

export const createExerciseAttemptResultRecords =
    async ({
        attemptId,
        results,
        client = databasePool,
    }) => {
        const records = [];

        for (const evaluationResult of results) {
            const result = await client.query({
                text: `
                    INSERT INTO exercise_attempt_results (
                        attempt_id,
                        test_case_id,
                        passed,
                        actual_output,
                        error_message,
                        execution_time_ms
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6
                    )
                    RETURNING
                        id,
                        attempt_id,
                        test_case_id,
                        passed,
                        actual_output,
                        error_message,
                        execution_time_ms,
                        created_at
                `,
                values: [
                    attemptId,
                    evaluationResult.testCaseId,
                    evaluationResult.passed,
                    serializeActualOutput(
                        evaluationResult.actualOutput,
                    ),
                    evaluationResult.errorMessage
                    ?? null,
                    evaluationResult.executionTimeMs
                    ?? null,
                ],
            });

            records.push(
                mapExerciseAttemptResultRow(
                    result.rows[0],
                ),
            );
        }

        return Object.freeze(records);
    };

export const markExerciseAssignmentCompleted =
    async ({
        assignmentId,
        completedAt = new Date(),
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                UPDATE exercise_assignments
                SET
                    status = 'completed',
                    started_at = COALESCE(
                        started_at,
                        $2
                    ),
                    completed_at = $2
                WHERE id = $1
                  AND status IN (
                      'assigned',
                      'started'
                  )
                RETURNING
                    id,
                    status,
                    started_at,
                    completed_at,
                    expires_at
            `,
            values: [
                assignmentId,
                completedAt,
            ],
        });

        return mapAssignmentStateRow(
            result.rows[0],
        );
    };

export const markExerciseAssignmentExpired =
    async ({
        assignmentId,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                UPDATE exercise_assignments
                SET status = 'expired'
                WHERE id = $1
                  AND status IN (
                      'assigned',
                      'started'
                  )
                RETURNING
                    id,
                    status,
                    started_at,
                    completed_at,
                    expires_at
            `,
            values: [
                assignmentId,
            ],
        });

        return mapAssignmentStateRow(
            result.rows[0],
        );
    };
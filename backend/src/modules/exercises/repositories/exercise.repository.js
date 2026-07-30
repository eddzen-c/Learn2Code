import {
    databasePool,
} from '../../../config/database.js';

const mapExerciseRow = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        id: row.id,
        topicId: row.topic_id,
        difficultyId:
            row.difficulty_id,
        languageId: row.language_id,
        createdByUserId:
            row.created_by_user_id,
        title: row.title,
        statement: row.statement,
        instructions: row.instructions,
        starterCode: row.starter_code,
        solutionCode: row.solution_code,
        estimatedMinutes:
            row.estimated_minutes,
        generationSource:
            row.generation_source,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
};

const mapTestCaseRow = (row) => (
    Object.freeze({
        id: row.id,
        exerciseId: row.exercise_id,
        position: row.position,
        input: row.input,
        expectedOutput:
            row.expected_output,
        isHidden: row.is_hidden,
        weight: Number(row.weight),
        createdAt: row.created_at,
    })
);

const mapAssignmentRow = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        id: row.id,
        userId: row.user_id,
        exerciseId: row.exercise_id,
        source: row.source,
        status: row.status,
        assignedAt: row.assigned_at,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        expiresAt: row.expires_at,
        metadata: Object.freeze({
            ...(row.metadata ?? {}),
        }),
    });
};

export const createExerciseRecord =
    async ({
        topicId,
        difficultyId,
        languageId,
        createdByUserId,
        title,
        statement,
        instructions = null,
        starterCode = null,
        solutionCode = null,
        estimatedMinutes = null,
        generationSource = 'ai',
        status = 'published',
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                INSERT INTO exercises (
                    topic_id,
                    difficulty_id,
                    language_id,
                    created_by_user_id,
                    title,
                    statement,
                    instructions,
                    starter_code,
                    solution_code,
                    estimated_minutes,
                    generation_source,
                    status
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9,
                    $10,
                    $11,
                    $12
                )
                RETURNING
                    id,
                    topic_id,
                    difficulty_id,
                    language_id,
                    created_by_user_id,
                    title,
                    statement,
                    instructions,
                    starter_code,
                    solution_code,
                    estimated_minutes,
                    generation_source,
                    status,
                    created_at,
                    updated_at
            `,
            values: [
                topicId,
                difficultyId,
                languageId,
                createdByUserId,
                title,
                statement,
                instructions,
                starterCode,
                solutionCode,
                estimatedMinutes,
                generationSource,
                status,
            ],
        });

        return mapExerciseRow(
            result.rows[0],
        );
    };

export const createExerciseTestCaseRecords =
    async ({
        exerciseId,
        testCases,
        client = databasePool,
    }) => {
        const createdTestCases = [];

        for (const testCase of testCases) {
            const result = await client.query({
                text: `
                    INSERT INTO exercise_test_cases (
                        exercise_id,
                        position,
                        input,
                        expected_output,
                        is_hidden,
                        weight
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
                        exercise_id,
                        position,
                        input,
                        expected_output,
                        is_hidden,
                        weight,
                        created_at
                `,
                values: [
                    exerciseId,
                    testCase.position,
                    testCase.input,
                    testCase.expectedOutput,
                    testCase.isHidden,
                    testCase.weight,
                ],
            });

            createdTestCases.push(
                mapTestCaseRow(
                    result.rows[0],
                ),
            );
        }

        return Object.freeze(
            createdTestCases,
        );
    };

export const createExerciseAssignmentRecord =
    async ({
        userId,
        exerciseId,
        source = 'adaptive_ai',
        status = 'assigned',
        expiresAt = null,
        metadata = {},
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                INSERT INTO exercise_assignments (
                    user_id,
                    exercise_id,
                    source,
                    status,
                    expires_at,
                    metadata
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
                    user_id,
                    exercise_id,
                    source,
                    status,
                    assigned_at,
                    started_at,
                    completed_at,
                    expires_at,
                    metadata
            `,
            values: [
                userId,
                exerciseId,
                source,
                status,
                expiresAt,
                metadata,
            ],
        });

        return mapAssignmentRow(
            result.rows[0],
        );
    };

const mapActiveAssignmentRow = (row) => {
    if (!row) {
        return null;
    }

    const publicTestCases =
        row.public_test_cases ?? [];

    return Object.freeze({
        assignment: Object.freeze({
            id: row.id,
            userId: row.user_id,
            exerciseId: row.exercise_id,
            source: row.source,
            status: row.status,
            assignedAt: row.assigned_at,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            expiresAt: row.expires_at,
            metadata: Object.freeze({
                ...(row.metadata ?? {}),
            }),
        }),

        exercise: Object.freeze({
            id: row.exercise_id,
            title: row.exercise_title,
            statement:
                row.exercise_statement,
            instructions:
                row.exercise_instructions,
            starterCode:
                row.exercise_starter_code,
            estimatedMinutes:
                row.exercise_estimated_minutes,

            topic: Object.freeze({
                id: row.topic_id,
                name: row.topic_name,
            }),

            difficulty: Object.freeze({
                id: row.difficulty_id,
                name: row.difficulty_name,
            }),

            language: Object.freeze({
                id: row.language_id,
                name: row.language_name,
                fileExtension:
                    row.language_file_extension,
            }),

            publicTestCases: Object.freeze(
                publicTestCases.map(
                    (testCase) => (
                        Object.freeze({
                            id: testCase.id,
                            position:
                                testCase.position,
                            input: testCase.input,
                            expectedOutput:
                                testCase.expectedOutput,
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

export const findActiveExerciseAssignmentByUserId =
    async ({
        userId,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                SELECT
                    exercise_assignments.id,
                    exercise_assignments.user_id,
                    exercise_assignments.exercise_id,
                    exercise_assignments.source,
                    exercise_assignments.status,
                    exercise_assignments.assigned_at,
                    exercise_assignments.started_at,
                    exercise_assignments.completed_at,
                    exercise_assignments.expires_at,
                    exercise_assignments.metadata,

                    exercises.title
                        AS exercise_title,
                    exercises.statement
                        AS exercise_statement,
                    exercises.instructions
                        AS exercise_instructions,
                    exercises.starter_code
                        AS exercise_starter_code,
                    exercises.estimated_minutes
                        AS exercise_estimated_minutes,

                    topics.id AS topic_id,
                    topics.name AS topic_name,

                    difficulty_levels.id
                        AS difficulty_id,
                    difficulty_levels.name
                        AS difficulty_name,

                    supported_languages.id
                        AS language_id,
                    supported_languages.name
                        AS language_name,
                    supported_languages.file_extension
                        AS language_file_extension,

                    public_tests.public_test_cases

                FROM exercise_assignments

                JOIN exercises
                    ON exercises.id =
                        exercise_assignments.exercise_id
                   AND exercises.status =
                        'published'

                JOIN topics
                    ON topics.id =
                        exercises.topic_id

                JOIN difficulty_levels
                    ON difficulty_levels.id =
                        exercises.difficulty_id

                JOIN supported_languages
                    ON supported_languages.id =
                        exercises.language_id

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

                                    'weight',
                                    exercise_test_cases.weight
                                )
                                ORDER BY
                                    exercise_test_cases.position
                            ),
                            '[]'::JSONB
                        ) AS public_test_cases

                    FROM exercise_test_cases

                    WHERE exercise_test_cases.exercise_id =
                        exercises.id
                      AND exercise_test_cases.is_hidden =
                        FALSE
                ) AS public_tests
                    ON TRUE

                WHERE exercise_assignments.user_id = $1
                  AND exercise_assignments.status
                        IN ('assigned', 'started')
                  AND (
                        exercise_assignments.expires_at
                            IS NULL
                        OR exercise_assignments.expires_at
                            > NOW()
                  )

                ORDER BY
                    exercise_assignments.assigned_at DESC,
                    exercise_assignments.id DESC

                LIMIT 1
            `,
            values: [userId],
        });

        return mapActiveAssignmentRow(
            result.rows[0],
        );
    };
import assert from 'node:assert/strict';
import {
    randomUUID,
} from 'node:crypto';
import test from 'node:test';

import {
    createExerciseAssignmentRecord,
    createExerciseRecord,
    createExerciseTestCaseRecords,
    findActiveExerciseAssignmentByUserId,
} from '../repositories/exercise.repository.js';

test(
    'createExerciseRecord inserts and maps an exercise',
    async () => {
        const exerciseId = randomUUID();
        const userId = randomUUID();
        const createdAt = new Date();

        let receivedQuery = null;

        const client = {
            query: async (query) => {
                receivedQuery = query;

                return {
                    rows: [
                        {
                            id: exerciseId,
                            topic_id: 3,
                            difficulty_id: 2,
                            language_id: 1,
                            created_by_user_id:
                                userId,
                            title:
                                'Suma acumulada',
                            statement:
                                'Resuelve el ejercicio.',
                            instructions:
                                'Muestra el resultado.',
                            starter_code:
                                '// Starter',
                            solution_code:
                                '// Solution',
                            estimated_minutes: 16,
                            generation_source:
                                'ai',
                            status: 'published',
                            created_at: createdAt,
                            updated_at: createdAt,
                        },
                    ],
                };
            },
        };

        const exercise =
            await createExerciseRecord({
                topicId: 3,
                difficultyId: 2,
                languageId: 1,
                createdByUserId: userId,
                title: 'Suma acumulada',
                statement:
                    'Resuelve el ejercicio.',
                instructions:
                    'Muestra el resultado.',
                starterCode: '// Starter',
                solutionCode: '// Solution',
                estimatedMinutes: 16,
                client,
            });

        assert.match(
            receivedQuery.text,
            /INSERT INTO exercises/,
        );

        assert.deepEqual(
            receivedQuery.values,
            [
                3,
                2,
                1,
                userId,
                'Suma acumulada',
                'Resuelve el ejercicio.',
                'Muestra el resultado.',
                '// Starter',
                '// Solution',
                16,
                'ai',
                'published',
            ],
        );

        assert.equal(
            exercise.id,
            exerciseId,
        );

        assert.equal(
            exercise.generationSource,
            'ai',
        );

        assert.equal(
            exercise.status,
            'published',
        );
    },
);

test(
    'createExerciseTestCaseRecords inserts every test case',
    async () => {
        const exerciseId = randomUUID();
        const receivedQueries = [];

        const client = {
            query: async (query) => {
                receivedQueries.push(query);

                return {
                    rows: [
                        {
                            id: randomUUID(),
                            exercise_id:
                                query.values[0],
                            position:
                                query.values[1],
                            input:
                                query.values[2],
                            expected_output:
                                query.values[3],
                            is_hidden:
                                query.values[4],
                            weight:
                                String(
                                    query.values[5],
                                ),
                            created_at:
                                new Date(),
                        },
                    ],
                };
            },
        };

        const testCases =
            await createExerciseTestCaseRecords({
                exerciseId,
                testCases: [
                    {
                        position: 1,
                        input: '4',
                        expectedOutput: '10',
                        isHidden: false,
                        weight: 1,
                    },
                    {
                        position: 2,
                        input: '6',
                        expectedOutput: '21',
                        isHidden: true,
                        weight: 2,
                    },
                ],
                client,
            });

        assert.equal(
            receivedQueries.length,
            2,
        );

        assert.equal(
            testCases.length,
            2,
        );

        assert.equal(
            testCases[0].exerciseId,
            exerciseId,
        );

        assert.equal(
            testCases[1].isHidden,
            true,
        );

        assert.equal(
            testCases[1].weight,
            2,
        );
    },
);

test(
    'createExerciseAssignmentRecord creates an adaptive assignment',
    async () => {
        const assignmentId = randomUUID();
        const userId = randomUUID();
        const exerciseId = randomUUID();
        const assignedAt = new Date();

        let receivedQuery = null;

        const client = {
            query: async (query) => {
                receivedQuery = query;

                return {
                    rows: [
                        {
                            id: assignmentId,
                            user_id: userId,
                            exercise_id:
                                exerciseId,
                            source:
                                'adaptive_ai',
                            status: 'assigned',
                            assigned_at:
                                assignedAt,
                            started_at: null,
                            completed_at: null,
                            expires_at: null,
                            metadata: {
                                provider: 'mock',
                                topicId: 3,
                            },
                        },
                    ],
                };
            },
        };

        const assignment =
            await createExerciseAssignmentRecord({
                userId,
                exerciseId,
                metadata: {
                    provider: 'mock',
                    topicId: 3,
                },
                client,
            });

        assert.match(
            receivedQuery.text,
            /INSERT INTO exercise_assignments/,
        );

        assert.deepEqual(
            receivedQuery.values,
            [
                userId,
                exerciseId,
                'adaptive_ai',
                'assigned',
                null,
                {
                    provider: 'mock',
                    topicId: 3,
                },
            ],
        );

        assert.equal(
            assignment.id,
            assignmentId,
        );

        assert.equal(
            assignment.userId,
            userId,
        );

        assert.equal(
            assignment.exerciseId,
            exerciseId,
        );

        assert.deepEqual(
            assignment.metadata,
            {
                provider: 'mock',
                topicId: 3,
            },
        );
    },
);

test(
    'findActiveExerciseAssignmentByUserId returns safe exercise data',
    async () => {
        const assignmentId = randomUUID();
        const exerciseId = randomUUID();
        const userId = randomUUID();

        let receivedQuery = null;

        const client = {
            query: async (query) => {
                receivedQuery = query;

                return {
                    rows: [
                        {
                            id: assignmentId,
                            user_id: userId,
                            exercise_id:
                                exerciseId,
                            source:
                                'adaptive_ai',
                            status: 'assigned',
                            assigned_at:
                                new Date(),
                            started_at: null,
                            completed_at: null,
                            expires_at: null,
                            metadata: {
                                provider: 'mock',
                            },
                            exercise_title:
                                'Suma acumulada',
                            exercise_statement:
                                'Suma del 1 hasta N.',
                            exercise_instructions:
                                'Muestra el resultado.',
                            exercise_starter_code:
                                '// Código inicial',
                            exercise_estimated_minutes:
                                16,
                            topic_id: 3,
                            topic_name: 'ciclos',
                            difficulty_id: 2,
                            difficulty_name:
                                'intermedio',
                            language_id: 1,
                            language_name:
                                'JavaScript',
                            language_file_extension:
                                '.js',
                            public_test_cases: [
                                {
                                    id: randomUUID(),
                                    position: 1,
                                    input: '4',
                                    expectedOutput:
                                        '10',
                                    weight: 1,
                                },
                            ],
                        },
                    ],
                };
            },
        };

        const result =
            await findActiveExerciseAssignmentByUserId({
                userId,
                client,
            });

        assert.deepEqual(
            receivedQuery.values,
            [userId],
        );

        assert.match(
            receivedQuery.text,
            /is_hidden\s*=\s*FALSE/,
        );

        assert.equal(
            result.assignment.id,
            assignmentId,
        );

        assert.equal(
            result.exercise.id,
            exerciseId,
        );

        assert.equal(
            result.exercise.topic.name,
            'ciclos',
        );

        assert.equal(
            result.exercise
                .publicTestCases.length,
            1,
        );

        assert.equal(
            result.exercise
                .publicTestCases[0]
                .expectedOutput,
            '10',
        );

        assert.equal(
            'solutionCode'
            in result.exercise,
            false,
        );
    },
);

test(
    'findActiveExerciseAssignmentByUserId returns null without an active assignment',
    async () => {
        const client = {
            query: async () => ({
                rows: [],
            }),
        };

        const result =
            await findActiveExerciseAssignmentByUserId({
                userId: randomUUID(),
                client,
            });

        assert.equal(result, null);
    },
);
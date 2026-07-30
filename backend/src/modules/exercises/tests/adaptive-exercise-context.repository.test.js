import assert from 'node:assert/strict';
import {
    randomUUID,
} from 'node:crypto';
import test from 'node:test';

import {
    findAdaptiveExerciseContextByUserId,
} from '../repositories/adaptive-exercise-context.repository.js';

test(
    'findAdaptiveExerciseContextByUserId maps the learning context',
    async () => {
        const userId = randomUUID();
        const assessmentId = randomUUID();

        let receivedQuery = null;

        const client = {
            query: async (query) => {
                receivedQuery = query;

                return {
                    rows: [
                        {
                            user_id: userId,
                            diagnostic_assessment_id:
                                assessmentId,
                            diagnostic_completed_at:
                                new Date(
                                    '2026-07-27T12:00:00.000Z',
                                ),
                            difficulty_id: 2,
                            difficulty_name:
                                'intermedio',
                            language_id: 1,
                            language_name:
                                'JavaScript',
                            language_file_extension:
                                '.js',
                            topic_id: 3,
                            topic_name: 'ciclos',
                            topic_description:
                                'Estructuras de repetición',
                            mastery_score: '42.50',
                            confidence_score: '60.00',
                            attempts_count: 2,
                            generation_sequence: '4',
                        },
                    ],
                };
            },
        };

        const context =
            await findAdaptiveExerciseContextByUserId({
                userId,
                client,
            });

        assert.deepEqual(
            receivedQuery.values,
            [userId],
        );

        assert.match(
            receivedQuery.text,
            /knowledge_states/,
        );

        assert.match(
            receivedQuery.text,
            /exercise_assignments/,
        );

        assert.equal(
            context.userId,
            userId,
        );

        assert.equal(
            context.diagnosticAssessmentId,
            assessmentId,
        );

        assert.deepEqual(
            context.difficulty,
            {
                id: 2,
                name: 'intermedio',
            },
        );

        assert.deepEqual(
            context.language,
            {
                id: 1,
                name: 'JavaScript',
                fileExtension: '.js',
            },
        );

        assert.deepEqual(
            context.weakestTopic,
            {
                id: 3,
                name: 'ciclos',
                description:
                    'Estructuras de repetición',
                masteryScore: 42.5,
                confidenceScore: 60,
                attemptsCount: 2,
            },
        );

        assert.equal(
            context.generationSequence,
            4,
        );
    },
);

test(
    'findAdaptiveExerciseContextByUserId returns null for an unavailable user',
    async () => {
        const client = {
            query: async () => ({
                rows: [],
            }),
        };

        const context =
            await findAdaptiveExerciseContextByUserId({
                userId: randomUUID(),
                client,
            });

        assert.equal(context, null);
    },
);

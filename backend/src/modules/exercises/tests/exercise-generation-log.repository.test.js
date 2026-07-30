import assert from 'node:assert/strict';
import {
    randomUUID,
} from 'node:crypto';
import test from 'node:test';

import {
    createExerciseGenerationLogRecord,
} from '../repositories/exercise-generation-log.repository.js';

test(
    'createExerciseGenerationLogRecord stores a successful generation',
    async () => {
        const logId = randomUUID();
        const userId = randomUUID();
        const exerciseId = randomUUID();
        const createdAt = new Date();

        let receivedQuery = null;

        const client = {
            query: async (query) => {
                receivedQuery = query;

                return {
                    rows: [
                        {
                            id: logId,
                            user_id: userId,
                            exercise_id:
                                exerciseId,
                            prompt_version_id:
                                null,
                            model_name:
                                'learn2code-mock-exercise-v1',
                            generation_params: {
                                provider: 'mock',
                                topicId: 3,
                            },
                            prompt_tokens: null,
                            completion_tokens:
                                null,
                            latency_ms: 12,
                            success: true,
                            error_message: null,
                            created_at: createdAt,
                        },
                    ],
                };
            },
        };

        const log =
            await createExerciseGenerationLogRecord({
                userId,
                exerciseId,
                modelName:
                    'learn2code-mock-exercise-v1',
                generationParams: {
                    provider: 'mock',
                    topicId: 3,
                },
                latencyMs: 12,
                client,
            });

        assert.match(
            receivedQuery.text,
            /INSERT INTO exercise_generation_logs/,
        );

        assert.deepEqual(
            receivedQuery.values,
            [
                userId,
                exerciseId,
                null,
                'learn2code-mock-exercise-v1',
                {
                    provider: 'mock',
                    topicId: 3,
                },
                null,
                null,
                12,
                true,
                null,
            ],
        );

        assert.equal(log.id, logId);
        assert.equal(log.success, true);
        assert.equal(log.latencyMs, 12);

        assert.deepEqual(
            log.generationParams,
            {
                provider: 'mock',
                topicId: 3,
            },
        );
    },
);

test(
    'createExerciseGenerationLogRecord stores a failed generation',
    async () => {
        const userId = randomUUID();

        const client = {
            query: async (query) => ({
                rows: [
                    {
                        id: randomUUID(),
                        user_id: query.values[0],
                        exercise_id: null,
                        prompt_version_id: null,
                        model_name: 'unknown',
                        generation_params: {},
                        prompt_tokens: null,
                        completion_tokens: null,
                        latency_ms: 5,
                        success: false,
                        error_message:
                            'Provider failed',
                        created_at: new Date(),
                    },
                ],
            }),
        };

        const log =
            await createExerciseGenerationLogRecord({
                userId,
                modelName: 'unknown',
                latencyMs: 5,
                success: false,
                errorMessage:
                    'Provider failed',
                client,
            });

        assert.equal(log.userId, userId);
        assert.equal(log.exerciseId, null);
        assert.equal(log.success, false);

        assert.equal(
            log.errorMessage,
            'Provider failed',
        );
    },
);
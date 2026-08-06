import assert from 'node:assert/strict';
import {
    randomUUID,
} from 'node:crypto';
import test from 'node:test';

import {
    ExerciseProviderUnavailableError,
} from '../errors/exercise.errors.js';

import {
    generatePersonalizedExercise,
} from '../services/exercise-generator.service.js';

const createGenerationInput = () => ({
    userId: randomUUID(),
    variationKey: randomUUID(),

    language: {
        id: 1,
        name: 'JavaScript',
        fileExtension: '.js',
    },

    difficulty: {
        id: 2,
        name: 'intermedio',
    },

    topic: {
        id: 3,
        name: 'ciclos',
        description:
            'Estructuras de repetición',
        masteryScore: 40,
        confidenceScore: 50,
        attemptsCount: 1,
    },

    personalizationContext: {
        learningGoal:
            'build_product',

        studyPace:
            'student',

        interestKeys: [
            'music',
            'video_games',
        ],
    },
});

test(
    'generatePersonalizedExercise delegates to the mock provider',
    async () => {
        const result =
            await generatePersonalizedExercise({
                ...createGenerationInput(),
                providerName: 'mock',
            });

        assert.equal(
            result.provider,
            'mock',
        );

        assert.equal(
            result.model,
            'learn2code-mock-exercise-v1',
        );

        assert.equal(
            result.exercise.testCases.length,
            3,
        );
    },
);

test(
    'generatePersonalizedExercise rejects an unavailable provider',
    async () => {
        await assert.rejects(
            () => generatePersonalizedExercise({
                ...createGenerationInput(),
                providerName: 'unknown',
            }),
            (error) => {
                assert.ok(
                    error instanceof
                    ExerciseProviderUnavailableError,
                );

                assert.equal(
                    error.code,
                    'EXERCISE_PROVIDER_UNAVAILABLE',
                );

                assert.equal(
                    error.statusCode,
                    503,
                );

                return true;
            },
        );
    },
);

test(
    'generatePersonalizedExercise validates provider input',
    async () => {
        await assert.rejects(
            () => generatePersonalizedExercise({
                ...createGenerationInput(),
                userId: '',
                providerName: 'mock',
            }),
            /User ID must be a non-empty string/,
        );
    },
);
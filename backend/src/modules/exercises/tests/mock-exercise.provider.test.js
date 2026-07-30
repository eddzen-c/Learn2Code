import assert from 'node:assert/strict';
import test from 'node:test';

import {
    generateMockExercise,
} from '../providers/mock-exercise.provider.js';

const userId =
    '11111111-1111-4111-8111-111111111111';

const javascriptLanguage = {
    id: 1,
    name: 'JavaScript',
    fileExtension: '.js',
};

const pythonLanguage = {
    id: 2,
    name: 'Python',
    fileExtension: '.py',
};

const intermediateDifficulty = {
    id: 2,
    name: 'intermedio',
};

const variablesTopic = {
    id: 1,
    name: 'variables',
    description: 'Variables y tipos',
    masteryScore: 35,
    confidenceScore: 50,
    attemptsCount: 2,
};

test(
    'generateMockExercise creates a JavaScript exercise',
    () => {
        const result = generateMockExercise({
            userId,
            variationKey: 'attempt-1',
            language:
                javascriptLanguage,
            difficulty:
                intermediateDifficulty,
            topic: variablesTopic,
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
            result.exercise.topicId,
            variablesTopic.id,
        );

        assert.equal(
            result.exercise.difficultyId,
            intermediateDifficulty.id,
        );

        assert.equal(
            result.exercise.languageId,
            javascriptLanguage.id,
        );

        assert.match(
            result.exercise.starterCode,
            /require\('node:fs'\)/,
        );

        assert.ok(
            result.exercise.solutionCode
                .length > 0,
        );

        assert.equal(
            result.exercise.testCases.length,
            3,
        );

        assert.equal(
            result.exercise.testCases[0]
                .isHidden,
            false,
        );

        assert.equal(
            result.exercise.testCases[2]
                .isHidden,
            true,
        );
    },
);

test(
    'generateMockExercise creates Python content',
    () => {
        const result = generateMockExercise({
            userId,
            variationKey:
                'python-functions-1',
            language: pythonLanguage,
            difficulty:
                intermediateDifficulty,
            topic: {
                ...variablesTopic,
                id: 4,
                name: 'funciones',
            },
        });

        assert.match(
            result.exercise.starterCode,
            /import sys/,
        );

        assert.match(
            result.exercise.solutionCode,
            /def transform/,
        );

        assert.equal(
            result.exercise.languageId,
            pythonLanguage.id,
        );
    },
);

test(
    'generateMockExercise supports every base topic',
    () => {
        const topics = [
            'variables',
            'condicionales',
            'ciclos',
            'funciones',
            'estructuras_de_datos',
        ];

        topics.forEach(
            (topicName, index) => {
                const result =
                    generateMockExercise({
                        userId,
                        variationKey:
                            `topic-${index}`,
                        language:
                            javascriptLanguage,
                        difficulty:
                            intermediateDifficulty,
                        topic: {
                            ...variablesTopic,
                            id: index + 1,
                            name: topicName,
                        },
                    });

                assert.ok(
                    result.exercise.title
                        .length > 0,
                );

                assert.ok(
                    result.exercise.statement
                        .length > 0,
                );

                assert.equal(
                    result.exercise.testCases
                        .length,
                    3,
                );
            },
        );
    },
);

test(
    'generateMockExercise varies generated content',
    () => {
        const first =
            generateMockExercise({
                userId,
                variationKey: 'attempt-1',
                language:
                    javascriptLanguage,
                difficulty:
                    intermediateDifficulty,
                topic: variablesTopic,
            });

        const second =
            generateMockExercise({
                userId,
                variationKey: 'attempt-a',
                language:
                    javascriptLanguage,
                difficulty:
                    intermediateDifficulty,
                topic: variablesTopic,
            });

        assert.notDeepEqual(
            first.exercise.testCases,
            second.exercise.testCases,
        );

        assert.notEqual(
            first.exercise
                .generationMetadata
                .variationKey,
            second.exercise
                .generationMetadata
                .variationKey,
        );
    },
);

test(
    'generateMockExercise validates required values',
    () => {
        assert.throws(
            () => generateMockExercise({
                userId: '',
                variationKey: 'attempt-1',
                language:
                    javascriptLanguage,
                difficulty:
                    intermediateDifficulty,
                topic: variablesTopic,
            }),
            /User ID must be a non-empty string/,
        );

        assert.throws(
            () => generateMockExercise({
                userId,
                variationKey: '',
                language:
                    javascriptLanguage,
                difficulty:
                    intermediateDifficulty,
                topic: variablesTopic,
            }),
            /Variation key must be a non-empty string/,
        );

        assert.throws(
            () => generateMockExercise({
                userId,
                variationKey: 'attempt-1',
                language: null,
                difficulty:
                    intermediateDifficulty,
                topic: variablesTopic,
            }),
            /Language is required/,
        );
    },
);
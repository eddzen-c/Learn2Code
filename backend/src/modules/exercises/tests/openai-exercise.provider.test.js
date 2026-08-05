import assert from 'node:assert/strict';
import {
    randomUUID,
} from 'node:crypto';
import test from 'node:test';

import {
    env,
} from '../../../config/env.js';

import {
    ExerciseGenerationFailedError,
} from '../errors/exercise.errors.js';

import {
    generateOpenAiExercise,
} from '../providers/openai-exercise.provider.js';

const createGenerationInput = () => ({
    userId:
        randomUUID(),

    variationKey:
        randomUUID(),

    language: {
        id: 1,
        name: 'JavaScript',
        slug: 'javascript',
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
    },
});

const generatedExercise = {
    title:
        'Contar números pares',

    statement:
        'Lee un número entero y muestra cuántos números pares existen desde uno hasta ese valor.',

    instructions:
        'Utiliza un ciclo y muestra únicamente el resultado solicitado.',

    starterCode:
        'const input = Number(prompt());\n// Escribe tu solución',

    solutionCode:
        'const input = Number(prompt());\nlet total = 0;\nfor (let index = 1; index <= input; index += 1) {\n    if (index % 2 === 0) total += 1;\n}\nconsole.log(total);',

    estimatedMinutes: 15,

    testCases: [
        {
            input: 4,
            expectedOutput: 2,
            isHidden: false,
        },
        {
            input: 7,
            expectedOutput: 3,
            isHidden: true,
        },
        {
            input: 10,
            expectedOutput: 5,
            isHidden: true,
        },
    ],
};

test(
    'generateOpenAiExercise creates a normalized exercise',
    async () => {
        const calls = [];

        const client = {
            responses: {
                parse:
                    async (parameters) => {
                        calls.push(parameters);

                        return {
                            id: 'response-1',
                            output_parsed:
                                generatedExercise,
                        };
                    },
            },
        };

        const input =
            createGenerationInput();

        const result =
            await generateOpenAiExercise({
                ...input,
                client,
            });

        assert.equal(
            result.provider,
            'openai',
        );

        assert.equal(
            result.model,
            env.ai.openAiModel,
        );

        assert.equal(
            result.exercise.topicId,
            input.topic.id,
        );

        assert.equal(
            result.exercise.difficultyId,
            input.difficulty.id,
        );

        assert.equal(
            result.exercise.languageId,
            input.language.id,
        );

        assert.deepEqual(
            result.exercise.testCases.map(
                (testCase) => testCase.position,
            ),
            [1, 2, 3],
        );

        assert.equal(
            result.exercise.testCases.reduce(
                (
                    total,
                    testCase,
                ) => (
                    total
                    + testCase.weight
                ),
                0,
            ),
            100,
        );

        assert.equal(
            result.exercise
                .generationMetadata
                .responseId,
            'response-1',
        );

        assert.equal(
            calls.length,
            1,
        );

        assert.equal(
            calls[0].model,
            env.ai.openAiModel,
        );

        assert.equal(
            calls[0].reasoning.effort,
            env.ai.openAiReasoningEffort,
        );

        assert.equal(
            calls[0].store,
            false,
        );

        assert.equal(
            calls[0]
                .safety_identifier
                .length,
            64,
        );

        assert.ok(
            calls[0].text.format,
        );
    },
);

test(
    'generateOpenAiExercise rejects an empty response',
    async () => {
        const client = {
            responses: {
                parse:
                    async () => ({
                        id: 'response-2',
                        output_parsed: null,
                    }),
            },
        };

        await assert.rejects(
            () => generateOpenAiExercise({
                ...createGenerationInput(),
                client,
            }),
            (error) => {
                assert.ok(
                    error instanceof
                    ExerciseGenerationFailedError,
                );

                assert.equal(
                    error.code,
                    'EXERCISE_GENERATION_FAILED',
                );

                return true;
            },
        );
    },
);

test(
    'generateOpenAiExercise requires a public test case',
    async () => {
        const client = {
            responses: {
                parse:
                    async () => ({
                        id: 'response-3',

                        output_parsed: {
                            ...generatedExercise,

                            testCases:
                                generatedExercise
                                    .testCases
                                    .map(
                                        (testCase) => ({
                                            ...testCase,
                                            isHidden: true,
                                        }),
                                    ),
                        },
                    }),
            },
        };

        await assert.rejects(
            () => generateOpenAiExercise({
                ...createGenerationInput(),
                client,
            }),
            ExerciseGenerationFailedError,
        );
    },
);

test(
    'generateOpenAiExercise wraps provider failures',
    async () => {
        const client = {
            responses: {
                parse:
                    async () => {
                        throw new Error(
                            'OpenAI unavailable',
                        );
                    },
            },
        };

        await assert.rejects(
            () => generateOpenAiExercise({
                ...createGenerationInput(),
                client,
            }),
            ExerciseGenerationFailedError,
        );
    },
);

test(
    'generateOpenAiExercise validates its input',
    async () => {
        await assert.rejects(
            () => generateOpenAiExercise({
                ...createGenerationInput(),
                userId: '',
                client: {},
            }),
            /User ID must be a non-empty string/,
        );
    },
);
import {
    createHash,
} from 'node:crypto';

import OpenAI from 'openai';

import {
    zodTextFormat,
} from 'openai/helpers/zod';

import {
    z,
} from 'zod';

import {
    env,
} from '../../../config/env.js';

import {
    ExerciseGenerationFailedError,
    ExerciseProviderUnavailableError,
} from '../errors/exercise.errors.js';

const PROMPT_VERSION =
    'learn2code-openai-exercise-v1';

const testCaseValueSchema =
    z.union([
        z.string(),
        z.number(),
        z.boolean(),
    ]);

const generatedExerciseSchema =
    z.object({
        title:
            z.string()
                .min(5)
                .max(120),

        statement:
            z.string()
                .min(20)
                .max(2_000),

        instructions:
            z.string()
                .min(10)
                .max(1_500),

        starterCode:
            z.string()
                .min(1)
                .max(10_000),

        solutionCode:
            z.string()
                .min(1)
                .max(10_000),

        estimatedMinutes:
            z.number()
                .int()
                .min(5)
                .max(60),

        testCases:
            z.array(
                z.object({
                    input:
                        testCaseValueSchema,

                    expectedOutput:
                        testCaseValueSchema,

                    isHidden:
                        z.boolean(),
                }),
            )
                .min(3)
                .max(6),
    });

const validateGenerationInput = ({
    userId,
    variationKey,
    language,
    difficulty,
    topic,
}) => {
    if (
        typeof userId !== 'string'
        || userId.trim().length === 0
    ) {
        throw new TypeError(
            'User ID must be a non-empty string',
        );
    }

    if (
        typeof variationKey !== 'string'
        || variationKey.trim().length === 0
    ) {
        throw new TypeError(
            'Variation key must be a non-empty string',
        );
    }

    if (!language || typeof language !== 'object') {
        throw new TypeError(
            'Language is required',
        );
    }

    if (
        !difficulty
        || typeof difficulty !== 'object'
    ) {
        throw new TypeError(
            'Difficulty is required',
        );
    }

    if (!topic || typeof topic !== 'object') {
        throw new TypeError(
            'Topic is required',
        );
    }
};

const createSafetyIdentifier = (userId) => (
    createHash('sha256')
        .update(userId)
        .digest('hex')
);

const createOpenAiClient = () => {
    if (!env.ai.openAiApiKey) {
        throw new ExerciseProviderUnavailableError(
            'openai',
        );
    }

    return new OpenAI({
        apiKey:
            env.ai.openAiApiKey,

        timeout:
            env.ai.requestTimeoutMs,

        maxRetries: 1,
    });
};

const createPromptInput = ({
    variationKey,
    language,
    difficulty,
    topic,
}) => (
    JSON.stringify(
        {
            variationKey,

            language: {
                name:
                    language.name,
                slug:
                    language.slug
                    ?? null,
                fileExtension:
                    language.fileExtension
                    ?? null,
            },

            difficulty: {
                name:
                    difficulty.name,
            },

            topic: {
                name:
                    topic.name,
                description:
                    topic.description
                    ?? null,
                masteryScore:
                    topic.masteryScore
                    ?? null,
                confidenceScore:
                    topic.confidenceScore
                    ?? null,
            },
        },
        null,
        2,
    )
);

const createTestCaseWeight = ({
    index,
    total,
}) => {
    const baseWeight =
        Math.floor(100 / total);

    if (index === total - 1) {
        return 100
            - baseWeight
            * (total - 1);
    }

    return baseWeight;
};

const normalizeTestCases = (testCases) => {
    if (
        !testCases.some(
            (testCase) => !testCase.isHidden,
        )
    ) {
        throw new ExerciseGenerationFailedError();
    }

    return Object.freeze(
        testCases.map(
            (
                testCase,
                index,
            ) => (
                Object.freeze({
                    position:
                        index + 1,
                    input:
                        testCase.input,
                    expectedOutput:
                        testCase.expectedOutput,
                    isHidden:
                        testCase.isHidden,
                    weight:
                        createTestCaseWeight({
                            index,
                            total:
                                testCases.length,
                        }),
                })
            ),
        ),
    );
};

const SYSTEM_INSTRUCTIONS = `
Eres el generador de ejercicios personalizados de Learn2Code.

Genera un único ejercicio de programación en español usando exclusivamente
el lenguaje, dificultad y tema proporcionados.

El ejercicio debe:
- ser apropiado para estudiantes principiantes o intermedios;
- usar entrada estándar y salida estándar;
- tener instrucciones claras y verificables;
- incluir código inicial incompleto;
- incluir una solución de referencia funcional;
- incluir entre 3 y 6 casos de prueba;
- incluir por lo menos un caso público;
- marcar los casos adicionales como ocultos;
- evitar librerías externas, archivos, red y entrada interactiva;
- producir solamente los datos solicitados por el esquema.
`.trim();

export const generateOpenAiExercise =
    async ({
        userId,
        variationKey,
        language,
        difficulty,
        topic,
        client = null,
    }) => {
        validateGenerationInput({
            userId,
            variationKey,
            language,
            difficulty,
            topic,
        });

        try {
            const openAiClient =
                client
                ?? createOpenAiClient();

            const response =
                await openAiClient
                    .responses
                    .parse({
                        model:
                            env.ai.openAiModel,

                        reasoning: {
                            effort:
                                env.ai
                                    .openAiReasoningEffort,
                        },

                        instructions:
                            SYSTEM_INSTRUCTIONS,

                        input:
                            createPromptInput({
                                variationKey,
                                language,
                                difficulty,
                                topic,
                            }),

                        text: {
                            format:
                                zodTextFormat(
                                    generatedExerciseSchema,
                                    'personalized_exercise',
                                ),
                        },

                        max_output_tokens:
                            6_000,

                        store: false,

                        safety_identifier:
                            createSafetyIdentifier(
                                userId,
                            ),
                    });

            const generated =
                response.output_parsed;

            if (!generated) {
                throw new ExerciseGenerationFailedError();
            }

            const testCases =
                normalizeTestCases(
                    generated.testCases,
                );

            return Object.freeze({
                provider: 'openai',
                model:
                    env.ai.openAiModel,

                exercise: Object.freeze({
                    topicId:
                        topic.id,
                    difficultyId:
                        difficulty.id,
                    languageId:
                        language.id,
                    title:
                        generated.title,
                    statement:
                        generated.statement,
                    instructions:
                        generated.instructions,
                    starterCode:
                        generated.starterCode,
                    solutionCode:
                        generated.solutionCode,
                    estimatedMinutes:
                        generated
                            .estimatedMinutes,
                    testCases,

                    generationMetadata:
                        Object.freeze({
                            promptVersion:
                                PROMPT_VERSION,
                            variationKey,
                            responseId:
                                response.id
                                ?? null,
                        }),
                }),
            });
        } catch (error) {
            if (
                error
                instanceof ExerciseGenerationFailedError
                || error
                instanceof ExerciseProviderUnavailableError
            ) {
                throw error;
            }

            throw new ExerciseGenerationFailedError();
        }
    };
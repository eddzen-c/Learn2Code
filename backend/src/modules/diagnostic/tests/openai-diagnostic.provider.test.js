import assert from 'node:assert/strict';
import test from 'node:test';

import {
    DiagnosticGenerationFailedError,
} from '../errors/diagnostic.errors.js';

import {
    generateOpenAiDiagnosticQuestions,
} from '../providers/openai-diagnostic.provider.js';

const language = Object.freeze({
    id: 1,
    name: 'JavaScript',
});

const topics = Object.freeze([
    Object.freeze({
        id: 1,
        name: 'variables',
    }),
    Object.freeze({
        id: 2,
        name: 'condicionales',
    }),
]);

const difficultyLevels = Object.freeze([
    Object.freeze({
        id: 1,
        name: 'básico',
    }),
    Object.freeze({
        id: 2,
        name: 'intermedio',
    }),
]);

const onboardingContext = Object.freeze({
    learningGoal:
        'career_preparation',

    studyPace:
        'student',

    weeklyTimeCommitment:
        'five_to_ten',

    learningStyle:
        'practical',

    projectIdea:
        'Crear un portafolio interactivo',

    technologyInterestKeys:
        Object.freeze([
            'javascript',
            'react',
        ]),

    interestKeys:
        Object.freeze([
            'video_games',
        ]),

    selfAssessedDifficultyId: 1,

    topicIds:
        Object.freeze([
            1,
            2,
        ]),
});

const generatedDiagnostic = {
    questions: [
        {
            topicId: 2,
            difficultyLevelId: 2,
            position: 2,
            technologyKey:
                'react',
            questionType:
                'multiple_choice',
            prompt:
                '¿Qué propiedad debe utilizarse como identificador estable al renderizar una lista de componentes en React?',
            starterCode: null,
            options: [
                'key',
                'id',
                'name',
            ],
            expectedAnswer:
                'key',
            explanation:
                'React utiliza la propiedad key para identificar de manera estable los elementos de una lista.',
        },
        {
            topicId: 1,
            difficultyLevelId: 1,
            position: 1,
            technologyKey:
                'javascript',
            questionType:
                'code_output',
            prompt:
                '¿Qué resultado muestra este código de JavaScript?',
            starterCode:
                'let value = 2;\nvalue += 3;\nconsole.log(value);',
            options: [
                '2',
                '3',
                '5',
            ],
            expectedAnswer: '5',
            explanation:
                'La variable termina almacenando la suma de 2 y 3.',
        },
    ],
};

const createClient = ({
    outputParsed =
    generatedDiagnostic,
    error = null,
} = {}) => {
    const calls = [];

    return {
        calls,

        responses: {
            parse: async (parameters) => {
                calls.push(parameters);

                if (error) {
                    throw error;
                }

                return {
                    id:
                        'response-diagnostic-1',
                    output_parsed:
                        outputParsed,
                };
            },
        },
    };
};

const createInput = (
    overrides = {},
) => ({
    userId: 'user-1',
    variationKey:
        'user-1:attempt-1',
    language,
    topics,
    difficultyLevels,
    onboardingContext,
    questionCount: 2,
    ...overrides,
});

test(
    'generateOpenAiDiagnosticQuestions creates normalized questions',
    async () => {
        const client = createClient();

        const result =
            await generateOpenAiDiagnosticQuestions({
                ...createInput(),
                client,
            });

        assert.equal(
            result.provider,
            'openai',
        );

        assert.equal(
            result.responseId,
            'response-diagnostic-1',
        );

        assert.equal(
            result.promptVersion,
            'learn2code-openai-diagnostic-v3',
        );

        assert.equal(
            result.questions.length,
            2,
        );

        assert.deepEqual(
            result.questions.map(
                (question) => (
                    question.position
                ),
            ),
            [
                1,
                2,
            ],
        );

        assert.equal(
            result.questions[0]
                .technologyKey,
            'javascript',
        );

        assert.equal(
            result.questions[0]
                .questionType,
            'code_output',
        );

        assert.equal(
            result.questions[1]
                .technologyKey,
            'react',
        );

        assert.equal(
            result.questions[1]
                .questionType,
            'multiple_choice',
        );

        assert.equal(
            result.questions[0]
                .starterCode,
            'let value = 2;\nvalue += 3;\nconsole.log(value);',
        );

        assert.equal(
            result.questions[1]
                .starterCode,
            null,
        );

        assert.deepEqual(
            result.questions[0]
                .evaluationCriteria,
            {
                mode: 'exact_match',
                caseSensitive: false,
                maximumScore: 100,
            },
        );

        assert.equal(
            result.questions[0]
                .contentFingerprint
                .length,
            64,
        );

        assert.equal(
            Object.isFrozen(
                result.questions,
            ),
            true,
        );

        assert.equal(
            Object.isFrozen(
                result.questions[0],
            ),
            true,
        );
    },
);

test(
    'generateOpenAiDiagnosticQuestions sends structured context',
    async () => {
        const client = createClient();

        await generateOpenAiDiagnosticQuestions({
            ...createInput(),
            client,
        });

        assert.equal(
            client.calls.length,
            1,
        );

        const request =
            client.calls[0];

        assert.equal(
            request.store,
            false,
        );

        assert.equal(
            request.safety_identifier.length,
            64,
        );

        assert.ok(
            request.text.format,
        );

        const promptInput =
            JSON.parse(
                request.input,
            );

        assert.equal(
            promptInput.variationKey,
            'user-1:attempt-1',
        );

        assert.equal(
            promptInput.questionCount,
            2,
        );

        assert.equal(
            promptInput.language.name,
            'JavaScript',
        );

        assert.deepEqual(
            promptInput.studentProfile,
            onboardingContext,
        );
    },
);

test(
    'generateOpenAiDiagnosticQuestions rejects an empty response',
    async () => {
        const client = createClient({
            outputParsed: null,
        });

        await assert.rejects(
            () => (
                generateOpenAiDiagnosticQuestions({
                    ...createInput(),
                    client,
                })
            ),
            DiagnosticGenerationFailedError,
        );
    },
);

test(
    'generateOpenAiDiagnosticQuestions rejects code questions without starter code',
    async () => {
        const client = createClient({
            outputParsed: {
                questions:
                    generatedDiagnostic
                        .questions
                        .map(
                            (question) => (
                                question.questionType
                                    === 'code_output'
                                    ? {
                                        ...question,
                                        starterCode:
                                            null,
                                    }
                                    : question
                            ),
                        ),
            },
        });

        await assert.rejects(
            () => (
                generateOpenAiDiagnosticQuestions({
                    ...createInput(),
                    client,
                })
            ),
            DiagnosticGenerationFailedError,
        );
    },
);

test(
    'generateOpenAiDiagnosticQuestions rejects invalid answer options',
    async () => {
        const client = createClient({
            outputParsed: {
                questions:
                    generatedDiagnostic
                        .questions
                        .map(
                            (
                                question,
                                index,
                            ) => (
                                index === 0
                                    ? {
                                        ...question,
                                        expectedAnswer:
                                            'Unsupported',
                                    }
                                    : question
                            ),
                        ),
            },
        });

        await assert.rejects(
            () => (
                generateOpenAiDiagnosticQuestions({
                    ...createInput(),
                    client,
                })
            ),
            DiagnosticGenerationFailedError,
        );
    },
);

test(
    'generateOpenAiDiagnosticQuestions wraps provider failures',
    async () => {
        const client = createClient({
            error:
                new Error(
                    'Provider unavailable',
                ),
        });

        await assert.rejects(
            () => (
                generateOpenAiDiagnosticQuestions({
                    ...createInput(),
                    client,
                })
            ),
            DiagnosticGenerationFailedError,
        );
    },
);

test(
    'generateOpenAiDiagnosticQuestions validates its input',
    async () => {
        const client = createClient();

        await assert.rejects(
            () => (
                generateOpenAiDiagnosticQuestions({
                    ...createInput({
                        userId: '',
                    }),
                    client,
                })
            ),
            TypeError,
        );

        await assert.rejects(
            () => (
                generateOpenAiDiagnosticQuestions({
                    ...createInput({
                        onboardingContext: {
                            unexpected: true,
                        },
                    }),
                    client,
                })
            ),
            TypeError,
        );

        assert.equal(
            client.calls.length,
            0,
        );
    },
);

test(
    'generateOpenAiDiagnosticQuestions rejects an unselected technology',
    async () => {
        const client = createClient({
            outputParsed: {
                questions:
                    generatedDiagnostic
                        .questions
                        .map(
                            (
                                question,
                                index,
                            ) => (
                                index === 0
                                    ? {
                                        ...question,

                                        technologyKey:
                                            'nodejs',
                                    }
                                    : question
                            ),
                        ),
            },
        });

        await assert.rejects(
            () => (
                generateOpenAiDiagnosticQuestions({
                    ...createInput(),
                    client,
                })
            ),
            DiagnosticGenerationFailedError,
        );
    },
);

test(
    'generateOpenAiDiagnosticQuestions rejects an unbalanced technology distribution',
    async () => {
        const client = createClient({
            outputParsed: {
                questions:
                    generatedDiagnostic
                        .questions
                        .map(
                            (question) => ({
                                ...question,

                                technologyKey:
                                    'javascript',
                            }),
                        ),
            },
        });

        await assert.rejects(
            () => (
                generateOpenAiDiagnosticQuestions({
                    ...createInput(),
                    client,
                })
            ),
            DiagnosticGenerationFailedError,
        );
    },
);

test(
    'generateOpenAiDiagnosticQuestions rejects an unsupported question type',
    async () => {
        const client = createClient({
            outputParsed: {
                questions:
                    generatedDiagnostic
                        .questions
                        .map(
                            (
                                question,
                                index,
                            ) => (
                                index === 0
                                    ? {
                                        ...question,

                                        questionType:
                                            'coding',
                                    }
                                    : question
                            ),
                        ),
            },
        });

        await assert.rejects(
            () => (
                generateOpenAiDiagnosticQuestions({
                    ...createInput(),
                    client,
                })
            ),
            DiagnosticGenerationFailedError,
        );
    },
);

test(
    'generateOpenAiDiagnosticQuestions supports legacy profiles without technologies',
    async () => {
        const legacyOnboardingContext =
            Object.freeze({
                ...onboardingContext,

                technologyInterestKeys:
                    Object.freeze([]),
            });

        const client = createClient({
            outputParsed: {
                questions:
                    generatedDiagnostic
                        .questions
                        .map(
                            (question) => ({
                                ...question,

                                technologyKey:
                                    null,
                            }),
                        ),
            },
        });

        const result =
            await generateOpenAiDiagnosticQuestions({
                ...createInput({
                    onboardingContext:
                        legacyOnboardingContext,
                }),
                client,
            });

        assert.deepEqual(
            result.questions.map(
                (question) => (
                    question.technologyKey
                ),
            ),
            [
                null,
                null,
            ],
        );
    },
);
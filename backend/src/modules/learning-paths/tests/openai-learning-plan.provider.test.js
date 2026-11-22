
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    generateOpenAiLearningPlan,
} from '../providers/openai-learning-plan.provider.js';

const onboarding = {
    learningGoal: 'career_preparation',
    weeklyTimeCommitment: 'five_to_ten',
    learningStyle: 'practical',
    technologyInterestKeys: [
        'javascript',
        'react',
    ],
    projectIdea: 'Crear mi portafolio',
};

const diagnostic = {
    overallScore: 62.5,
    difficultyName: 'intermedio',
    topicScores: [
        {
            topicId: 1,
            masteryScore: 100,
        },
        {
            topicId: 2,
            masteryScore: 50,
        },
        {
            topicId: 3,
            masteryScore: 0,
        },
    ],
    technologyScores: [
        {
            technologyKey: 'javascript',
            scorePercentage: 50,
        },
        {
            technologyKey: 'react',
            scorePercentage: 75,
        },
    ],
};

const topics = [
    { id: 1, name: 'variables' },
    { id: 2, name: 'condicionales' },
    { id: 3, name: 'ciclos' },
    { id: 4, name: 'funciones' },
    { id: 5, name: 'estructuras_de_datos' },
];

const generatedPlan = {
    specializationKey: 'frontend',

    title: 'Ruta Frontend personalizada',

    description:
        'Plan para fortalecer fundamentos y avanzar hacia el desarrollo de interfaces.',

    reason:
        'El estudiante tiene interés en React y debe reforzar algunos fundamentos.',

    estimatedWeeks: 12,

    steps: [
        {
            topicId: 3,
            title: 'Reforzar ciclos',
            description:
                'Practica estructuras repetitivas mediante ejercicios progresivos.',
        },
        {
            topicId: 2,
            title: 'Dominar condicionales',
            description:
                'Resuelve problemas utilizando decisiones y expresiones lógicas.',
        },
        {
            topicId: 4,
            title: 'Trabajar con funciones',
            description:
                'Construye soluciones organizadas mediante funciones reutilizables.',
        },
    ],
};

function createMockClient(outputParsed = generatedPlan) {
    const calls = [];

    return {
        calls,

        responses: {
            parse: async (parameters) => {
                calls.push(parameters);

                return {
                    id: 'response-plan-test',
                    output_parsed: outputParsed,
                };
            },
        },
    };
}

function createInput(client, overrides = {}) {
    return {
        onboarding,
        diagnostic,
        topics,
        client,
        ...overrides,
    };
}

test('generates a personalized learning plan', async () => {
    const client = createMockClient();

    const result = await generateOpenAiLearningPlan(
        createInput(client),
    );

    assert.equal(result.provider, 'openai');

    assert.equal(
        result.plan.specializationKey,
        'frontend',
    );

    assert.equal(result.plan.estimatedWeeks, 12);

    assert.equal(result.plan.steps.length, 3);

    assert.deepEqual(
        result.plan.steps.map((step) => step.position),
        [1, 2, 3],
    );
});

test('sends onboarding and diagnostic results together', async () => {
    const client = createMockClient();

    await generateOpenAiLearningPlan(
        createInput(client),
    );

    assert.equal(client.calls.length, 1);

    const request = client.calls[0];
    const input = JSON.parse(request.input);

    assert.equal(
        input.onboarding.learningGoal,
        'career_preparation',
    );

    assert.deepEqual(
        input.onboarding.technologyInterestKeys,
        ['javascript', 'react'],
    );

    assert.equal(
        input.diagnostic.overallScore,
        62.5,
    );

    assert.equal(
        input.diagnostic.difficultyName,
        'intermedio',
    );

    assert.equal(input.availableTopics.length, 5);

    assert.equal(request.store, false);
});

test('rejects nonexistent topic identifiers', async () => {
    const client = createMockClient({
        ...generatedPlan,
        steps: [
            {
                ...generatedPlan.steps[0],
                topicId: 999,
            },
            ...generatedPlan.steps.slice(1),
        ],
    });

    await assert.rejects(
        generateOpenAiLearningPlan(createInput(client)),
        /tema inexistente/,
    );
});

test('rejects an invalid specialization', async () => {
    const client = createMockClient({
        ...generatedPlan,
        specializationKey: 'javascript',
    });

    await assert.rejects(
        generateOpenAiLearningPlan(createInput(client)),
        /formato inválido/,
    );
});

test('requires onboarding information', async () => {
    const client = createMockClient();

    await assert.rejects(
        generateOpenAiLearningPlan(
            createInput(client, {
                onboarding: null,
            }),
        ),
        TypeError,
    );

    assert.equal(client.calls.length, 0);
});

test('requires valid diagnostic results', async () => {
    const client = createMockClient();

    await assert.rejects(
        generateOpenAiLearningPlan(
            createInput(client, {
                diagnostic: {
                    ...diagnostic,
                    overallScore: -10,
                },
            }),
        ),
        TypeError,
    );
});

test('requires a valid topic catalog', async () => {
    const client = createMockClient();

    await assert.rejects(
        generateOpenAiLearningPlan(
            createInput(client, {
                topics: [],
            }),
        ),
        TypeError,
    );
});
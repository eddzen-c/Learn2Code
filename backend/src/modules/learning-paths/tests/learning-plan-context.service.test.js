
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    getLearningPlanContext,
} from '../services/learning-plan-context.service.js';

const onboarding = {
    language: {
        id: 1,
        name: 'JavaScript',
    },

    learningGoal: 'career_preparation',
    weeklyTimeCommitment: 'less_than_5',
    learningStyle: 'practical',

    technologyInterestKeys: [
        'javascript',
        'react',
    ],

    projectIdea: 'Crear un portafolio',
};

const diagnostic = {
    state: 'completed',

    assessment: {
        id: 'assessment-test',
        status: 'completed',
        questionCount: 8,
    },

    result: {
        overallScore: 62.5,

        resultingDifficulty: {
            id: 2,
            name: 'intermedio',
        },
    },
};

function createDependencies(overrides = {}) {
    const values = {
        onboarding,
        diagnostic,

        topics: [
            { id: 1, name: 'variables' },
            { id: 2, name: 'condicionales' },
            { id: 3, name: 'ciclos' },
            { id: 4, name: 'funciones' },
            { id: 5, name: 'estructuras_de_datos' },
        ],

        topicScores: [
            {
                topicId: 1,
                masteryScore: 100,
            },
            {
                topicId: 2,
                masteryScore: 50,
            },
        ],

        technologyScores: [
            {
                technologyKey: 'javascript',
                scorePercentage: 50,
            },
        ],

        ...overrides,
    };

    return {
        findStudentOnboardingByUserId:
            async () => values.onboarding,

        getCurrentDiagnostic:
            async () => values.diagnostic,

        listActiveTopics:
            async () => values.topics,

        listDiagnosticTopicScores:
            async () => values.topicScores,

        listDiagnosticTechnologyScores:
            async () => values.technologyScores,
    };
}

test('combines onboarding and completed diagnostic', async () => {
    const result = await getLearningPlanContext({
        userId: 'student-test',
        client: {},
        dependencies: createDependencies(),
    });

    assert.equal(result.state, 'ready');

    assert.equal(
        result.assessmentId,
        'assessment-test',
    );

    assert.equal(
        result.diagnostic.overallScore,
        62.5,
    );

    assert.equal(
        result.diagnostic.difficultyName,
        'intermedio',
    );

    assert.equal(
        result.onboarding.learningGoal,
        'career_preparation',
    );

    assert.equal(result.languageId, 1);
    assert.equal(result.difficultyId, 2);
    assert.equal(result.topics.length, 5);
});

test('requires completed onboarding', async () => {
    const result = await getLearningPlanContext({
        userId: 'student-test',
        client: {},

        dependencies: createDependencies({
            onboarding: null,
        }),
    });

    assert.equal(
        result.state,
        'onboarding_required',
    );
});

test('does not generate a plan from an unfinished exam', async () => {
    const result = await getLearningPlanContext({
        userId: 'student-test',
        client: {},

        dependencies: createDependencies({
            diagnostic: {
                ...diagnostic,
                state: 'in_progress',
                result: null,
            },
        }),
    });

    assert.equal(
        result.state,
        'diagnostic_required',
    );
});

test('rejects a missing topic catalog', async () => {
    await assert.rejects(
        getLearningPlanContext({
            userId: 'student-test',
            client: {},

            dependencies: createDependencies({
                topics: [],
            }),
        }),
        /catálogo de temas/,
    );
});

test('requires a student identifier', async () => {
    await assert.rejects(
        getLearningPlanContext({
            userId: '',
            client: {},
            dependencies: createDependencies(),
        }),
        TypeError,
    );
});

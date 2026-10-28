
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    getCurrentLearningPlan,
    generateLearningPlan,
    confirmStudentLearningPlan,
} from '../services/learning-path.service.js';

const userId = 'student-1';

const context = {
    state: 'ready',
    assessmentId: 'assessment-1',
    languageId: 1,
    difficultyId: 2,

    onboarding: {
        learningGoal: 'career_preparation',
        weeklyTimeCommitment: 'five_to_ten',
        technologyInterestKeys: ['javascript', 'react'],
    },

    diagnostic: {
        overallScore: 62.5,
        difficultyName: 'intermedio',
        topicScores: [],
        technologyScores: [],
    },

    topics: [
        { id: 1, name: 'variables' },
        { id: 2, name: 'condicionales' },
        { id: 3, name: 'funciones' },
    ],
};

const generation = {
    provider: 'openai',
    model: 'test-model',
    responseId: 'response-test',

    plan: {
        specializationKey: 'frontend',
        title: 'Ruta Frontend personalizada',
        description: 'Ruta adaptada al estudiante.',
        reason: 'Interés en React y áreas por reforzar.',
        estimatedWeeks: 12,

        steps: [
            {
                topicId: 1,
                position: 1,
                title: 'Variables',
                description: 'Reforzar fundamentos.',
            },
            {
                topicId: 2,
                position: 2,
                title: 'Condicionales',
                description: 'Practicar decisiones.',
            },
            {
                topicId: 3,
                position: 3,
                title: 'Funciones',
                description: 'Reutilizar código.',
            },
        ],
    },
};

function makePlan(confirmedAt = null) {
    return {
        id: 'path-1',
        userId,
        assessmentId: context.assessmentId,
        specializationKey: 'frontend',
        title: generation.plan.title,
        description: generation.plan.description,
        reason: generation.plan.reason,
        estimatedWeeks: 12,
        confirmedAt,
        steps: generation.plan.steps,
    };
}

function createHarness({
    contextResult = context,
    existingPlan = null,
    generationGate = null,
} = {}) {
    let storedPlan = existingPlan;

    const calls = {
        find: 0,
        ai: 0,
        save: 0,
        confirm: 0,
        aiInput: null,
    };

    const deps = {
        getLearningPlanContext: async () => contextResult,

        findLearningPathByDiagnostic: async () => {
            calls.find += 1;
            return storedPlan;
        },

        generateOpenAiLearningPlan: async (input) => {
            calls.ai += 1;
            calls.aiInput = input;

            if (generationGate) {
                await generationGate;
            }

            return generation;
        },

        saveGeneratedLearningPath: async () => {
            calls.save += 1;
            storedPlan = makePlan();
            return storedPlan;
        },

        confirmLearningPath: async ({
            userId: requestedUserId,
            assessmentId,
            pathId,
        }) => {
            calls.confirm += 1;

            if (
                !storedPlan
                || requestedUserId !== userId
                || assessmentId !== context.assessmentId
                || pathId !== storedPlan.id
            ) {
                return null;
            }

            storedPlan = makePlan(
                '2026-10-27T18:00:00.000Z',
            );

            return storedPlan;
        },
    };

    return { deps, calls };
}

test('returns not_generated when there is no plan', async () => {
    const harness = createHarness();

    const result = await getCurrentLearningPlan({
        userId,
        deps: harness.deps,
    });

    assert.equal(result.state, 'not_generated');
    assert.equal(result.plan, null);
});

test('recovers an existing recommendation', async () => {
    const harness = createHarness({
        existingPlan: makePlan(),
    });

    const result = await getCurrentLearningPlan({
        userId,
        deps: harness.deps,
    });

    assert.equal(result.state, 'recommended');
    assert.equal(result.plan.id, 'path-1');
    assert.equal(harness.calls.ai, 0);
});

test('recognizes a confirmed plan', async () => {
    const harness = createHarness({
        existingPlan: makePlan(
            '2026-10-27T18:00:00.000Z',
        ),
    });

    const result = await getCurrentLearningPlan({
        userId,
        deps: harness.deps,
    });

    assert.equal(result.state, 'confirmed');
});

test('generates using both student information sources', async () => {
    const harness = createHarness();

    const result = await generateLearningPlan({
        userId,
        deps: harness.deps,
    });

    assert.equal(result.state, 'recommended');
    assert.equal(result.plan.specializationKey, 'frontend');

    assert.equal(harness.calls.ai, 1);
    assert.equal(harness.calls.save, 1);

    assert.deepEqual(
        harness.calls.aiInput.onboarding,
        context.onboarding,
    );

    assert.deepEqual(
        harness.calls.aiInput.diagnostic,
        context.diagnostic,
    );
});

test('reuses a saved plan without calling OpenAI again', async () => {
    const harness = createHarness();

    const first = await generateLearningPlan({
        userId,
        deps: harness.deps,
    });

    const second = await generateLearningPlan({
        userId,
        deps: harness.deps,
    });

    assert.equal(first.plan.id, second.plan.id);
    assert.equal(harness.calls.ai, 1);
    assert.equal(harness.calls.save, 1);
});

test('shares an in-progress generation', async () => {
    let releaseGeneration;

    const gate = new Promise((resolve) => {
        releaseGeneration = resolve;
    });

    const harness = createHarness({
        generationGate: gate,
    });

    const requests = [
        generateLearningPlan({
            userId,
            deps: harness.deps,
        }),

        generateLearningPlan({
            userId,
            deps: harness.deps,
        }),
    ];

    releaseGeneration();

    const [first, second] = await Promise.all(requests);

    assert.equal(first.plan.id, second.plan.id);
    assert.equal(harness.calls.ai, 1);
    assert.equal(harness.calls.save, 1);
});

test('does not generate without a completed diagnostic', async () => {
    const harness = createHarness({
        contextResult: {
            state: 'diagnostic_required',
            assessmentId: null,
        },
    });

    const result = await generateLearningPlan({
        userId,
        deps: harness.deps,
    });

    assert.equal(result.state, 'diagnostic_required');
    assert.equal(result.plan, null);
    assert.equal(harness.calls.ai, 0);
    assert.equal(harness.calls.save, 0);
});

test('confirms the correct student plan', async () => {
    const harness = createHarness({
        existingPlan: makePlan(),
    });

    const result = await confirmStudentLearningPlan({
        userId,
        pathId: 'path-1',
        deps: harness.deps,
    });

    assert.equal(result.state, 'confirmed');
    assert.ok(result.plan.confirmedAt);
    assert.equal(harness.calls.confirm, 1);
});

test('rejects confirmation of another plan', async () => {
    const harness = createHarness({
        existingPlan: makePlan(),
    });

    await assert.rejects(
        confirmStudentLearningPlan({
            userId,
            pathId: 'another-path',
            deps: harness.deps,
        }),
        (error) => {
            assert.equal(error.statusCode, 404);
            assert.equal(
                error.code,
                'LEARNING_PATH_NOT_FOUND',
            );

            return true;
        },
    );
});

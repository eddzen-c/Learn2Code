
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    findLearningPathByDiagnostic,
    saveGeneratedLearningPath,
} from '../repositories/learning-path.repository.js';

const userId = 'student-test';
const assessmentId = 'assessment-test';

const context = {
    state: 'ready',
    assessmentId,
    languageId: 1,
    difficultyId: 2,
    topics: [
        { id: 1, name: 'variables' },
        { id: 2, name: 'condicionales' },
        { id: 3, name: 'ciclos' },
        { id: 4, name: 'funciones' },
        { id: 5, name: 'estructuras_de_datos' },
    ],
};

const generation = {
    provider: 'openai',
    model: 'test-model',
    responseId: 'response-123',
    plan: {
        specializationKey: 'frontend',
        title: 'Ruta Frontend personalizada',
        description:
            'Plan personalizado para desarrollar interfaces web.',
        reason:
            'Los intereses y resultados indican afinidad con Frontend.',
        estimatedWeeks: 12,
        steps: [
            {
                topicId: 3,
                title: 'Practicar ciclos',
                description:
                    'Reforzar ciclos mediante ejercicios prácticos.',
            },
            {
                topicId: 2,
                title: 'Reforzar condicionales',
                description:
                    'Resolver problemas usando decisiones lógicas.',
            },
            {
                topicId: 4,
                title: 'Dominar funciones',
                description:
                    'Construir funciones reutilizables en proyectos.',
            },
        ],
    },
};

function createStoredPath() {
    return {
        id: 'path-test',
        user_id: userId,
        diagnostic_assessment_id: assessmentId,
        language_id: 1,
        difficulty_id: 2,
        specialization_key: 'frontend',
        title: generation.plan.title,
        description: generation.plan.description,
        reason: generation.plan.reason,
        estimated_weeks: 12,
        generation_metadata: {
            provider: 'openai',
            model: 'test-model',
        },
        status: 'active',
        confirmed_at: null,
        created_at: new Date('2026-10-27T12:00:00Z'),
    };
}

function createDatabase({
    existing = false,
    failAtPosition = null,
} = {}) {
    let pathRow = existing
        ? createStoredPath()
        : null;

    let stepRows = existing
        ? generation.plan.steps.map((step, index) => ({
            id: `step-${index + 1}`,
            topic_id: step.topicId,
            position: index + 1,
            title: step.title,
            description: step.description,
            status: 'pending',
            completed_at: null,
        }))
        : [];

    const calls = [];
    let released = false;

    const client = {
        async query(statement) {
            const sql = typeof statement === 'string'
                ? statement
                : statement.text;

            const values = typeof statement === 'string'
                ? []
                : statement.values ?? [];

            calls.push({ sql, values });

            if (sql.includes('FROM learning_paths')) {
                return {
                    rows: pathRow ? [pathRow] : [],
                };
            }

            if (sql.includes('FROM learning_path_steps')) {
                return {
                    rows: [...stepRows],
                };
            }

            if (sql.includes('INSERT INTO learning_paths')) {
                pathRow = {
                    ...createStoredPath(),
                    user_id: values[0],
                    diagnostic_assessment_id: values[1],
                    language_id: values[2],
                    difficulty_id: values[3],
                    specialization_key: values[4],
                    title: values[5],
                    description: values[6],
                    reason: values[7],
                    estimated_weeks: values[8],
                    generation_metadata: JSON.parse(values[9]),
                };

                return {
                    rows: [{ id: pathRow.id }],
                };
            }

            if (sql.includes('INSERT INTO learning_path_steps')) {
                const position = values[2];

                if (position === failAtPosition) {
                    throw new Error(
                        'Fallo simulado al guardar un paso.',
                    );
                }

                stepRows.push({
                    id: `step-${position}`,
                    topic_id: values[1],
                    position,
                    title: values[3],
                    description: values[4],
                    status: 'pending',
                    completed_at: null,
                });

                return { rows: [] };
            }

            return { rows: [] };
        },

        release() {
            released = true;
        },
    };

    return {
        client,
        pool: {
            async connect() {
                return client;
            },
        },
        calls,
        wasReleased: () => released,
    };
}

test('saves the plan and all its steps', async () => {
    const db = createDatabase();

    const saved = await saveGeneratedLearningPath({
        userId,
        context,
        generation,
        pool: db.pool,
    });

    assert.equal(saved.id, 'path-test');
    assert.equal(saved.specializationKey, 'frontend');
    assert.equal(saved.estimatedWeeks, 12);
    assert.equal(saved.reason, generation.plan.reason);

    assert.equal(saved.steps.length, 3);

    assert.deepEqual(
        saved.steps.map((step) => step.position),
        [1, 2, 3],
    );

    assert.equal(
        saved.generationMetadata.provider,
        'openai',
    );

    assert.equal(saved.confirmedAt, null);

    assert.ok(
        db.calls.some((call) => call.sql === 'COMMIT'),
    );

    assert.equal(db.wasReleased(), true);
});

test('returns an existing plan without duplicating it', async () => {
    const db = createDatabase({
        existing: true,
    });

    const saved = await saveGeneratedLearningPath({
        userId,
        context,
        generation,
        pool: db.pool,
    });

    assert.equal(saved.id, 'path-test');

    const insertCalls = db.calls.filter(
        (call) => call.sql.includes('INSERT INTO'),
    );

    assert.equal(insertCalls.length, 0);

    assert.ok(
        db.calls.some((call) => call.sql === 'COMMIT'),
    );
});

test('rolls back when a step cannot be saved', async () => {
    const db = createDatabase({
        failAtPosition: 2,
    });

    await assert.rejects(
        saveGeneratedLearningPath({
            userId,
            context,
            generation,
            pool: db.pool,
        }),
        /Fallo simulado/,
    );

    assert.ok(
        db.calls.some((call) => call.sql === 'ROLLBACK'),
    );

    assert.equal(db.wasReleased(), true);
});

test('rejects topics outside the catalog', async () => {
    const db = createDatabase();

    const invalidGeneration = {
        ...generation,
        plan: {
            ...generation.plan,
            steps: [
                {
                    ...generation.plan.steps[0],
                    topicId: 999,
                },
                ...generation.plan.steps.slice(1),
            ],
        },
    };

    await assert.rejects(
        saveGeneratedLearningPath({
            userId,
            context,
            generation: invalidGeneration,
            pool: db.pool,
        }),
        /temas no disponibles/,
    );

    assert.equal(db.calls.length, 0);
});

test('retrieves a plan by student and diagnostic', async () => {
    const db = createDatabase({
        existing: true,
    });

    const result = await findLearningPathByDiagnostic({
        userId,
        assessmentId,
        client: db.client,
    });

    assert.equal(result.id, 'path-test');
    assert.equal(result.steps.length, 3);

    const lookup = db.calls.find(
        (call) => call.sql.includes('FROM learning_paths'),
    );

    assert.deepEqual(
        lookup.values,
        [userId, assessmentId],
    );
});

test('returns null when the student has no plan', async () => {
    const db = createDatabase();

    const result = await findLearningPathByDiagnostic({
        userId,
        assessmentId,
        client: db.client,
    });

    assert.equal(result, null);
});

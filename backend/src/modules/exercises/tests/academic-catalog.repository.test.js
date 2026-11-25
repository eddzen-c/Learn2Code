
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    listAcademicCatalog,
    listPublishedUnitExercises,
} from '../repositories/academic-catalog.repository.js';

const createClient = (rows) => {
    let receivedQuery = null;

    return {
        client: {
            query: async (query) => {
                receivedQuery = query;

                return { rows };
            },
        },
        getQuery: () => receivedQuery,
    };
};

test(
    'returns the four specializations and planned stages',
    async () => {
        const rows = [
            ['frontend', 'Desarrollo Frontend', 1],
            ['backend', 'Desarrollo Backend', 2],
            ['fullstack', 'Desarrollo Full Stack', 3],
            ['devops', 'DevOps', 4],
        ].map(([key, name, position]) => ({
            specialization_key: key,
            specialization_name: name,
            specialization_position: position,
            stage_id: String(position),
            stage_position: 1,
            stage_title: `Etapa ${position}`,
            stage_status: 'planned',
            module_id: null,
            unit_id: null,
        }));

        const { client, getQuery } =
            createClient(rows);

        const catalog =
            await listAcademicCatalog({ client });

        assert.equal(catalog.length, 4);

        assert.deepEqual(
            catalog.map((item) => item.key),
            ['frontend', 'backend', 'fullstack', 'devops'],
        );

        for (const specialization of catalog) {
            assert.equal(
                specialization.stages.length,
                1,
            );

            assert.equal(
                specialization.stages[0].status,
                'planned',
            );

            assert.deepEqual(
                specialization.stages[0].modules,
                [],
            );
        }

        assert.match(
            getQuery().text,
            /FROM academic_specializations/,
        );

        assert.match(
            getQuery().text,
            /academic_stages/,
        );

        assert.match(
            getQuery().text,
            /st\.status = 'published'/,
        );
    },
);

test(
    'groups published modules and units without duplicating stages',
    async () => {
        const common = {
            specialization_key: 'frontend',
            specialization_name: 'Desarrollo Frontend',
            specialization_position: 1,
            stage_id: '10',
            stage_position: 1,
            stage_title: 'Fundamentos Web',
            stage_status: 'published',
            module_id: 'module-1',
            module_code: 'frontend-html',
            module_position: 1,
            module_title: 'HTML',
            module_description: 'Estructura web',
        };

        const { client, getQuery } =
            createClient([
                {
                    ...common,
                    unit_id: 'unit-1',
                    unit_code: 'html-basics',
                    unit_position: 1,
                    unit_title: 'Fundamentos HTML',
                    unit_description: 'Etiquetas',
                },
                {
                    ...common,
                    unit_id: 'unit-2',
                    unit_code: 'html-forms',
                    unit_position: 2,
                    unit_title: 'Formularios',
                    unit_description: 'Entradas',
                },
            ]);

        const catalog =
            await listAcademicCatalog({ client });

        assert.equal(catalog.length, 1);

        const stages = catalog[0].stages;

        assert.equal(stages.length, 1);
        assert.equal(stages[0].modules.length, 1);

        assert.deepEqual(
            stages[0].modules[0].units.map(
                (unit) => unit.code,
            ),
            ['html-basics', 'html-forms'],
        );

        assert.match(
            getQuery().text,
            /m\.status = 'published'/,
        );

        assert.match(
            getQuery().text,
            /u\.status = 'published'/,
        );

        assert.doesNotMatch(
            getQuery().text,
            /solution_code|submitted_code|expected_output/,
        );
    },
);

test(
    'returns an empty catalog when PostgreSQL has no rows',
    async () => {
        const { client } = createClient([]);

        const result =
            await listAcademicCatalog({ client });

        assert.deepEqual(result, []);
    },
);

test(
    'keeps a specialization without stages',
    async () => {
        const { client } = createClient([
            {
                specialization_key: 'devops',
                specialization_name: 'DevOps',
                specialization_position: 4,
                stage_id: null,
                module_id: null,
                unit_id: null,
            },
        ]);

        const result =
            await listAcademicCatalog({ client });

        assert.equal(result.length, 1);
        assert.deepEqual(result[0].stages, []);
    },
);

test(
    'returns a published academic unit without exercises',
    async () => {
        const unitId =
            '11111111-1111-4111-8111-111111111111';

        const { client, getQuery } = createClient([
            {
                unit_id: unitId,
                unit_code: 'frontend-html-basics',
                unit_title: 'Fundamentos de HTML',
                unit_description: 'Estructura de documentos',
                module_id:
                    '22222222-2222-4222-8222-222222222222',
                stage_id: '1',
                specialization_key: 'frontend',
                exercise_id: null,
            },
        ]);

        const result = await listPublishedUnitExercises({
            unitId,
            client,
        });

        assert.equal(result.unit.id, unitId);
        assert.equal(result.unit.title, 'Fundamentos de HTML');
        assert.equal(
            result.unit.specializationKey,
            'frontend',
        );
        assert.deepEqual(result.exercises, []);
        assert.deepEqual(getQuery().values, [unitId, null]);
    },
);

test(
    'returns only catalog-eligible exercise information',
    async () => {
        const unitId =
            '11111111-1111-4111-8111-111111111111';

        const { client, getQuery } = createClient([
            {
                unit_id: unitId,
                unit_code: 'frontend-javascript',
                unit_title: 'JavaScript básico',
                unit_description: 'Fundamentos',
                module_id:
                    '22222222-2222-4222-8222-222222222222',
                stage_id: '1',
                specialization_key: 'frontend',
                exercise_id:
                    '33333333-3333-4333-8333-333333333333',
                exercise_title: 'Variables',
                exercise_statement: 'Declara una variable.',
                exercise_instructions: 'Muestra su valor.',
                estimated_minutes: 10,
                topic_name: 'variables',
                difficulty_name: 'principiante',
                language_name: 'JavaScript',
                completed: true,
                completed_at: '2026-11-25T12:00:00.000Z',
                in_progress: false,
            },
        ]);

        const result = await listPublishedUnitExercises({
            unitId,
            client,
        });

        assert.equal(result.exercises.length, 1);
        assert.equal(result.exercises[0].title, 'Variables');
        assert.equal(result.exercises[0].completed, true);
        assert.equal(result.exercises[0].inProgress, false);
        assert.ok(result.exercises[0].completedAt);
        assert.equal(
            result.exercises[0].language,
            'JavaScript',
        );

        assert.match(
            getQuery().text,
            /e\.generation_source = 'manual'/,
        );

        assert.match(
            getQuery().text,
            /e\.created_by_user_id IS NULL/,
        );

        assert.match(
            getQuery().text,
            /u\.status = 'published'/,
        );

        assert.match(
            getQuery().text,
            /m\.status = 'published'/,
        );

        assert.match(
            getQuery().text,
            /s\.status = 'published'/,
        );

        assert.doesNotMatch(
            getQuery().text,
            /solution_code|submitted_code|expected_output/i,
        );

        assert.equal(
            'solutionCode' in result.exercises[0],
            false,
        );
    },
);

test(
    'does not expose unavailable academic units',
    async () => {
        const { client } = createClient([]);

        const result = await listPublishedUnitExercises({
            unitId:
                '11111111-1111-4111-8111-111111111111',
            client,
        });

        assert.equal(result, null);
    },
);

test('completion status is queried only for the authenticated student', async () => {
    const unitId = '11111111-1111-4111-8111-111111111111';
    const userId = '22222222-2222-4222-8222-222222222222';
    const { client, getQuery } = createClient([{
        unit_id: unitId,
        unit_code: 'unit',
        unit_title: 'Unidad',
        unit_description: '',
        module_id: '33333333-3333-4333-8333-333333333333',
        stage_id: '1',
        specialization_key: 'frontend',
        exercise_id: '44444444-4444-4444-8444-444444444444',
        exercise_title: 'Ejercicio',
        completed: false,
        in_progress: true,
    }]);
    const result = await listPublishedUnitExercises({ unitId, userId, client });
    assert.deepEqual(getQuery().values, [unitId, userId]);
    assert.match(getQuery().text, /a\.user_id\s*=\s*\$2/);
    assert.match(getQuery().text, /a\.academic_unit_id\s*=\s*u\.id/);
    assert.equal(result.exercises[0].completed, false);
    assert.equal(result.exercises[0].inProgress, true);
});

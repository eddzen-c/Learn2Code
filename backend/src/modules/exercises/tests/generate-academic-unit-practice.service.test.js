
import assert from 'node:assert/strict'
import test from 'node:test'
import {
    choosePersonalizedDifficulty,
    findAcademicUnitGenerationContext,
    generateAcademicUnitPractice,
} from '../services/generate-academic-unit-practice.service.js'

test('topic mastery adjusts student difficulty without exceeding bounds', () => {
    assert.equal(choosePersonalizedDifficulty({
        profileDifficultyId: 3, mastery: 30, attempts: 2,
    }), 2)
    assert.equal(choosePersonalizedDifficulty({
        profileDifficultyId: 2, mastery: 88, attempts: 4,
    }), 3)
    assert.equal(choosePersonalizedDifficulty({
        profileDifficultyId: 1, mastery: 15, attempts: 0,
    }), 1)
    assert.equal(choosePersonalizedDifficulty({
        profileDifficultyId: 2, mastery: null, attempts: 0,
    }), 2)
})

test('unit context selects its own topic and the student diagnostic', async () => {
    const queries = []
    const result = await findAcademicUnitGenerationContext({
        userId: 'user-1', unitId: 'unit-1',
        client: {
            query: async ({ text, values }) => {
                queries.push({ text, values })
                if (text.includes('SELECT id, name FROM difficulty_levels')) {
                    return { rows: [{ id: 1, name: 'básico' }] }
                }
                return { rows: [{
                    unit_id: 'unit-1', unit_title: 'Listas',
                    unit_description: 'Procesamiento de arreglos',
                    module_title: 'Procesamiento', stage_title: 'Frontend',
                    specialization_name: 'Full Stack',
                    topic_id: 3, topic_name: 'ciclos',
                    topic_description: 'Recorrer arreglos',
                    language_id: 1, language_name: 'JavaScript',
                    file_extension: '.js', current_difficulty_id: 2,
                    diagnostic_assessment_id: 'diag-1',
                    mastery_score: '35', confidence_score: '65',
                    attempts_count: 2,
                }] }
            },
        },
    })
    assert.deepEqual(queries[0].values, ['unit-1', 'user-1'])
    assert.match(queries[0].text, /academic_unit_topics/)
    assert.match(queries[0].text, /knowledge_states/)
    assert.equal(result.difficulty.id, 1)
    assert.equal(result.topic.id, 3)
    assert.equal(result.curriculumContext.unit, 'Listas')
})

function makeFixture(contextOverride = {}) {
    const queries = []
    const tx = {
        query: async (query) => {
            queries.push(query)
            return { rows: [] }
        },
        release() {},
    }
    const received = {}
    const pool = {
        query: async () => ({ rows: [{ total: 2 }] }),
        connect: async () => tx,
    }
    const context = {
        unitId: 'unit-1',
        topic: { id: 3, name: 'ciclos', masteryScore: 38 },
        difficulty: { id: 1, name: 'básico' },
        language: { id: 1, name: 'JavaScript', fileExtension: '.js' },
        diagnosticAssessmentId: 'diag-1',
        curriculumContext: {
            specialization: 'Full Stack',
            stage: 'Frontend Avanzado',
            module: 'Procesamiento',
            unit: 'Listas',
            description: 'Arreglos',
        },
        ...contextOverride,
    }
    const call = (overrides = {}) => generateAcademicUnitPractice({
        userId: 'user-1', unitId: 'unit-1', pool,
        readContext: async () => context,
        findActive: async () => null,
        findOnboarding: async () => ({
            learningGoal: 'build_product',
            studyPace: 'student',
            interestKeys: ['games'],
        }),
        generate: async (input) => {
            received.generate = input
            return {
                provider: 'mock', model: 'test-model',
                exercise: {
                    topicId: 3, difficultyId: 1, languageId: 1,
                    title: 'Procesar registros',
                    statement: 'Procesa un arreglo de registros',
                    instructions: 'Lee y escribe JSON',
                    starterCode: '// starter',
                    solutionCode: '// private',
                    estimatedMinutes: 15,
                    testCases: [
                        { position: 1, input: '[]', expectedOutput: '[]', weight: 34, isHidden: false },
                        { position: 2, input: '[1]', expectedOutput: '[1]', weight: 33, isHidden: false },
                        { position: 3, input: '[2]', expectedOutput: '[2]', weight: 33, isHidden: true },
                    ],
                },
            }
        },
        verify: async (input) => { received.verified = input },
        createExercise: async (input) => {
            received.savedExercise = input
            return { id: 'exercise-new' }
        },
        createTests: async (input) => { received.savedTests = input },
        createAssignment: async (input) => {
            received.assignment = input
            return { id: 'assignment-new' }
        },
        createLog: async (input) => { received.log = input },
        ...overrides,
    })
    return { call, received, queries }
}

test('new unit exercise uses real curriculum and saves a private AI solution', async () => {
    const { call, received, queries } = makeFixture()
    const result = await call()
    assert.equal(result.created, true)
    assert.equal(result.assignment.id, 'assignment-new')
    assert.equal(received.generate.topic.name, 'ciclos')
    assert.equal(received.generate.difficulty.id, 1)
    assert.equal(received.generate.curriculumContext.unit, 'Listas')
    assert.deepEqual(received.generate.personalizationContext.interestKeys, ['games'])
    assert.equal(received.assignment.academicUnitId, 'unit-1')
    assert.equal(received.assignment.source, 'manual')
    assert.equal(received.assignment.metadata.academicPersonalized, true)
    assert.equal(received.savedExercise.solutionCode, '// private')
    assert.equal(result.exercise, undefined)
    assert.equal(received.savedTests.testCases.length, 3)
    assert.equal(received.log.generationParams.academicUnitId, 'unit-1')
    assert.equal(queries[0], 'BEGIN')
    assert.equal(queries.at(-1), 'COMMIT')
})

test('existing practice resumes without another AI call', async () => {
    const { call } = makeFixture()
    const result = await call({
        findActive: async () => ({
            id: 'assigned', exerciseId: 'exercise-1', status: 'started',
            academicUnitId: 'unit-1',
        }),
        readContext: async () => { throw new Error('should not read context') },
    })
    assert.equal(result.created, false)
    assert.equal(result.assignment.id, 'assigned')
})

test('without diagnostic, the AI is not called and nothing is saved', async () => {
    const { call, received, queries } = makeFixture()
    await assert.rejects(
        call({ readContext: async () => ({ diagnosticRequired: true }) }),
        (error) => error.statusCode === 409 && error.code === 'ACADEMIC_DIAGNOSTIC_REQUIRED',
    )
    assert.equal(received.generate, undefined)
    assert.equal(queries.length, 0)
})

test('mismatched generated topic is rejected before database writes', async () => {
    const { call, received, queries } = makeFixture()
    await assert.rejects(
        call({
            generate: async () => ({ exercise: {
                topicId: 99, difficultyId: 1, languageId: 1,
                testCases: [{}, {}, {}],
            } }),
        }),
        (error) => error.code === 'ACADEMIC_GENERATION_INVALID',
    )
    assert.equal(received.savedExercise, undefined)
    assert.equal(queries.length, 0)
})

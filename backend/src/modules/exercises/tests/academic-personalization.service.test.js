
import assert from 'node:assert/strict'
import test from 'node:test'

import {
    getPersonalizedAcademicCatalog,
    personalizeAcademicCatalog,
} from '../services/academic-personalization.service.js'

const catalog = [{
    key: 'frontend',
    name: 'Desarrollo Frontend',
    stages: [1, 2, 3, 4, 5].map((position) => ({
        id: position,
        position,
        status: 'published',
        title: 'Etapa ' + position,
        modules: [{
            id: 'module-' + position,
            title: 'Módulo ' + position,
            units: [{
                id: 'unit-' + position,
                title: 'Unidad ' + position,
            }],
        }],
    })),
}]

test('without completed diagnostic the published catalog remains accessible', () => {
    const result = personalizeAcademicCatalog(catalog, {
        profile: null, knowledge: [], assignments: [],
    })
    assert.equal(result.personalization.status, 'diagnostic_required')
    assert.deepEqual(result.specializations, catalog)
})

test('beginner and advanced students receive different recommended stages', () => {
    const beginner = personalizeAcademicCatalog(catalog, {
        profile: { difficultyId: 1, difficultyName: 'básico', overallScore: 28 },
        knowledge: [], assignments: [],
    })
    const advanced = personalizeAcademicCatalog(catalog, {
        profile: { difficultyId: 3, difficultyName: 'avanzado', overallScore: 93 },
        knowledge: [], assignments: [],
    })
    assert.equal(beginner.specializations[0].personalization.recommendedStageId, 1)
    assert.equal(advanced.specializations[0].personalization.recommendedStageId, 3)
    assert.equal(beginner.personalization.difficulty.id, 1)
    assert.equal(advanced.personalization.difficulty.id, 3)
    assert.deepEqual(
        beginner.specializations[0].stages.map((stage) => stage.id),
        [1, 2, 3, 4, 5],
    )
})

test('mastery and completed exercises adjust recommendations with real data', () => {
    const result = personalizeAcademicCatalog(catalog, {
        profile: { difficultyId: 2, difficultyName: 'intermedio', overallScore: 65 },
        knowledge: [
            { unitId: 'unit-2', mastery: 29 },
            { unitId: 'unit-3', mastery: 94 },
        ],
        assignments: [
            { unitId: 'unit-2', completed: 1, active: 0 },
            { unitId: 'unit-3', completed: 0, active: 1 },
        ],
    })
    const stages = result.specializations[0].stages
    assert.equal(stages[1].modules[0].units[0].personalization.state, 'completed')
    assert.equal(stages[2].modules[0].units[0].personalization.state, 'in_progress')
    assert.equal(stages[2].modules[0].units[0].personalization.mastery, 94)
    assert.equal(stages[2].modules[0].units[0].personalization.recommended, true)
    assert.equal(stages[2].modules[0].personalization.recommended, true)
})

test('user-specific result is derived without mutating shared catalog', async () => {
    const result = await getPersonalizedAcademicCatalog({
        userId: 'user-123',
        listCatalog: async () => catalog,
        readSignals: async ({ userId }) => {
            assert.equal(userId, 'user-123')
            return {
                profile: { difficultyId: 1, difficultyName: 'básico', overallScore: 30 },
                knowledge: [],
                assignments: [],
            }
        },
    })
    assert.equal(result.personalization.status, 'personalized')
    assert.equal(catalog[0].stages[0].personalization, undefined)
})

test('students at the same level receive different recommended topics from their mastery', () => {
    const profile = {
        difficultyId: 2,
        difficultyName: 'intermedio',
        overallScore: 63,
    }
    const first = personalizeAcademicCatalog(catalog, {
        profile,
        knowledge: [
            { unitId: 'unit-2', mastery: 28 },
            { unitId: 'unit-3', mastery: 92 },
        ],
        assignments: [],
    })
    const second = personalizeAcademicCatalog(catalog, {
        profile,
        knowledge: [
            { unitId: 'unit-2', mastery: 92 },
            { unitId: 'unit-3', mastery: 24 },
        ],
        assignments: [],
    })
    assert.equal(first.specializations[0].personalization.recommendedUnitId, 'unit-2')
    assert.equal(second.specializations[0].personalization.recommendedUnitId, 'unit-3')
})

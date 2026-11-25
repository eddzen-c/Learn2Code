import { describe, expect, it } from 'vitest'
import {
    isSuggestedUnitExercise,
    prioritizeUnitExercises,
} from './academic-unit-prioritization.js'

const published = [
    { id: 'advanced', difficultyId: 3 },
    { id: 'basic', difficultyId: 1 },
    { id: 'intermediate', difficultyId: 2 },
]

describe('priorización de ejercicios por estudiante', () => {
    it('da primero los ejercicios básicos a quien necesita fundamentos', () => {
        expect(prioritizeUnitExercises(published, 1).map((item) => item.id))
            .toEqual(['basic', 'intermediate', 'advanced'])
    })

    it('da primero los ejercicios avanzados a estudiantes avanzados', () => {
        expect(prioritizeUnitExercises(published, 3).map((item) => item.id))
            .toEqual(['advanced', 'intermediate', 'basic'])
    })

    it('prioriza el nivel intermedio sin ocultar ejercicios', () => {
        expect(prioritizeUnitExercises(published, 2).map((item) => item.id))
            .toEqual(['intermediate', 'advanced', 'basic'])
        expect(published[0].id).toBe('advanced')
    })

    it('sin diagnóstico conserva el orden publicado y no etiqueta sugerencias', () => {
        expect(prioritizeUnitExercises(published, null)).toEqual(published)
        expect(isSuggestedUnitExercise(published[0], null)).toBe(false)
    })

    it('solo marca como recomendado un ejercicio del nivel sugerido', () => {
        expect(isSuggestedUnitExercise(published[1], 1)).toBe(true)
        expect(isSuggestedUnitExercise(published[0], 1)).toBe(false)
    })
})

import { describe, expect, it } from 'vitest'
import { buildExerciseSupport } from './exercise-support.js'

const exercise = {
    id: 'exercise-1',
    titulo: 'Filtrar productos disponibles',
    tecnologia: 'JavaScript',
    tema: 'estructuras_de_datos',
    enunciado: 'Devuelve los nombres con stock positivo.',
    requisitos: ['Lee JSON e imprime solo JSON.'],
    entrada: '[{"stock":2}]',
    salida: '["Teclado"]',
}

describe('buildExerciseSupport', () => {
    it('crea tres pistas sin mostrar soluciones ni ejemplos falsos', () => {
        const { pistas } = buildExerciseSupport(exercise)
        expect(pistas).toHaveLength(3)
        expect(pistas[0].example).toBe(exercise.enunciado)
        expect(pistas[1].description).toMatch(/arreglo/i)
        expect(pistas[2].example).toBe(exercise.requisitos[0])
        expect(JSON.stringify(pistas)).not.toMatch(/precio 100|demostración/i)
    })

    it('selecciona documentación por tema y lenguaje', () => {
        const { recursos } = buildExerciseSupport(exercise)
        expect(recursos.map((r) => r.titulo)).toContain('Métodos de Array')
        expect(recursos.every((r) => r.url.startsWith('https://'))).toBe(true)
        expect(recursos.every((r) => !r.url.includes('example.com'))).toBe(true)
    })

    it('adapta ayudas a otro ejercicio sin contaminar las pistas previas', () => {
        const { pistas, recursos } = buildExerciseSupport({
            ...exercise,
            id: 'exercise-2',
            tema: 'condicionales',
            enunciado: 'Valida un acceso según el rol.',
            requisitos: [],
        })
        expect(pistas[0].example).toBe('Valida un acceso según el rol.')
        expect(pistas[1].description).toMatch(/condición/i)
        expect(pistas[2].example).toContain('Entrada:')
        expect(recursos.some((r) => r.url.includes('if...else'))).toBe(true)
        expect(JSON.stringify(pistas)).not.toContain('stock positivo')
    })

    it('ofrece documentación de Python sin sugerir sintaxis JavaScript', () => {
        const { pistas, recursos } = buildExerciseSupport({
            ...exercise,
            tecnologia: 'Python',
            tema: 'funciones',
        })
        expect(pistas[1].description).not.toMatch(/javascript/i)
        expect(recursos.every((r) => r.url.includes('docs.python.org'))).toBe(true)
    })

    it('no presenta ayudas cuando no existe un ejercicio real', () => {
        expect(buildExerciseSupport(null)).toEqual({ pistas: [], recursos: [] })
        expect(buildExerciseSupport({ id: '' })).toEqual({
            pistas: [], recursos: [],
        })
    })
})

import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    toExerciseViewModel,
} from './exercise-view-model.js'

describe('toExerciseViewModel', () => {
    const ejercicioReal = {
        id: 'exercise-123',
        title: 'Filtrar productos disponibles',
        statement: 'Filtra los productos disponibles.',
        instructions: 'Devuelve un nuevo arreglo.',
        starterCode: 'function filtrar() {}',
        estimatedMinutes: 15,

        language: {
            name: 'JavaScript',
            fileExtension: '.js',
        },

        difficulty: {
            name: 'Intermedio',
        },

        publicTestCases: [
            {
                id: 'case-1',
                input: '[1,2,3]',
                expectedOutput: '[2,3]',
            },
        ],
    }

    it('convierte los datos reales al formato visual', () => {
        const resultado =
            toExerciseViewModel(ejercicioReal)

        expect(resultado.titulo).toBe(
            'Filtrar productos disponibles',
        )

        expect(resultado.tecnologia).toBe('JavaScript')
        expect(resultado.dificultad).toBe('Intermedio')
        expect(resultado.minutos).toBe(15)
        expect(resultado.archivo).toBe('solucion.js')
        expect(resultado.codigo).toBe(
            'function filtrar() {}',
        )
    })

    it('conserva las instrucciones y ejemplos reales', () => {
        const resultado =
            toExerciseViewModel(ejercicioReal)

        expect(resultado.requisitos).toEqual([
            'Devuelve un nuevo arreglo.',
        ])

        expect(resultado.entrada).toBe('[1,2,3]')
        expect(resultado.salida).toBe('[2,3]')
        expect(resultado.casosPublicos).toHaveLength(1)
    })

    it('no inventa recompensas', () => {
        const resultado =
            toExerciseViewModel(ejercicioReal)

        expect(resultado.xp).toBeNull()
    })

    it('no inventa ejemplos ni duración', () => {
        const resultado = toExerciseViewModel({
            id: 'exercise-456',
            title: 'Ejercicio nuevo',
            publicTestCases: [],
        })

        expect(resultado.entrada).toBeNull()
        expect(resultado.salida).toBeNull()
        expect(resultado.minutos).toBeNull()
        expect(resultado.imagen).toBeNull()
        expect(resultado.archivo).toBeNull()
    })

    it('rechaza ejercicios sin identificador válido', () => {
        expect(toExerciseViewModel(null)).toBeNull()

        expect(
            toExerciseViewModel({
                title: 'Sin identificador',
            }),
        ).toBeNull()
    })
})
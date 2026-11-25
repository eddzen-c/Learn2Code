
import {
    renderHook,
    waitFor,
} from '@testing-library/react'

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    getAcademicExerciseAssignment,
    getCurrentExercise,
} from '../api/exercise.api.js'

import {
    useExerciseSession,
} from './useExerciseSession.js'

vi.mock('../api/exercise.api.js', () => ({
    getAcademicExerciseAssignment: vi.fn(),
    getCurrentExercise: vi.fn(),
}))

const sessionData = {
    state: 'assigned',
    assignment: {
        id: 'assignment-123',
        status: 'assigned',
    },
    exercise: {
        id: 'exercise-123',
        title: 'Filtrar productos disponibles',
        statement: 'Filtra una lista de productos.',
        starterCode: 'function filtrar() {}',
        language: {
            name: 'JavaScript',
            fileExtension: '.js',
        },
        difficulty: {
            name: 'Intermedio',
        },
        publicTestCases: [],
    },
}

describe('useExerciseSession', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('carga una asignación académica real', async () => {
        getAcademicExerciseAssignment.mockResolvedValue(
            sessionData,
        )

        const { result } = renderHook(() =>
            useExerciseSession({
                accessToken: 'token',
                assignmentId: 'assignment-123',
            }),
        )

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.exercise.titulo).toBe(
            'Filtrar productos disponibles',
        )

        expect(result.current.code).toBe(
            'function filtrar() {}',
        )

        expect(
            getAcademicExerciseAssignment,
        ).toHaveBeenCalledWith({
            accessToken: 'token',
            assignmentId: 'assignment-123',
        })

        expect(getCurrentExercise).not.toHaveBeenCalled()
    })

    it('carga la práctica adaptativa sin asignación explícita', async () => {
        getCurrentExercise.mockResolvedValue(sessionData)

        const { result } = renderHook(() =>
            useExerciseSession({
                accessToken: 'token',
            }),
        )

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.session.assignment.id).toBe(
            'assignment-123',
        )

        expect(getCurrentExercise).toHaveBeenCalledWith(
            'token',
        )

        expect(
            getAcademicExerciseAssignment,
        ).not.toHaveBeenCalled()
    })

    it('no solicita ejercicios sin autenticación', async () => {
        const { result } = renderHook(() =>
            useExerciseSession({
                accessToken: null,
            }),
        )

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.error).not.toBeNull()
        expect(result.current.exercise).toBeNull()
        expect(getCurrentExercise).not.toHaveBeenCalled()
    })

    it('informa errores del backend sin inventar ejercicios', async () => {
        getAcademicExerciseAssignment.mockRejectedValue(
            new Error('Asignación no disponible'),
        )

        const { result } = renderHook(() =>
            useExerciseSession({
                accessToken: 'token',
                assignmentId: 'assignment-123',
            }),
        )

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.error.message).toBe(
            'Asignación no disponible',
        )

        expect(result.current.exercise).toBeNull()
        expect(result.current.code).toBe('')
    })
})

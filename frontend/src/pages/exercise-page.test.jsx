import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
    MemoryRouter,
} from 'react-router-dom'

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    generateNextExercise,
    getAcademicExerciseAssignment,
    getCurrentExercise,
    submitExerciseAttempt,
} from '../api/exercise.api.js'

import {
    AuthContext,
} from '../auth/auth-context.js'

import {
    ExercisePage,
} from './ExercisePage.jsx'

vi.mock('../api/exercise.api.js', () => ({
    generateNextExercise: vi.fn(),
    getAcademicExerciseAssignment: vi.fn(),
    getCurrentExercise: vi.fn(),
    submitExerciseAttempt: vi.fn(),
}))

const assignment = {
    id: 'assignment-1',
    exerciseId: 'exercise-1',
    status: 'assigned',
    assignedAt: '2026-08-01T12:00:00.000Z',
    startedAt: null,
    completedAt: null,
    expiresAt: '2026-08-02T12:00:00.000Z',
}

const academicAssignment = {
    ...assignment,
    id: 'assignment-academic-1',
    exerciseId: 'exercise-academic-1',
    academicUnitId: 'unit-123',
    source: 'manual',
    expiresAt: null,
}

const exercise = {
    id: 'exercise-1',
    title: 'Suma dos números',
    statement:
        'Crea una función que reciba dos números y devuelva su suma.',
    instructions:
        'No utilices valores escritos directamente en el código.',
    starterCode:
        'function sumar(a, b) {\n    // Escribe tu solución\n}',
    estimatedMinutes: 15,

    topic: {
        id: 1,
        name: 'variables',
    },

    difficulty: {
        id: 1,
        name: 'básico',
    },

    language: {
        id: 1,
        name: 'JavaScript',
        fileExtension: '.js',
    },

    publicTestCases: [{
        id: 'test-case-1',
        position: 1,
        input: {
            a: 2,
            b: 3,
        },
        expectedOutput: 5,
        weight: 50,
    }],
}

const renderExercisePage = (
    path = '/exercises/current',
) => {
    render(
        <AuthContext.Provider
            value={{
                accessToken: 'access-token',
                user: {
                    id: 'user-1',
                    fullName: 'Estudiante Learn2Code',
                    email: 'student@example.com',
                    roles: ['student'],
                },
            }}
        >
            <MemoryRouter initialEntries={[path]}>
                <ExercisePage />
            </MemoryRouter>
        </AuthContext.Provider>,
    )
}

describe('ExercisePage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('loads the current personalized exercise', async () => {
        getCurrentExercise.mockResolvedValue({
            state: 'assigned',
            assignment,
            exercise,
        })

        renderExercisePage()

        expect(
            await screen.findByRole('heading', {
                name: 'Suma dos números',
            }),
        ).toBeInTheDocument()

        expect(
            getCurrentExercise,
        ).toHaveBeenCalledWith(
            'access-token',
        )

        expect(
            screen.getByLabelText('Tu solución'),
        ).toHaveValue(
            exercise.starterCode,
        )

        expect(
            screen.getByText('JavaScript'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('variables'),
        ).toBeInTheDocument()
    })

    it('generates an exercise when none is assigned', async () => {
        const user = userEvent.setup()

        getCurrentExercise.mockResolvedValue({
            state: 'none',
            assignment: null,
            exercise: null,
        })

        generateNextExercise.mockResolvedValue({
            created: true,
            assignment,
            exercise,
        })

        renderExercisePage()

        await user.click(
            await screen.findByRole('button', {
                name:
                    'Generar ejercicio personalizado',
            }),
        )

        expect(
            await screen.findByRole('heading', {
                name: 'Suma dos números',
            }),
        ).toBeInTheDocument()

        expect(
            generateNextExercise,
        ).toHaveBeenCalledWith(
            'access-token',
        )
    })

    it('shows feedback and permits retrying a failed attempt', async () => {
        const user = userEvent.setup()

        getCurrentExercise.mockResolvedValue({
            state: 'assigned',
            assignment,
            exercise,
        })

        submitExerciseAttempt.mockResolvedValue({
            attempt: {
                id: 'attempt-1',
                status: 'completed',
                passed: false,
                score: 0,
                testsPassed: 0,
                testsTotal: 1,
                executionTimeMs: 0,
                feedback:
                    'Revisa el algoritmo e inténtalo nuevamente.',
                attemptedAt:
                    '2026-08-01T12:05:00.000Z',
                completedAt:
                    '2026-08-01T12:05:01.000Z',
            },

            assignment: {
                id: assignment.id,
                status: 'started',
                startedAt:
                    '2026-08-01T12:05:00.000Z',
                completedAt: null,
            },

            evaluator: {
                provider: 'mock',
                name:
                    'learn2code-mock-evaluator-v1',
            },

            progress: null,

            results: [{
                testCaseId: 'test-case-1',
                position: 1,
                passed: false,
                actualOutput: null,
                errorMessage:
                    'La solución no coincide.',
                executionTimeMs: 0,
            }],
        })

        renderExercisePage()

        const editor =
            await screen.findByLabelText(
                'Tu solución',
            )

        await user.clear(editor)
        await user.type(
            editor,
            'código incorrecto',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Enviar solución',
            }),
        )

        expect(
            await screen.findByRole('heading', {
                name: 'Sigue intentándolo',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Revisa el algoritmo e inténtalo nuevamente.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('heading', {
                name: 'Progreso obtenido',
            }),
        ).not.toBeInTheDocument()

        expect(
            submitExerciseAttempt,
        ).toHaveBeenCalledWith({
            accessToken: 'access-token',
            assignmentId: 'assignment-1',
            submittedCode:
                'código incorrecto',
        })

        expect(
            screen.getByRole('button', {
                name: 'Enviar solución',
            }),
        ).toBeEnabled()
    })

    it('shows the successful result of a passing attempt', async () => {
        const user = userEvent.setup()

        getCurrentExercise.mockResolvedValue({
            state: 'assigned',
            assignment,
            exercise,
        })

        submitExerciseAttempt.mockResolvedValue({
            attempt: {
                id: 'attempt-2',
                status: 'completed',
                passed: true,
                score: 100,
                testsPassed: 1,
                testsTotal: 1,
                executionTimeMs: 0,
                feedback:
                    'La solución fue aprobada.',
                attemptedAt:
                    '2026-08-01T12:10:00.000Z',
                completedAt:
                    '2026-08-01T12:10:01.000Z',
            },

            assignment: {
                id: assignment.id,
                status: 'completed',
                startedAt:
                    '2026-08-01T12:10:00.000Z',
                completedAt:
                    '2026-08-01T12:10:01.000Z',
            },

            evaluator: {
                provider: 'mock',
                name:
                    'learn2code-mock-evaluator-v1',
            },

            progress: {
                applied: true,
                xpAwarded: 75,

                userXp: {
                    totalXp: 375,
                    currentLevelId: 2,
                },

                streak: {
                    currentStreak: 4,
                    longestStreak: 7,
                },

                badgeAwards: {
                    awarded: true,
                    count: 1,

                    badges: [{
                        id: 'user-badge-1',

                        badge: {
                            id: 'badge-1',
                            name:
                                'Primer paso',
                        },
                    }],
                },
            },

            results: [{
                testCaseId: 'test-case-1',
                position: 1,
                passed: true,
                actualOutput: 5,
                errorMessage: null,
                executionTimeMs: 0,
            }],
        })

        renderExercisePage()

        await user.click(
            await screen.findByRole('button', {
                name: 'Enviar solución',
            }),
        )

        expect(
            await screen.findByRole('heading', {
                name: '¡Ejercicio superado!',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Puntuación: 100/100'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: 'Progreso obtenido',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('+75 XP'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('375'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Programador Junior',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText('4 días'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('7 días'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: '¡Nueva insignia!',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('region', {
                name: 'Insignias desbloqueadas',
            })
        ).toHaveTextContent('Primer paso')

        expect(
            screen.getByRole('link', {
                name:
                    'Ver todas mis insignias',
            }),
        ).toHaveAttribute(
            'href',
            '/badges',
        )

        expect(
            screen.getByRole('button', {
                name: 'Generar otro ejercicio',
            }),
        ).toBeInTheDocument()

        await waitFor(() => {
            expect(
                submitExerciseAttempt,
            ).toHaveBeenCalledOnce()
        })
    })

    it('loads the selected academic assignment without requesting an adaptive exercise', async () => {
        const academicExercise = {
            ...exercise,
            id: 'exercise-academic-1',
            title: 'Variables en JavaScript',
        }

        getAcademicExerciseAssignment.mockResolvedValue({
            state: 'assigned',
            assignment: academicAssignment,
            exercise: academicExercise,
        })

        renderExercisePage(
            '/exercises/current?assignment=assignment-academic-1',
        )

        expect(
            await screen.findByRole('heading', {
                name: 'Variables en JavaScript',
            }),
        ).toBeInTheDocument()

        expect(
            getAcademicExerciseAssignment,
        ).toHaveBeenCalledWith({
            accessToken: 'access-token',
            assignmentId: 'assignment-academic-1',
        })

        expect(
            getCurrentExercise,
        ).not.toHaveBeenCalled()

        expect(
            screen.getByLabelText('Tu solución'),
        ).toHaveValue(
            academicExercise.starterCode,
        )

        expect(
            screen.getByRole('link', {
                name: 'Volver a la unidad',
            }),
        ).toHaveAttribute(
            'href',
            '/exercises/units/unit-123',
        )

        expect(
            screen.queryByRole('button', {
                name: 'Generar ejercicio personalizado',
            }),
        ).not.toBeInTheDocument()
    })

    it('submits an academic solution and shows its evaluation', async () => {
        const user = userEvent.setup()

        getAcademicExerciseAssignment.mockResolvedValue({
            state: 'assigned',
            assignment: academicAssignment,
            exercise: {
                ...exercise,
                id: 'exercise-academic-1',
            },
        })

        submitExerciseAttempt.mockResolvedValue({
            attempt: {
                id: 'attempt-academic-1',
                status: 'completed',
                passed: true,
                score: 100,
                testsPassed: 1,
                testsTotal: 1,
                feedback: 'La solución fue aprobada.',
            },

            assignment: {
                id: academicAssignment.id,
                status: 'completed',
            },

            evaluator: {
                provider: 'docker',
                name: 'docker',
            },

            progress: null,

            results: [{
                testCaseId: 'test-case-1',
                position: 1,
                passed: true,
            }],
        })

        renderExercisePage(
            '/exercises/current?assignment=assignment-academic-1',
        )

        const editor = await screen.findByLabelText(
            'Tu solución',
        )

        await user.clear(editor)

        await user.type(
            editor,
            'console.log(5)',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Enviar solución',
            }),
        )

        await waitFor(() => {
            expect(
                submitExerciseAttempt,
            ).toHaveBeenCalledWith({
                accessToken: 'access-token',
                assignmentId: 'assignment-academic-1',
                submittedCode: 'console.log(5)',
            })
        })

        expect(
            await screen.findByRole('heading', {
                name: '¡Ejercicio superado!',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Puntuación: 100/100'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('La solución fue aprobada.'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Enviar solución',
            }),
        ).toBeDisabled()

        expect(
            screen.queryByRole('button', {
                name: 'Generar otro ejercicio',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('heading', {
                name: 'Progreso obtenido',
            }),
        ).not.toBeInTheDocument()
    })

    it('shows an error when the academic assignment does not exist', async () => {
        getAcademicExerciseAssignment.mockRejectedValue(
            Object.assign(
                new Error('Assignment not found'),
                {
                    code: 'ACADEMIC_ASSIGNMENT_NOT_FOUND',
                },
            ),
        )

        renderExercisePage(
            '/exercises/current?assignment=missing-assignment',
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'El ejercicio académico no está disponible.',
        )

        expect(
            getCurrentExercise,
        ).not.toHaveBeenCalled()

        expect(
            screen.queryByRole('button', {
                name: 'Generar ejercicio personalizado',
            }),
        ).not.toBeInTheDocument()
    })

    it('does not allow new submissions for completed academic assignments', async () => {
        getAcademicExerciseAssignment.mockResolvedValue({
            state: 'completed',

            assignment: {
                ...academicAssignment,
                status: 'completed',
            },

            exercise: {
                ...exercise,
                id: 'exercise-academic-1',
            },
        })

        renderExercisePage(
            '/exercises/current?assignment=assignment-academic-1',
        )

        expect(
            await screen.findByRole('button', {
                name: 'Enviar solución',
            }),
        ).toBeDisabled()

        expect(
            submitExerciseAttempt,
        ).not.toHaveBeenCalled()
    })
})
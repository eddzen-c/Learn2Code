
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'

import {
    MemoryRouter,
    Route,
    Routes,
    useLocation,
} from 'react-router-dom'

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    getAcademicCatalog,
    getAcademicUnitExercises,
    assignAcademicExerciseAssignment,
    generateAcademicUnitPractice,
} from '../api/exercise.api.js'

import {
    AuthContext,
} from '../auth/auth-context.js'

import {
    AcademicUnitPage,
} from './AcademicUnitPage.jsx'

vi.mock('../api/exercise.api.js', () => ({
    assignAcademicExerciseAssignment: vi.fn(),
    generateAcademicUnitPractice: vi.fn(),
    getAcademicCatalog: vi.fn(),
    getAcademicUnitExercises: vi.fn(),
}))

const catalogo = {
    specializations: [
        {
            key: 'frontend',
            name: 'Desarrollo Frontend',
            stages: [
                {
                    id: '11',
                    title: 'Fundamentos Web',
                    status: 'published',
                    modules: [
                        {
                            id: 'module-1',
                            title: 'HTML',
                            units: [
                                {
                                    id: 'unit-1',
                                    title: 'Elementos HTML',
                                    description: 'Etiquetas y contenido',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
}

function AssignmentLocation() {
    const location = useLocation()

    return (
        <p data-testid="assignment-location">
            {location.pathname}
            {location.search}
        </p>
    )
}

const renderUnit = (
    path = '/exercises/units/unit-1',
) => render(
    <AuthContext.Provider
        value={{
            accessToken: 'access-token',
            user: {
                fullName: 'Estudiante Learn2Code',
                emailVerified: true,
            },
            signOut: vi.fn(),
        }}
    >
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route
                    path="/exercises/units/:unitId"
                    element={<AcademicUnitPage />}
                />

                <Route
                    path="/resolver-ejercicio-real"
                    element={<AssignmentLocation />}
                />

            </Routes>
        </MemoryRouter>
    </AuthContext.Provider>,
)

describe('AcademicUnitPage', () => {
    beforeEach(() => {
        vi.resetAllMocks()

        getAcademicCatalog.mockResolvedValue(catalogo)

        getAcademicUnitExercises.mockResolvedValue({
            unit: {
                id: 'unit-1',
            },
            exercises: [],
        })
    })

    it('muestra los datos publicados de la unidad', async () => {
        renderUnit()

        // Ejercicios reutiliza las clases y los componentes visuales de Inicio.
        expect(screen.getByRole('main')).toHaveClass('inicio-layout')
        expect(document.querySelector('.inicio-workspace')).toBeInTheDocument()
        expect(document.querySelector('.learning-sidebar--profile')).toBeInTheDocument()
        expect(document.querySelector('.profile-topbar')).toBeInTheDocument()

        expect(
            await screen.findByRole('heading', {
                name: 'Elementos HTML',
                level: 1,
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Etiquetas y contenido'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'Volver a la etapa',
            }),
        ).toHaveAttribute(
            'href',
            '/exercises/stages/11',
        )

        expect(
            getAcademicCatalog,
        ).toHaveBeenCalledWith('access-token')
    })

    it('no inventa ejercicios ni progreso académico', async () => {
        renderUnit()

        expect(
            await screen.findByText(
                'Esta unidad todavía no tiene ejercicios publicados.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByText(/100 % completado/i),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('link', {
                name: /Resolver ejercicio/i,
            }),
        ).not.toBeInTheDocument()
    })

    it('muestra los ejercicios publicados de la unidad', async () => {
        getAcademicUnitExercises.mockResolvedValue({
            unit: {
                id: 'unit-1',
            },
            exercises: [
                {
                    id: 'exercise-1',
                    title: 'Crear un encabezado',
                    statement: 'Escribe un encabezado HTML.',
                    instructions: 'Utiliza la etiqueta h1.',
                    estimatedMinutes: 10,
                    topic: 'HTML',
                    difficulty: 'Principiante',
                    language: 'JavaScript',
                },
            ],
        })

        renderUnit()

        expect(
            await screen.findByRole('heading', {
                name: 'Crear un encabezado',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Escribe un encabezado HTML.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Utiliza la etiqueta h1.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'HTML · Principiante · JavaScript',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Tiempo estimado: 10 minutos',
            ),
        ).toBeInTheDocument()

        expect(
            getAcademicUnitExercises,
        ).toHaveBeenCalledWith({
            accessToken: 'access-token',
            unitId: 'unit-1',
        })
    })

    it('informa errores al consultar los ejercicios', async () => {
        getAcademicUnitExercises.mockRejectedValue(
            new Error('Servicio no disponible'),
        )

        renderUnit()

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No fue posible consultar los ejercicios',
        )

        expect(
            screen.getByRole('heading', {
                name: 'Elementos HTML',
                level: 1,
            }),
        ).toBeInTheDocument()
    })

    it('rechaza ejercicios que pertenecen a otra unidad', async () => {
        getAcademicUnitExercises.mockResolvedValue({
            unit: {
                id: 'otra-unidad',
            },
            exercises: [],
        })

        renderUnit()

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No fue posible consultar los ejercicios',
        )
    })

    it('rechaza unidades inexistentes', async () => {
        renderUnit('/exercises/units/unidad-inexistente')

        expect(
            await screen.findByText(
                'La unidad solicitada no está publicada o no existe.',
            ),
        ).toBeInTheDocument()
    })

    it('informa errores de consulta', async () => {
        getAcademicCatalog.mockRejectedValue(
            new Error('No disponible'),
        )

        renderUnit()

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No fue posible consultar la unidad',
        )
    })

    it('abre la asignación real del ejercicio seleccionado', async () => {
        getAcademicUnitExercises.mockResolvedValue({
            unit: {
                id: 'unit-1',
            },
            exercises: [
                {
                    id: 'exercise-1',
                    title: 'Crear un encabezado',
                    statement: 'Escribe un encabezado HTML.',
                },
            ],
        })

        assignAcademicExerciseAssignment.mockResolvedValue({
            created: true,
            assignment: {
                id: 'assignment-123',
            },
        })

        renderUnit()

        const button = await screen.findByRole('button', {
            name: 'Resolver ejercicio: Crear un encabezado',
        })

        fireEvent.click(button)

        expect(
            await screen.findByTestId(
                'assignment-location',
            ),
        ).toHaveTextContent(
            '/resolver-ejercicio-real?assignment=assignment-123',
        )

        expect(
            assignAcademicExerciseAssignment,
        ).toHaveBeenCalledWith({
            accessToken: 'access-token',
            unitId: 'unit-1',
            exerciseId: 'exercise-1',
        })
    })

    it('informa errores cuando no se puede asignar el ejercicio', async () => {
        getAcademicUnitExercises.mockResolvedValue({
            unit: {
                id: 'unit-1',
            },
            exercises: [
                {
                    id: 'exercise-1',
                    title: 'Crear un encabezado',
                    statement: 'Escribe un encabezado HTML.',
                },
            ],
        })

        assignAcademicExerciseAssignment.mockRejectedValue(
            new Error('Servicio no disponible'),
        )

        renderUnit()

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Resolver ejercicio: Crear un encabezado',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No fue posible abrir el ejercicio',
        )
    })

    it('rechaza asignaciones sin identificador', async () => {
        getAcademicUnitExercises.mockResolvedValue({
            unit: {
                id: 'unit-1',
            },
            exercises: [
                {
                    id: 'exercise-1',
                    title: 'Crear un encabezado',
                    statement: 'Escribe un encabezado HTML.',
                },
            ],
        })

        assignAcademicExerciseAssignment.mockResolvedValue({
            created: true,
            assignment: {},
        })

        renderUnit()

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Resolver ejercicio: Crear un encabezado',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No fue posible abrir el ejercicio',
        )
    })
})

describe('AcademicUnitPage - personalización real', () => {
    it('genera el reto del nivel del estudiante y abre la asignación existente', async () => {
        getAcademicCatalog.mockResolvedValue({
            ...catalogo,
            personalization: {
                status: 'personalized',
                difficulty: { id: 2, name: 'intermedio' },
            },
            specializations: catalogo.specializations.map((specialization) => ({
                ...specialization,
                stages: specialization.stages.map((stage) => ({
                    ...stage,
                    modules: stage.modules.map((mod) => ({
                        ...mod,
                        units: mod.units.map((unit) => ({
                            ...unit,
                            personalization: {
                                state: 'reinforce',
                                mastery: 38,
                                recommended: true,
                                message: 'Tu desempeño sugiere reforzar este tema.',
                            },
                        })),
                    })),
                })),
            })),
        })
        generateAcademicUnitPractice.mockResolvedValue({
            created: true,
            assignment: { id: 'personalized-assignment-123' },
        })

        renderUnit()

        expect(await screen.findByRole('heading', {
            name: 'Practica a tu nivel',
        })).toBeInTheDocument()
        expect(screen.getByText(/Dominio registrado: 38%/)).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', {
            name: /Generar ejercicio a mi nivel/,
        }))
        expect(await screen.findByTestId('assignment-location'))
            .toHaveTextContent('assignment=personalized-assignment-123')
        expect(generateAcademicUnitPractice).toHaveBeenCalledWith({
            accessToken: 'access-token',
            unitId: 'unit-1',
        })
    })

    it('sin diagnóstico conserva los ejercicios públicos e invita a completarlo', async () => {
        getAcademicCatalog.mockResolvedValue({
            ...catalogo,
            personalization: {
                status: 'diagnostic_required',
                difficulty: null,
            },
        })
        renderUnit()

        expect(await screen.findByRole('heading', {
            name: 'Descubre tu nivel de conocimientos',
        })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Realizar diagnóstico/ }))
            .toHaveAttribute('href', '/diagnostic')
        expect(screen.queryByRole('button', {
            name: /Generar ejercicio a mi nivel/,
        })).not.toBeInTheDocument()
        expect(generateAcademicUnitPractice).not.toHaveBeenCalled()
    })
})

describe('AcademicUnitPage - estado persistente de finalización', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        getAcademicCatalog.mockResolvedValue(catalogo)
        assignAcademicExerciseAssignment.mockResolvedValue({
            assignment: { id: 'new-assignment' },
        })
    })

    it('muestra finalizados y permite repetir sin borrar el estado', async () => {
        getAcademicUnitExercises.mockResolvedValue({
            unit: { id: 'unit-1' },
            exercises: [
                {
                    id: 'exercise-done',
                    title: 'Ejercicio aprobado',
                    statement: 'Ejercicio terminado',
                    difficultyId: 1,
                    completed: true,
                    completedAt: '2026-11-25T18:00:00.000Z',
                    inProgress: false,
                },
                {
                    id: 'exercise-pending',
                    title: 'Ejercicio pendiente',
                    statement: 'Todavía por hacer',
                    difficultyId: 2,
                    completed: false,
                    inProgress: true,
                },
            ],
        })

        renderUnit()

        expect(await screen.findByText('1 de 2 finalizados'))
            .toBeInTheDocument()
        expect(screen.getByText('Finalizado')).toBeInTheDocument()
        expect(screen.getByText('En progreso')).toBeInTheDocument()
        expect(screen.getByRole('button', {
            name: 'Resolver ejercicio: Ejercicio aprobado',
        })).toHaveTextContent('Volver a practicar')
        expect(screen.getByRole('button', {
            name: 'Resolver ejercicio: Ejercicio pendiente',
        })).toHaveTextContent('Continuar ejercicio')

        fireEvent.click(screen.getByRole('button', {
            name: 'Resolver ejercicio: Ejercicio aprobado',
        }))
        expect(await screen.findByTestId('assignment-location'))
            .toHaveTextContent('assignment=new-assignment')
        expect(assignAcademicExerciseAssignment).toHaveBeenCalledWith({
            accessToken: 'access-token',
            unitId: 'unit-1',
            exerciseId: 'exercise-done',
        })
    })

    it('no marca como terminado un ejercicio sin aprobación', async () => {
        getAcademicUnitExercises.mockResolvedValue({
            unit: { id: 'unit-1' },
            exercises: [{
                id: 'exercise-1',
                title: 'Reto sin resolver',
                statement: 'Pendiente',
                completed: false,
                inProgress: false,
            }],
        })
        renderUnit()
        expect(await screen.findByText('0 de 1 finalizados'))
            .toBeInTheDocument()
        expect(screen.queryByText('Finalizado')).not.toBeInTheDocument()
    })
})

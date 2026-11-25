
import {
    render,
    screen,
    within,
} from '@testing-library/react'

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
    getAcademicCatalog,
} from '../api/exercise.api.js'

import {
    getCurrentLearningPlan,
} from '../api/learning-paths.api.js'

import {
    selectStudentRoute,
} from '../api/student-routes.api.js'

import {
    AuthContext,
} from '../auth/auth-context.js'

import {
    ExercisesCatalogPage,
} from './ExercisesCatalogPage.jsx'

vi.mock('../api/learning-paths.api.js', () => ({
    getCurrentLearningPlan: vi.fn(),
}))

vi.mock('../api/exercise.api.js', () => ({
    getAcademicCatalog: vi.fn(),
}))

vi.mock('../api/student-routes.api.js', () => ({
    selectStudentRoute: vi.fn(),
}))

const renderCatalog = () => render(
    <AuthContext.Provider
        value={{
            accessToken: 'access-token',
            user: {
                id: 'student-1',
                fullName: 'Estudiante Learn2Code',
                emailVerified: true,
            },
            signOut: vi.fn(),
        }}
    >
        <MemoryRouter initialEntries={['/exercises']}>
            <ExercisesCatalogPage />
        </MemoryRouter>
    </AuthContext.Provider>,
)

describe('ExercisesCatalogPage - recomendación de IA', () => {
    beforeEach(() => {
        vi.resetAllMocks()

        getCurrentLearningPlan.mockResolvedValue({
            state: 'not_generated',
            plan: null,
        })

        getAcademicCatalog.mockResolvedValue({
            specializations: [
                {
                    key: 'frontend',
                    name: 'Desarrollo Frontend',
                    stages: [
                        {
                            id: 1,
                            position: 1,
                            title: 'Fundamentos Web',
                            status: 'planned',
                            modules: [],
                        },
                    ],
                },
                {
                    key: 'backend',
                    name: 'Desarrollo Backend',
                    stages: [],
                },
                {
                    key: 'fullstack',
                    name: 'Desarrollo Full Stack',
                    stages: [],
                },
                {
                    key: 'devops',
                    name: 'DevOps',
                    stages: [],
                },
            ],
        })
    })

    it.each([
        ['frontend', 'Frontend'],
        ['backend', 'Backend'],
        ['fullstack', 'Full Stack'],
        ['devops', 'DevOps'],
    ])(
        'muestra la especialización recomendada %s',
        async (specializationKey, nombre) => {
            getCurrentLearningPlan.mockResolvedValue({
                state: 'recommended',
                plan: { specializationKey },
            })

            renderCatalog()

            expect(
                await screen.findByText(
                    `IA recomienda: ${nombre}`,
                ),
            ).toBeInTheDocument()

            expect(
                getCurrentLearningPlan,
            ).toHaveBeenCalledWith('access-token')

            expect(
                selectStudentRoute,
            ).not.toHaveBeenCalled()
        },
    )

    it('acepta una recomendación de un plan confirmado', async () => {
        getCurrentLearningPlan.mockResolvedValue({
            state: 'confirmed',
            plan: {
                specializationKey: 'backend',
            },
        })

        renderCatalog()

        expect(
            await screen.findByText('IA recomienda: Backend'),
        ).toBeInTheDocument()
    })

    it('no inventa una especialización sin plan', async () => {
        getCurrentLearningPlan.mockResolvedValue({
            state: 'not_generated',
            plan: null,
        })

        renderCatalog()

        expect(
            await screen.findByText(
                'Sin recomendación de IA disponible',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByText(/IA recomienda:/),
        ).not.toBeInTheDocument()
    })

    it('rechaza una especialización desconocida', async () => {
        getCurrentLearningPlan.mockResolvedValue({
            state: 'recommended',
            plan: {
                specializationKey: 'unknown',
            },
        })

        renderCatalog()

        expect(
            await screen.findByText(
                'Sin recomendación de IA disponible',
            ),
        ).toBeInTheDocument()
    })

    it('informa cuando falla la consulta del plan', async () => {
        getCurrentLearningPlan.mockRejectedValue(
            new Error('No se pudo consultar el servidor'),
        )

        renderCatalog()

        expect(
            await screen.findByText(
                'No se pudo consultar la recomendación',
            ),
        ).toBeInTheDocument()

        expect(
            selectStudentRoute,
        ).not.toHaveBeenCalled()
    })

    it('muestra especializaciones y etapas del catálogo académico', async () => {
        renderCatalog()

        expect(
            await screen.findByRole('heading', {
                name: 'Desarrollo Frontend',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Fundamentos Web'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(/En preparación/),
        ).toBeInTheDocument()

        expect(getAcademicCatalog).toHaveBeenCalledWith(
            'access-token',
        )

        expect(
            screen.queryByText('Variables y operaciones'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText('Filtrar una lista de productos'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('link', {
                name: 'Comenzar ejercicio',
            }),
        ).not.toBeInTheDocument()
    })

    it('informa cuando falla la consulta del catálogo académico', async () => {
        getAcademicCatalog.mockRejectedValue(
            new Error('Servicio no disponible'),
        )

        renderCatalog()

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No pudimos consultar el catálogo académico',
        )

        expect(
            screen.queryByRole('heading', {
                name: 'Desarrollo Frontend',
            }),
        ).not.toBeInTheDocument()
    })

    it('muestra la composición de cuatro tarjetas con etapas reales', async () => {
        renderCatalog()

        expect(
            await screen.findByRole('heading', {
                name: 'Desarrollo Frontend',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('navigation', {
                name: 'Navegación del catálogo',
            }),
        ).toBeInTheDocument()

        expect(
            document.querySelector('.excat-content--catalog'),
        ).toBeInTheDocument()

        const tarjetas = document.querySelectorAll(
            '#catalogo-academico .excat-specialization',
        )

        expect(tarjetas).toHaveLength(4)

        expect(
            within(tarjetas[0]).getByText('Fundamentos Web'),
        ).toBeInTheDocument()

        expect(
            within(tarjetas[0]).getByText('En preparación'),
        ).toBeInTheDocument()

        expect(
            screen.queryByText('50 ejercicios completados'),
        ).not.toBeInTheDocument()

        // No mostrar un catálogo ficticio vacío junto al catálogo publicado.
        expect(
            screen.queryByRole('heading', {
                name: 'Explora los ejercicios',
            }),
        ).not.toBeInTheDocument()
    })

    it('solo destaca la especialización indicada por el plan de IA', async () => {
        getCurrentLearningPlan.mockResolvedValue({
            state: 'recommended',
            plan: { specializationKey: 'backend' },
        })

        getAcademicCatalog.mockResolvedValue({
            personalization: {
                status: 'personalized',
                difficulty: { id: 2, name: 'Intermedio' },
            },
            specializations: ['frontend', 'backend', 'fullstack', 'devops'].map((key) => ({
                key,
                name: 'Desarrollo ' + key,
                personalization: {
                    recommendedStageId: key + '-stage',
                },
                stages: [{
                    id: key + '-stage',
                    title: 'Fundamentos ' + key,
                    position: 1,
                    status: 'published',
                    personalization: { recommended: true },
                    modules: [{
                        id: key + '-module',
                        title: 'Módulo',
                        units: [{ id: key + '-unit', title: 'Unidad' }],
                    }],
                }],
            })),
        })

        renderCatalog()

        expect(await screen.findByText('IA recomienda: Backend'))
            .toBeInTheDocument()
        const tarjetas = document.querySelectorAll(
            '#catalogo-academico .excat-specialization',
        )
        expect(tarjetas).toHaveLength(4)

        for (const tarjeta of tarjetas) {
            const isBackend = within(tarjeta).queryByRole('heading', {
                name: 'Desarrollo backend',
            }) !== null
            const expected = isBackend ? 1 : 0
            expect(within(tarjeta).queryAllByText('Recorrido sugerido para ti'))
                .toHaveLength(expected)
            expect(within(tarjeta).queryAllByText('Recomendado para ti'))
                .toHaveLength(expected)
        }
    })

    it('sin plan recomendado no destaca las cuatro especializaciones', async () => {
        getAcademicCatalog.mockResolvedValue({
            personalization: {
                status: 'personalized',
                difficulty: { id: 2, name: 'Intermedio' },
            },
            specializations: ['frontend', 'backend', 'fullstack', 'devops'].map((key) => ({
                key,
                name: 'Desarrollo ' + key,
                personalization: { recommendedStageId: key + '-stage' },
                stages: [{
                    id: key + '-stage',
                    title: 'Fundamentos ' + key,
                    position: 1,
                    status: 'published',
                    personalization: { recommended: true },
                    modules: [],
                }],
            })),
        })
        renderCatalog()
        expect(await screen.findByText('Sin recomendación de IA disponible'))
            .toBeInTheDocument()
        expect(screen.queryByText('Recorrido sugerido para ti')).not.toBeInTheDocument()
        expect(screen.queryByText('Recomendado para ti')).not.toBeInTheDocument()
    })

    it('abre las cuatro especializaciones dentro de Ejercicios', async () => {
        renderCatalog()

        const destinos = [
            ['Desarrollo Frontend', '/exercises/specializations/frontend'],
            ['Desarrollo Backend', '/exercises/specializations/backend'],
            ['Desarrollo Full Stack', '/exercises/specializations/fullstack'],
            ['DevOps', '/exercises/specializations/devops'],
        ]

        for (const [nombre, destino] of destinos) {
            const titulo = await screen.findByRole(
                'heading',
                { name: nombre },
            )

            const tarjeta = titulo.closest('article')

            expect(tarjeta).not.toBeNull()

            expect(
                within(tarjeta).getByRole('link', {
                    name: 'Ver especialización',
                }),
            ).toHaveAttribute('href', destino)
        }

        expect(
            selectStudentRoute,
        ).not.toHaveBeenCalled()
    })
})

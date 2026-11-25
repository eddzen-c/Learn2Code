
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
    getDashboardSummary,
} from '../api/dashboard.api.js'
import { getAcademicCatalog } from '../api/exercise.api.js'

import {
    AuthContext,
} from '../auth/auth-context.js'

import {
    DashboardPage,
} from './DashboardPage.jsx'

vi.mock('../api/dashboard.api.js', () => ({
    getDashboardSummary: vi.fn(),
}))
vi.mock('../api/exercise.api.js', () => ({
    getAcademicCatalog: vi.fn(),
}))

const dashboardSummary = {
    progress: {
        exercisesAttempted: 10,
        exercisesSolved: 7,
        exercisesAvailable: 50,
        exercisesCompleted: 7,
        catalogCompletionRate: 14,
        codeExecutions: 15,
        completionRate: 70,
        lastActivityAt: '2026-07-25T12:00:00.000Z',
    },

    gamification: {
        totalXp: 450,
        currentLevel: {
            id: 2,
            name: 'Programador Junior',
            minimumXp: 300,
        },
        nextLevel: {
            id: 3,
            name: 'Programador Intermedio',
            minimumXp: 1000,
        },
        levelProgressPercentage: 21.43,
        xpToNextLevel: 550,
        currentStreak: 4,
        longestStreak: 9,
        lastActiveDate: '2026-07-25',
        badgesEarned: 3,
    },

    recentActivity: [{
        id: 'activity-1',
        amount: 50,
        reason: 'Ejercicio completado',
        sourceType: 'exercise',
        sourceId: null,
        createdAt: '2026-07-25T12:30:00.000Z',
    }],
}

const renderDashboardPage = ({
    signOut = vi.fn(),
} = {}) => {
    render(
        <AuthContext.Provider
            value={{
                user: {
                    fullName: 'Estudiante Learn2Code',
                    email: 'student@example.com',
                    roles: ['student'],
                },
                accessToken: 'access-token',
                signOut,
            }}
        >
            <MemoryRouter>
                <DashboardPage />
            </MemoryRouter>
        </AuthContext.Provider>,
    )

    return { signOut }
}

describe('DashboardPage', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        getAcademicCatalog.mockResolvedValue({
            personalization: { status: 'diagnostic_required' },
            specializations: [],
        })
    })

    it('loads and displays real dashboard statistics', async () => {
        getDashboardSummary.mockResolvedValue(
            dashboardSummary,
        )

        renderDashboardPage()

        expect(
            await screen.findByText('450 XP'),
        ).toBeInTheDocument()

        expect(
            getDashboardSummary,
        ).toHaveBeenCalledWith('access-token')

        expect(
            screen.getByText('Ejercicio completado'),
        ).toBeInTheDocument()
        expect(screen.getByText('7 de 50 ejercicios')).toBeInTheDocument()

        expect(
            screen.getAllByText('4 días'),
        ).toHaveLength(3)

        const progressBars = screen.getAllByRole(
            'progressbar',
            { name: 'Porcentaje completado' },
        )

        expect(
            progressBars.some(
                (element) =>
                    element.getAttribute('aria-valuenow') === '14',
            ),
        ).toBe(true)
    })

    it('opens and closes the shared mobile navigation menu', async () => {
        const user = userEvent.setup()

        getDashboardSummary.mockResolvedValue(
            dashboardSummary,
        )

        renderDashboardPage()

        const navigation = screen.getByLabelText(
            'Navegación principal',
        )

        const openButton = screen.getByLabelText(
            'Abrir menú de navegación',
        )

        expect(openButton).toHaveAttribute(
            'aria-expanded',
            'false',
        )

        expect(navigation).not.toHaveClass(
            'is-mobile-open',
        )

        await user.click(openButton)

        const closeButton = screen.getByLabelText(
            'Cerrar menú de navegación',
        )

        expect(closeButton).toHaveAttribute(
            'aria-expanded',
            'true',
        )

        expect(navigation).toHaveClass(
            'is-mobile-open',
        )

        await user.click(closeButton)

        expect(navigation).not.toHaveClass(
            'is-mobile-open',
        )
    })

    it('shows the current empty activity message', async () => {
        getDashboardSummary.mockResolvedValue({
            ...dashboardSummary,
            recentActivity: [],
        })

        renderDashboardPage()

        expect(
            await screen.findByText(
                /Tus actividades aparecerán aquí conforme avances/,
            ),
        ).toBeInTheDocument()
    })

    it('allows retrying after an API error', async () => {
        const user = userEvent.setup()

        getDashboardSummary
            .mockRejectedValueOnce({
                code: 'NETWORK_ERROR',
            })
            .mockResolvedValueOnce(dashboardSummary)

        renderDashboardPage()

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No fue posible conectar con el servidor.',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Reintentar',
            }),
        )

        expect(
            await screen.findByText('450 XP'),
        ).toBeInTheDocument()

        await waitFor(() => {
            expect(
                getDashboardSummary,
            ).toHaveBeenCalledTimes(2)
        })
    })

    it('allows signing out from the account menu', async () => {
        const user = userEvent.setup()

        getDashboardSummary.mockResolvedValue(
            dashboardSummary,
        )

        const signOut = vi.fn().mockResolvedValue()

        renderDashboardPage({ signOut })

        await user.click(
            screen.getByRole('button', {
                name: 'Opciones de cuenta de Estudiante Learn2Code',
            }),
        )

        await user.click(
            screen.getByRole('menuitem', {
                name: 'Cerrar sesión',
            }),
        )

        await waitFor(() => {
            expect(signOut).toHaveBeenCalledOnce()
        })
    })
})

describe('DashboardPage - personalización académica real', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        getDashboardSummary.mockResolvedValue(dashboardSummary)
    })

    it('muestra la unidad recomendada por el dominio del estudiante', async () => {
        getAcademicCatalog.mockResolvedValue({
            personalization: {
                status: 'personalized',
                difficulty: { id: 2, name: 'Intermedio' },
            },
            specializations: [{
                key: 'frontend',
                name: 'Desarrollo Frontend',
                stages: [{
                    id: 'stage-1',
                    title: 'Fundamentos',
                    modules: [{
                        id: 'module-1',
                        title: 'JavaScript',
                        units: [{
                            id: 'unit-student',
                            title: 'Funciones para este estudiante',
                            personalization: {
                                recommended: true,
                                state: 'reinforce',
                                mastery: 37,
                                priority: 1,
                                message: 'Refuerza las funciones por tus resultados.',
                            },
                        }],
                    }],
                }],
            }],
        })
        renderDashboardPage()
        expect(await screen.findAllByText('Funciones para este estudiante'))
            .not.toHaveLength(0)
        expect(screen.getAllByText('Refuerza las funciones por tus resultados.').length)
            .toBeGreaterThan(0)
        expect(screen.getByText('Dominio registrado: 37%')).toBeInTheDocument()
        expect(screen.getAllByRole('link', { name: /Continuar esta unidad|Practicar esta unidad|Abrir práctica/ })
            .some((link) => link.getAttribute('href') === '/exercises/units/unit-student'))
            .toBe(true)
        expect(screen.queryByText('Manipulación del DOM')).not.toBeInTheDocument()
        expect(screen.queryByText('2 h 45 min')).not.toBeInTheDocument()
    })

    it('sin diagnóstico no inventa ejercicios sugeridos ni minutos de estudio', async () => {
        getAcademicCatalog.mockResolvedValue({
            personalization: { status: 'diagnostic_required' },
            specializations: [{
                name: 'Frontend',
                stages: [{
                    title: 'Etapa',
                    modules: [{
                        title: 'Módulo',
                        units: [{ id: 'unit-1', title: 'Contenido público' }],
                    }],
                }],
            }],
        })
        renderDashboardPage()
        expect(screen.queryByText('Tu dedicación')).not.toBeInTheDocument()
        expect(screen.queryByText('Contenido público')).not.toBeInTheDocument()
        expect(screen.getAllByText(/Completa tu diagnóstico/).length)
            .toBeGreaterThan(0)
    })
})

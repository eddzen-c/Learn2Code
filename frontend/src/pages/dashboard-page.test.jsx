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

import {
    AuthContext,
} from '../auth/auth-context.js'

import {
    DashboardPage,
} from './DashboardPage.jsx'

vi.mock('../api/dashboard.api.js', () => ({
    getDashboardSummary: vi.fn(),
}))

const dashboardSummary = {
    progress: {
        exercisesAttempted: 10,
        exercisesSolved: 7,
        codeExecutions: 15,
        completionRate: 70,
        lastActivityAt:
            '2026-07-25T12:00:00.000Z',
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
        createdAt:
            '2026-07-25T12:30:00.000Z',
    }],
}

const renderDashboardPage = ({
    signOut = vi.fn(),
} = {}) => {
    render(
        <AuthContext.Provider
            value={{
                user: {
                    fullName:
                        'Estudiante Learn2Code',
                    email:
                        'student@example.com',
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

    return {
        signOut,
    }
}

describe('DashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('loads and displays the dashboard summary', async () => {
        getDashboardSummary.mockResolvedValue(
            dashboardSummary,
        )

        renderDashboardPage()

        expect(
            await screen.findByText(
                'Programador Junior',
            ),
        ).toBeInTheDocument()

        expect(
            getDashboardSummary,
        ).toHaveBeenCalledWith(
            'access-token',
        )

        expect(
            screen.getByText('450'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Ejercicio completado',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('progressbar', {
                name: 'Progreso de ejercicios',
            }),
        ).toHaveAttribute(
            'aria-valuenow',
            '70',
        )
    })

    it('shows an empty activity message', async () => {
        getDashboardSummary.mockResolvedValue({
            ...dashboardSummary,
            recentActivity: [],
        })

        renderDashboardPage()

        expect(
            await screen.findByText(
                'Aún no hay actividad reciente.',
            ),
        ).toBeInTheDocument()
    })

    it('allows retrying after an API error', async () => {
        const user = userEvent.setup()

        getDashboardSummary
            .mockRejectedValueOnce({
                code: 'NETWORK_ERROR',
            })
            .mockResolvedValueOnce(
                dashboardSummary,
            )

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
            await screen.findByText(
                'Programador Junior',
            ),
        ).toBeInTheDocument()

        expect(
            getDashboardSummary,
        ).toHaveBeenCalledTimes(2)
    })

    it('allows the user to sign out', async () => {
        const user = userEvent.setup()

        getDashboardSummary.mockResolvedValue(
            dashboardSummary,
        )

        const signOut = vi
            .fn()
            .mockResolvedValue()

        renderDashboardPage({
            signOut,
        })

        await user.click(
            screen.getByRole('button', {
                name: 'Cerrar sesión',
            }),
        )

        await waitFor(() => {
            expect(signOut).toHaveBeenCalledOnce()
        })
    })
})
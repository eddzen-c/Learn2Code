import {
    render,
    screen,
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
    getBadgeCatalog,
} from '../api/gamification.api.js'
import { getDashboardSummary } from '../api/dashboard.api.js'

import {
    AuthContext,
} from '../auth/auth-context.js'

import {
    BadgesPage,
} from './BadgesPage.jsx'

vi.mock('../api/gamification.api.js', () => ({
    getBadgeCatalog: vi.fn(),
}))
vi.mock('../api/dashboard.api.js', () => ({
    getDashboardSummary: vi.fn(),
}))

const renderBadgesPage = () => {
    render(
        <AuthContext.Provider
            value={{
                accessToken:
                    'access-token',
                user: {
                    id: 'user-1',
                },
            }}
        >
            <MemoryRouter>
                <BadgesPage />
            </MemoryRouter>
        </AuthContext.Provider>,
    )
}

const catalog = {
    total: 2,
    earnedCount: 1,
    pendingCount: 1,

    badges: [
        {
            id: 'badge-1',
            name: 'Primer paso',
            description:
                'Completa tu primer ejercicio personalizado.',
            criteriaType:
                'exercises_completed',
            criteriaValue: {
                threshold: 1,
            },
            threshold: 1,
            currentValue: 1,
            progressPercentage: 100,
            earned: true,
            earnedAt:
                '2026-08-03T12:00:00.000Z',
        },
        {
            id: 'badge-2',
            name: 'En práctica',
            description:
                'Completa cinco ejercicios personalizados.',
            criteriaType:
                'exercises_completed',
            criteriaValue: {
                threshold: 5,
            },
            threshold: 5,
            currentValue: 1,
            progressPercentage: 20,
            earned: false,
            earnedAt: null,
        },
    ],
}

describe('BadgesPage', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        getDashboardSummary.mockResolvedValue({
            gamification: {
                totalXp: 150,
                currentLevel: { id: 1, name: 'Principiante' },
                levelProgressPercentage: 30,
                currentStreak: 2,
            },
        })
    })

    it('loads earned and pending badges', async () => {
        getBadgeCatalog.mockResolvedValue(
            catalog,
        )

        renderBadgesPage()

        expect(
            await screen.findByRole('heading', {
                name: /Cada paso cuenta/,
            }),
        ).toBeInTheDocument()

        expect(
            getBadgeCatalog,
        ).toHaveBeenCalledWith(
            'access-token',
        )

        expect(
            screen.getByRole('heading', {
                name: 'Primer paso',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getAllByRole('heading', {
                name: 'En práctica',
            })[0],
        ).toBeInTheDocument()

        expect(
            screen.getByText('Obtenido'),
        ).toBeInTheDocument()

        expect(
            screen.getAllByText('Por desbloquear')[0],
        ).toBeInTheDocument()

        expect(
            screen.getByRole('progressbar', {
                name:
                    'Progreso de En práctica',
            }),
        ).toHaveAttribute(
            'aria-valuenow',
            '20',
        )
    })

    it('allows retrying after an API error', async () => {
        const user = userEvent.setup()

        getBadgeCatalog
            .mockRejectedValueOnce(
                new Error(
                    'Network error',
                ),
            )
            .mockResolvedValueOnce(
                catalog,
            )

        renderBadgesPage()

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No fue posible cargar tus insignias.',
        )

        await user.click(
            screen.getByRole('button', {
                name:
                    'Intentar nuevamente',
            }),
        )

        expect(
            await screen.findByRole('heading', {
                name: 'Primer paso',
            }),
        ).toBeInTheDocument()

        expect(
            getBadgeCatalog,
        ).toHaveBeenCalledTimes(2)
    })

    it('shows an empty catalog message', async () => {
        getBadgeCatalog.mockResolvedValue({
            total: 0,
            earnedCount: 0,
            pendingCount: 0,
            badges: [],
        })

        renderBadgesPage()

        expect(
            await screen.findByText(
                'Todavía no hay insignias disponibles.',
            ),
        ).toBeInTheDocument()
    })
})
describe('Logros: filtros y detalles funcionales', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        getBadgeCatalog.mockResolvedValue(catalog)
        getDashboardSummary.mockResolvedValue({
            gamification: {
                totalXp: 150,
                currentLevel: { id: 1, name: 'Principiante' },
                levelProgressPercentage: 30,
                currentStreak: 2,
            },
        })
    })

    it('filtra insignias obtenidas y pendientes sin inventar registros', async () => {
        const user = userEvent.setup()
        renderBadgesPage()
        expect(await screen.findByRole('heading', { name: 'Primer paso' }))
            .toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Obtenidos' }))
        expect(screen.getByRole('heading', { name: 'Primer paso' })).toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'En práctica' }))
            .not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Por desbloquear' }))
        expect(screen.getAllByRole('heading', { name: 'En práctica' }).length).toBeGreaterThan(0)
        expect(screen.queryByRole('heading', { name: 'Primer paso' }))
            .not.toBeInTheDocument()
    })

    it('abre y cierra detalles basados en el requisito real', async () => {
        const user = userEvent.setup()
        renderBadgesPage()
        expect(await screen.findByRole('heading', { name: 'Primer paso' }))
            .toBeInTheDocument()
        const buttons = screen.getAllByRole('button', { name: /Ver detalle/ })
        await user.click(buttons[buttons.length - 1])
        expect(screen.getByRole('dialog', { name: 'Detalle de En práctica' }))
            .toBeInTheDocument()
        expect(screen.getByText(/Alcanza 5 en:/)).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Cerrar detalle' }))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
})

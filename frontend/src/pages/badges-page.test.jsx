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

import {
    AuthContext,
} from '../auth/auth-context.js'

import {
    BadgesPage,
} from './BadgesPage.jsx'

vi.mock('../api/gamification.api.js', () => ({
    getBadgeCatalog: vi.fn(),
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
        vi.clearAllMocks()
    })

    it('loads earned and pending badges', async () => {
        getBadgeCatalog.mockResolvedValue(
            catalog,
        )

        renderBadgesPage()

        expect(
            await screen.findByRole('heading', {
                name: 'Mis insignias',
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
            screen.getByRole('heading', {
                name: 'En práctica',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Obtenida'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Pendiente'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('progressbar', {
                name:
                    'Progreso de Primer paso',
            }),
        ).toHaveAttribute(
            'aria-valuenow',
            '100',
        )

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
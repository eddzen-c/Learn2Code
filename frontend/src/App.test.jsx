import {
    cleanup,
    render,
    screen,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    useAuth,
} from './auth/useAuth.js'

import {
    getCurrentStudentOnboarding,
} from './api/onboarding.api.js'

import App from './App.jsx'

vi.mock('./auth/useAuth.js', () => ({
    useAuth: vi.fn(),
}))

vi.mock(
    './api/onboarding.api.js',
    async (importOriginal) => ({
        ...(await importOriginal()),
        getCurrentStudentOnboarding: vi.fn(),
    }),
)

vi.mock('./pages/OnboardingPage.jsx', () => ({
    OnboardingPage: () => (
        <h1>Sobre ti</h1>
    ),
}))

vi.mock('./pages/DashboardPage.jsx', () => ({
    DashboardPage: () => (
        <h1>Dashboard del estudiante</h1>
    ),
}))

const setRoute = (pathname) => {
    window.history.replaceState(
        {},
        '',
        pathname,
    )
}

const pendingOnboarding = {
    state: 'pending',
    onboarding: null,
}

const completedOnboarding = {
    state: 'completed',
    onboarding: {
        completedAt:
            '2026-11-14T05:00:00.000Z',
        learningFlowCompletedAt:
            '2026-11-14T06:00:00.000Z',
    },
}

describe('LearningFlowGate', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        getCurrentStudentOnboarding.mockReset()

        useAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            accessToken: 'access-token',
            user: {
                emailVerified: true,
            },
        })
    })

    afterEach(() => {
        cleanup()
        setRoute('/')
    })

    it(
        'sends a new student to onboarding',
        async () => {
            getCurrentStudentOnboarding
                .mockResolvedValue(
                    pendingOnboarding,
                )

            setRoute('/')

            render(<App />)

            expect(
                await screen.findByRole(
                    'heading',
                    {
                        name: 'Sobre ti',
                    },
                ),
            ).toBeInTheDocument()

            expect(
                window.location.pathname,
            ).toBe('/onboarding')

            expect(
                getCurrentStudentOnboarding,
            ).toHaveBeenCalledWith(
                'access-token',
            )
        },
    )

    it(
        'blocks dashboard access before completion',
        async () => {
            getCurrentStudentOnboarding
                .mockResolvedValue({
                    state: 'completed',
                    onboarding: {
                        completedAt:
                            '2026-11-14T05:00:00.000Z',
                        learningFlowCompletedAt:
                            null,
                    },
                })

            setRoute('/dashboard')

            render(<App />)

            expect(
                await screen.findByRole(
                    'heading',
                    {
                        name: 'Sobre ti',
                    },
                ),
            ).toBeInTheDocument()

            expect(
                window.location.pathname,
            ).toBe('/onboarding')
        },
    )

    it(
        'opens the dashboard after completing the flow',
        async () => {
            getCurrentStudentOnboarding
                .mockResolvedValue(
                    completedOnboarding,
                )

            setRoute('/')

            render(<App />)

            expect(
                await screen.findByRole(
                    'heading',
                    {
                        name: 'Dashboard del estudiante',
                    },
                ),
            ).toBeInTheDocument()

            expect(
                window.location.pathname,
            ).toBe('/dashboard')
        },
    )

    it(
        'prevents repeating the diagnostic after completion',
        async () => {
            getCurrentStudentOnboarding
                .mockResolvedValue(
                    completedOnboarding,
                )

            setRoute('/diagnostic')

            render(<App />)

            expect(
                await screen.findByRole(
                    'heading',
                    {
                        name: 'Dashboard del estudiante',
                    },
                ),
            ).toBeInTheDocument()

            expect(
                window.location.pathname,
            ).toBe('/dashboard')
        },
    )

    it(
        'shows a retry option when the status request fails',
        async () => {
            getCurrentStudentOnboarding
                .mockRejectedValueOnce(
                    new Error(
                        'No se pudo consultar el servidor',
                    ),
                )
                .mockResolvedValue(
                    completedOnboarding,
                )

            setRoute('/dashboard')

            render(<App />)

            expect(
                await screen.findByRole(
                    'alert',
                ),
            ).toHaveTextContent(
                'No se pudo consultar el servidor',
            )

            await userEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name: 'Reintentar',
                    },
                ),
            )

            expect(
                await screen.findByRole(
                    'heading',
                    {
                        name: 'Dashboard del estudiante',
                    },
                ),
            ).toBeInTheDocument()

            expect(
                getCurrentStudentOnboarding,
            ).toHaveBeenCalledTimes(2)
        },
    )
})
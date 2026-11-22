import {
    render,
    screen,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
    MemoryRouter,
    Route,
    Routes,
} from 'react-router-dom'

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    getCurrentLearningPlan,
} from '../api/learning-paths.api.js'

import {
    getCurrentDiagnostic,
} from '../api/diagnostic.api.js'

import {
    completeStudentLearningFlow,
    getCurrentStudentOnboarding,
} from '../api/onboarding.api.js'

import {
    AuthContext,
} from '../auth/auth-context.js'

import {
    StartLearningPage,
} from './StartLearningPage.jsx'

vi.mock('../api/learning-paths.api.js', () => ({
    getCurrentLearningPlan: vi.fn(),
}))

vi.mock('../api/diagnostic.api.js', () => ({
    getCurrentDiagnostic: vi.fn(),
}))

vi.mock('../api/onboarding.api.js', () => ({
    completeStudentLearningFlow: vi.fn(),
    getCurrentStudentOnboarding: vi.fn(),
}))

const recommendedPlan = {
    state: 'recommended',
    plan: {
        id: 1,
        specializationKey: 'frontend',
        title: 'Plan recomendado de Frontend',
        estimatedWeeks: 6,
        steps: [
            {
                id: 1,
                title: 'Fundamentos de programación',
                description: 'Conceptos iniciales',
            },
        ],
    },
}

const completedDiagnostic = {
    state: 'completed',
    result: {
        overallScore: 75,
        resultingDifficulty: {
            name: 'Intermedio',
        },
    },
}

const studentOnboarding = {
    state: 'completed',
    onboarding: {
        completedAt: '2026-11-14T05:00:00.000Z',
        learningFlowCompletedAt: null,
        weeklyTimeCommitment: 'five_to_ten',
    },
}

const successfulCompletion = {
    state: 'completed',
    completedAt: '2026-11-14T06:00:00.000Z',
}

const renderStartLearningPage = () => {
    return render(
        <AuthContext.Provider
            value={{
                accessToken: 'access-token',
                user: {
                    fullName: 'Ana Gabriela',
                    emailVerified: true,
                },
            }}
        >
            <MemoryRouter
                initialEntries={['/start-learning']}
            >
                <Routes>
                    <Route
                        path="/start-learning"
                        element={<StartLearningPage />}
                    />

                    <Route
                        path="/dashboard"
                        element={
                            <h1>
                                Dashboard del estudiante
                            </h1>
                        }
                    />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>,
    )
}

describe('StartLearningPage', () => {
    beforeEach(() => {
        vi.resetAllMocks()

        getCurrentLearningPlan.mockResolvedValue(
            recommendedPlan,
        )

        getCurrentDiagnostic.mockResolvedValue(
            completedDiagnostic,
        )

        getCurrentStudentOnboarding.mockResolvedValue(
            studentOnboarding,
        )
    })

    it(
        'completes the learning flow and navigates to dashboard',
        async () => {
            const user = userEvent.setup()

            completeStudentLearningFlow.mockResolvedValue(
                successfulCompletion,
            )

            renderStartLearningPage()

            const continueButton =
                await screen.findByRole(
                    'button',
                    {
                        name: 'Continuar',
                    },
                )

            await user.click(continueButton)

            expect(
                completeStudentLearningFlow,
            ).toHaveBeenCalledWith({
                accessToken: 'access-token',
            })

            expect(
                await screen.findByRole(
                    'heading',
                    {
                        name: 'Dashboard del estudiante',
                    },
                ),
            ).toBeInTheDocument()

            expect(
                completeStudentLearningFlow,
            ).toHaveBeenCalledTimes(1)
        },
    )

    it(
        'keeps the student on the page when completion fails',
        async () => {
            const user = userEvent.setup()

            completeStudentLearningFlow.mockRejectedValue(
                new Error(
                    'No fue posible guardar el recorrido',
                ),
            )

            renderStartLearningPage()

            await user.click(
                await screen.findByRole(
                    'button',
                    {
                        name: 'Continuar',
                    },
                ),
            )

            expect(
                await screen.findByRole('alert'),
            ).toHaveTextContent(
                'No fue posible guardar el recorrido',
            )

            expect(
                screen.getByRole(
                    'button',
                    {
                        name: 'Continuar',
                    },
                ),
            ).toBeEnabled()

            expect(
                screen.queryByRole(
                    'heading',
                    {
                        name: 'Dashboard del estudiante',
                    },
                ),
            ).not.toBeInTheDocument()
        },
    )

    it(
        'does not navigate when the completion response is invalid',
        async () => {
            const user = userEvent.setup()

            completeStudentLearningFlow.mockResolvedValue({
                state: 'completed',
                completedAt: null,
            })

            renderStartLearningPage()

            await user.click(
                await screen.findByRole(
                    'button',
                    {
                        name: 'Continuar',
                    },
                ),
            )

            expect(
                await screen.findByRole('alert'),
            ).toHaveTextContent(
                'No fue posible confirmar la finalización del recorrido.',
            )

            expect(
                screen.queryByRole(
                    'heading',
                    {
                        name: 'Dashboard del estudiante',
                    },
                ),
            ).not.toBeInTheDocument()
        },
    )

    it(
        'disables the button while saving the completion',
        async () => {
            const user = userEvent.setup()

            let resolveCompletion

            completeStudentLearningFlow.mockImplementation(
                () => new Promise((resolve) => {
                    resolveCompletion = resolve
                }),
            )

            renderStartLearningPage()

            await user.click(
                await screen.findByRole(
                    'button',
                    {
                        name: 'Continuar',
                    },
                ),
            )

            expect(
                screen.getByRole(
                    'button',
                    {
                        name: 'Guardando...',
                    },
                ),
            ).toBeDisabled()

            expect(
                completeStudentLearningFlow,
            ).toHaveBeenCalledTimes(1)

            resolveCompletion(successfulCompletion)

            expect(
                await screen.findByRole(
                    'heading',
                    {
                        name: 'Dashboard del estudiante',
                    },
                ),
            ).toBeInTheDocument()
        },
    )
})
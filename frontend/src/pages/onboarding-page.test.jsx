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
    completeStudentOnboarding,
    getCurrentStudentOnboarding,
    getStudentOnboardingOptions,
} from '../api/onboarding.api.js'

import {
    AuthContext,
} from '../auth/auth-context.js'

import {
    OnboardingPage,
} from './OnboardingPage.jsx'

vi.mock('../api/onboarding.api.js', () => ({
    completeStudentOnboarding:
        vi.fn(),

    getCurrentStudentOnboarding:
        vi.fn(),

    getStudentOnboardingOptions:
        vi.fn(),
}))

const onboardingOptions = {
    languages: [
        {
            id: 1,
            name: 'JavaScript',
        },
        {
            id: 2,
            name: 'Python',
        },
    ],

    difficulties: [
        {
            id: 1,
            name: 'básico',
        },
        {
            id: 2,
            name: 'intermedio',
        },
        {
            id: 3,
            name: 'avanzado',
        },
    ],

    topics: [
        {
            id: 1,
            name: 'variables',
        },
        {
            id: 2,
            name: 'condicionales',
        },
    ],

    learningGoals: [
        'career_preparation',
        'professional_growth',
        'build_product',
        'personal_interest',
    ],

    technologyInterests: [
        'javascript',
        'python',
        'react',
        'html_css',
        'nodejs',
        'typescript',
        'java',
        'sql',
        'other',
    ],

    weeklyTimeCommitments: [
        'less_than_5',
        'five_to_ten',
        'ten_to_twenty',
        'more_than_twenty',
    ],

    learningStyles: [
        'practical',
        'visual',
        'reading',
        'guided',
    ],
}

const renderOnboardingPage = () => {
    render(
        <AuthContext.Provider
            value={{
                accessToken:
                    'access-token',

                user: {
                    fullName:
                        'Ana Gabriela',
                },
            }}
        >
            <MemoryRouter
                initialEntries={[
                    '/onboarding',
                ]}
            >
                <Routes>
                    <Route
                        element={
                            <OnboardingPage />
                        }
                        path="/onboarding"
                    />

                    <Route
                        element={
                            <h1>
                                Evaluación inicial
                            </h1>
                        }
                        path="/diagnostic"
                    />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>,
    )
}

describe('OnboardingPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        getStudentOnboardingOptions
            .mockResolvedValue(
                onboardingOptions,
            )

        getCurrentStudentOnboarding
            .mockResolvedValue({
                state: 'pending',
                onboarding: null,
            })

        completeStudentOnboarding
            .mockResolvedValue({
                state: 'completed',
            })
    })

    it(
        'stores the new student profile and opens the diagnostic',
        async () => {
            const user =
                userEvent.setup()

            renderOnboardingPage()

            expect(
                await screen.findByRole(
                    'heading',
                    {
                        name:
                            '¡Te damos la bienvenida, Ana!',
                    },
                ),
            ).toBeInTheDocument()

            await user.click(
                screen.getByRole(
                    'radio',
                    {
                        name:
                            /Conseguir trabajo como desarrollador/,
                    },
                ),
            )

            await user.click(
                screen.getByRole(
                    'radio',
                    {
                        name:
                            /Intermedio/,
                    },
                ),
            )

            await user.click(
                screen.getByRole(
                    'checkbox',
                    {
                        name: /JavaScript/,
                    },
                ),
            )

            await user.click(
                screen.getByRole(
                    'checkbox',
                    {
                        name: /React/,
                    },
                ),
            )

            await user.click(
                screen.getByRole(
                    'checkbox',
                    {
                        name: /Node\.js/,
                    },
                ),
            )

            await user.click(
                screen.getByRole(
                    'radio',
                    {
                        name:
                            /10 - 20 horas/,
                    },
                ),
            )

            await user.click(
                screen.getByRole(
                    'radio',
                    {
                        name: /Práctico/,
                    },
                ),
            )

            await user.type(
                screen.getByLabelText(
                    '¿Qué te gustaría construir primero?',
                ),
                'Una plataforma educativa',
            )

            await user.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Continuar al diagnóstico',
                    },
                ),
            )

            expect(
                completeStudentOnboarding,
            ).toHaveBeenCalledWith({
                accessToken:
                    'access-token',

                preferences: {
                    languageId: 1,

                    selfAssessedDifficultyId:
                        2,

                    learningGoal:
                        'career_preparation',

                    weeklyTimeCommitment:
                        'ten_to_twenty',

                    learningStyle:
                        'practical',

                    technologyInterestKeys: [
                        'javascript',
                        'react',
                        'nodejs',
                    ],

                    projectIdea:
                        'Una plataforma educativa',
                },
            })

            expect(
                await screen.findByRole(
                    'heading',
                    {
                        name:
                            'Evaluación inicial',
                    },
                ),
            ).toBeInTheDocument()
        },
    )

    it(
        'requires at least one technology',
        async () => {
            const user =
                userEvent.setup()

            renderOnboardingPage()

            await screen.findByRole(
                'heading',
                {
                    name:
                        '¡Te damos la bienvenida, Ana!',
                },
            )

            await user.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Continuar al diagnóstico',
                    },
                ),
            )

            expect(
                await screen.findByRole(
                    'alert',
                ),
            ).toHaveTextContent(
                'Selecciona al menos una tecnología.',
            )

            expect(
                completeStudentOnboarding,
            ).not.toHaveBeenCalled()
        },
    )
})
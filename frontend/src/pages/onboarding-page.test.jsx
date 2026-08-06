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
        {
            id: 3,
            name: 'ciclos',
        },
        {
            id: 4,
            name: 'funciones',
        },
        {
            id: 5,
            name: 'estructuras de datos',
        },
    ],

    learningGoals: [
        'academic_support',
        'career_preparation',
        'build_product',
    ],

    interests: [
        'video_games',
        'music',
        'sports_fitness',
        'cooking_gastronomy',
        'movies_series_anime',
        'finance_crypto',
    ],

    studyPaces: [
        'casual',
        'student',
        'intensive',
    ],
}

const renderOnboardingPage = () => {
    render(
        <AuthContext.Provider
            value={{
                accessToken:
                    'access-token',
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
        'stores the preferences and opens the diagnostic',
        async () => {
            const user =
                userEvent.setup()

            renderOnboardingPage()

            expect(
                await screen.findByRole(
                    'heading',
                    {
                        name:
                            'Cuéntanos sobre ti',
                    },
                ),
            ).toBeInTheDocument()

            await user.selectOptions(
                screen.getByLabelText(
                    'Lenguaje de programación',
                ),
                '2',
            )

            await user.click(
                screen.getByRole(
                    'checkbox',
                    {
                        name: 'Videojuegos',
                    },
                ),
            )

            await user.click(
                screen.getByRole(
                    'checkbox',
                    {
                        name:
                            'Música y conciertos',
                    },
                ),
            )

            await user.click(
                screen.getByRole(
                    'radio',
                    {
                        name: 'intermedio',
                    },
                ),
            )

            await user.click(
                screen.getByRole(
                    'radio',
                    {
                        name:
                            /Intensivo/,
                    },
                ),
            )

            await user.selectOptions(
                screen.getByLabelText(
                    'Objetivo principal',
                ),
                'career_preparation',
            )

            await user.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Crear mi diagnóstico',
                    },
                ),
            )

            expect(
                completeStudentOnboarding,
            ).toHaveBeenCalledWith({
                accessToken:
                    'access-token',

                preferences: {
                    languageId: 2,

                    selfAssessedDifficultyId:
                        2,

                    learningGoal:
                        'career_preparation',

                    studyPace:
                        'intensive',

                    interestKeys: [
                        'video_games',
                        'music',
                    ],

                    topicIds: [
                        1,
                        2,
                        3,
                        4,
                        5,
                    ],
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
        'allows selecting at most three interests',
        async () => {
            const user =
                userEvent.setup()

            renderOnboardingPage()

            await screen.findByRole(
                'heading',
                {
                    name:
                        'Cuéntanos sobre ti',
                },
            )

            await user.click(
                screen.getByRole(
                    'checkbox',
                    {
                        name: 'Videojuegos',
                    },
                ),
            )

            await user.click(
                screen.getByRole(
                    'checkbox',
                    {
                        name:
                            'Música y conciertos',
                    },
                ),
            )

            await user.click(
                screen.getByRole(
                    'checkbox',
                    {
                        name:
                            'Deportes y fitness',
                    },
                ),
            )

            const fourthInterest =
                screen.getByRole(
                    'checkbox',
                    {
                        name:
                            'Cocina y gastronomía',
                    },
                )

            await user.click(
                fourthInterest,
            )

            expect(
                await screen.findByRole(
                    'alert',
                ),
            ).toHaveTextContent(
                'Selecciona como máximo tres intereses.',
            )

            expect(
                fourthInterest,
            ).not.toBeChecked()
        },
    )
})
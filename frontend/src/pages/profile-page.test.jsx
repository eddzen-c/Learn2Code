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
    AuthContext,
} from '../auth/auth-context.js'

import {
    ProfilePage,
} from './ProfilePage.jsx'

import {
    PublicProfilePage,
} from './PublicProfilePage.jsx'

import {
    getCurrentStudentOnboarding,
} from '../api/onboarding.api.js'

import {
    getCurrentDiagnostic,
} from '../api/diagnostic.api.js'

import {
    getCurrentStudentRoute,
} from '../api/student-routes.api.js'

import {
    getCurrentUserPrivacyPreferences,
    updateCurrentUserPrivacyPreferences,
    getCurrentUserNotificationPreferences,
    updateCurrentUserNotificationPreferences,
} from '../api/auth.api.js'

import {
    getDashboardSummary,
} from '../api/dashboard.api.js'

import {
    getBadgeCatalog,
} from '../api/gamification.api.js'

vi.mock('../api/onboarding.api.js', () => ({
    getCurrentStudentOnboarding: vi.fn(),
}))

vi.mock('../api/diagnostic.api.js', () => ({
    getCurrentDiagnostic: vi.fn(),
}))

vi.mock('../api/student-routes.api.js', () => ({
    getCurrentStudentRoute: vi.fn(),
}))

vi.mock('../api/auth.api.js', async (importOriginal) => ({
    ...(await importOriginal()),
    getCurrentUserPrivacyPreferences: vi.fn(),
    updateCurrentUserPrivacyPreferences: vi.fn(),
    getCurrentUserNotificationPreferences: vi.fn(),
    updateCurrentUserNotificationPreferences: vi.fn(),
}))

vi.mock('../api/dashboard.api.js', () => ({
    getDashboardSummary: vi.fn(),
}))

vi.mock('../api/gamification.api.js', () => ({
    getBadgeCatalog: vi.fn(),
}))

beforeEach(() => {
    getDashboardSummary.mockReset()

    getDashboardSummary.mockResolvedValue({
        gamification: null,
    })
})

const currentUser = {
    id: 'user-1',
    fullName: 'Estudiante Learn2Code',
    email: 'student@example.com',
    username: 'estudiante_dev',
    bio: 'Aprendiendo programación',
    githubUrl: 'https://github.com/estudiante',
    portfolioUrl: 'https://example.com',
    roles: ['student'],
    preferredLocale: 'es-MX',
    preferredProgrammingLanguageId: 1,
    emailVerified: true,
}

const renderProfilePage = ({
    loadProfile,
    updateProfile = vi.fn(),
    accessToken = null,
}) => {
    return render(
        <AuthContext.Provider
            value={{
                user: null,
                loadProfile,
                accessToken,
                updateProfile,
                signOut: vi.fn(),
            }}
        >
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        </AuthContext.Provider>,
    )
}

describe('ProfilePage', () => {

    it('loads the current personal information', async () => {
        const loadProfile = vi
            .fn()
            .mockResolvedValue(currentUser)

        renderProfilePage({ loadProfile })

        expect(
            await screen.findByLabelText('Nombre'),
        ).toHaveValue('Estudiante')

        expect(
            screen.getByLabelText('Apellidos'),
        ).toHaveValue('Learn2Code')

        expect(
            screen.getByLabelText('Nombre de usuario'),
        ).toHaveValue('estudiante_dev')

        expect(
            screen.getByLabelText('Correo electrónico'),
        ).toHaveValue('student@example.com')

        expect(
            screen.getByLabelText('Sobre mí'),
        ).toHaveValue('Aprendiendo programación')

        expect(
            screen.getByLabelText('GitHub (opcional)'),
        ).toHaveValue('https://github.com/estudiante')

        expect(
            screen.getByLabelText('Portafolio (opcional)'),
        ).toHaveValue('https://example.com')

        expect(loadProfile).toHaveBeenCalledOnce()
    })

    it('updates and saves the personal information', async () => {
        const user = userEvent.setup()

        const loadProfile = vi
            .fn()
            .mockResolvedValue(currentUser)

        const updatedUser = {
            ...currentUser,
            fullName: 'Estudiante Actualizado',
            username: 'estudiante_nuevo',
            bio: 'Desarrollando aplicaciones con React',
            githubUrl: 'https://github.com/nuevo',
            portfolioUrl: 'https://nuevositio.com',
        }

        const updateProfile = vi
            .fn()
            .mockResolvedValue(updatedUser)

        renderProfilePage({
            loadProfile,
            updateProfile,
        })

        const lastNameInput =
            await screen.findByLabelText('Apellidos')

        await user.clear(lastNameInput)
        await user.paste('Actualizado')

        const usernameInput =
            screen.getByLabelText('Nombre de usuario')

        await user.clear(usernameInput)
        await user.paste('estudiante_nuevo')

        const bioInput =
            screen.getByLabelText('Sobre mí')

        await user.clear(bioInput)
        await user.paste(
            'Desarrollando aplicaciones con React',
        )

        const githubInput =
            screen.getByLabelText('GitHub (opcional)')

        await user.clear(githubInput)
        await user.paste(
            'https://github.com/nuevo',
        )

        const portfolioInput =
            screen.getByLabelText('Portafolio (opcional)')

        await user.clear(portfolioInput)
        await user.paste(
            'https://nuevositio.com',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Guardar cambios',
            }),
        )

        await waitFor(() => {
            expect(updateProfile).toHaveBeenCalledWith({
                fullName: 'Estudiante Actualizado',
                username: 'estudiante_nuevo',
                bio: 'Desarrollando aplicaciones con React',
                githubUrl: 'https://github.com/nuevo',
                portfolioUrl: 'https://nuevositio.com',
            })
        })

        expect(
            await screen.findByText(
                'Información personal actualizada correctamente.',
            ),
        ).toBeInTheDocument()

        await waitFor(() => {
            expect(
                screen.getByLabelText('Apellidos'),
            ).toHaveValue('Actualizado')
        })
    })

    it('shows an error when the username is already taken', async () => {
        const user = userEvent.setup()

        const loadProfile = vi
            .fn()
            .mockResolvedValue(currentUser)

        const updateProfile = vi
            .fn()
            .mockRejectedValue({
                code: 'USERNAME_ALREADY_TAKEN',
            })

        renderProfilePage({
            loadProfile,
            updateProfile,
        })

        const usernameInput =
            await screen.findByLabelText('Nombre de usuario')

        await user.clear(usernameInput)
        await user.type(
            usernameInput,
            'usuario_ocupado',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Guardar cambios',
            }),
        )

        expect(
            await screen.findByText(
                'Ese nombre de usuario ya está ocupado. Elige otro.',
            ),
        ).toBeInTheDocument()

        expect(updateProfile).toHaveBeenCalledOnce()
    })

    it('shows an error when the profile cannot load', async () => {
        const loadProfile = vi
            .fn()
            .mockRejectedValue({
                code: 'NETWORK_ERROR',
            })

        const updateProfile = vi.fn()

        renderProfilePage({
            loadProfile,
            updateProfile,
        })

        expect(
            await screen.findByRole('heading', {
                name: 'No fue posible cargar tu perfil',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'No fue posible conectar con el servidor.',
        )

        expect(updateProfile).not.toHaveBeenCalled()
    })


    it('shows actual onboarding, diagnostic and selected route', async () => {
        const loadProfile = vi
            .fn()
            .mockResolvedValue(currentUser)

        getCurrentStudentOnboarding.mockResolvedValue({
            state: 'completed',
            onboarding: {
                learningGoal: 'build_product',
                weeklyTimeCommitment: 'ten_to_twenty',
            },
        })

        getCurrentDiagnostic.mockResolvedValue({
            state: 'completed',
            result: {
                resultingDifficulty: {
                    name: 'Intermedio',
                },
            },
        })

        getCurrentStudentRoute.mockResolvedValue({
            state: 'selected',
            selection: {
                specializationKey: 'fullstack',
            },
        })

        renderProfilePage({
            loadProfile,
            accessToken: 'test-access-token',
        })

        expect(
            await screen.findAllByText('Full Stack'),
        ).toHaveLength(2)

        expect(
            screen.getByText('Intermedio'),
        ).toBeInTheDocument()

        // El encabezado debe mostrar el nivel diagnóstico real.
        expect(
            screen.getByText('Nivel intermedio'),
        ).toBeInTheDocument()

        // La etiqueta del encabezado debe usar la ruta seleccionada.
        expect(
            screen.getByText('Ruta Full Stack'),
        ).toBeInTheDocument()

        expect(
            screen.queryByText('Diagnóstico pendiente'),
        ).not.toBeInTheDocument()

        expect(
            screen.getByText('Crear mis propios proyectos'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('10 - 20 horas'),
        ).toBeInTheDocument()

        expect(
            getCurrentStudentOnboarding,
        ).toHaveBeenCalledWith('test-access-token')

        expect(
            getCurrentDiagnostic,
        ).toHaveBeenCalledWith('test-access-token')

        expect(
            getCurrentStudentRoute,
        ).toHaveBeenCalledWith('test-access-token')
    })

    it('shows pending route and diagnostic labels without duplication', async () => {
        const loadProfile = vi
            .fn()
            .mockResolvedValue(currentUser)

        getCurrentStudentOnboarding.mockResolvedValue({
            state: 'not_started',
        })

        getCurrentDiagnostic.mockResolvedValue({
            state: 'not_started',
        })

        getCurrentStudentRoute.mockResolvedValue({
            state: 'not_selected',
        })

        renderProfilePage({
            loadProfile,
            accessToken: 'test-access-token',
        })

        expect(
            await screen.findByText('Ruta pendiente'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Diagnóstico pendiente'),
        ).toBeInTheDocument()

        expect(
            screen.queryByText('Ruta Sin ruta seleccionada'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText('Nivel pendiente'),
        ).not.toBeInTheDocument()
    })

    it('shows real gamification statistics without demo values', async () => {
        getDashboardSummary.mockResolvedValue({
            gamification: {
                currentLevel: {
                    id: 2,
                    name: 'Programador Junior',
                },
                totalXp: 450,
                currentStreak: 4,
            },
        })

        renderProfilePage({
            loadProfile: vi.fn().mockResolvedValue(currentUser),
            accessToken: 'test-access-token',
        })

        expect(
            await screen.findByText('Nivel Programador Junior'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('450 XP'),
        ).toBeInTheDocument()

        expect(
            screen.getAllByText('4 días'),
        ).toHaveLength(3)

        expect(
            screen.queryByText('14 días'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText('2,450 XP'),
        ).not.toBeInTheDocument()

        expect(
            getDashboardSummary,
        ).toHaveBeenCalledWith(
            'test-access-token',
        )
    })

})

// ============================================================
// PRUEBAS DE INTEGRACIÓN - PRIVACIDAD EN PERFIL
// ============================================================

describe('ProfilePage privacy integration', () => {
    const defaultPreferences = {
        audience: 'members',
        showRoute: true,
        showAchievements: true,
        showLevel: false,
        showStreak: false,
    }

    beforeEach(() => {
        getCurrentUserPrivacyPreferences.mockReset()
        updateCurrentUserPrivacyPreferences.mockReset()
    })

    it('loads privacy preferences from the API', async () => {
        const user = userEvent.setup()

        const preferences = {
            ...defaultPreferences,
            audience: 'private',
            showRoute: false,
        }

        getCurrentUserPrivacyPreferences
            .mockResolvedValue(preferences)

        renderProfilePage({
            loadProfile: vi.fn().mockResolvedValue(currentUser),
            accessToken: 'test-access-token',
        })

        await screen.findByLabelText('Nombre')

        await user.click(
            screen.getByRole('tab', {
                name: 'Privacidad',
            }),
        )

        const audience = await screen.findByLabelText(
            'Quién puede ver mi perfil',
        )

        expect(audience).toHaveValue('private')

        expect(
            getCurrentUserPrivacyPreferences,
        ).toHaveBeenCalledWith('test-access-token')
    })

    it('saves privacy changes through the API', async () => {
        const user = userEvent.setup()

        getCurrentUserPrivacyPreferences
            .mockResolvedValue(defaultPreferences)

        const savedPreferences = {
            ...defaultPreferences,
            audience: 'private',
        }

        updateCurrentUserPrivacyPreferences
            .mockResolvedValue(savedPreferences)

        renderProfilePage({
            loadProfile: vi.fn().mockResolvedValue(currentUser),
            accessToken: 'test-access-token',
        })

        await screen.findByLabelText('Nombre')

        await user.click(
            screen.getByRole('tab', {
                name: 'Privacidad',
            }),
        )

        const audience = await screen.findByLabelText(
            'Quién puede ver mi perfil',
        )

        await user.selectOptions(
            audience,
            'private',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Guardar privacidad',
            }),
        )

        await waitFor(() => {
            expect(
                updateCurrentUserPrivacyPreferences,
            ).toHaveBeenCalledWith({
                accessToken: 'test-access-token',
                preferences: savedPreferences,
            })
        })

        expect(
            await screen.findByText(
                'Privacidad guardada correctamente.',
            ),
        ).toBeInTheDocument()
    })

    it('shows an error when privacy cannot load', async () => {
        const user = userEvent.setup()

        getCurrentUserPrivacyPreferences
            .mockRejectedValue({
                code: 'NETWORK_ERROR',
            })

        renderProfilePage({
            loadProfile: vi.fn().mockResolvedValue(currentUser),
            accessToken: 'test-access-token',
        })

        await screen.findByLabelText('Nombre')

        await user.click(
            screen.getByRole('tab', {
                name: 'Privacidad',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No fue posible conectar con el servidor.',
        )

        expect(
            screen.queryByRole('button', {
                name: 'Guardar privacidad',
            }),
        ).not.toBeInTheDocument()
    })

    it('does not report success when saving fails', async () => {
        const user = userEvent.setup()

        getCurrentUserPrivacyPreferences
            .mockResolvedValue(defaultPreferences)

        updateCurrentUserPrivacyPreferences
            .mockRejectedValue({
                code: 'NETWORK_ERROR',
            })

        renderProfilePage({
            loadProfile: vi.fn().mockResolvedValue(currentUser),
            accessToken: 'test-access-token',
        })

        await screen.findByLabelText('Nombre')

        await user.click(
            screen.getByRole('tab', {
                name: 'Privacidad',
            }),
        )

        const audience = await screen.findByLabelText(
            'Quién puede ver mi perfil',
        )

        await user.selectOptions(
            audience,
            'private',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Guardar privacidad',
            }),
        )

        expect(
            await screen.findByText(
                'No se pudieron guardar los cambios.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByText(
                'Privacidad guardada correctamente.',
            ),
        ).not.toBeInTheDocument()
    })
})

// ============================================================
// PRUEBAS DE VISTA PREVIA DE PRIVACIDAD
// ============================================================

describe('PublicProfilePage privacy preview', () => {
    const savedPreferences = {
        audience: 'members',
        showRoute: true,
        showAchievements: true,
        showLevel: false,
        showStreak: false,
    }

    const renderPublicProfile = ({
        state = null,
        accessToken = 'test-access-token',
    } = {}) => {
        return render(
            <AuthContext.Provider
                value={{
                    user: currentUser,
                    accessToken,
                    loadProfile: vi.fn()
                        .mockResolvedValue(currentUser),
                    signOut: vi.fn(),
                }}
            >
                <MemoryRouter
                    initialEntries={[
                        {
                            pathname: '/profile/public',
                            state,
                        },
                    ]}
                >
                    <PublicProfilePage />
                </MemoryRouter>
            </AuthContext.Provider>,
        )
    }

    beforeEach(() => {
        getCurrentUserPrivacyPreferences.mockReset()
        getDashboardSummary.mockReset()
        getBadgeCatalog.mockReset()
        getCurrentStudentOnboarding.mockReset()
        getCurrentStudentRoute.mockReset()

        getBadgeCatalog.mockResolvedValue({
            total: 0,
            earnedCount: 0,
            pendingCount: 0,
            badges: [],
        })

        getCurrentStudentOnboarding.mockResolvedValue({
            state: 'not_completed',
        })

        getCurrentStudentRoute.mockResolvedValue({
            state: 'not_selected',
        })
    })

    it('does not display fictional projects or publications', () => {
        renderPublicProfile({
            state: {
                privacySettings: savedPreferences,
            },
        })

        expect(
            screen.getByText(
                'Proyectos compartidos no disponibles',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByText('Dashboard interactivo'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText(
                '¿Cómo puedo filtrar productos por precio?',
            ),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText('12 me gusta'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText('3 comentarios'),
        ).not.toBeInTheDocument()
    })

    it('navigates from shared projects to publications', async () => {
        const user = userEvent.setup()

        renderPublicProfile({
            state: {
                privacySettings: savedPreferences,
            },
        })

        await user.click(
            screen.getByRole('button', {
                name: 'Ver sección de publicaciones',
            }),
        )

        expect(
            screen.getByRole('tab', {
                name: 'Publicaciones',
            }),
        ).toHaveAttribute('aria-selected', 'true')

        expect(
            screen.getByText('Publicaciones no disponibles'),
        ).toBeInTheDocument()

        expect(
            screen.queryByText(
                'Proyectos compartidos no disponibles',
            ),
        ).not.toBeInTheDocument()
    })

    it('allows filtering publications without inventing content', async () => {
        const user = userEvent.setup()

        renderPublicProfile({
            state: {
                privacySettings: savedPreferences,
            },
        })

        await user.click(
            screen.getByRole('tab', {
                name: 'Publicaciones',
            }),
        )

        const allButton = screen.getByRole('button', {
            name: 'Todas',
        })

        const questionsButton = screen.getByRole('button', {
            name: 'Preguntas',
        })

        const contributionsButton = screen.getByRole('button', {
            name: 'Aportes',
        })

        expect(allButton).toHaveAttribute(
            'aria-pressed',
            'true',
        )

        await user.click(questionsButton)

        expect(questionsButton).toHaveAttribute(
            'aria-pressed',
            'true',
        )

        expect(
            screen.getByText(
                /Las preguntas estarán disponibles/,
            ),
        ).toBeInTheDocument()

        await user.click(contributionsButton)

        expect(contributionsButton).toHaveAttribute(
            'aria-pressed',
            'true',
        )

        expect(
            screen.getByText(
                /aportes estarán disponibles/,
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByText('12 me gusta'),
        ).not.toBeInTheDocument()
    })

    it('shows earned and pending badges from the real catalog', async () => {
        const user = userEvent.setup()

        getBadgeCatalog.mockResolvedValue({
            total: 3,
            earnedCount: 2,
            pendingCount: 1,
            badges: [
                {
                    id: 'badge-1',
                    name: 'Primeros pasos',
                    description: 'Completaste tus primeros ejercicios.',
                    earned: true,
                },
                {
                    id: 'badge-2',
                    name: 'Constancia',
                    description: 'Mantuviste tu hábito de aprendizaje.',
                    earned: true,
                },
                {
                    id: 'badge-3',
                    name: 'Nuevo desafío',
                    description: 'Completa el siguiente desafío.',
                    earned: false,
                },
            ],
        })

        renderPublicProfile({
            state: {
                privacySettings: savedPreferences,
            },
        })

        await user.click(
            screen.getByRole('tab', {
                name: 'Logros',
            }),
        )

        expect(
            await screen.findByText(
                /2 de\s+3 insignias desbloqueadas\./,
            ),
        ).toBeInTheDocument()

        expect(
            screen.getAllByText('Desbloqueado'),
        ).toHaveLength(2)

        expect(
            screen.getByText('Pendiente'),
        ).toBeInTheDocument()

        expect(
            getBadgeCatalog,
        ).toHaveBeenCalledWith('test-access-token')
    })

    it('does not load badges when achievements are hidden', async () => {
        const user = userEvent.setup()

        renderPublicProfile({
            state: {
                privacySettings: {
                    ...savedPreferences,
                    showAchievements: false,
                },
            },
        })

        await user.click(
            screen.getByRole('tab', {
                name: 'Logros',
            }),
        )

        expect(
            screen.getByText(
                'Los logros están ocultos por tus preferencias.',
            ),
        ).toBeInTheDocument()

        expect(
            getBadgeCatalog,
        ).not.toHaveBeenCalled()
    })

    it('does not invent badges when the catalog fails', async () => {
        const user = userEvent.setup()

        getBadgeCatalog.mockRejectedValue(
            new Error('Badge API unavailable'),
        )

        renderPublicProfile({
            state: {
                privacySettings: savedPreferences,
            },
        })

        await user.click(
            screen.getByRole('tab', {
                name: 'Logros',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No fue posible cargar las insignias.',
        )

        expect(
            screen.queryByText('Desbloqueado'),
        ).not.toBeInTheDocument()
    })

    it('shows the actual selected route and technologies', async () => {
        getCurrentStudentOnboarding.mockResolvedValue({
            state: 'completed',
            onboarding: {
                technologyInterestKeys: [
                    'react',
                    'nodejs',
                ],
            },
        })

        getCurrentStudentRoute.mockResolvedValue({
            state: 'selected',
            selection: {
                specializationKey: 'fullstack',
            },
        })

        renderPublicProfile({
            state: {
                privacySettings: {
                    ...savedPreferences,
                    showRoute: true,
                },
            },
        })

        expect(
            await screen.findByText('Ruta Full Stack'),
        ).toBeInTheDocument()

        expect(
            screen.getAllByText('Node.js'),
        ).toHaveLength(2)

        expect(
            screen.queryByText('Ruta Frontend'),
        ).not.toBeInTheDocument()

        expect(
            getCurrentStudentOnboarding,
        ).toHaveBeenCalledWith('test-access-token')

        expect(
            getCurrentStudentRoute,
        ).toHaveBeenCalledWith('test-access-token')
    })

    it('shows a pending route when no selection exists', async () => {
        renderPublicProfile({
            state: {
                privacySettings: {
                    ...savedPreferences,
                    showRoute: true,
                },
            },
        })

        expect(
            await screen.findByText('Ruta pendiente'),
        ).toBeInTheDocument()

        expect(
            screen.getAllByText('Sin tecnologías registradas.'),
        ).toHaveLength(2)

        expect(
            screen.queryByText('Ruta Frontend'),
        ).not.toBeInTheDocument()
    })

    it('does not request learning data when route is hidden', () => {
        renderPublicProfile({
            state: {
                privacySettings: {
                    ...savedPreferences,
                    showRoute: false,
                },
            },
        })

        expect(
            getCurrentStudentOnboarding,
        ).not.toHaveBeenCalled()

        expect(
            getCurrentStudentRoute,
        ).not.toHaveBeenCalled()

        expect(
            screen.queryByText('Ruta pendiente'),
        ).not.toBeInTheDocument()
    })

    it('does not invent learning data when APIs fail', async () => {
        getCurrentStudentOnboarding.mockRejectedValue(
            new Error('Onboarding API unavailable'),
        )

        getCurrentStudentRoute.mockRejectedValue(
            new Error('Route API unavailable'),
        )

        renderPublicProfile({
            state: {
                privacySettings: {
                    ...savedPreferences,
                    showRoute: true,
                },
            },
        })

        expect(
            await screen.findByText('Ruta no disponible'),
        ).toBeInTheDocument()

        expect(
            screen.getAllByText(
                'No fue posible cargar las tecnologías.',
            ),
        ).toHaveLength(2)

        expect(
            screen.queryByText('Ruta Frontend'),
        ).not.toBeInTheDocument()
    })

    it('uses temporary settings without fetching saved privacy', async () => {
        renderPublicProfile({
            state: {
                privacySettings: {
                    ...savedPreferences,
                    audience: 'private',
                    showRoute: false,
                    showAchievements: false,
                },
            },
        })

        expect(
            await screen.findByText(
                'Esta es una vista previa privada.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByText('Ruta Frontend'),
        ).not.toBeInTheDocument()

        expect(
            getCurrentUserPrivacyPreferences,
        ).not.toHaveBeenCalled()
    })

    it('loads saved privacy when opened directly', async () => {
        getCurrentUserPrivacyPreferences.mockResolvedValue({
            ...savedPreferences,
            audience: 'private',
            showRoute: false,
        })

        renderPublicProfile()

        expect(
            await screen.findByText(
                'Esta es una vista previa privada.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByText('Ruta Frontend'),
        ).not.toBeInTheDocument()

        expect(
            getCurrentUserPrivacyPreferences,
        ).toHaveBeenCalledWith(
            'test-access-token',
        )
    })

    it('shows an error when saved privacy cannot load', async () => {
        getCurrentUserPrivacyPreferences.mockRejectedValue({
            code: 'NETWORK_ERROR',
        })

        renderPublicProfile()

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No fue posible conectar con el servidor.',
        )

        expect(
            getCurrentUserPrivacyPreferences,
        ).toHaveBeenCalledWith(
            'test-access-token',
        )

        expect(
            screen.queryByText('Ruta Frontend'),
        ).not.toBeInTheDocument()
    })

    it('does not request gamification when level and streak are hidden', () => {
        renderPublicProfile({
            state: {
                privacySettings: {
                    ...savedPreferences,
                    showLevel: false,
                    showStreak: false,
                },
            },
        })

        expect(
            getDashboardSummary,
        ).not.toHaveBeenCalled()

        expect(
            screen.queryByText('1,250 XP'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText('Racha actual: 4 días'),
        ).not.toBeInTheDocument()
    })

    it('shows real level XP and streak when enabled', async () => {
        getDashboardSummary.mockResolvedValue({
            gamification: {
                currentLevel: {
                    name: 'Intermedio',
                },
                totalXp: 1250,
                currentStreak: 4,
            },
        })

        renderPublicProfile({
            state: {
                privacySettings: {
                    ...savedPreferences,
                    showLevel: true,
                    showStreak: true,
                },
            },
        })

        expect(
            await screen.findByText('Nivel: Intermedio'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('1,250 XP'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Racha actual: 4 días'),
        ).toBeInTheDocument()

        expect(
            getDashboardSummary,
        ).toHaveBeenCalledWith(
            'test-access-token',
        )
    })

    it('shows only level and XP when streak is hidden', async () => {
        getDashboardSummary.mockResolvedValue({
            gamification: {
                currentLevel: {
                    name: 'Intermedio',
                },
                totalXp: 1250,
                currentStreak: 4,
            },
        })

        renderPublicProfile({
            state: {
                privacySettings: {
                    ...savedPreferences,
                    showLevel: true,
                    showStreak: false,
                },
            },
        })

        expect(
            await screen.findByText('1,250 XP'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Nivel: Intermedio'),
        ).toBeInTheDocument()

        expect(
            screen.queryByText('Racha actual: 4 días'),
        ).not.toBeInTheDocument()
    })

    it('shows only streak when level and XP are hidden', async () => {
        getDashboardSummary.mockResolvedValue({
            gamification: {
                currentLevel: {
                    name: 'Intermedio',
                },
                totalXp: 1250,
                currentStreak: 4,
            },
        })

        renderPublicProfile({
            state: {
                privacySettings: {
                    ...savedPreferences,
                    showLevel: false,
                    showStreak: true,
                },
            },
        })

        expect(
            await screen.findByText('Racha actual: 4 días'),
        ).toBeInTheDocument()

        expect(
            screen.queryByText('Nivel: Intermedio'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText('1,250 XP'),
        ).not.toBeInTheDocument()
    })

    it('does not invent progress when gamification fails', async () => {
        getDashboardSummary.mockRejectedValue(
            new Error('Gamification API unavailable'),
        )

        renderPublicProfile({
            state: {
                privacySettings: {
                    ...savedPreferences,
                    showLevel: true,
                    showStreak: true,
                },
            },
        })

        expect(
            await screen.findByText(
                'No fue posible cargar la información de progreso.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByText('0 XP'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText('Racha actual: 0 días'),
        ).not.toBeInTheDocument()
    })
})

// ============================================================
// PRUEBAS DE INTEGRACIÓN - NOTIFICACIONES
// ============================================================

describe('ProfilePage notification integration', () => {
    const notificationPreferences = {
        mentionsWeb: true,
        mentionsEmail: true,
        projectsWeb: true,
        projectsEmail: false,
        achievementsWeb: true,
        achievementsEmail: false,
        communityWeb: true,
        communityEmail: false,
        coursesWeb: false,
        coursesEmail: false,
        weeklySummary: false,
        studyReminderEnabled: true,
        reminderTime: '19:00',
        reminderFrequency: 'weekdays',
        reminderChannel: 'web',
    }

    beforeEach(() => {
        getCurrentUserNotificationPreferences.mockReset()
        updateCurrentUserNotificationPreferences.mockReset()
    })

    const openNotifications = async (user) => {
        renderProfilePage({
            loadProfile: vi.fn().mockResolvedValue(currentUser),
            accessToken: 'test-access-token',
        })

        await screen.findByLabelText('Nombre')

        await user.click(
            screen.getByRole('tab', {
                name: 'Notificaciones',
            }),
        )
    }

    it('loads saved notification preferences', async () => {
        const user = userEvent.setup()

        getCurrentUserNotificationPreferences
            .mockResolvedValue({
                ...notificationPreferences,
                mentionsWeb: false,
            })

        await openNotifications(user)

        const mentionsSwitch = await screen.findByRole(
            'switch',
            {
                name: 'Respuestas y menciones en la web',
            },
        )

        expect(mentionsSwitch).toHaveAttribute(
            'aria-checked',
            'false',
        )

        expect(
            screen.getByRole('switch', {
                name: 'Respuestas y menciones por correo',
            }),
        ).toHaveAttribute('aria-checked', 'true')

        expect(
            getCurrentUserNotificationPreferences,
        ).toHaveBeenCalledWith('test-access-token')
    })

    it('saves changed notification preferences', async () => {
        const user = userEvent.setup()

        getCurrentUserNotificationPreferences
            .mockResolvedValue(notificationPreferences)

        const updatedPreferences = {
            ...notificationPreferences,
            mentionsWeb: false,
        }

        updateCurrentUserNotificationPreferences
            .mockResolvedValue(updatedPreferences)

        await openNotifications(user)

        const mentionsSwitch = await screen.findByRole(
            'switch',
            {
                name: 'Respuestas y menciones en la web',
            },
        )

        await user.click(mentionsSwitch)

        await user.click(
            screen.getByRole('button', {
                name: /guardar/i,
            }),
        )

        await waitFor(() => {
            expect(
                updateCurrentUserNotificationPreferences,
            ).toHaveBeenCalledWith({
                accessToken: 'test-access-token',
                preferences: updatedPreferences,
            })
        })

        expect(
            await screen.findByText(
                'Tus preferencias se guardaron correctamente.',
            ),
        ).toBeInTheDocument()
    })

    it('shows an error when notifications cannot load', async () => {
        const user = userEvent.setup()

        getCurrentUserNotificationPreferences
            .mockRejectedValue({
                code: 'NETWORK_ERROR',
            })

        await openNotifications(user)

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No fue posible conectar con el servidor.',
        )

        expect(
            screen.queryByRole('switch', {
                name: 'Respuestas y menciones en la web',
            }),
        ).not.toBeInTheDocument()

        expect(
            updateCurrentUserNotificationPreferences,
        ).not.toHaveBeenCalled()
    })

    it('does not report success when saving fails', async () => {
        const user = userEvent.setup()

        getCurrentUserNotificationPreferences
            .mockResolvedValue(notificationPreferences)

        updateCurrentUserNotificationPreferences
            .mockRejectedValue({
                code: 'NETWORK_ERROR',
            })

        await openNotifications(user)

        const mentionsSwitch = await screen.findByRole(
            'switch',
            {
                name: 'Respuestas y menciones en la web',
            },
        )

        await user.click(mentionsSwitch)

        await user.click(
            screen.getByRole('button', {
                name: /guardar/i,
            }),
        )

        expect(
            await screen.findByText(
                'No se pudieron guardar los cambios.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByText(
                'Tus preferencias se guardaron correctamente.',
            ),
        ).not.toBeInTheDocument()
    })
})
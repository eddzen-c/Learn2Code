
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
    getCurrentStudentOnboarding,
} from '../api/onboarding.api.js'

import {
    getCurrentDiagnostic,
} from '../api/diagnostic.api.js'

import {
    getCurrentStudentRoute,
} from '../api/student-routes.api.js'

vi.mock('../api/onboarding.api.js', () => ({
    getCurrentStudentOnboarding: vi.fn(),
}))

vi.mock('../api/diagnostic.api.js', () => ({
    getCurrentDiagnostic: vi.fn(),
}))

vi.mock('../api/student-routes.api.js', () => ({
    getCurrentStudentRoute: vi.fn(),
}))

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

})

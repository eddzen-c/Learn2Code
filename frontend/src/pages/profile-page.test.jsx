import {
    render,
    screen,
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

const currentUser = {
    id: 'user-1',
    fullName: 'Estudiante Learn2Code',
    email: 'student@example.com',
    roles: ['student'],
    preferredLocale: 'es-MX',
    preferredProgrammingLanguageId: 1,
}

const renderProfilePage = ({
    loadProfile,
    updateProfile = vi.fn(),
}) => {
    render(
        <AuthContext.Provider
            value={{
                loadProfile,
                updateProfile,
            }}
        >
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        </AuthContext.Provider>,
    )
}

describe('ProfilePage', () => {
    it('loads the current profile information', async () => {
        const loadProfile = vi
            .fn()
            .mockResolvedValue(currentUser)

        renderProfilePage({
            loadProfile,
        })

        expect(
            await screen.findByDisplayValue(
                'Estudiante Learn2Code',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText(
                'Idioma de la interfaz',
            ),
        ).toHaveValue('es-MX')

        expect(
            screen.getByLabelText(
                'Lenguaje de programación preferido',
            ),
        ).toHaveValue('1')

        expect(loadProfile).toHaveBeenCalledOnce()
    })

    it('updates the profile information', async () => {
        const user = userEvent.setup()

        const loadProfile = vi
            .fn()
            .mockResolvedValue(currentUser)

        const updatedUser = {
            ...currentUser,
            fullName: 'Estudiante Actualizado',
            preferredLocale: 'en-US',
            preferredProgrammingLanguageId: 2,
        }

        const updateProfile = vi
            .fn()
            .mockResolvedValue(updatedUser)

        renderProfilePage({
            loadProfile,
            updateProfile,
        })

        const nameInput =
            await screen.findByLabelText(
                'Nombre completo',
            )

        await user.clear(nameInput)

        await user.type(
            nameInput,
            'Estudiante Actualizado',
        )

        await user.selectOptions(
            screen.getByLabelText(
                'Idioma de la interfaz',
            ),
            'en-US',
        )

        await user.selectOptions(
            screen.getByLabelText(
                'Lenguaje de programación preferido',
            ),
            '2',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Guardar cambios',
            }),
        )

        expect(updateProfile).toHaveBeenCalledWith({
            fullName: 'Estudiante Actualizado',
            preferredLocale: 'en-US',
            preferredProgrammingLanguageId: 2,
        })

        expect(
            await screen.findByRole('status'),
        ).toHaveTextContent(
            'Tu perfil se actualizó correctamente.',
        )

        expect(nameInput).toHaveValue(
            'Estudiante Actualizado',
        )
    })

    it('shows an unsupported language error', async () => {
        const user = userEvent.setup()

        const loadProfile = vi
            .fn()
            .mockResolvedValue(currentUser)

        const updateProfile = vi
            .fn()
            .mockRejectedValue({
                code:
                    'UNSUPPORTED_PROGRAMMING_LANGUAGE',
            })

        renderProfilePage({
            loadProfile,
            updateProfile,
        })

        await screen.findByDisplayValue(
            'Estudiante Learn2Code',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Guardar cambios',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'El lenguaje seleccionado no está disponible.',
        )
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
                name:
                    'No fue posible cargar tu perfil',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'No fue posible conectar con el servidor.',
        )

        expect(updateProfile).not.toHaveBeenCalled()
    })
})
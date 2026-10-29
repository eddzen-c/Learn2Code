
import {
    render,
    screen,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    ProfileSecurity,
} from './ProfileSecurity.jsx'

describe('ProfileSecurity', () => {
    it('does not invent active sessions', () => {
        render(
            <ProfileSecurity
                email="student@example.com"
            />,
        )

        expect(
            screen.getByText(
                /La información de sesiones activas/,
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByText(/Android · Chrome/),
        ).not.toBeInTheDocument()
    })

    it('does not claim that an unavailable password change succeeded', async () => {
        const user = userEvent.setup()

        render(<ProfileSecurity />)

        await user.type(
            screen.getByLabelText('Contraseña actual'),
            'PasswordAnterior123!',
        )

        await user.type(
            screen.getByLabelText('Nueva contraseña'),
            'PasswordNueva456!',
        )

        await user.type(
            screen.getByLabelText('Confirmar nueva contraseña'),
            'PasswordNueva456!',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Actualizar contraseña',
            }),
        )

        expect(
            screen.getByText(
                'El cambio de contraseña todavía no está disponible.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByText(
                'Tu contraseña se actualizó correctamente.',
            ),
        ).not.toBeInTheDocument()
    })

    it('confirms an actual successful callback', async () => {
        const user = userEvent.setup()

        const onSubmitPassword = vi
            .fn()
            .mockResolvedValue(undefined)

        render(
            <ProfileSecurity
                onSubmitPassword={onSubmitPassword}
            />,
        )

        await user.type(
            screen.getByLabelText('Contraseña actual'),
            'PasswordAnterior123!',
        )

        await user.type(
            screen.getByLabelText('Nueva contraseña'),
            'PasswordNueva456!',
        )

        await user.type(
            screen.getByLabelText('Confirmar nueva contraseña'),
            'PasswordNueva456!',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Actualizar contraseña',
            }),
        )

        expect(
            await screen.findByText(
                'Tu contraseña se actualizó correctamente.',
            ),
        ).toBeInTheDocument()

        expect(onSubmitPassword).toHaveBeenCalledOnce()
    })
})

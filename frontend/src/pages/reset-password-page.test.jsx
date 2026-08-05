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
    resetPassword,
} from '../api/auth.api.js'

import {
    ResetPasswordPage,
} from './ResetPasswordPage.jsx'

vi.mock('../api/auth.api.js', () => ({
    resetPassword:
        vi.fn(),
}))

const renderPage = (
    entry =
        '/reset-password?token=reset-token',
) => {
    render(
        <MemoryRouter
            initialEntries={[entry]}
        >
            <ResetPasswordPage />
        </MemoryRouter>,
    )
}

describe('ResetPasswordPage', () => {
    beforeEach(() => {
        resetPassword.mockReset()
    })

    it('updates the password with a valid token', async () => {
        const user = userEvent.setup()

        resetPassword.mockResolvedValue({
            reset: true,
        })

        renderPage()

        await user.type(
            screen.getByLabelText(
                'Nueva contraseña',
            ),
            'New-Password-2026!',
        )

        await user.type(
            screen.getByLabelText(
                'Confirmar nueva contraseña',
            ),
            'New-Password-2026!',
        )

        await user.click(
            screen.getByRole('button', {
                name:
                    'Guardar nueva contraseña',
            }),
        )

        expect(
            resetPassword,
        ).toHaveBeenCalledWith({
            token:
                'reset-token',
            newPassword:
                'New-Password-2026!',
        })

        expect(
            await screen.findByRole('heading', {
                name:
                    'Contraseña actualizada',
            }),
        ).toBeInTheDocument()
    })

    it('rejects different passwords', async () => {
        const user = userEvent.setup()

        renderPage()

        await user.type(
            screen.getByLabelText(
                'Nueva contraseña',
            ),
            'New-Password-2026!',
        )

        await user.type(
            screen.getByLabelText(
                'Confirmar nueva contraseña',
            ),
            'Different-Password-2026!',
        )

        await user.click(
            screen.getByRole('button', {
                name:
                    'Guardar nueva contraseña',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'Las contraseñas no coinciden.',
        )

        expect(
            resetPassword,
        ).not.toHaveBeenCalled()
    })

    it('rejects a link without a token', () => {
        renderPage('/reset-password')

        expect(
            screen.getByRole('heading', {
                name: 'Enlace no válido',
            }),
        ).toBeInTheDocument()

        expect(
            resetPassword,
        ).not.toHaveBeenCalled()
    })
})
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

    it('accepts a secure password of exactly 8 characters', async () => {
        const user = userEvent.setup()

        resetPassword.mockResolvedValue({
            reset: true,
        })

        renderPage()

        await user.type(
            screen.getByLabelText('Nueva contraseña'),
            'Abc123!x',
        )

        await user.type(
            screen.getByLabelText('Confirmar nueva contraseña'),
            'Abc123!x',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Guardar nueva contraseña',
            }),
        )

        expect(resetPassword).toHaveBeenCalledWith({
            token: 'reset-token',
            newPassword: 'Abc123!x',
        })

        expect(
            await screen.findByRole('heading', {
                name: 'Contraseña actualizada',
            }),
        ).toBeInTheDocument()
    })

    const invalidPasswordCases = [
        {
            reason: 'without an uppercase letter',
            password: 'abc123!x',
        },
        {
            reason: 'without a number',
            password: 'Abcdef!x',
        },
        {
            reason: 'without a special character',
            password: 'Abc123xy',
        },
        {
            reason: 'when whitespace replaces the special character',
            password: 'Abc123 x',
        },
    ]

    for (const { reason, password } of invalidPasswordCases) {
        it(`rejects a password ${reason}`, async () => {
            const user = userEvent.setup()

            renderPage()

            await user.type(
                screen.getByLabelText('Nueva contraseña'),
                password,
            )

            await user.type(
                screen.getByLabelText('Confirmar nueva contraseña'),
                password,
            )

            await user.click(
                screen.getByRole('button', {
                    name: 'Guardar nueva contraseña',
                }),
            )

            expect(
                await screen.findByRole('alert'),
            ).toHaveTextContent(
                'La nueva contraseña debe incluir una mayúscula, un número y un carácter especial.',
            )

            expect(resetPassword).not.toHaveBeenCalled()
        })
    }

    it('rejects an excessively long password with a clear message', async () => {
        const user = userEvent.setup()

        const password = 'Abc1!' + 'a'.repeat(68)

        renderPage()

        await user.type(
            screen.getByLabelText('Nueva contraseña'),
            password,
        )

        await user.type(
            screen.getByLabelText('Confirmar nueva contraseña'),
            password,
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Guardar nueva contraseña',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'La contraseña es demasiado larga. Prueba con una más corta.',
        )

        expect(resetPassword).not.toHaveBeenCalled()
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
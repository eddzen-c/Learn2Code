
import {
    render,
    screen,
    within,
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

// ============================================================
// AYUDANTE PARA COMPLETAR EL FORMULARIO DE CAMBIO DE CORREO
// ============================================================

const fillEmailChangeRequest = async ({
    user,
    newEmail = 'nuevo@example.com',
    currentPassword = 'PasswordActual123!',
}) => {
    await user.click(
        screen.getByRole('button', {
            name: 'Cambiar correo',
        }),
    )

    await user.click(
        screen.getByLabelText('Nuevo correo electrónico'),
    )

    await user.paste(newEmail)

    await user.click(
        screen.getByLabelText(
            'Contraseña actual para cambiar correo',
        ),
    )

    await user.paste(currentPassword)
}

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

    const invalidPasswordCases = [
        {
            reason: 'shorter than 8 characters',
            password: 'Ab12!xy',
            expectedMessage:
                'La nueva contraseña debe tener al menos 8 caracteres.',
        },
        {
            reason: 'without an uppercase letter',
            password: 'abc123!x',
            expectedMessage:
                'La nueva contraseña debe incluir una mayúscula, un número y un carácter especial.',
        },
        {
            reason: 'without a number',
            password: 'Abcdef!x',
            expectedMessage:
                'La nueva contraseña debe incluir una mayúscula, un número y un carácter especial.',
        },
        {
            reason: 'without a special character',
            password: 'Abc123xy',
            expectedMessage:
                'La nueva contraseña debe incluir una mayúscula, un número y un carácter especial.',
        },
        {
            reason: 'when whitespace replaces the special character',
            password: 'Abc123 x',
            expectedMessage:
                'La nueva contraseña debe incluir una mayúscula, un número y un carácter especial.',
        },
    ]

    it.each(invalidPasswordCases)(
        'rejects a password $reason before calling the backend',
        async ({ password, expectedMessage }) => {
            const user = userEvent.setup()
            const onSubmitPassword = vi.fn()

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
                password,
            )

            await user.type(
                screen.getByLabelText('Confirmar nueva contraseña'),
                password,
            )

            await user.click(
                screen.getByRole('button', {
                    name: 'Actualizar contraseña',
                }),
            )

            expect(
                await screen.findByText(expectedMessage),
            ).toBeInTheDocument()

            expect(onSubmitPassword).not.toHaveBeenCalled()
        },
    )

    it('rejects an excessively long password with a clear message', async () => {
        const user = userEvent.setup()
        const onSubmitPassword = vi.fn()

        const password = 'Abc1!' + 'a'.repeat(68)

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
            password,
        )

        await user.type(
            screen.getByLabelText('Confirmar nueva contraseña'),
            password,
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Actualizar contraseña',
            }),
        )

        expect(
            await screen.findByText(
                'La contraseña es demasiado larga. Prueba con una más corta.',
            ),
        ).toBeInTheDocument()

        expect(onSubmitPassword).not.toHaveBeenCalled()
    })

    it('accepts a secure new password of exactly 8 characters', async () => {
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
            'Abc123!x',
        )

        await user.type(
            screen.getByLabelText('Confirmar nueva contraseña'),
            'Abc123!x',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Actualizar contraseña',
            }),
        )

        expect(onSubmitPassword).toHaveBeenCalledOnce()

        expect(onSubmitPassword).toHaveBeenCalledWith({
            currentPassword: 'PasswordAnterior123!',
            newPassword: 'Abc123!x',
            confirmPassword: 'Abc123!x',
        })

        expect(
            await screen.findByText(
                'Tu contraseña se actualizó correctamente.',
            ),
        ).toBeInTheDocument()
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

    // ========================================================
    // CAMBIO DE CORREO - DISPONIBILIDAD
    // ========================================================

    it('keeps email change disabled without callbacks or verification', () => {
        const onRequestEmailChange = vi.fn()
        const onConfirmEmailChange = vi.fn()

        const { rerender } = render(
            <ProfileSecurity email="actual@example.com" />,
        )

        expect(
            screen.getByRole('button', {
                name: 'Cambiar correo',
            }),
        ).toBeDisabled()

        rerender(
            <ProfileSecurity
                email="actual@example.com"
                isEmailVerified={false}
                onRequestEmailChange={onRequestEmailChange}
                onConfirmEmailChange={onConfirmEmailChange}
            />,
        )

        expect(
            screen.getByRole('button', {
                name: 'Cambiar correo',
            }),
        ).toBeDisabled()

        expect(onRequestEmailChange).not.toHaveBeenCalled()
        expect(onConfirmEmailChange).not.toHaveBeenCalled()
    })

    // ========================================================
    // CAMBIO DE CORREO - ABRIR Y CANCELAR
    // ========================================================

    it('opens and cancels the email change form', async () => {
        const user = userEvent.setup()

        const onRequestEmailChange = vi.fn()
        const onConfirmEmailChange = vi.fn()

        render(
            <ProfileSecurity
                email="actual@example.com"
                onRequestEmailChange={onRequestEmailChange}
                onConfirmEmailChange={onConfirmEmailChange}
            />,
        )

        await fillEmailChangeRequest({ user })

        const emailForm = screen
            .getByLabelText('Nuevo correo electrónico')
            .closest('form')

        expect(emailForm).not.toBeNull()

        await user.click(
            within(emailForm).getByRole('button', {
                name: 'Cancelar',
            }),
        )

        expect(
            screen.queryByLabelText('Nuevo correo electrónico'),
        ).not.toBeInTheDocument()

        await user.click(
            screen.getByRole('button', {
                name: 'Cambiar correo',
            }),
        )

        expect(
            screen.getByLabelText('Nuevo correo electrónico'),
        ).toHaveValue('')

        expect(onRequestEmailChange).not.toHaveBeenCalled()
        expect(onConfirmEmailChange).not.toHaveBeenCalled()
    })

    // ========================================================
    // CAMBIO DE CORREO - RECHAZAR MISMA DIRECCION
    // ========================================================

    it('rejects changing to the current email before calling the API', async () => {
        const user = userEvent.setup()

        const onRequestEmailChange = vi.fn()
        const onConfirmEmailChange = vi.fn()

        render(
            <ProfileSecurity
                email="actual@example.com"
                onRequestEmailChange={onRequestEmailChange}
                onConfirmEmailChange={onConfirmEmailChange}
            />,
        )

        await fillEmailChangeRequest({
            user,
            newEmail: 'ACTUAL@example.com',
        })

        await user.click(
            screen.getByRole('button', {
                name: 'Enviar código',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'El nuevo correo debe ser diferente al actual.',
        )

        expect(onRequestEmailChange).not.toHaveBeenCalled()
    })

    // ========================================================
    // CAMBIO DE CORREO - RECORRIDO EXITOSO
    // ========================================================

    it('requests and confirms an email change with a six-digit code', async () => {
        const user = userEvent.setup()

        const onRequestEmailChange = vi
            .fn()
            .mockResolvedValue({
                requested: true,
                newEmail: 'nuevo@example.com',
            })

        const onConfirmEmailChange = vi
            .fn()
            .mockResolvedValue({
                changed: true,
                user: {
                    email: 'nuevo@example.com',
                },
            })

        render(
            <ProfileSecurity
                email="actual@example.com"
                onRequestEmailChange={onRequestEmailChange}
                onConfirmEmailChange={onConfirmEmailChange}
            />,
        )

        await fillEmailChangeRequest({
            user,
            newEmail: 'NUEVO@EXAMPLE.COM',
        })

        await user.click(
            screen.getByRole('button', {
                name: 'Enviar código',
            }),
        )

        expect(onRequestEmailChange).toHaveBeenCalledOnce()

        expect(onRequestEmailChange).toHaveBeenCalledWith({
            newEmail: 'nuevo@example.com',
            currentPassword: 'PasswordActual123!',
        })

        expect(
            await screen.findByLabelText(
                'Código de seis dígitos',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /Enviamos un código de seis dígitos a nuevo@example\.com/,
            ),
        ).toBeInTheDocument()

        await user.click(
            screen.getByLabelText('Código de seis dígitos'),
        )

        await user.paste('000042')

        await user.click(
            screen.getByRole('button', {
                name: 'Confirmar correo',
            }),
        )

        expect(onConfirmEmailChange).toHaveBeenCalledOnce()

        expect(onConfirmEmailChange).toHaveBeenCalledWith({
            code: '000042',
        })

        expect(
            await screen.findByText(
                'Tu correo se actualizó correctamente.',
            ),
        ).toBeInTheDocument()
    })

    // ========================================================
    // CAMBIO DE CORREO - ERROR EN LA SOLICITUD
    // ========================================================

    it('shows email change request errors without advancing', async () => {
        const user = userEvent.setup()

        const onRequestEmailChange = vi
            .fn()
            .mockRejectedValue(
                new Error(
                    'La contraseña actual es incorrecta.',
                ),
            )

        const onConfirmEmailChange = vi.fn()

        render(
            <ProfileSecurity
                email="actual@example.com"
                onRequestEmailChange={onRequestEmailChange}
                onConfirmEmailChange={onConfirmEmailChange}
            />,
        )

        await fillEmailChangeRequest({ user })

        await user.click(
            screen.getByRole('button', {
                name: 'Enviar código',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'La contraseña actual es incorrecta.',
        )

        expect(
            screen.getByRole('button', {
                name: 'Enviar código',
            }),
        ).toBeEnabled()

        expect(
            screen.queryByLabelText('Código de seis dígitos'),
        ).not.toBeInTheDocument()

        expect(onConfirmEmailChange).not.toHaveBeenCalled()
    })

    // ========================================================
    // CAMBIO DE CORREO - ERROR EN LA CONFIRMACION
    // ========================================================

    it('keeps the code form open when confirmation fails', async () => {
        const user = userEvent.setup()

        const onRequestEmailChange = vi
            .fn()
            .mockResolvedValue({
                requested: true,
            })

        const onConfirmEmailChange = vi
            .fn()
            .mockRejectedValue(
                new Error(
                    'El código es incorrecto o ha vencido.',
                ),
            )

        render(
            <ProfileSecurity
                email="actual@example.com"
                onRequestEmailChange={onRequestEmailChange}
                onConfirmEmailChange={onConfirmEmailChange}
            />,
        )

        await fillEmailChangeRequest({ user })

        await user.click(
            screen.getByRole('button', {
                name: 'Enviar código',
            }),
        )

        const codeInput = await screen.findByLabelText(
            'Código de seis dígitos',
        )

        await user.click(codeInput)
        await user.paste('123456')

        await user.click(
            screen.getByRole('button', {
                name: 'Confirmar correo',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'El código es incorrecto o ha vencido.',
        )

        expect(codeInput).toHaveValue('123456')

        expect(
            screen.getByRole('button', {
                name: 'Confirmar correo',
            }),
        ).toBeEnabled()

        expect(onConfirmEmailChange).toHaveBeenCalledWith({
            code: '123456',
        })
    })
})

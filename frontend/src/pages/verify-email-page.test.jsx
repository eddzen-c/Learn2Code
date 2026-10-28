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
    confirmEmailVerificationCode,
    requestEmailVerificationCode,
} from '../api/auth.api.js'

import {
    AuthContext,
} from '../auth/auth-context.js'

import {
    VerifyEmailPage,
} from './VerifyEmailPage.jsx'

vi.mock('../api/auth.api.js', () => ({
    confirmEmailVerificationCode: vi.fn(),
    requestEmailVerificationCode: vi.fn(),
}))

const renderPage = ({
    entry = '/verify-email',
    auth = {},
} = {}) => {
    const loadProfile = vi.fn()
        .mockResolvedValue({
            emailVerified: true,
        })

    render(
        <AuthContext.Provider
            value={{
                accessToken:
                    'access-token',
                isAuthenticated: true,
                isLoading: false,
                loadProfile,
                user: {
                    email:
                        'student@example.com',
                },
                ...auth,
            }}
        >
            <MemoryRouter
                initialEntries={[entry]}
            >
                <VerifyEmailPage />
            </MemoryRouter>
        </AuthContext.Provider>,
    )

    return {
        loadProfile,
    }
}

describe('VerifyEmailPage', () => {
    beforeEach(() => {
        confirmEmailVerificationCode.mockReset()
        requestEmailVerificationCode.mockReset()
    })

    it('does not verify the account using an old link', () => {
        renderPage({
            entry: '/verify-email?token=old-verification-token',
        })

        expect(
            screen.getByRole('heading', {
                name: 'Verifica tu correo',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getAllByRole('textbox', {
                name: /Dígito/,
            }),
        ).toHaveLength(6)

        expect(
            confirmEmailVerificationCode,
        ).not.toHaveBeenCalled()
    })

    it('requests a six-digit verification code', async () => {
        const user = userEvent.setup()

        requestEmailVerificationCode.mockResolvedValue({
            requested: true,
            alreadyVerified: false,
        })

        renderPage()

        await user.click(
            screen.getByRole('button', {
                name: 'Enviar código',
            }),
        )

        expect(
            requestEmailVerificationCode,
        ).toHaveBeenCalledWith('access-token')

        expect(
            await screen.findByRole('status'),
        ).toHaveTextContent(
            'El código fue enviado a tu correo.',
        )
    })

    it('confirms the six-digit verification code', async () => {
        const user = userEvent.setup()

        confirmEmailVerificationCode.mockResolvedValue({
            verified: true,
        })

        renderPage()

        for (const [index, digit] of
            ['2', '8', '4', '7', '1', '6'].entries()) {
            await user.type(
                screen.getByRole('textbox', {
                    name: `Dígito ${index + 1}`,
                }),
                digit,
            )
        }

        await user.click(
            screen.getByRole('button', {
                name: 'Verificar correo',
            }),
        )

        expect(
            confirmEmailVerificationCode,
        ).toHaveBeenCalledWith({
            accessToken: 'access-token',
            code: '284716',
        })

        expect(
            await screen.findByRole('heading', {
                name: 'Correo verificado',
            }),
        ).toBeInTheDocument()
    })



    it('shows the code as sent after registration', () => {
        renderPage({
            entry: {
                pathname: '/verify-email',
                state: {
                    emailVerification: {
                        requested: true,
                        alreadyVerified: false,
                        delivery: {
                            provider: 'mock',
                            simulated: true,
                        },
                    },
                },
            },
        })

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Modo de prueba: el código se generó',
        )

        expect(
            screen.getByRole('button', {
                name: /Reenviar en/,
            }),
        ).toBeDisabled()

        expect(
            requestEmailVerificationCode,
        ).not.toHaveBeenCalled()
    })

    it('shows the branded login screen for anonymous visitors', () => {
        renderPage({
            auth: {
                accessToken: null,
                isAuthenticated: false,
                user: null,
            },
        })

        expect(
            screen.getByRole('heading', {
                name: 'Verifica tu correo',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'Iniciar sesión',
            }),
        ).toHaveAttribute('href', '/login')

        expect(
            screen.getByRole('link', {
                name: /Volver al registro/,
            }),
        ).toHaveAttribute('href', '/register')
    })

})
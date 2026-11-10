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
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    AuthContext,
} from '../auth/auth-context.js'

import {
    LoginPage,
} from './LoginPage.jsx'

import RegisterPage from './RegisterPage.jsx'

const privatePage = (
    <h1>Panel privado</h1>
)

const renderLoginPage = (
    signIn,
    {
        passwordChanged = false,
        emailChanged = false,
    } = {},
) => {
    render(
        <AuthContext.Provider value={{ signIn }}>
            <MemoryRouter
                initialEntries={[
                    {
                        pathname: '/login',
                        state: emailChanged || passwordChanged
                            ? {
                                emailChanged,
                                passwordChanged,
                            }
                            : null,
                    },
                ]}
            >
                <Routes>
                    <Route
                        element={<LoginPage />}
                        path="/login"
                    />

                    <Route
                        element={privatePage}
                        path="/"
                    />

                    <Route
                        element={
                            <h1>Verifica tu correo</h1>
                        }
                        path="/verify-email"
                    />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>,
    )
}

const renderRegisterPage = (signUp) => {
    render(
        <AuthContext.Provider value={{ signUp }}>
            <MemoryRouter initialEntries={['/register']}>
                <Routes>
                    <Route
                        element={<RegisterPage />}
                        path="/register"
                    />

                    <Route
                        element={
                            <h1>Verifica tu correo</h1>
                        }
                        path="/verify-email"
                    />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>,
    )
}

// ========================================================
// CONFIRMACION DE CAMBIO DE CORREO
// ========================================================

it('shows confirmation after changing the email', () => {
    const signIn = vi.fn()

    renderLoginPage(signIn, {
        emailChanged: true,
    })

    expect(
        screen.getByRole('status'),
    ).toHaveTextContent(
        'Tu correo electrónico se actualizó correctamente. Inicia sesión con tu nuevo correo.',
    )

    expect(
        screen.queryByText(
            /Contraseña actualizada correctamente/,
        ),
    ).not.toBeInTheDocument()

    expect(
        screen.queryByText(
            'Ingresa a tu cuenta para continuar aprendiendo.',
        ),
    ).not.toBeInTheDocument()

    expect(signIn).not.toHaveBeenCalled()
})

describe('LoginPage', () => {
    it('shows confirmation after changing the password', () => {
        const signIn = vi.fn()

        renderLoginPage(signIn, {
            passwordChanged: true,
        })

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Contraseña actualizada correctamente. Inicia sesión con tu nueva contraseña.',
        )

        expect(
            screen.queryByText(
                'Ingresa a tu cuenta para continuar aprendiendo.',
            ),
        ).not.toBeInTheDocument()

        expect(signIn).not.toHaveBeenCalled()
    })

    it('shows the usual message on a normal login', () => {
        const signIn = vi.fn()

        renderLoginPage(signIn)

        expect(
            screen.getByText(
                'Ingresa a tu cuenta para continuar aprendiendo.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByText(
                /Contraseña actualizada correctamente/,
            ),
        ).not.toBeInTheDocument()

        expect(signIn).not.toHaveBeenCalled()
    })

    it('submits credentials and opens the dashboard', async () => {
        const user = userEvent.setup()

        const signIn = vi.fn().mockResolvedValue({
            user: {
                fullName: 'Student',
                emailVerified: true,
            },
        })

        renderLoginPage(signIn)

        await user.type(
            screen.getByLabelText(
                'Correo electrónico',
            ),
            'student@example.com',
        )

        await user.type(
            screen.getByLabelText('Contraseña'),
            'Secure-Password-2026!',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Iniciar sesión',
            }),
        )

        expect(signIn).toHaveBeenCalledWith({
            email: 'student@example.com',
            password: 'Secure-Password-2026!',
        })

        expect(
            await screen.findByRole('heading', {
                name: 'Panel privado',
            }),
        ).toBeInTheDocument()
    })

    it('shows an invalid credentials error', async () => {
        const user = userEvent.setup()

        const signIn = vi.fn().mockRejectedValue({
            code: 'INVALID_CREDENTIALS',
        })

        renderLoginPage(signIn)

        await user.type(
            screen.getByLabelText(
                'Correo electrónico',
            ),
            'student@example.com',
        )

        await user.type(
            screen.getByLabelText('Contraseña'),
            'Incorrect-Password!',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Iniciar sesión',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'El correo o la contraseña son incorrectos.',
        )
    })

    it('opens email verification for an unverified user', async () => {
        const user = userEvent.setup()

        const signIn = vi.fn().mockResolvedValue({
            user: {
                fullName: 'Student',
                emailVerified: false,
            },
        })

        renderLoginPage(signIn)

        await user.type(
            screen.getByLabelText(
                'Correo electrónico',
            ),
            'student@example.com',
        )

        await user.type(
            screen.getByLabelText(
                'Contraseña',
            ),
            'Secure-Password-2026!',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Iniciar sesión',
            }),
        )

        expect(
            await screen.findByRole('heading', {
                name: 'Verifica tu correo',
            }),
        ).toBeInTheDocument()
    })
})

describe('RegisterPage', () => {
    it('rejects different passwords', async () => {
        const user = userEvent.setup()
        const signUp = vi.fn()

        renderRegisterPage(signUp)

        await user.type(
            screen.getByLabelText('Nombre completo'),
            'Integration Student',
        )

        await user.type(
            screen.getByLabelText(
                'Correo electrónico',
            ),
            'student@example.com',
        )

        await user.type(
            screen.getByLabelText('Contraseña'),
            'Secure-Password-2026!',
        )

        await user.type(
            screen.getByLabelText(
                'Confirmar contraseña',
            ),
            'Different-Password-2026!',
        )

        await user.click(
            screen.getByRole('checkbox', {
                name: /Acepto los Términos y la Política/i,
            }),
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Crear cuenta',
            })
        )

        expect(signUp).not.toHaveBeenCalled()

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'Las contraseñas no coinciden.',
        )
    })

    const fillRegistrationForm = async (user, password) => {
        await user.type(
            screen.getByLabelText('Nombre completo'),
            'Integration Student',
        )

        await user.type(
            screen.getByLabelText('Correo electrónico'),
            'student@example.com',
        )

        await user.type(
            screen.getByLabelText('Contraseña'),
            password,
        )

        await user.type(
            screen.getByLabelText('Confirmar contraseña'),
            password,
        )

        await user.click(
            screen.getByRole('checkbox', {
                name: /Acepto los Términos y la Política/i,
            }),
        )
    }

    const invalidRegistrationPasswords = [
        {
            reason: 'shorter than 8 characters',
            password: 'Ab12!xy',
        },
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

    it.each(invalidRegistrationPasswords)(
        'rejects a password $reason before registration',
        async ({ password }) => {
            const user = userEvent.setup()
            const signUp = vi.fn()

            renderRegisterPage(signUp)

            await fillRegistrationForm(user, password)

            await user.click(
                screen.getByRole('button', {
                    name: 'Crear cuenta',
                }),
            )

            expect(
                await screen.findByRole('alert'),
            ).toHaveTextContent(
                'La contraseña no cumple todos los requisitos de seguridad.',
            )

            expect(signUp).not.toHaveBeenCalled()
        },
    )

    it('rejects an excessively long password with a clear message', async () => {
        const user = userEvent.setup()
        const signUp = vi.fn()

        const password = 'Abc1!' + 'a'.repeat(68)

        renderRegisterPage(signUp)

        await fillRegistrationForm(user, password)

        await user.click(
            screen.getByRole('button', {
                name: 'Crear cuenta',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'La contraseña es demasiado larga. Prueba con una más corta.',
        )

        expect(signUp).not.toHaveBeenCalled()
    })

    it('registers with a secure password of exactly 8 characters', async () => {
        const user = userEvent.setup()

        const signUp = vi.fn().mockResolvedValue({
            user: {
                fullName: 'Integration Student',
            },
        })

        renderRegisterPage(signUp)

        await fillRegistrationForm(user, 'Abc123!x')

        await user.click(
            screen.getByRole('button', {
                name: 'Crear cuenta',
            }),
        )

        expect(signUp).toHaveBeenCalledWith({
            fullName: 'Integration Student',
            email: 'student@example.com',
            password: 'Abc123!x',
        })

        expect(
            await screen.findByRole('heading', {
                name: 'Verifica tu correo',
            }),
        ).toBeInTheDocument()
    })

    it('registers the user and opens email verification', async () => {
        const user = userEvent.setup()

        const signUp = vi.fn().mockResolvedValue({
            user: {
                fullName: 'Integration Student',
            },
        })

        renderRegisterPage(signUp)

        await user.type(
            screen.getByLabelText('Nombre completo'),
            'Integration Student',
        )

        await user.type(
            screen.getByLabelText(
                'Correo electrónico',
            ),
            'student@example.com',
        )

        await user.type(
            screen.getByLabelText('Contraseña'),
            'Secure-Password-2026!',
        )

        await user.type(
            screen.getByLabelText(
                'Confirmar contraseña',
            ),
            'Secure-Password-2026!',
        )

        await user.click(
            screen.getByRole('checkbox', {
                name: /Acepto los Términos y la Política/i,
            }),
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Crear cuenta',
            }),
        )

        expect(signUp).toHaveBeenCalledWith({
            fullName: 'Integration Student',
            email: 'student@example.com',
            password: 'Secure-Password-2026!',
        })

        expect(
            await screen.findByRole('heading', {
                name: 'Verifica tu correo',
            }),
        ).toBeInTheDocument()
    })
})
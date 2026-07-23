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

import {
    RegisterPage,
} from './RegisterPage.jsx'

const privatePage = (
    <h1>Panel privado</h1>
)

const renderLoginPage = (signIn) => {
    render(
        <AuthContext.Provider value={{ signIn }}>
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route
                        element={<LoginPage />}
                        path="/login"
                    />

                    <Route
                        element={privatePage}
                        path="/dashboard"
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
                        element={privatePage}
                        path="/dashboard"
                    />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>,
    )
}

describe('LoginPage', () => {
    it('submits credentials and opens the dashboard', async () => {
        const user = userEvent.setup()

        const signIn = vi.fn().mockResolvedValue({
            user: {
                fullName: 'Student',
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
            screen.getByRole('button', {
                name: 'Crear cuenta',
            }),
        )

        expect(signUp).not.toHaveBeenCalled()

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'Las contraseñas no coinciden.',
        )
    })

    it('registers the user and opens the dashboard', async () => {
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
                name: 'Panel privado',
            }),
        ).toBeInTheDocument()
    })
})
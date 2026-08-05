import {
    render,
    screen,
} from '@testing-library/react'

import {
    MemoryRouter,
    Route,
    Routes,
} from 'react-router-dom'

import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    AuthContext,
} from './auth-context.js'

import {
    VerifiedEmailRoute,
} from './VerifiedEmailRoute.jsx'

const renderRoute = (auth) => {
    render(
        <AuthContext.Provider value={auth}>
            <MemoryRouter
                initialEntries={['/diagnostic']}
            >
                <Routes>
                    <Route
                        element={
                            <VerifiedEmailRoute />
                        }
                    >
                        <Route
                            element={
                                <h1>
                                    Diagnóstico
                                </h1>
                            }
                            path="/diagnostic"
                        />
                    </Route>

                    <Route
                        element={
                            <h1>
                                Verifica tu correo
                            </h1>
                        }
                        path="/verify-email"
                    />

                    <Route
                        element={
                            <h1>
                                Iniciar sesión
                            </h1>
                        }
                        path="/login"
                    />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>,
    )
}

describe('VerifiedEmailRoute', () => {
    it('allows a verified user', () => {
        renderRoute({
            isAuthenticated: true,
            isLoading: false,
            user: {
                emailVerified: true,
            },
        })

        expect(
            screen.getByRole('heading', {
                name: 'Diagnóstico',
            }),
        ).toBeInTheDocument()
    })

    it('redirects an unverified user', () => {
        renderRoute({
            isAuthenticated: true,
            isLoading: false,
            user: {
                emailVerified: false,
            },
        })

        expect(
            screen.getByRole('heading', {
                name: 'Verifica tu correo',
            }),
        ).toBeInTheDocument()
    })

    it('redirects an anonymous user', () => {
        renderRoute({
            isAuthenticated: false,
            isLoading: false,
            user: null,
        })

        expect(
            screen.getByRole('heading', {
                name: 'Iniciar sesión',
            }),
        ).toBeInTheDocument()
    })
})
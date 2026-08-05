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
    PublicOnlyRoute,
} from './PublicOnlyRoute.jsx'

const renderRoute = (auth) => {
    render(
        <AuthContext.Provider value={auth}>
            <MemoryRouter
                initialEntries={['/login']}
            >
                <Routes>
                    <Route
                        element={
                            <PublicOnlyRoute
                                authenticatedRedirectTo="/dashboard"
                            />
                        }
                    >
                        <Route
                            element={
                                <h1>
                                    Página de acceso
                                </h1>
                            }
                            path="/login"
                        />
                    </Route>

                    <Route
                        element={
                            <h1>Panel</h1>
                        }
                        path="/dashboard"
                    />

                    <Route
                        element={
                            <h1>
                                Verifica tu correo
                            </h1>
                        }
                        path="/verify-email"
                    />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>,
    )
}

describe('PublicOnlyRoute', () => {
    it('allows an anonymous user', () => {
        renderRoute({
            isAuthenticated: false,
            isLoading: false,
            user: null,
        })

        expect(
            screen.getByRole('heading', {
                name: 'Página de acceso',
            }),
        ).toBeInTheDocument()
    })

    it('redirects a verified user', () => {
        renderRoute({
            isAuthenticated: true,
            isLoading: false,
            user: {
                emailVerified: true,
            },
        })

        expect(
            screen.getByRole('heading', {
                name: 'Panel',
            }),
        ).toBeInTheDocument()
    })

    it('redirects an unverified user to verification', () => {
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
})
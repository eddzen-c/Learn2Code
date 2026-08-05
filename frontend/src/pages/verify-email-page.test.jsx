import {
    render,
    screen,
    waitFor,
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
    confirmEmailVerification,
    requestEmailVerification,
} from '../api/auth.api.js'

import {
    AuthContext,
} from '../auth/auth-context.js'

import {
    VerifyEmailPage,
} from './VerifyEmailPage.jsx'

vi.mock('../api/auth.api.js', () => ({
    confirmEmailVerification:
        vi.fn(),

    requestEmailVerification:
        vi.fn(),
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
        confirmEmailVerification.mockReset()
        requestEmailVerification.mockReset()
    })

    it('confirms the verification token', async () => {
        confirmEmailVerification.mockResolvedValue({
            verified: true,
        })

        const {
            loadProfile,
        } = renderPage({
            entry:
                '/verify-email?token=verification-token',
        })

        expect(
            await screen.findByRole('heading', {
                name: 'Correo verificado',
            }),
        ).toBeInTheDocument()

        expect(
            confirmEmailVerification,
        ).toHaveBeenCalledWith(
            'verification-token',
        )

        await waitFor(() => {
            expect(
                loadProfile,
            ).toHaveBeenCalledOnce()
        })
    })

    it('resends the verification message', async () => {
        const user = userEvent.setup()

        requestEmailVerification.mockResolvedValue({
            requested: true,
        })

        renderPage()

        await user.click(
            screen.getByRole('button', {
                name: 'Reenviar correo',
            }),
        )

        expect(
            requestEmailVerification,
        ).toHaveBeenCalledWith(
            'access-token',
        )

        expect(
            await screen.findByRole('status'),
        ).toHaveTextContent(
            'El mensaje fue enviado nuevamente.',
        )
    })

    it('shows an invalid verification error', async () => {
        confirmEmailVerification.mockRejectedValue(
            new Error('Invalid token'),
        )

        renderPage({
            entry:
                '/verify-email?token=invalid-token',
        })

        expect(
            await screen.findByRole('heading', {
                name:
                    'No pudimos verificar el correo',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('alert'),
        ).toBeInTheDocument()
    })
})
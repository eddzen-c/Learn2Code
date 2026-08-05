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
    requestPasswordReset,
} from '../api/auth.api.js'

import {
    ForgotPasswordPage,
} from './ForgotPasswordPage.jsx'

vi.mock('../api/auth.api.js', () => ({
    requestPasswordReset:
        vi.fn(),
}))

const renderPage = () => {
    render(
        <MemoryRouter>
            <ForgotPasswordPage />
        </MemoryRouter>,
    )
}

describe('ForgotPasswordPage', () => {
    beforeEach(() => {
        requestPasswordReset.mockReset()
    })

    it('requests password recovery instructions', async () => {
        const user = userEvent.setup()

        requestPasswordReset.mockResolvedValue({
            requested: true,
        })

        renderPage()

        await user.type(
            screen.getByLabelText(
                'Correo electrónico',
            ),
            'student@example.com',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Enviar instrucciones',
            }),
        )

        expect(
            requestPasswordReset,
        ).toHaveBeenCalledWith(
            'student@example.com',
        )

        expect(
            await screen.findByRole('heading', {
                name: 'Revisa tu correo',
            }),
        ).toBeInTheDocument()
    })

    it('allows retrying after an API error', async () => {
        const user = userEvent.setup()

        requestPasswordReset.mockRejectedValue(
            new Error('Request failed'),
        )

        renderPage()

        await user.type(
            screen.getByLabelText(
                'Correo electrónico',
            ),
            'student@example.com',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Enviar instrucciones',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Enviar instrucciones',
            }),
        ).toBeEnabled()
    })
})
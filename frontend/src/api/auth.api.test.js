import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    apiRequest,
} from './api-client.js'

import {
    confirmEmailVerification,
    requestEmailVerification,
    requestPasswordReset,
    resetPassword,
} from './auth.api.js'

vi.mock('./api-client.js', () => ({
    apiRequest: vi.fn(),
}))

describe('account recovery API', () => {
    beforeEach(() => {
        apiRequest.mockReset()
    })

    it('requests an email verification message', async () => {
        apiRequest.mockResolvedValue({
            data: {
                requested: true,
            },
        })

        const result =
            await requestEmailVerification(
                'access-token',
            )

        expect(apiRequest).toHaveBeenCalledWith(
            '/auth/email-verification/request',
            {
                method: 'POST',
                accessToken:
                    'access-token',
            },
        )

        expect(result).toEqual({
            requested: true,
        })
    })

    it('confirms an email verification token', async () => {
        apiRequest.mockResolvedValue({
            data: {
                verified: true,
            },
        })

        const result =
            await confirmEmailVerification(
                'verification-token',
            )

        expect(apiRequest).toHaveBeenCalledWith(
            '/auth/email-verification/confirm',
            {
                method: 'POST',
                body: {
                    token:
                        'verification-token',
                },
            },
        )

        expect(result).toEqual({
            verified: true,
        })
    })

    it('requests a password reset', async () => {
        apiRequest.mockResolvedValue({
            data: {
                requested: true,
            },
        })

        const result =
            await requestPasswordReset(
                'student@example.com',
            )

        expect(apiRequest).toHaveBeenCalledWith(
            '/auth/password-reset/request',
            {
                method: 'POST',
                body: {
                    email:
                        'student@example.com',
                },
            },
        )

        expect(result).toEqual({
            requested: true,
        })
    })

    it('resets the password with a valid token', async () => {
        apiRequest.mockResolvedValue({
            data: {
                reset: true,
            },
        })

        const result =
            await resetPassword({
                token:
                    'reset-token',
                newPassword:
                    'New-Password-2026!',
            })

        expect(apiRequest).toHaveBeenCalledWith(
            '/auth/password-reset/confirm',
            {
                method: 'POST',
                body: {
                    token:
                        'reset-token',
                    newPassword:
                        'New-Password-2026!',
                },
            },
        )

        expect(result).toEqual({
            reset: true,
        })
    })
})
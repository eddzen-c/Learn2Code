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
    changeCurrentUserPassword,
    requestCurrentUserEmailChange,
    confirmCurrentUserEmailChange,
    requestEmailVerificationCode,
    confirmEmailVerificationCode,
    getCurrentUserPrivacyPreferences,
    updateCurrentUserPrivacyPreferences,
    getCurrentUserNotificationPreferences,
    updateCurrentUserNotificationPreferences,
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

    it('changes the authenticated user password', async () => {
        apiRequest.mockResolvedValue({
            data: {
                changed: true,
            },
        })

        const result = await changeCurrentUserPassword({
            accessToken: 'access-token',
            currentPassword: 'PasswordAnterior123!',
            newPassword: 'PasswordNueva456!',
            confirmPassword: 'PasswordNueva456!',
        })

        expect(apiRequest).toHaveBeenCalledWith(
            '/auth/me/password',
            {
                method: 'PATCH',
                accessToken: 'access-token',
                body: {
                    currentPassword: 'PasswordAnterior123!',
                    newPassword: 'PasswordNueva456!',
                    confirmPassword: 'PasswordNueva456!',
                },
            },
        )

        expect(result).toEqual({
            changed: true,
        })
    })

    it('propagates password change errors', async () => {
        const apiError = new Error(
            'La contraseña actual es incorrecta.',
        )

        apiRequest.mockRejectedValue(apiError)

        await expect(
            changeCurrentUserPassword({
                accessToken: 'access-token',
                currentPassword: 'PasswordIncorrecta123!',
                newPassword: 'PasswordNueva456!',
                confirmPassword: 'PasswordNueva456!',
            }),
        ).rejects.toBe(apiError)
    })

    // ========================================================
    // CAMBIO DE CORREO - SOLICITAR CODIGO
    // ========================================================

    it('requests an email change using the current password', async () => {
        const responseData = {
            requested: true,
            newEmail: 'nuevo@example.com',
            expiresAt: '2026-11-09T20:00:00.000Z',
            delivery: {
                provider: 'mock',
                accepted: true,
                simulated: true,
            },
        }

        apiRequest.mockResolvedValue({
            data: responseData,
        })

        const result = await requestCurrentUserEmailChange({
            accessToken: 'access-token',
            newEmail: 'nuevo@example.com',
            currentPassword: 'PasswordActual123!',
        })

        expect(apiRequest).toHaveBeenCalledWith(
            '/auth/me/email-change/request',
            {
                method: 'POST',
                accessToken: 'access-token',
                body: {
                    newEmail: 'nuevo@example.com',
                    currentPassword: 'PasswordActual123!',
                },
            },
        )

        expect(result).toEqual(responseData)
        expect(result).not.toHaveProperty('code')
        expect(result).not.toHaveProperty('currentPassword')
    })

    // ========================================================
    // CAMBIO DE CORREO - CONFIRMAR CODIGO
    // ========================================================

    it('confirms an email change using a six-digit code', async () => {
        const responseData = {
            changed: true,
            user: {
                id: 'user-123',
                email: 'nuevo@example.com',
                emailVerifiedAt: '2026-11-09T19:00:00.000Z',
            },
        }

        apiRequest.mockResolvedValue({
            data: responseData,
        })

        const result = await confirmCurrentUserEmailChange({
            accessToken: 'access-token',
            code: '000042',
        })

        expect(apiRequest).toHaveBeenCalledWith(
            '/auth/me/email-change/confirm',
            {
                method: 'POST',
                accessToken: 'access-token',
                body: {
                    code: '000042',
                },
            },
        )

        expect(result).toEqual(responseData)
        expect(result.changed).toBe(true)
        expect(result.user.email).toBe('nuevo@example.com')
    })

    // ========================================================
    // CAMBIO DE CORREO - ERROR AL SOLICITAR
    // ========================================================

    it('propagates email change request errors', async () => {
        const apiError = new Error(
            'La contraseña actual es incorrecta.',
        )

        apiRequest.mockRejectedValue(apiError)

        await expect(
            requestCurrentUserEmailChange({
                accessToken: 'access-token',
                newEmail: 'nuevo@example.com',
                currentPassword: 'PasswordIncorrecta123!',
            }),
        ).rejects.toBe(apiError)
    })

    // ========================================================
    // CAMBIO DE CORREO - ERROR AL CONFIRMAR
    // ========================================================

    it('propagates email change confirmation errors', async () => {
        const apiError = new Error(
            'El código es incorrecto o ha vencido.',
        )

        apiRequest.mockRejectedValue(apiError)

        await expect(
            confirmCurrentUserEmailChange({
                accessToken: 'access-token',
                code: '999999',
            }),
        ).rejects.toBe(apiError)
    })

    it('requests a six-digit email verification code', async () => {
        apiRequest.mockResolvedValue({
            data: {
                requested: true,
            },
        })

        const result = await requestEmailVerificationCode(
            'access-token',
        )

        expect(apiRequest).toHaveBeenCalledWith(
            '/auth/email-verification/code/request',
            {
                method: 'POST',
                accessToken: 'access-token',
            },
        )

        expect(result).toEqual({
            requested: true,
        })
    })

    it('confirms a six-digit email verification code', async () => {
        apiRequest.mockResolvedValue({
            data: {
                verified: true,
            },
        })

        const result = await confirmEmailVerificationCode({
            accessToken: 'access-token',
            code: '000042',
        })

        expect(apiRequest).toHaveBeenCalledWith(
            '/auth/email-verification/code/confirm',
            {
                method: 'POST',
                accessToken: 'access-token',
                body: {
                    code: '000042',
                },
            },
        )

        expect(result).toEqual({
            verified: true,
        })
    })

})

// ============================================================
// PRUEBAS API - PREFERENCIAS DE PRIVACIDAD
// ============================================================

describe('privacy preferences API', () => {
    beforeEach(() => {
        apiRequest.mockReset()
    })

    it('loads the current privacy preferences', async () => {
        const preferences = {
            audience: 'members',
            showRoute: true,
            showAchievements: true,
            showLevel: false,
            showStreak: false,
        }

        apiRequest.mockResolvedValue({
            data: {
                preferences,
            },
        })

        const result =
            await getCurrentUserPrivacyPreferences(
                'access-token',
            )

        expect(apiRequest).toHaveBeenCalledWith(
            '/auth/me/privacy/preferences',
            {
                accessToken: 'access-token',
            },
        )

        expect(result).toEqual(preferences)
    })

    it('updates privacy preferences using PATCH', async () => {
        const preferences = {
            audience: 'private',
            showRoute: false,
            showAchievements: true,
            showLevel: false,
            showStreak: false,
        }

        apiRequest.mockResolvedValue({
            data: {
                preferences,
            },
        })

        const result =
            await updateCurrentUserPrivacyPreferences({
                accessToken: 'access-token',
                preferences,
            })

        expect(apiRequest).toHaveBeenCalledWith(
            '/auth/me/privacy/preferences',
            {
                method: 'PATCH',
                accessToken: 'access-token',
                body: preferences,
            },
        )

        expect(result).toEqual(preferences)
    })

    it('propagates errors when loading privacy', async () => {
        const error = new Error(
            'Unable to connect to the API',
        )

        apiRequest.mockRejectedValue(error)

        await expect(
            getCurrentUserPrivacyPreferences(
                'access-token',
            ),
        ).rejects.toBe(error)
    })

    it('propagates errors when saving privacy', async () => {
        const error = new Error(
            'Unable to save privacy preferences',
        )

        apiRequest.mockRejectedValue(error)

        await expect(
            updateCurrentUserPrivacyPreferences({
                accessToken: 'access-token',
                preferences: {
                    audience: 'private',
                },
            }),
        ).rejects.toBe(error)
    })
})

// ============================================================
// PRUEBAS API - PREFERENCIAS DE NOTIFICACIONES
// ============================================================

describe('notification preferences API', () => {
    beforeEach(() => {
        apiRequest.mockReset()
    })

    it('loads the current notification preferences', async () => {
        const preferences = {
            mentionsWeb: true,
            mentionsEmail: false,
            weeklySummary: true,
            reminderTime: '08:00',
            reminderFrequency: 'everyday',
        }

        apiRequest.mockResolvedValue({
            data: {
                preferences,
            },
        })

        const result =
            await getCurrentUserNotificationPreferences(
                'access-token',
            )

        expect(apiRequest).toHaveBeenCalledWith(
            '/auth/me/notifications/preferences',
            {
                accessToken: 'access-token',
            },
        )

        expect(result).toEqual(preferences)
    })

    it('updates notification preferences using PATCH', async () => {
        const changes = {
            mentionsWeb: false,
            weeklySummary: true,
            reminderTime: '19:00',
        }

        const savedPreferences = {
            ...changes,
            reminderFrequency: 'weekdays',
            reminderChannel: 'web',
        }

        apiRequest.mockResolvedValue({
            data: {
                preferences: savedPreferences,
            },
        })

        const result =
            await updateCurrentUserNotificationPreferences({
                accessToken: 'access-token',
                preferences: changes,
            })

        expect(apiRequest).toHaveBeenCalledWith(
            '/auth/me/notifications/preferences',
            {
                method: 'PATCH',
                accessToken: 'access-token',
                body: changes,
            },
        )

        expect(result).toEqual(savedPreferences)
    })

    it('propagates errors when loading notifications', async () => {
        const error = new Error('Network error')

        apiRequest.mockRejectedValue(error)

        await expect(
            getCurrentUserNotificationPreferences(
                'access-token',
            ),
        ).rejects.toBe(error)
    })

    it('propagates errors when saving notifications', async () => {
        const error = new Error('Save error')

        apiRequest.mockRejectedValue(error)

        await expect(
            updateCurrentUserNotificationPreferences({
                accessToken: 'access-token',
                preferences: {
                    mentionsWeb: false,
                },
            }),
        ).rejects.toBe(error)
    })
})
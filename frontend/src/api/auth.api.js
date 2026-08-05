import {
    apiRequest,
} from './api-client.js'

export const register = async ({
    fullName,
    email,
    password,
}) => {
    const response = await apiRequest(
        '/auth/register',
        {
            method: 'POST',
            body: {
                fullName,
                email,
                password,
            },
        },
    )

    return response.data
}

export const login = async ({
    email,
    password,
}) => {
    const response = await apiRequest(
        '/auth/login',
        {
            method: 'POST',
            body: {
                email,
                password,
            },
        },
    )

    return response.data
}

export const refresh = async () => {
    const response = await apiRequest(
        '/auth/refresh',
        {
            method: 'POST',
        },
    )

    return response.data
}

export const logout = async () => {
    await apiRequest(
        '/auth/logout',
        {
            method: 'POST',
        },
    )
}

export const getCurrentUser = async (
    accessToken,
) => {
    const response = await apiRequest(
        '/auth/me',
        {
            accessToken,
        },
    )

    return response.data.user
}

export const updateCurrentUser = async ({
    accessToken,
    profile,
}) => {
    const response = await apiRequest(
        '/auth/me',
        {
            method: 'PATCH',
            accessToken,
            body: profile,
        },
    )

    return response.data.user
}

export const requestEmailVerification =
    async (
        accessToken,
    ) => {
        const response =
            await apiRequest(
                '/auth/email-verification/request',
                {
                    method: 'POST',
                    accessToken,
                },
            )

        return response.data
    }

export const confirmEmailVerification =
    async (
        token,
    ) => {
        const response =
            await apiRequest(
                '/auth/email-verification/confirm',
                {
                    method: 'POST',
                    body: {
                        token,
                    },
                },
            )

        return response.data
    }

export const requestPasswordReset =
    async (
        email,
    ) => {
        const response =
            await apiRequest(
                '/auth/password-reset/request',
                {
                    method: 'POST',
                    body: {
                        email,
                    },
                },
            )

        return response.data
    }

export const resetPassword =
    async ({
        token,
        newPassword,
    }) => {
        const response =
            await apiRequest(
                '/auth/password-reset/confirm',
                {
                    method: 'POST',
                    body: {
                        token,
                        newPassword,
                    },
                },
            )

        return response.data
    }
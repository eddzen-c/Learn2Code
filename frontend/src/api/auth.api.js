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
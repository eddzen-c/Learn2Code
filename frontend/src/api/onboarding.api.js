import {
    apiRequest,
} from './api-client.js'

export const getStudentOnboardingOptions =
    async (accessToken) => {
        const response = await apiRequest(
            '/onboarding/options',
            {
                accessToken,
            },
        )

        return response.data
    }

export const getCurrentStudentOnboarding =
    async (accessToken) => {
        const response = await apiRequest(
            '/onboarding/current',
            {
                accessToken,
            },
        )

        return response.data
    }

export const completeStudentOnboarding =
    async ({
        accessToken,
        preferences,
    }) => {
        const response = await apiRequest(
            '/onboarding',
            {
                method: 'PUT',
                accessToken,
                body: preferences,
            },
        )

        return response.data
    }
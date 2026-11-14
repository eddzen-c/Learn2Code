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

/**
* Registra la finalización del recorrido inicial de aprendizaje del estudiante.
* No confirma el plan recomendado ni selecciona
* una especialización.
*/
export const completeStudentLearningFlow =
    async ({
        accessToken,
    }) => {
        const response = await apiRequest(
            '/onboarding/learning-flow/complete',
            {
                method: 'PUT',
                accessToken,
            },
        )

        return response.data
    }
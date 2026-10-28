
import {
    apiRequest,
} from './api-client.js'

export const getCurrentLearningPlan = async (
    accessToken,
) => {
    const response = await apiRequest(
        '/learning-paths/current',
        {
            accessToken,
        },
    )

    return response.data
}

export const generateLearningPlan = async (
    accessToken,
) => {
    const response = await apiRequest(
        '/learning-paths',
        {
            method: 'POST',
            accessToken,
        },
    )

    return response.data
}

export const confirmLearningPlan = async ({
    accessToken,
    pathId,
}) => {
    const response = await apiRequest(
        `/learning-paths/${encodeURIComponent(pathId)}/confirm`,
        {
            method: 'POST',
            accessToken,
        },
    )

    return response.data
}

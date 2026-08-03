import {
    apiRequest,
} from './api-client.js'

export const getBadgeCatalog = async (
    accessToken,
) => {
    const response = await apiRequest(
        '/gamification/badges',
        {
            accessToken,
        },
    )

    return response.data
}
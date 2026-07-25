import {
    apiRequest,
} from './api-client.js'

export const getDashboardSummary = async (
    accessToken,
) => {
    const response = await apiRequest(
        '/dashboard/summary',
        {
            accessToken,
        },
    )

    return response.data.summary
}
import {
    apiRequest,
} from './api-client.js'

export const getCurrentExercise = async (
    accessToken,
) => {
    const response = await apiRequest(
        '/exercises/current',
        {
            accessToken,
        },
    )

    return response.data
}

export const generateNextExercise = async (
    accessToken,
) => {
    const response = await apiRequest(
        '/exercises/next',
        {
            method: 'POST',
            accessToken,
        },
    )

    return response.data
}

export const submitExerciseAttempt = async ({
    accessToken,
    assignmentId,
    submittedCode,
}) => {
    const encodedAssignmentId =
        encodeURIComponent(assignmentId)

    const response = await apiRequest(
        `/exercises/assignments/${encodedAssignmentId}/attempts`,
        {
            method: 'POST',
            accessToken,
            body: {
                submittedCode,
            },
        },
    )

    return response.data
}
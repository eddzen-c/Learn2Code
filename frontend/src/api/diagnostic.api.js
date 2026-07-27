import {
    apiRequest,
} from './api-client.js'

export const getCurrentDiagnostic = async (
    accessToken,
) => {
    const response = await apiRequest(
        '/diagnostics/current',
        {
            accessToken,
        },
    )

    return response.data
}

export const startDiagnostic = async ({
    accessToken,
    languageId,
}) => {
    const response = await apiRequest(
        '/diagnostics',
        {
            method: 'POST',
            accessToken,
            body: {
                languageId,
            },
        },
    )

    return response.data
}

export const submitDiagnosticAnswer = async ({
    accessToken,
    assessmentId,
    questionId,
    answer,
    submittedCode = null,
}) => {
    const encodedAssessmentId =
        encodeURIComponent(assessmentId)

    const response = await apiRequest(
        `/diagnostics/${encodedAssessmentId}/responses`,
        {
            method: 'POST',
            accessToken,
            body: {
                questionId,
                answer,
                submittedCode,
            },
        },
    )

    return response.data
}
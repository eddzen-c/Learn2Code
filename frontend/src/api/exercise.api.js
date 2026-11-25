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

export const getAcademicCatalog = async (
    accessToken,
) => {
    const response = await apiRequest(
        '/exercises/catalog',
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

export const getExerciseTutorUsage = async ({
    accessToken,
    assignmentId,
}) => {
    const id = encodeURIComponent(assignmentId)
    const response = await apiRequest(
        `/exercises/assignments/${id}/tutor/usage`,
        { accessToken },
    )
    return response.data
}

// El chat tutor utiliza un modelo distinto al generador de ejercicios.
export const askExerciseTutor = async ({
    accessToken,
    assignmentId,
    kind,
    hintLevel = 1,
    message = '',
    history = [],
    model,
    requestId,
}) => {
    const encodedAssignmentId = encodeURIComponent(assignmentId)

    const response = await apiRequest(
        `/exercises/assignments/${encodedAssignmentId}/tutor`,
        {
            method: 'POST',
            accessToken,
            body: {
                kind,
                hintLevel,
                ...(model ? { model } : {}),
                ...(kind === 'question' ? {
                    message,
                    ...(requestId ? { requestId } : {}),
                } : {}),
                history,
            },
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

// Genera una práctica nueva para el nivel y tema de esta unidad.
export const generateAcademicUnitPractice = async ({
    accessToken,
    unitId,
}) => {
    const encodedId = encodeURIComponent(unitId)
    const response = await apiRequest(
        `/exercises/catalog/units/${encodedId}/personalized-practice`,
        { method: 'POST', accessToken },
    )
    return response.data
}

export const getAcademicUnitExercises = async ({
    accessToken,
    unitId,
}) => {
    const encodedUnitId = encodeURIComponent(unitId)

    const response = await apiRequest(
        `/exercises/catalog/units/${encodedUnitId}/exercises`,
        {
            accessToken,
        },
    )

    return response.data
}

export const getAcademicExerciseAssignment = async ({
    accessToken,
    assignmentId,
}) => {
    const encodedAssignmentId =
        encodeURIComponent(assignmentId)

    const response = await apiRequest(
        `/exercises/assignments/${encodedAssignmentId}`,
        {
            accessToken,
        },
    )

    return response.data
}

export const assignAcademicExerciseAssignment = async ({
    accessToken,
    unitId,
    exerciseId,
}) => {
    const encodedUnitId = encodeURIComponent(unitId)
    const encodedExerciseId = encodeURIComponent(exerciseId)

    const response = await apiRequest(
        `/exercises/catalog/units/${encodedUnitId}/exercises/${encodedExerciseId}/assignments`,
        {
            method: 'POST',
            accessToken,
        },
    )

    return response.data
}
const rawApiUrl = import.meta.env.VITE_API_URL

if (!rawApiUrl) {
    throw new Error('VITE_API_URL is required')
}

const API_URL = rawApiUrl.replace(/\/+$/, '')

export class ApiError extends Error {
    constructor(
        message,
        {
            status = 0,
            code = 'API_ERROR',
            details = null,
            cause = null,
        } = {},
    ) {
        super(message)

        this.name = new.target.name
        this.status = status
        this.code = code
        this.details = details
        this.cause = cause
    }
}

export const apiRequest = async (
    path,
    {
        method = 'GET',
        body,
        accessToken = null,
        signal,
    } = {},
) => {
    if (
        typeof path !== 'string'
        || !path.startsWith('/')
    ) {
        throw new TypeError(
            'API path must start with "/"',
        )
    }

    const headers = {
        Accept: 'application/json',
    }

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json'
    }

    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
    }

    let response

    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            credentials: 'include',
            body: body === undefined
                ? undefined
                : JSON.stringify(body),
            signal,
        })
    } catch (error) {
        throw new ApiError(
            'Unable to connect to the API',
            {
                code: 'NETWORK_ERROR',
                cause: error,
            },
        )
    }

    if (response.status === 204) {
        return null
    }

    const responseBody = await response
        .json()
        .catch(() => null)

    if (!response.ok) {
        throw new ApiError(
            responseBody?.message
            ?? 'The API request failed',
            {
                status: response.status,
                code:
                    responseBody?.code
                    ?? 'API_REQUEST_FAILED',
                details: responseBody,
            },
        )
    }

    return responseBody
}
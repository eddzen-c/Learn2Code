import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    apiRequest,
} from './api-client.js'

const createJsonResponse = ({
    body,
    ok = true,
    status = 200,
}) => ({
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('apiRequest', () => {
    it('sends cookies and an access token', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            createJsonResponse({
                body: {
                    status: 'success',
                },
            }),
        )

        vi.stubGlobal('fetch', fetchMock)

        await apiRequest('/auth/me', {
            accessToken: 'access-token',
        })

        expect(fetchMock).toHaveBeenCalledWith(
            'http://localhost:3000/api/v1/auth/me',
            expect.objectContaining({
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    Authorization: 'Bearer access-token',
                },
            }),
        )
    })

    it('serializes a JSON request body', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            createJsonResponse({
                body: {
                    status: 'success',
                },
            }),
        )

        vi.stubGlobal('fetch', fetchMock)

        await apiRequest('/auth/login', {
            method: 'POST',
            body: {
                email: 'student@example.com',
                password: 'secure-password',
            },
        })

        const requestOptions =
            fetchMock.mock.calls[0][1]

        expect(requestOptions.headers).toEqual({
            Accept: 'application/json',
            'Content-Type': 'application/json',
        })

        expect(requestOptions.body).toBe(
            JSON.stringify({
                email: 'student@example.com',
                password: 'secure-password',
            }),
        )
    })

    it('returns null for a 204 response', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 204,
        })

        vi.stubGlobal('fetch', fetchMock)

        await expect(
            apiRequest('/auth/logout', {
                method: 'POST',
            }),
        ).resolves.toBeNull()
    })

    it('maps an API error response', async () => {
        const errorBody = {
            status: 'error',
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
        }

        const fetchMock = vi.fn().mockResolvedValue(
            createJsonResponse({
                body: errorBody,
                ok: false,
                status: 401,
            }),
        )

        vi.stubGlobal('fetch', fetchMock)

        await expect(
            apiRequest('/auth/login', {
                method: 'POST',
            }),
        ).rejects.toMatchObject({
            name: 'ApiError',
            status: 401,
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            details: errorBody,
        })
    })

    it('maps a network failure', async () => {
        const fetchMock = vi.fn().mockRejectedValue(
            new Error('Connection refused'),
        )

        vi.stubGlobal('fetch', fetchMock)

        await expect(
            apiRequest('/auth/me'),
        ).rejects.toMatchObject({
            name: 'ApiError',
            status: 0,
            code: 'NETWORK_ERROR',
        })
    })

    it('rejects an invalid API path', async () => {
        await expect(
            apiRequest('auth/me'),
        ).rejects.toBeInstanceOf(TypeError)
    })
})
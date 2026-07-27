import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    apiRequest,
} from './api-client.js'

import {
    getCurrentDiagnostic,
    startDiagnostic,
    submitDiagnosticAnswer,
} from './diagnostic.api.js'

vi.mock('./api-client.js', () => ({
    apiRequest: vi.fn(),
}))

describe('diagnostic API', () => {
    beforeEach(() => {
        apiRequest.mockReset()

        apiRequest.mockResolvedValue({
            data: {
                state: 'not_started',
            },
        })
    })

    it('gets the current diagnostic', async () => {
        const result =
            await getCurrentDiagnostic(
                'access-token',
            )

        expect(apiRequest).toHaveBeenCalledWith(
            '/diagnostics/current',
            {
                accessToken:
                    'access-token',
            },
        )

        expect(result).toEqual({
            state: 'not_started',
        })
    })

    it('starts a diagnostic', async () => {
        apiRequest.mockResolvedValue({
            data: {
                assessment: {
                    id: 'assessment-1',
                },
            },
        })

        const result =
            await startDiagnostic({
                accessToken:
                    'access-token',
                languageId: 2,
            })

        expect(apiRequest).toHaveBeenCalledWith(
            '/diagnostics',
            {
                method: 'POST',
                accessToken:
                    'access-token',
                body: {
                    languageId: 2,
                },
            },
        )

        expect(result.assessment.id).toBe(
            'assessment-1',
        )
    })

    it('submits a diagnostic answer', async () => {
        apiRequest.mockResolvedValue({
            data: {
                response: {
                    isCorrect: true,
                },
            },
        })

        const result =
            await submitDiagnosticAnswer({
                accessToken:
                    'access-token',
                assessmentId:
                    'assessment/1',
                questionId:
                    'question-1',
                answer: '15',
            })

        expect(apiRequest).toHaveBeenCalledWith(
            '/diagnostics/assessment%2F1/responses',
            {
                method: 'POST',
                accessToken:
                    'access-token',
                body: {
                    questionId:
                        'question-1',
                    answer: '15',
                    submittedCode: null,
                },
            },
        )

        expect(
            result.response.isCorrect,
        ).toBe(true)
    })
})
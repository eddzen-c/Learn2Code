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
    completeStudentLearningFlow,
    completeStudentOnboarding,
    getCurrentStudentOnboarding,
    getStudentOnboardingOptions,
} from './onboarding.api.js'

vi.mock('./api-client.js', () => ({
    apiRequest: vi.fn(),
}))

describe('student onboarding API', () => {
    beforeEach(() => {
        apiRequest.mockReset()
    })

    it('gets the available onboarding options', async () => {
        apiRequest.mockResolvedValue({
            data: {
                languages: [],
                difficultyLevels: [],
                topics: [],
                learningGoals: [],
            },
        })

        const result =
            await getStudentOnboardingOptions(
                'access-token',
            )

        expect(apiRequest).toHaveBeenCalledWith(
            '/onboarding/options',
            {
                accessToken: 'access-token',
            },
        )

        expect(result.languages).toEqual([])
    })

    it('gets the current onboarding state', async () => {
        apiRequest.mockResolvedValue({
            data: {
                state: 'pending',
                onboarding: null,
            },
        })

        const result =
            await getCurrentStudentOnboarding(
                'access-token',
            )

        expect(apiRequest).toHaveBeenCalledWith(
            '/onboarding/current',
            {
                accessToken: 'access-token',
            },
        )

        expect(result.state).toBe('pending')
    })

    it('completes the student onboarding', async () => {
        const preferences = {
            languageId: 1,
            selfAssessedDifficultyId: 1,
            learningGoal:
                'programming_fundamentals',
            topicIds: [1, 2],
        }

        apiRequest.mockResolvedValue({
            data: {
                state: 'completed',
                onboarding: preferences,
            },
        })

        const result =
            await completeStudentOnboarding({
                accessToken: 'access-token',
                preferences,
            })

        expect(apiRequest).toHaveBeenCalledWith(
            '/onboarding',
            {
                method: 'PUT',
                accessToken: 'access-token',
                body: preferences,
            },
        )

        expect(result.state).toBe('completed')
    })

    it('completes the five-step learning flow', async () => {
        const completedAt =
            '2026-11-14T06:00:00.000Z'

        apiRequest.mockResolvedValue({
            data: {
                state: 'completed',
                completedAt,
            },
        })

        const result =
            await completeStudentLearningFlow({
                accessToken: 'access-token',
            })

        expect(apiRequest).toHaveBeenCalledWith(
            '/onboarding/learning-flow/complete',
            {
                method: 'PUT',
                accessToken: 'access-token',
            },
        )

        expect(result).toEqual({
            state: 'completed',
            completedAt,
        })
    })

    it('propagates learning flow completion errors', async () => {
        apiRequest.mockRejectedValue(
            new Error(
                'LEARNING_FLOW_PREREQUISITES_REQUIRED',
            ),
        )

        await expect(
            completeStudentLearningFlow({
                accessToken: 'access-token',
            }),
        ).rejects.toThrow(
            'LEARNING_FLOW_PREREQUISITES_REQUIRED',
        )

        expect(apiRequest).toHaveBeenCalledTimes(1)

        expect(apiRequest).toHaveBeenCalledWith(
            '/onboarding/learning-flow/complete',
            {
                method: 'PUT',
                accessToken: 'access-token',
            },
        )
    })
})
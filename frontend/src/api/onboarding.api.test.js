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
})
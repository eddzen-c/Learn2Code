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
    generateNextExercise,
    getCurrentExercise,
    submitExerciseAttempt,
} from './exercise.api.js'

vi.mock('./api-client.js', () => ({
    apiRequest: vi.fn(),
}))

describe('exercise API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('loads the current exercise', async () => {
        const data = {
            state: 'none',
            assignment: null,
            exercise: null,
        }

        apiRequest.mockResolvedValue({
            data,
        })

        await expect(
            getCurrentExercise('access-token'),
        ).resolves.toEqual(data)

        expect(apiRequest).toHaveBeenCalledWith(
            '/exercises/current',
            {
                accessToken: 'access-token',
            },
        )
    })

    it('generates the next exercise', async () => {
        const data = {
            created: true,
            assignment: {
                id: 'assignment-id',
            },
        }

        apiRequest.mockResolvedValue({
            data,
        })

        await expect(
            generateNextExercise('access-token'),
        ).resolves.toEqual(data)

        expect(apiRequest).toHaveBeenCalledWith(
            '/exercises/next',
            {
                method: 'POST',
                accessToken: 'access-token',
            },
        )
    })

    it('submits an exercise attempt', async () => {
        const data = {
            attempt: {
                passed: true,
                score: 100,
            },
        }

        apiRequest.mockResolvedValue({
            data,
        })

        await expect(
            submitExerciseAttempt({
                accessToken: 'access-token',
                assignmentId: 'assignment/id',
                submittedCode:
                    'console.log("Learn2Code")',
            }),
        ).resolves.toEqual(data)

        expect(apiRequest).toHaveBeenCalledWith(
            '/exercises/assignments/assignment%2Fid/attempts',
            {
                method: 'POST',
                accessToken: 'access-token',
                body: {
                    submittedCode:
                        'console.log("Learn2Code")',
                },
            },
        )
    })
})
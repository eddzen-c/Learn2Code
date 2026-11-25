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
    askExerciseTutor,
    generateAcademicUnitPractice,
    generateNextExercise,
    getAcademicCatalog,
    getExerciseTutorUsage,
    getCurrentExercise,
    submitExerciseAttempt,
    getAcademicUnitExercises,
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

    it('loads the academic catalog', async () => {
        const data = {
            specializations: [
                {
                    key: 'frontend',
                    name: 'Desarrollo Frontend',
                    stages: [],
                },
            ],
        }

        apiRequest.mockResolvedValue({ data })

        await expect(
            getAcademicCatalog('access-token'),
        ).resolves.toEqual(data)

        expect(apiRequest).toHaveBeenCalledWith(
            '/exercises/catalog',
            {
                accessToken: 'access-token',
            },
        )
    })

    it('propagates academic catalog errors', async () => {
        const error = new Error(
            'No fue posible consultar el catálogo.',
        )

        apiRequest.mockRejectedValue(error)

        await expect(
            getAcademicCatalog('access-token'),
        ).rejects.toThrow(
            'No fue posible consultar el catálogo.',
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

    it('loads the question limit for the current exercise', async () => {
        apiRequest.mockResolvedValue({ data: { used: 7, limit: 30 } })

        const usage = await getExerciseTutorUsage({
            accessToken: 'access-token',
            assignmentId: 'assignment/id',
        })

        expect(usage).toEqual({ used: 7, limit: 30 })
        expect(apiRequest).toHaveBeenCalledWith(
            '/exercises/assignments/assignment%2Fid/tutor/usage',
            { accessToken: 'access-token' },
        )
    })

    it('routes tutor hints to a separate authenticated endpoint', async () => {
        apiRequest.mockResolvedValue({
            data: { reply: 'Una pregunta orientadora.' },
        })

        const result = await askExerciseTutor({
            accessToken: 'access-token',
            assignmentId: 'assignment/id',
            kind: 'hint',
            hintLevel: 2,
            history: [],
        })

        expect(result.reply).toBe('Una pregunta orientadora.')
        expect(apiRequest).toHaveBeenCalledWith(
            '/exercises/assignments/assignment%2Fid/tutor',
            {
                method: 'POST',
                accessToken: 'access-token',
                body: {
                    kind: 'hint',
                    hintLevel: 2,
                    history: [],
                },
            },
        )
    })

    it('sends tutor questions and recent chat history', async () => {
        apiRequest.mockResolvedValue({
            data: { reply: 'Intenta con una condición.' },
        })

        await askExerciseTutor({
            accessToken: 'access-token',
            assignmentId: 'assignment-id',
            kind: 'question',
            model: 'gpt-4o-mini',
            requestId: '11111111-1111-4111-8111-111111111111',
            message: '¿Cómo empiezo?',
            history: [{ role: 'assistant', content: 'Primera pista' }],
        })

        expect(apiRequest).toHaveBeenCalledWith(
            '/exercises/assignments/assignment-id/tutor',
            expect.objectContaining({
                method: 'POST',
                body: {
                    kind: 'question',
                    hintLevel: 1,
                    model: 'gpt-4o-mini',
                    requestId: '11111111-1111-4111-8111-111111111111',
                    message: '¿Cómo empiezo?',
                    history: [{ role: 'assistant', content: 'Primera pista' }],
                },
            }),
        )
    })

    it('starts a personalized AI practice inside an academic unit', async () => {
        apiRequest.mockResolvedValue({
            data: { created: true, assignment: { id: 'assignment-one' } },
        })
        const result = await generateAcademicUnitPractice({
            accessToken: 'token',
            unitId: 'unit/id',
        })
        expect(result.assignment.id).toBe('assignment-one')
        expect(apiRequest).toHaveBeenCalledWith(
            '/exercises/catalog/units/unit%2Fid/personalized-practice',
            { method: 'POST', accessToken: 'token' },
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

    it('loads exercises from a published academic unit', async () => {
        const unitId =
            '11111111-1111-4111-8111-111111111111'

        const data = {
            unit: {
                id: unitId,
                title: 'Fundamentos de HTML',
            },
            exercises: [],
        }

        apiRequest.mockResolvedValue({ data })

        await expect(
            getAcademicUnitExercises({
                accessToken: 'access-token',
                unitId,
            }),
        ).resolves.toEqual(data)

        expect(apiRequest).toHaveBeenCalledWith(
            `/exercises/catalog/units/${unitId}/exercises`,
            {
                accessToken: 'access-token',
            },
        )
    })

    it('propagates academic unit exercise API errors', async () => {
        const unitId =
            '11111111-1111-4111-8111-111111111111'

        apiRequest.mockRejectedValue(
            new Error('Unidad no disponible'),
        )

        await expect(
            getAcademicUnitExercises({
                accessToken: 'access-token',
                unitId,
            }),
        ).rejects.toThrow('Unidad no disponible')
    })
})
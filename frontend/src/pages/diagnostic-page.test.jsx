import {
    render,
    screen,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
    MemoryRouter,
} from 'react-router-dom'

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    getCurrentDiagnostic,
    startDiagnostic,
    submitDiagnosticAnswer,
} from '../api/diagnostic.api.js'

import {
    AuthContext,
} from '../auth/auth-context.js'

import {
    DiagnosticPage,
} from './DiagnosticPage.jsx'

vi.mock('../api/diagnostic.api.js', () => ({
    getCurrentDiagnostic: vi.fn(),
    startDiagnostic: vi.fn(),
    submitDiagnosticAnswer: vi.fn(),
}))

const question = {
    id: 'question-1',
    position: 1,
    questionType: 'code_output',
    prompt:
        '¿Qué resultado muestra?\n\nconsole.log(5);',
    options: [
        '4',
        '5',
        '6',
    ],
    starterCode: null,
    maxScore: 100,
    topic: {
        id: 1,
        name: 'variables',
    },
    difficulty: {
        id: 1,
        name: 'básico',
    },
    response: null,
}

const secondQuestion = {
    ...question,
    id: 'question-2',
    position: 2,
    prompt:
        '¿Qué resultado muestra?\n\nconsole.log(10);',
    options: [
        '8',
        '9',
        '10',
    ],
}

const renderDiagnosticPage = () => {
    render(
        <AuthContext.Provider
            value={{
                user: {
                    fullName: 'Student',
                    preferredProgrammingLanguageId:
                        1,
                },
                accessToken:
                    'access-token',
            }}
        >
            <MemoryRouter>
                <DiagnosticPage />
            </MemoryRouter>
        </AuthContext.Provider>,
    )
}

describe('DiagnosticPage', () => {
    beforeEach(() => {
        getCurrentDiagnostic.mockReset()
        startDiagnostic.mockReset()
        submitDiagnosticAnswer.mockReset()
    })

    it('starts a new diagnostic', async () => {
        const user = userEvent.setup()

        getCurrentDiagnostic.mockResolvedValue({
            state: 'not_started',
            assessment: null,
            questions: [],
            result: null,
        })

        startDiagnostic.mockResolvedValue({
            assessment: {
                id: 'assessment-1',
                status: 'in_progress',
                questionCount: 1,
                answeredCount: 0,
            },
            language: {
                id: 2,
                name: 'Python',
            },
            questions: [
                question,
            ],
            generation: {
                provider: 'mock',
                simulated: true,
            },
        })

        renderDiagnosticPage()

        expect(
            await screen.findByRole(
                'heading',
                {
                    name:
                        'Descubramos tu nivel',
                },
            ),
        ).toBeInTheDocument()

        await user.selectOptions(
            screen.getByLabelText(
                'Lenguaje de programación',
            ),
            '2',
        )

        await user.click(
            screen.getByRole('button', {
                name:
                    'Comenzar diagnóstico',
            }),
        )

        expect(
            startDiagnostic,
        ).toHaveBeenCalledWith({
            accessToken:
                'access-token',
            languageId: 2,
        })

        expect(
            await screen.findByRole(
                'heading',
                {
                    name: 'Pregunta 1 de 1',
                },
            ),
        ).toBeInTheDocument()
    })

    it('submits an answer and advances', async () => {
        const user = userEvent.setup()

        getCurrentDiagnostic.mockResolvedValue({
            state: 'in_progress',
            assessment: {
                id: 'assessment-1',
                status: 'in_progress',
                questionCount: 2,
                answeredCount: 0,
            },
            questions: [
                question,
                secondQuestion,
            ],
            result: null,
        })

        submitDiagnosticAnswer.mockResolvedValue({
            response: {
                id: 'response-1',
                questionId:
                    'question-1',
                status: 'evaluated',
                isCorrect: true,
                score: 100,
                feedback:
                    'Respuesta correcta.',
                evaluatedAt:
                    '2026-07-25T23:00:00Z',
            },
            progress: {
                answeredCount: 1,
                questionCount: 2,
                allAnswered: false,
            },
            completion: null,
        })

        renderDiagnosticPage()

        expect(
            await screen.findByRole(
                'heading',
                {
                    name: 'Pregunta 1 de 2',
                },
            ),
        ).toBeInTheDocument()

        await user.click(
            screen.getByRole('radio', {
                name: '5',
            }),
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Enviar respuesta',
            }),
        )

        expect(
            submitDiagnosticAnswer,
        ).toHaveBeenCalledWith({
            accessToken:
                'access-token',
            assessmentId:
                'assessment-1',
            questionId:
                'question-1',
            answer: '5',
        })

        expect(
            await screen.findByRole(
                'heading',
                {
                    name: 'Pregunta 2 de 2',
                },
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Respuesta correcta.',
            ),
        ).toBeInTheDocument()
    })

    it('shows a completed result', async () => {
        getCurrentDiagnostic.mockResolvedValue({
            state: 'completed',
            assessment: {
                id: 'assessment-1',
                status: 'completed',
                questionCount: 8,
                answeredCount: 8,
            },
            questions: [],
            result: {
                overallScore: 75,
                resultingDifficulty: {
                    id: 2,
                    name: 'intermedio',
                },
                completedAt:
                    '2026-07-25T23:30:00Z',
            },
        })

        renderDiagnosticPage()

        expect(
            await screen.findByRole(
                'heading',
                {
                    name: 'Tu resultado',
                },
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText('75%'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('intermedio'),
        ).toBeInTheDocument()
    })
})
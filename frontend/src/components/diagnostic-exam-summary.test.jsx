import {
    render,
    screen,
} from '@testing-library/react'

import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    DiagnosticExamSummary,
} from './DiagnosticExamSummary.jsx'

const questions = [
    {
        technologyKey: 'javascript',
    },
    {
        technologyKey: 'javascript',
    },
    {
        technologyKey: 'react',
    },
    {
        technologyKey: 'python',
    },
]

describe('DiagnosticExamSummary', () => {
    it(
        'calculates the technology distribution',
        () => {
            render(
                <DiagnosticExamSummary
                    answeredCount={1}
                    questionCount={4}
                    questions={questions}
                />,
            )

            expect(
                screen.getByRole(
                    'complementary',
                    {
                        name:
                            'Resumen del examen',
                    },
                ),
            ).toBeTruthy()

            expect(
                screen.getByText('15 min'),
            ).toBeTruthy()

            expect(
                screen.getByText('JavaScript'),
            ).toBeTruthy()

            expect(
                screen.getByText('React'),
            ).toBeTruthy()

            expect(
                screen.getByText('Python'),
            ).toBeTruthy()

            expect(
                screen.getByText('50%'),
            ).toBeTruthy()

            expect(
                screen.getAllByText('25%'),
            ).toHaveLength(2)
        },
    )
})
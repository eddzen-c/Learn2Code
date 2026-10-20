import {
    render,
    screen,
    within,
} from '@testing-library/react'

import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    LearningFlowProgress,
} from './LearningFlowProgress.jsx'

describe('LearningFlowProgress', () => {
    it('shows five stages and the current progress', () => {
        render(
            <LearningFlowProgress
                activeStep={2}
            />,
        )

        const progress =
            screen.getByRole('list', {
                name:
                    'Progreso de configuración',
            })

        expect(
            within(progress)
                .getAllByRole('listitem'),
        ).toHaveLength(5)

        expect(
            screen
                .getByText('Sobre ti')
                .closest('li'),
        ).toHaveClass('is-complete')

        expect(
            screen
                .getByText('Diagnóstico')
                .closest('li'),
        ).toHaveClass('is-active')

        expect(
            screen.getByText(
                'Plan recomendado',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                '¡A aprender!',
            ),
        ).toBeInTheDocument()
    })
})
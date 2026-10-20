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
    LearningTopbar,
} from './LearningTopbar.jsx'

describe('LearningTopbar', () => {
    it(
        'shows the current learning stage and student identity',
        () => {
            render(
                <LearningTopbar
                    activeStep={2}
                    userName="Edwin"
                />,
            )

            const progress = screen.getByRole(
                'list',
                {
                    name:
                        'Progreso de configuración',
                },
            )

            const steps = within(progress)
                .getAllByRole('listitem')

            expect(
                steps[0].classList.contains(
                    'is-complete',
                ),
            ).toBe(true)

            expect(
                steps[1].classList.contains(
                    'is-active',
                ),
            ).toBe(true)

            expect(
                screen.getByLabelText(
                    'Perfil de Edwin',
                ),
            ).toBeTruthy()

            expect(
                screen.getByText('Edwin'),
            ).toBeTruthy()

            expect(
                screen.getByText('Estudiante'),
            ).toBeTruthy()
        },
    )
})
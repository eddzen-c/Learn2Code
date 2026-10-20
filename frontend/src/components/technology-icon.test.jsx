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
    TechnologyIcon,
} from './TechnologyIcon.jsx'

describe('TechnologyIcon', () => {
    it('renders accessible catalog technology icons', () => {
        render(
            <div>
                <TechnologyIcon
                    technologyKey="javascript"
                />

                <TechnologyIcon
                    technologyKey="html_css"
                />

                <TechnologyIcon
                    technologyKey="sql"
                />

                <TechnologyIcon
                    technologyKey="unknown"
                />
            </div>,
        )

        expect(
            screen.getByRole('img', {
                name: 'JavaScript',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('img', {
                name: 'HTML y CSS',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('img', {
                name: 'SQL',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('img', {
                name: 'Otra tecnología',
            }),
        ).toBeInTheDocument()
    })
})
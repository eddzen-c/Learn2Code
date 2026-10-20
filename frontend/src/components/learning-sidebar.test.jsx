import {
    render,
    screen,
} from '@testing-library/react'

import {
    MemoryRouter,
} from 'react-router-dom'

import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    LearningSidebar,
} from './LearningSidebar.jsx'

describe('LearningSidebar', () => {
    it('renders navigation and marks the selected item', () => {
        render(
            <MemoryRouter>
                <LearningSidebar
                    activeItem="routes"
                    mascotSrc="/images/test-mascot.png"
                />
            </MemoryRouter>,
        )

        const homeLink =
            screen.getByRole('link', {
                name: 'Inicio',
            })

        const routesLink =
            screen.getByRole('link', {
                name: 'Rutas',
            })

        expect(homeLink)
            .not
            .toHaveClass('is-active')

        expect(routesLink)
            .toHaveClass('is-active')

        expect(
            screen.getByRole('navigation', {
                name:
                    'Navegación principal',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByAltText(
                'Mascota de Learn2Code programando',
            ),
        ).toHaveAttribute(
            'src',
            '/images/test-mascot.png',
        )
    })
})
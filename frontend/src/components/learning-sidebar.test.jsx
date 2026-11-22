import {
    render,
    screen,
    within,
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
                'Dragón de Learn2Code programando',
            )
        ).toHaveAttribute(
            'src',
            '/images/test-mascot.png',
        )
    })

    it('shows the same eight navigation modules', () => {
        render(
            <MemoryRouter>
                <LearningSidebar
                    variant="profile"
                    activeItem="routes"
                />
            </MemoryRouter>,
        )

        const navigation = screen.getByRole(
            'navigation',
            { name: 'Navegación principal' },
        )

        const expectedModules = [
            'Inicio',
            'Rutas',
            'Cursos',
            'Ejercicios',
            'Proyectos',
            'Comunidad',
            'Logros',
            'Perfil',
        ]

        expect(
            within(navigation).getAllByRole('link'),
        ).toHaveLength(8)

        expectedModules.forEach((moduleName) => {
            expect(
                within(navigation).getByRole('link', {
                    name: moduleName,
                }),
            ).toBeInTheDocument()
        })

        expect(
            within(navigation).getByRole('link', {
                name: 'Rutas',
            }),
        ).toHaveAttribute('aria-current', 'page')

        expect(
            screen.getByRole('button', {
                name: 'Abrir menú de navegación',
            }),
        ).toBeInTheDocument()
    })
})
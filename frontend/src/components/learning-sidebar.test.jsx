import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LearningSidebar } from './LearningSidebar.jsx'

function renderSidebar(pathname = '/dashboard', props = {}) {
    return render(
        <MemoryRouter initialEntries={[pathname]}>
            <LearningSidebar {...props} />
        </MemoryRouter>,
    )
}

const expectedModules = [
    ['Inicio', '/dashboard'],
    ['Rutas', '/routes'],
    ['Ejercicios', '/exercises'],
    ['Logros', '/badges'],
    ['Perfil', '/profile'],
]

describe('LearningSidebar: navegación única en todas las páginas internas', () => {
    it.each([
        ['/onboarding', 'Inicio'],
        ['/diagnostic', 'Inicio'],
        ['/diagnostic/results', 'Inicio'],
        ['/dashboard', 'Inicio'],
        ['/recommended-plan', 'Rutas'],
        ['/my-recommendation', 'Rutas'],
        ['/start-learning', 'Rutas'],
        ['/routes', 'Rutas'],
        ['/routes/frontend', 'Rutas'],
        ['/routes/backend', 'Rutas'],
        ['/routes/fullstack', 'Rutas'],
        ['/routes/devops', 'Rutas'],
        ['/exercises', 'Ejercicios'],
        ['/exercises/specializations/fullstack', 'Ejercicios'],
        ['/exercises/stages/stage-1', 'Ejercicios'],
        ['/exercises/modules/module-1', 'Ejercicios'],
        ['/exercises/units/unit-1', 'Ejercicios'],
        ['/exercises/current', 'Ejercicios'],
        ['/resolver-ejercicio', 'Ejercicios'],
        ['/resolver-ejercicio-real', 'Ejercicios'],
        ['/ejercicio-completado', 'Ejercicios'],
        ['/badges', 'Logros'],
        ['/profile', 'Perfil'],
        ['/profile/public', 'Perfil'],
    ])('en %s mantiene el menú compartido y marca %s', (pathname, activeLabel) => {
        renderSidebar(pathname, { variant: 'default', activeItem: 'diagnostic' })
        const sidebar = screen.getByRole('complementary', {
            name: 'Barra lateral de Learn2Code',
        })
        expect(sidebar).toHaveClass('learning-sidebar--unified')
        expect(sidebar).toHaveClass('learning-sidebar--profile')
        const menu = within(sidebar).getByRole('navigation', {
            name: 'Navegación principal',
        })
        const links = within(menu).getAllByRole('link')
        expect(links).toHaveLength(5)
        for (const [label, path] of expectedModules) {
            expect(within(menu).getByRole('link', { name: label }))
                .toHaveAttribute('href', path)
        }
        expect(within(menu).getByRole('link', { name: activeLabel }))
            .toHaveAttribute('aria-current', 'page')
        expect(within(sidebar).getByAltText('Dragón de Learn2Code programando'))
            .toHaveAttribute('src', '/images/dragon-laptop-512.png')
    })

    it('no cambia de diseño cuando la página envía otra variante o mascota', () => {
        renderSidebar('/onboarding', {
            variant: 'default',
            mascotSrc: '/images/learn2code-mascot-thinking.png',
            messageTitle: 'Bienvenida',
            message: 'Texto de otra variante',
        })
        expect(document.querySelector('.learning-sidebar--unified')).toBeInTheDocument()
        expect(document.querySelector('.onboarding-sidebar-message'))
            .not.toBeInTheDocument()
        expect(screen.getByAltText('Dragón de Learn2Code programando'))
            .toHaveAttribute('src', '/images/dragon-laptop-512.png')
    })

    it('permite abrir el menú móvil y lo cierra al navegar', () => {
        renderSidebar('/dashboard')
        const toggle = screen.getByRole('button', { name: 'Abrir menú de navegación' })
        expect(toggle).toHaveAttribute('aria-expanded', 'false')
        fireEvent.click(toggle)
        const navigation = screen.getByRole('navigation', { name: 'Navegación principal' })
        expect(navigation).toHaveClass('is-mobile-open')
        expect(screen.getByRole('button', { name: 'Cerrar menú de navegación' }))
            .toHaveAttribute('aria-expanded', 'true')
        fireEvent.click(within(navigation).getByRole('link', { name: 'Rutas' }))
        expect(navigation).not.toHaveClass('is-mobile-open')
    })

    it('muestra rachas reales cuando existen y no inventa cifras', () => {
        const { rerender } = renderSidebar('/dashboard', { streakDays: 3 })
        expect(screen.getByText('3 días')).toBeInTheDocument()
        rerender(
            <MemoryRouter initialEntries={['/dashboard']}>
                <LearningSidebar />
            </MemoryRouter>,
        )
        expect(screen.queryByText('3 días')).not.toBeInTheDocument()
    })
})

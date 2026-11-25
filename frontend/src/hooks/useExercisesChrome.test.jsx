import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudentStreak } from './useStudentStreak.js'
import { useExercisesChrome } from './useExercisesChrome.js'

vi.mock('../auth/useAuth.js', () => ({
    useAuth: () => ({ accessToken: 'real-access-token' }),
}))

vi.mock('./useStudentStreak.js', () => ({
    useStudentStreak: vi.fn(),
}))

function ChromeHarness() {
    const { sidebar, topbar } = useExercisesChrome()
    const location = useLocation()

    return (
        <section>
            <p data-testid="racha">{String(topbar.streakDays)}</p>
            <p data-testid="sidebar-racha">{String(sidebar.streakDays)}</p>
            <p data-testid="menu-activo">{sidebar.activeItem}</p>
            <p data-testid="ruta">{location.pathname}</p>
            <p data-testid="pestana">{location.state?.openTab ?? ''}</p>
            <button type="button" onClick={topbar.onOpenNotifications}>
                Abrir notificaciones
            </button>
        </section>
    )
}

describe('useExercisesChrome', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('muestra únicamente la racha que devuelve el backend', () => {
        useStudentStreak.mockReturnValue(7)

        render(
            <MemoryRouter initialEntries={['/exercises']}>
                <ChromeHarness />
            </MemoryRouter>,
        )

        expect(useStudentStreak).toHaveBeenCalledWith('real-access-token')
        expect(screen.getByTestId('racha')).toHaveTextContent('7')
        expect(screen.getByTestId('sidebar-racha')).toHaveTextContent('7')
        expect(screen.getByTestId('menu-activo')).toHaveTextContent('exercises')
    })

    it('abre la sección real de notificaciones de Perfil', () => {
        useStudentStreak.mockReturnValue(null)

        render(
            <MemoryRouter initialEntries={['/exercises']}>
                <ChromeHarness />
            </MemoryRouter>,
        )

        fireEvent.click(
            screen.getByRole('button', { name: 'Abrir notificaciones' }),
        )

        expect(screen.getByTestId('ruta')).toHaveTextContent('/profile')
        expect(screen.getByTestId('pestana')).toHaveTextContent('notifications')
        expect(screen.getByTestId('racha')).toHaveTextContent('null')
    })
})

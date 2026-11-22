import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from '../auth/auth-context.js';
import { getCurrentLearningPlan } from '../api/learning-paths.api.js';
import { getCurrentStudentRoute, selectStudentRoute } from '../api/student-routes.api.js';
import { FullStackRoutePage } from './FullStackRoutePage.jsx';

vi.mock('../api/learning-paths.api.js', () => ({
    getCurrentLearningPlan: vi.fn(),
}));

vi.mock('../api/student-routes.api.js', () => ({
    getCurrentStudentRoute: vi.fn(),
    selectStudentRoute: vi.fn(),
}));

vi.mock('../hooks/useStudentStreak.js', () => ({
    useStudentStreak: () => 0,
}));

vi.mock('../components/LearningSidebar.jsx', () => ({
    LearningSidebar: () => (
        <nav aria-label="Navegación lateral de prueba" />
    ),
}));

vi.mock('../components/ProfileTopbar.jsx', () => ({
    ProfileTopbar: () => (
        <header>Barra superior de prueba</header>
    ),
}));

const renderRouteDetail = () => render(
    <AuthContext.Provider
        value={{
            accessToken: 'access-token',
            user: {
                fullName: 'Test User',
                emailVerified: true,
            },
            signOut: vi.fn(),
        }}
    >
        <MemoryRouter initialEntries={['/routes/fullstack']}>
            <Routes>
                <Route
                    path="/routes/:specializationKey"
                    element={<FullStackRoutePage />}
                />
                <Route
                    path="/start-learning"
                    element={<p>Inicio de aprendizaje</p>}
                />
            </Routes>
        </MemoryRouter>
    </AuthContext.Provider>,
);

describe('Ruta FullStack - pruebas independientes', () => {

    beforeEach(() => {
        vi.clearAllMocks();

        getCurrentStudentRoute.mockResolvedValue({
            state: 'not_selected',
            selection: null,
        });

        getCurrentLearningPlan.mockResolvedValue({
            state: 'not_available',
            plan: null,
        });

        selectStudentRoute.mockResolvedValue({
            state: 'selected',
            selection: {
                specializationKey: 'backend',
            },
        });
    });

    it('renders Full Stack with the correct learning stages', () => {
        renderRouteDetail();

        expect(
            screen.getByRole('heading', {
                name: 'Ruta Full Stack',
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                'Construcción de interfaces con React y componentes reutilizables.',
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                'Comunicación entre interfaz, servidor y base de datos.',
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                'Pruebas de funcionamiento y preparación para publicar.',
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                'Etapas orientativas de esta especialización.',
            ),
        ).toBeInTheDocument();
    });

    it('shows Full Stack project examples with their own images', () => {
        renderRouteDetail();

        expect(
            screen.getByRole('heading', {
                name: 'Proyectos que podrías construir',
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText('Tienda en línea'),
        ).toBeInTheDocument();

        expect(
            screen.getByText('Gestor de tareas'),
        ).toBeInTheDocument();

        expect(
            screen.getByText('Panel de información'),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /Ejemplos ilustrativos\. Su disponibilidad/,
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('img', {
                name: 'Ejemplo ilustrativo de Tienda en línea',
            }),
        ).toHaveAttribute(
            'src',
            '/images/rutas/detalles/fullstack/proyectos/miniatura-tienda-512.webp',
        );
    });

    it('shows the original Full Stack illustration', () => {
        renderRouteDetail();

        const illustration = screen.getByRole('img', {
            name: /Ilustración de Full Stack con React/,
        });

        expect(illustration).toHaveAttribute(
            'src',
            '/images/rutas/detalles/fullstack/ilustracion-fullstack-original.webp',
        );

        expect(
            screen.queryByRole('img', {
                name: /Mascota de Learn2Code representando/,
            }),
        ).not.toBeInTheDocument();
    });

});
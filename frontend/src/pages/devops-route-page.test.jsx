import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from '../auth/auth-context.js';
import { getCurrentLearningPlan } from '../api/learning-paths.api.js';
import { getCurrentStudentRoute, selectStudentRoute } from '../api/student-routes.api.js';
import { DevOpsRoutePage } from './DevOpsRoutePage.jsx';

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
        <MemoryRouter initialEntries={['/routes/devops']}>
            <Routes>
                <Route
                    path="/routes/:specializationKey"
                    element={<DevOpsRoutePage />}
                />
                <Route
                    path="/exercises/specializations/devops"
                    element={<p>Catálogo DevOps abierto</p>}
                />
            </Routes>
        </MemoryRouter>
    </AuthContext.Provider>,
);

describe('Ruta DevOps - pruebas independientes', () => {

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

    it('renders DevOps with its specific learning stages', () => {
        renderRouteDetail();

        expect(
            screen.getByRole('heading', {
                name: 'Ruta DevOps',
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                'Conceptos de infraestructura, automatización y operaciones.',
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                'Creación y administración de contenedores con Docker.',
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                'Automatización de pruebas y despliegues mediante GitHub Actions.',
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                'Fundamentos de infraestructura y servicios en AWS.',
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                'Aplicación práctica de los conceptos de esta especialización.',
            ),
        ).toBeInTheDocument();

        expect(
            screen.queryByText('Contenido detallado por definir'),
        ).not.toBeInTheDocument();
    });

    it('shows the original DevOps illustration', () => {
        renderRouteDetail();

        const illustration = screen.getByRole('img', {
            name: /Ilustración de DevOps con Docker/,
        });

        expect(illustration).toHaveAttribute(
            'src',
            '/images/rutas/detalles/devops/ilustracion-devops-original.webp',
        );

        expect(
            screen.queryByRole('img', {
                name: /Mascota de Learn2Code representando/,
            }),
        ).not.toBeInTheDocument();
    });

    it('shows DevOps project examples with their own images', () => {
        renderRouteDetail();

        expect(
            screen.getByRole('heading', {
                name: 'Proyectos que podrías construir',
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText('Pipeline de CI/CD'),
        ).toBeInTheDocument();

        expect(
            screen.getByText('API en contenedores'),
        ).toBeInTheDocument();

        expect(
            screen.getByText('Panel de información'),
        ).toBeInTheDocument();

        const pipeline = screen.getByRole('img', {
            name: 'Ejemplo ilustrativo de Pipeline de CI/CD',
        });

        expect(pipeline).toHaveAttribute(
            'src',
            '/images/rutas/detalles/devops/proyectos/miniatura-pipeline-512.webp',
        );

        const api = screen.getByRole('img', {
            name: 'Ejemplo ilustrativo de API en contenedores',
        });

        expect(api).toHaveAttribute(
            'src',
            '/images/rutas/detalles/devops/proyectos/miniatura-api-productos-512.webp',
        );

        const dashboard = screen.getByRole('img', {
            name: 'Ejemplo ilustrativo de Panel de información',
        });

        expect(dashboard).toHaveAttribute(
            'src',
            '/images/rutas/detalles/devops/proyectos/miniatura-dashboard-512.webp',
        );

        expect(
            screen.queryByText('Proyectos por definir'),
        ).not.toBeInTheDocument();
    });

    it('abre el catálogo DevOps cuando la ruta ya está seleccionada', async () => {
        getCurrentStudentRoute.mockResolvedValue({
            state: 'selected',
            selection: { specializationKey: 'devops' },
        });
        renderRouteDetail();
        expect(await screen.findByText('Esta es tu ruta seleccionada'))
            .toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', {
            name: 'Comenzar esta ruta',
        }));
        expect(await screen.findByText('Catálogo DevOps abierto'))
            .toBeInTheDocument();
    });

});
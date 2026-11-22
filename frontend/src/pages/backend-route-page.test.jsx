import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from '../auth/auth-context.js';
import { getCurrentLearningPlan } from '../api/learning-paths.api.js';
import { getCurrentStudentRoute, selectStudentRoute } from '../api/student-routes.api.js';
import { BackendRoutePage } from './BackendRoutePage.jsx';

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
        <MemoryRouter initialEntries={['/routes/backend']}>
            <Routes>
                <Route
                    path="/routes/:specializationKey"
                    element={<BackendRoutePage />}
                />
                <Route
                    path="/start-learning"
                    element={<p>Inicio de aprendizaje</p>}
                />
            </Routes>
        </MemoryRouter>
    </AuthContext.Provider>,
);

describe('Ruta Backend - pruebas independientes', () => {

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

    it('renders the correct Backend specialization', async () => {
        renderRouteDetail();

        expect(
            screen.getByRole('heading', {
                name: 'Ruta Backend',
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                'Domina servidores, bases de datos y APIs escalables.',
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('img', {
                name: /Ilustración de Backend/i,
            }),
        ).toHaveAttribute(
            'src',
            '/images/rutas/detalles/backend/ilustracion-backend-mockup.webp',
        );

        await waitFor(() => {
            expect(getCurrentStudentRoute).toHaveBeenCalledWith(
                'access-token',
            );
        });
    });

    it('shows Backend project examples without claiming they are available', () => {
        renderRouteDetail();

        expect(
            screen.getByRole('heading', {
                name: 'Proyectos que podrías construir',
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText('API de productos'),
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
                name: 'Ejemplo ilustrativo de API de productos',
            }),
        ).toHaveAttribute(
            'src',
            '/images/rutas/detalles/backend/proyectos/miniatura-api-productos-512.webp',
        );
    });

    it('does not invent progress or unavailable statistics', async () => {
        renderRouteDetail();

        expect(
            await screen.findByText('Sin seleccionar'),
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText('Progreso aún no disponible'),
        ).toBeInTheDocument();

        expect(
            screen.getAllByText('Por definir').length,
        ).toBeGreaterThan(0);

        expect(
            screen.queryByText('14 módulos'),
        ).not.toBeInTheDocument();

        expect(
            screen.queryByText('6 proyectos'),
        ).not.toBeInTheDocument();
    });

    it('does not save a route when confirmation is cancelled', async () => {
        const user = userEvent.setup();

        renderRouteDetail();

        const selectButton = screen.getByRole('button', {
            name: 'Seleccionar esta ruta',
        });

        await waitFor(() => {
            expect(selectButton).toBeEnabled();
        });

        await user.click(selectButton);

        expect(
            screen.getByText('¿Confirmas tu elección?'),
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole('button', {
                name: 'Cancelar',
            }),
        );

        expect(selectStudentRoute).not.toHaveBeenCalled();
    });

    it('saves Backend only after explicit confirmation', async () => {
        const user = userEvent.setup();

        renderRouteDetail();

        const selectButton = screen.getByRole('button', {
            name: 'Seleccionar esta ruta',
        });

        await waitFor(() => {
            expect(selectButton).toBeEnabled();
        });

        await user.click(selectButton);

        expect(selectStudentRoute).not.toHaveBeenCalled();

        await user.click(
            screen.getByRole('button', {
                name: 'Confirmar elección',
            }),
        );

        await waitFor(() => {
            expect(selectStudentRoute).toHaveBeenCalledWith({
                accessToken: 'access-token',
                specializationKey: 'backend',
            });
        });

        expect(
            await screen.findByText(
                'Desarrollo Backend se guardó como tu ruta elegida.',
            ),
        ).toBeInTheDocument();
    });

    it('prevents selection when the current route cannot load', async () => {
        getCurrentStudentRoute.mockRejectedValue(
            new Error('Error al consultar la ruta'),
        );

        renderRouteDetail();

        expect(
            await screen.findByText('Error al consultar la ruta'),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'Seleccionar esta ruta',
            }),
        ).toBeDisabled();

        expect(selectStudentRoute).not.toHaveBeenCalled();
    });

    it('opens learning when Backend is already selected', async () => {
        const user = userEvent.setup();

        getCurrentStudentRoute.mockResolvedValue({
            state: 'selected',
            selection: {
                specializationKey: 'backend',
            },
        });

        renderRouteDetail();

        expect(
            await screen.findByText(
                'Esta es tu ruta seleccionada',
            ),
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole('button', {
                name: 'Comenzar esta ruta',
            }),
        );

        expect(
            screen.getByText('Inicio de aprendizaje'),
        ).toBeInTheDocument();

        expect(selectStudentRoute).not.toHaveBeenCalled();
    });

});
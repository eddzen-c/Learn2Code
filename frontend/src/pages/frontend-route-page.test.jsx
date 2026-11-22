
import {
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { AuthContext } from '../auth/auth-context.js';

import {
    getCurrentLearningPlan,
} from '../api/learning-paths.api.js';

import {
    getCurrentStudentRoute,
    selectStudentRoute,
} from '../api/student-routes.api.js';

import { FrontendRoutePage } from './FrontendRoutePage.jsx';

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
    ProfileTopbar: ({ searchValue, onSearchChange }) => (
        <header>
            <input
                aria-label="Buscar en la ruta Frontend"
                value={searchValue}
                onChange={(event) => {
                    onSearchChange(event.target.value);
                }}
            />
        </header>
    ),
}));

const renderFrontendRoute = () => render(
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
        <MemoryRouter initialEntries={['/routes/frontend']}>
            <FrontendRoutePage />
        </MemoryRouter>
    </AuthContext.Provider>,
);

describe('Ruta Frontend - pruebas independientes', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        getCurrentLearningPlan.mockResolvedValue({
            state: 'not_available',
            plan: null,
        });

        getCurrentStudentRoute.mockResolvedValue({
            state: 'not_selected',
            selection: null,
        });

        selectStudentRoute.mockResolvedValue({
            state: 'selected',
            selection: {
                specializationKey: 'frontend',
            },
        });
    });

    it('muestra la especialización Frontend y sus tecnologías', async () => {
        renderFrontendRoute();

        expect(
            screen.getByRole('heading', {
                name: 'Ruta Frontend',
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /Aprende a construir experiencias web/,
            ),
        ).toHaveTextContent(
            /HTML,\s*CSS,\s*JavaScript y React\./,
        );

        expect(
            screen.getByRole('img', {
                name: 'Ilustración de programación Frontend',
            }),
        ).toHaveAttribute(
            'src',
            '/images/rutas/detalles/frontend/ilustracion-frontend-original.webp',
        );

        await waitFor(() => {
            expect(getCurrentStudentRoute).toHaveBeenCalledWith(
                'access-token',
            );

            expect(getCurrentLearningPlan).toHaveBeenCalledWith(
                'access-token',
            );
        });
    });

    it('no inventa progreso cuando el usuario no ha elegido una ruta', async () => {
        renderFrontendRoute();

        expect(
            await screen.findByText(
                'Aún no has elegido una ruta',
            ),
        ).toBeInTheDocument();

        expect(
            screen.getAllByText('No disponible').length,
        ).toBeGreaterThan(0);

        expect(selectStudentRoute).not.toHaveBeenCalled();
    });

    it('muestra cuando el usuario ya eligió Backend', async () => {
        getCurrentStudentRoute.mockResolvedValue({
            state: 'selected',
            selection: {
                specializationKey: 'backend',
            },
        });

        renderFrontendRoute();

        expect(
            await screen.findByText(
                'Actualmente elegiste Backend',
            ),
        ).toBeInTheDocument();

        expect(selectStudentRoute).not.toHaveBeenCalled();
    });

    it('indica cuando Frontend es la especialización recomendada', async () => {
        getCurrentLearningPlan.mockResolvedValue({
            state: 'available',
            plan: {
                specializationKey: 'frontend',
                steps: [],
            },
        });

        renderFrontendRoute();

        expect(
            await screen.findByText(
                /Recomendada para ti según tu/,
            ),
        ).toBeInTheDocument();
    });

    it('permite buscar contenido de la especialización', async () => {
        const user = userEvent.setup();

        renderFrontendRoute();

        await user.type(
            screen.getByRole('textbox', {
                name: 'Buscar en la ruta Frontend',
            }),
            'Portafolio personal',
        );

        const results = screen.getByRole('region', {
            name: 'Resultados de búsqueda en Frontend',
        });

        expect(
            within(results).getByText('Portafolio personal'),
        ).toBeInTheDocument();
    });

    it('informa cuando no puede consultar la ruta seleccionada', async () => {
        getCurrentStudentRoute.mockRejectedValue(
            new Error('Error al consultar la ruta'),
        );

        renderFrontendRoute();

        expect(
            await screen.findByText('Estado no disponible'),
        ).toBeInTheDocument();

        expect(selectStudentRoute).not.toHaveBeenCalled();
    });


    it('no guarda Frontend cuando el usuario cancela la confirmación', async () => {
        const user = userEvent.setup();

        renderFrontendRoute();

        const selectButton = screen.getByRole('button', {
            name: 'Elegir Frontend',
        });

        await waitFor(() => {
            expect(selectButton).toBeEnabled();
        });

        await user.click(selectButton);

        expect(
            screen.getByText('¿Confirmas tu elección?'),
        ).toBeInTheDocument();

        expect(selectStudentRoute).not.toHaveBeenCalled();

        await user.click(
            screen.getByRole('button', {
                name: 'Cancelar',
            }),
        );

        expect(
            screen.queryByText('¿Confirmas tu elección?'),
        ).not.toBeInTheDocument();

        expect(selectStudentRoute).not.toHaveBeenCalled();
    });

    it('guarda Frontend únicamente después de confirmar la elección', async () => {
        const user = userEvent.setup();

        renderFrontendRoute();

        const selectButton = screen.getByRole('button', {
            name: 'Elegir Frontend',
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
            expect(selectStudentRoute).toHaveBeenCalledTimes(1);

            expect(selectStudentRoute).toHaveBeenCalledWith({
                accessToken: 'access-token',
                specializationKey: 'frontend',
            });
        });

        expect(
            await screen.findByText(
                '¡Frontend se guardó como tu ruta elegida!',
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'Frontend elegida',
            }),
        ).toBeDisabled();
    });

    it('muestra el error cuando el servidor rechaza guardar Frontend', async () => {
        const user = userEvent.setup();

        selectStudentRoute.mockRejectedValue(
            new Error('No se pudo guardar la ruta'),
        );

        renderFrontendRoute();

        const selectButton = screen.getByRole('button', {
            name: 'Elegir Frontend',
        });

        await waitFor(() => {
            expect(selectButton).toBeEnabled();
        });

        await user.click(selectButton);

        await user.click(
            screen.getByRole('button', {
                name: 'Confirmar elección',
            }),
        );

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent('No se pudo guardar la ruta');

        expect(selectStudentRoute).toHaveBeenCalledTimes(1);

        expect(
            screen.queryByText(
                '¡Frontend se guardó como tu ruta elegida!',
            ),
        ).not.toBeInTheDocument();
    });

});

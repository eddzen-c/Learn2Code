import {
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    getCurrentDiagnostic,
} from '../api/diagnostic.api.js';

import {
    getCurrentStudentOnboarding,
} from '../api/onboarding.api.js';

import {
    getCurrentLearningPlan,
} from '../api/learning-paths.api.js';

import {
    getCurrentStudentRoute,
    selectStudentRoute,
} from '../api/student-routes.api.js';

import { AuthContext } from '../auth/auth-context.js';
import { RoutesPage } from './RoutesPage.jsx';

vi.mock('../api/diagnostic.api.js', () => ({
    getCurrentDiagnostic: vi.fn(),
}));

vi.mock('../api/onboarding.api.js', () => ({
    getCurrentStudentOnboarding: vi.fn(),
}));

vi.mock('../api/learning-paths.api.js', () => ({
    getCurrentLearningPlan: vi.fn(),
}));

vi.mock('../api/student-routes.api.js', () => ({
    getCurrentStudentRoute: vi.fn(),
    selectStudentRoute: vi.fn(),
}));

function CurrentLocation() {
    const location = useLocation();
    return <output data-testid="current-route-location">{location.pathname}</output>;
}

const renderRoutesPage = () => {
    return render(
        <AuthContext.Provider
            value={{
                accessToken: 'access-token',
                user: {
                    fullName: 'Integration Student',
                    emailVerified: true,
                },
            }}
        >
            <MemoryRouter initialEntries={['/routes']}>
                <RoutesPage />
                <CurrentLocation />
            </MemoryRouter>
        </AuthContext.Provider>,
    );
};

const getRouteCard = (routeName) => {
    const title = routeName === 'DevOps'
        ? 'Ruta DevOps'
        : `Ruta ${routeName.replace(/^Desarrollo /, '')}`;

    return screen
        .getByRole('heading', { name: title })
        .closest('article');
};

const openRouteDetails = async (user, routeName) => {
    const card = getRouteCard(routeName);

    await user.click(
        within(card).getByRole('button', {
            name: /Seleccionar ruta|Cambiar selección/,
        }),
    );

    return card;
};

const waitForSelectionReady = async () => {
    await waitFor(() => {
        const backendCard = getRouteCard(
            'Desarrollo Backend',
        );

        expect(
            within(backendCard).getByRole('button', {
                name: 'Seleccionar ruta',
            }),
        ).toBeEnabled();
    });
};

describe('RoutesPage', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        getCurrentDiagnostic.mockResolvedValue({
            state: 'completed',
            result: {
                resultingDifficulty: {
                    name: 'Intermedio',
                },
                overallScore: 80,
            },
            questions: [
                {
                    topic: {
                        name: 'Lógica de programación',
                    },
                    response: {
                        status: 'evaluated',
                        score: 90,
                    },
                },
                {
                    topic: {
                        name: 'Bases de datos',
                    },
                    response: {
                        status: 'evaluated',
                        score: 40,
                    },
                },
            ],
        });

        getCurrentStudentOnboarding.mockResolvedValue({
            state: 'completed',
            onboarding: {
                learningGoal: 'career_preparation',
            },
        });

        getCurrentLearningPlan.mockResolvedValue({
            state: 'recommended',
            plan: {
                specializationKey: 'frontend',
            },
        });

        getCurrentStudentRoute.mockResolvedValue({
            state: 'not_selected',
            selection: null,
        });
    });

    it('shows real diagnostic and onboarding information', async () => {
        renderRoutesPage();

        const summary = screen.getByRole('region', {
            name: 'Resumen de tu diagnóstico',
        });

        expect(
            await within(summary).findByText(
                'Tu diagnóstico completado',
            ),
        ).toBeInTheDocument();

        expect(
            within(summary).getByText('Intermedio'),
        ).toBeInTheDocument();

        expect(
            within(summary).getByText('Lógica de programación'),
        ).toBeInTheDocument();

        expect(
            within(summary).queryByText('Bases de datos'),
        ).not.toBeInTheDocument();

        expect(
            await within(summary).findByText(
                'Conseguir trabajo como desarrollador',
            ),
        ).toBeInTheDocument();

        expect(
            within(summary).getByRole('link', {
                name: /Ver detalle del diagnóstico/,
            }),
        ).toHaveAttribute(
            'href',
            '/diagnostic/results',
        );

        expect(selectStudentRoute).not.toHaveBeenCalled();
    });

    it('links directly to each specialization detail', () => {
        renderRoutesPage();

        const destinations = [
            ['Desarrollo Frontend', '/routes/frontend'],
            ['Desarrollo Backend', '/routes/backend'],
            ['Desarrollo Full Stack', '/routes/fullstack'],
            ['DevOps', '/routes/devops'],
        ];

        destinations.forEach(([name, path]) => {
            const card = getRouteCard(name);

            expect(
                within(card).getByRole('link', {
                    name: 'Ver ruta',
                }),
            ).toHaveAttribute('href', path);
        });

        expect(
            screen.queryByText('Abrir página completa'),
        ).not.toBeInTheDocument();

        expect(selectStudentRoute).not.toHaveBeenCalled();
    });

    it('filters routes using only the shared topbar search', async () => {
        const user = userEvent.setup();

        renderRoutesPage();

        const searchboxes = screen.getAllByRole('searchbox');

        expect(searchboxes).toHaveLength(1);

        const searchbox = searchboxes[0];

        await user.type(searchbox, 'MongoDB');

        expect(
            screen.getByRole('heading', {
                name: 'Ruta Backend',
            }),
        ).toBeInTheDocument();

        expect(
            screen.queryByRole('heading', {
                name: 'Ruta Frontend',
            }),
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole('heading', {
                name: 'Ruta Full Stack',
            }),
        ).not.toBeInTheDocument();

        await user.clear(searchbox);

        expect(
            screen.getByRole('heading', {
                name: 'Ruta Frontend',
            }),
        ).toBeInTheDocument();
    });

    it('allows exploring routes without selecting one', async () => {
        const user = userEvent.setup();

        renderRoutesPage();

        await waitForSelectionReady();

        const backendCard = await openRouteDetails(
            user,
            'Desarrollo Backend',
        );

        expect(
            within(backendCard).getByText(
                /Consultar una ruta no la selecciona automáticamente/,
            ),
        ).toBeInTheDocument();

        expect(selectStudentRoute).not.toHaveBeenCalled();
    });

    it('selects Backend only after explicit confirmation', async () => {
        const user = userEvent.setup();

        selectStudentRoute.mockResolvedValue({
            state: 'selected',
            selection: {
                specializationKey: 'backend',
            },
        });

        renderRoutesPage();

        await waitForSelectionReady();

        const backendCard = await openRouteDetails(
            user,
            'Desarrollo Backend',
        );

        await user.click(
            within(backendCard).getByRole('button', {
                name: 'Seleccionar ruta',
            }),
        );

        expect(selectStudentRoute).not.toHaveBeenCalled();

        expect(
            within(backendCard).getByText(
                '¿Confirmas tu elección?',
            ),
        ).toBeInTheDocument();

        await user.click(
            within(backendCard).getByRole('button', {
                name: 'Confirmar elección',
            }),
        );

        expect(selectStudentRoute).toHaveBeenCalledWith({
            accessToken: 'access-token',
            specializationKey: 'backend',
        });

        expect(selectStudentRoute).toHaveBeenCalledTimes(1);
        await waitFor(() => {
            expect(screen.getByTestId('current-route-location'))
                .toHaveTextContent('/exercises/specializations/backend');
        });

        expect(
            await within(
                getRouteCard('Desarrollo Backend'),
            ).findByText('Tu ruta elegida'),
        ).toBeInTheDocument();

        expect(
            within(backendCard).getByText('Tu ruta elegida'),
        ).toBeInTheDocument();
    });

    it('cancels Full Stack selection without saving', async () => {
        const user = userEvent.setup();

        renderRoutesPage();

        await waitForSelectionReady();

        const fullStackCard = await openRouteDetails(
            user,
            'Desarrollo Full Stack',
        );

        await user.click(
            within(fullStackCard).getByRole('button', {
                name: 'Seleccionar ruta',
            }),
        );

        expect(
            within(fullStackCard).getByRole('button', {
                name: 'Confirmar elección',
            }),
        ).toBeInTheDocument();

        await user.click(
            within(fullStackCard).getByRole('button', {
                name: 'Cancelar',
            }),
        );

        expect(selectStudentRoute).not.toHaveBeenCalled();

        expect(
            within(fullStackCard).getByRole('button', {
                name: 'Seleccionar ruta',
            }),
        ).toBeEnabled();
    });

    it('allows selecting DevOps', async () => {
        const user = userEvent.setup();

        selectStudentRoute.mockResolvedValue({
            state: 'selected',
            selection: {
                specializationKey: 'devops',
            },
        });

        renderRoutesPage();

        await waitForSelectionReady();

        const devopsCard = await openRouteDetails(
            user,
            'DevOps',
        );

        await user.click(
            within(devopsCard).getByRole('button', {
                name: 'Seleccionar ruta',
            }),
        );

        await user.click(
            within(devopsCard).getByRole('button', {
                name: 'Confirmar elección',
            }),
        );

        expect(selectStudentRoute).toHaveBeenCalledWith({
            accessToken: 'access-token',
            specializationKey: 'devops',
        });

        expect(
            await within(
                getRouteCard('DevOps'),
            ).findByText('Tu ruta elegida'),
        ).toBeInTheDocument();

        expect(
            within(devopsCard).getByText('Tu ruta elegida'),
        ).toBeInTheDocument();
    });

    it('separates the saved selection from the recommendation', async () => {
        getCurrentStudentRoute.mockResolvedValue({
            state: 'selected',
            selection: {
                specializationKey: 'backend',
            },
        });

        renderRoutesPage();

        expect(
            await within(
                getRouteCard('Desarrollo Backend'),
            ).findByText('Tu ruta elegida'),
        ).toBeInTheDocument();

        const frontendCard = getRouteCard(
            'Desarrollo Frontend',
        );

        const backendCard = getRouteCard(
            'Desarrollo Backend',
        );

        expect(
            within(frontendCard).getByText(
                'Recomendada para ti',
            ),
        ).toBeInTheDocument();

        expect(
            within(backendCard).getByText('Tu ruta elegida'),
        ).toBeInTheDocument();

        expect(selectStudentRoute).not.toHaveBeenCalled();
    });

    it('combines the recommended and selected badges', async () => {
        getCurrentStudentRoute.mockResolvedValue({
            state: 'selected',
            selection: {
                specializationKey: 'frontend',
            },
        });

        renderRoutesPage();

        const frontendCard = getRouteCard('Desarrollo Frontend');

        expect(
            await within(frontendCard).findByText(
                'Recomendada y elegida',
            ),
        ).toBeInTheDocument();

        expect(
            within(frontendCard).queryByText('Recomendada para ti'),
        ).not.toBeInTheDocument();

        expect(
            within(frontendCard).queryByText('Tu ruta elegida'),
        ).not.toBeInTheDocument();
    });

    it('selects Frontend from the catalog after confirmation', async () => {
        const user = userEvent.setup();

        selectStudentRoute.mockResolvedValue({
            state: 'selected',
            selection: {
                specializationKey: 'frontend',
            },
        });

        renderRoutesPage();

        await waitForSelectionReady();

        const frontendCard = getRouteCard(
            'Desarrollo Frontend',
        );

        await user.click(
            within(frontendCard).getByRole('button', {
                name: 'Seleccionar ruta',
            }),
        );

        expect(selectStudentRoute).not.toHaveBeenCalled();

        await user.click(
            within(frontendCard).getByRole('button', {
                name: 'Confirmar elección',
            }),
        );

        expect(selectStudentRoute).toHaveBeenCalledWith({
            accessToken: 'access-token',
            specializationKey: 'frontend',
        });

        expect(
            await within(frontendCard).findByText(
                'Recomendada y elegida',
            ),
        ).toBeInTheDocument();
    });

    it('shows saving errors and permits retrying', async () => {
        const user = userEvent.setup();

        selectStudentRoute
            .mockRejectedValueOnce(
                new Error('No fue posible guardar la ruta'),
            )
            .mockResolvedValueOnce({
                state: 'selected',
                selection: {
                    specializationKey: 'backend',
                },
            });

        renderRoutesPage();

        await waitForSelectionReady();

        const backendCard = await openRouteDetails(
            user,
            'Desarrollo Backend',
        );

        await user.click(
            within(backendCard).getByRole('button', {
                name: 'Seleccionar ruta',
            }),
        );

        await user.click(
            within(backendCard).getByRole('button', {
                name: 'Confirmar elección',
            }),
        );

        expect(
            await within(backendCard).findByRole('alert'),
        ).toHaveTextContent(
            'No fue posible guardar la ruta',
        );

        expect(
            within(backendCard).getByRole('button', {
                name: 'Confirmar elección',
            }),
        ).toBeEnabled();

        await user.click(
            within(backendCard).getByRole('button', {
                name: 'Confirmar elección',
            }),
        );

        expect(
            await within(
                getRouteCard('Desarrollo Backend'),
            ).findByText('Tu ruta elegida'),
        ).toBeInTheDocument();

        expect(selectStudentRoute).toHaveBeenCalledTimes(2);
    });
});
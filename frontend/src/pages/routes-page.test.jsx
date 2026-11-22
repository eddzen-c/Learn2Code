import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    getCurrentLearningPlan,
} from '../api/learning-paths.api.js';

import {
    getCurrentStudentRoute,
    selectStudentRoute,
} from '../api/student-routes.api.js';

import { AuthContext } from '../auth/auth-context.js';
import { RoutesPage } from './RoutesPage.jsx';

vi.mock('../api/learning-paths.api.js', () => ({
    getCurrentLearningPlan: vi.fn(),
}));

vi.mock('../api/student-routes.api.js', () => ({
    getCurrentStudentRoute: vi.fn(),
    selectStudentRoute: vi.fn(),
}));

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
            </MemoryRouter>
        </AuthContext.Provider>,
    );
};

const getRouteCard = (routeName) => {
    return screen
        .getByRole('heading', { name: routeName })
        .closest('article');
};

const openRouteDetails = async (user, routeName) => {
    const card = getRouteCard(routeName);

    await user.click(
        within(card).getByRole('button', {
            name: 'Conocer esta ruta',
        }),
    );

    return card;
};

describe('RoutesPage', () => {
    beforeEach(() => {
        vi.resetAllMocks();

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

    it('allows exploring routes without selecting one', async () => {
        const user = userEvent.setup();

        renderRoutesPage();

        expect(
            await screen.findByText(
                /Aún no has elegido una especialización/,
            ),
        ).toBeInTheDocument();

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

        await screen.findByText(
            /Aún no has elegido una especialización/,
        );

        const backendCard = await openRouteDetails(
            user,
            'Desarrollo Backend',
        );

        await user.click(
            within(backendCard).getByRole('button', {
                name: 'Elegir Desarrollo Backend',
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

        expect(
            await screen.findByText(
                /Actualmente elegiste Desarrollo Backend/,
            ),
        ).toBeInTheDocument();

        expect(
            within(backendCard).getByText('Tu ruta elegida'),
        ).toBeInTheDocument();
    });

    it('cancels Full Stack selection without saving', async () => {
        const user = userEvent.setup();

        renderRoutesPage();

        await screen.findByText(
            /Aún no has elegido una especialización/,
        );

        const fullStackCard = await openRouteDetails(
            user,
            'Desarrollo Full Stack',
        );

        await user.click(
            within(fullStackCard).getByRole('button', {
                name: 'Elegir Desarrollo Full Stack',
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
                name: 'Elegir Desarrollo Full Stack',
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

        await screen.findByText(
            /Aún no has elegido una especialización/,
        );

        const devopsCard = await openRouteDetails(
            user,
            'DevOps',
        );

        await user.click(
            within(devopsCard).getByRole('button', {
                name: 'Elegir DevOps',
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
            await screen.findByText(
                /Actualmente elegiste DevOps/,
            ),
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
            await screen.findByText(
                /Actualmente elegiste Desarrollo Backend/,
            ),
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

        await screen.findByText(
            /Aún no has elegido una especialización/,
        );

        const backendCard = await openRouteDetails(
            user,
            'Desarrollo Backend',
        );

        await user.click(
            within(backendCard).getByRole('button', {
                name: 'Elegir Desarrollo Backend',
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
            await screen.findByText(
                /Actualmente elegiste Desarrollo Backend/,
            ),
        ).toBeInTheDocument();

        expect(selectStudentRoute).toHaveBeenCalledTimes(2);
    });
});
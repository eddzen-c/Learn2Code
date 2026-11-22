
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    render,
    screen,
} from '@testing-library/react'

import { MemoryRouter } from 'react-router-dom'

import {
    AuthContext,
} from '../auth/auth-context.js'

import {
    getCurrentStudentOnboarding,
} from '../api/onboarding.api.js'

import {
    getCurrentDiagnostic,
} from '../api/diagnostic.api.js'

import {
    getCurrentStudentRoute,
} from '../api/student-routes.api.js'

import {
    getCurrentLearningPlan,
} from '../api/learning-paths.api.js'

import {
    ProfileLearning,
} from './ProfileLearning.jsx'

vi.mock('../api/onboarding.api.js', () => ({
    getCurrentStudentOnboarding: vi.fn(),
}))

vi.mock('../api/diagnostic.api.js', () => ({
    getCurrentDiagnostic: vi.fn(),
}))

vi.mock('../api/student-routes.api.js', () => ({
    getCurrentStudentRoute: vi.fn(),
}))

vi.mock('../api/learning-paths.api.js', () => ({
    getCurrentLearningPlan: vi.fn(),
}))

function renderLearning() {
    return render(
        <AuthContext.Provider
            value={{
                accessToken: 'test-access-token',
            }}
        >
            <MemoryRouter>
                <ProfileLearning />
            </MemoryRouter>
        </AuthContext.Provider>,
    )
}

describe('ProfileLearning', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('displays real onboarding, diagnostic and route data', async () => {
        getCurrentStudentOnboarding.mockResolvedValue({
            state: 'completed',
            onboarding: {
                learningGoal: 'career_preparation',
                weeklyTimeCommitment: 'ten_to_twenty',
                learningStyle: 'practical',
                technologyInterestKeys: [
                    'javascript',
                    'react',
                    'nodejs',
                ],
                language: {
                    name: 'JavaScript',
                },
                projectIdea: 'Una plataforma educativa',
            },
        })

        getCurrentDiagnostic.mockResolvedValue({
            state: 'completed',
            result: {
                overallScore: 85,
                resultingDifficulty: {
                    name: 'Intermedio',
                },
            },
        })

        getCurrentStudentRoute.mockResolvedValue({
            state: 'selected',
            selection: {
                specializationKey: 'frontend',
            },
        })

        getCurrentLearningPlan.mockResolvedValue({
            state: 'generated',
            plan: {
                specializationKey: 'backend',
            },
        })

        renderLearning()

        expect(
            await screen.findByText('Ruta Frontend'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Node.js'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('React'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('85%'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Intermedio'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Backend'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Una plataforma educativa'),
        ).toBeInTheDocument()

        expect(
            getCurrentStudentOnboarding,
        ).toHaveBeenCalledWith('test-access-token')

        expect(
            getCurrentStudentRoute,
        ).toHaveBeenCalledWith('test-access-token')
    })

    it('offers onboarding when learning preferences are missing', async () => {
        getCurrentStudentOnboarding.mockResolvedValue({
            state: 'pending',
            onboarding: null,
        })

        getCurrentDiagnostic.mockResolvedValue({
            state: 'not_started',
            result: null,
        })

        getCurrentStudentRoute.mockResolvedValue({
            state: 'not_selected',
            selection: null,
        })

        getCurrentLearningPlan.mockResolvedValue({
            state: 'not_generated',
            plan: null,
        })

        renderLearning()

        expect(
            await screen.findByRole('heading', {
                name: 'Personaliza tu aprendizaje',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: /Completar «Acerca de ti»/,
            }),
        ).toHaveAttribute('href', '/onboarding')

        expect(
            screen.queryByText('Crear mis propios proyectos'),
        ).not.toBeInTheDocument()
    })

    it('does not invent progress when no data exists', async () => {
        getCurrentStudentOnboarding.mockResolvedValue({
            state: 'pending',
            onboarding: null,
        })

        getCurrentDiagnostic.mockResolvedValue({
            state: 'not_started',
            result: null,
        })

        getCurrentStudentRoute.mockResolvedValue({
            state: 'not_selected',
            selection: null,
        })

        getCurrentLearningPlan.mockResolvedValue({
            state: 'not_generated',
            plan: null,
        })

        renderLearning()

        expect(
            await screen.findByText('Ninguna ruta elegida'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Todavía no hay un plan generado.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Pendiente'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: /Explorar rutas/,
            }),
        ).toHaveAttribute('href', '/routes')
    })
})

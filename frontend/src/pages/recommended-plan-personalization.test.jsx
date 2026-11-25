import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../auth/auth-context.js'
import { getCurrentDiagnostic } from '../api/diagnostic.api.js'
import { getCurrentStudentOnboarding } from '../api/onboarding.api.js'
import { getCurrentLearningPlan } from '../api/learning-paths.api.js'
import { getAcademicCatalog } from '../api/exercise.api.js'
import { RecommendedPlanPage } from './RecommendedPlanPage.jsx'

vi.mock('../api/diagnostic.api.js', () => ({
    getCurrentDiagnostic: vi.fn(),
}))
vi.mock('../api/onboarding.api.js', () => ({
    getCurrentStudentOnboarding: vi.fn(),
}))
vi.mock('../api/learning-paths.api.js', () => ({
    getCurrentLearningPlan: vi.fn(),
    generateLearningPlan: vi.fn(),
}))
vi.mock('../api/exercise.api.js', () => ({
    getAcademicCatalog: vi.fn(),
}))

const renderPlan = () => render(
    <AuthContext.Provider value={{
        accessToken: 'token',
        user: { fullName: 'Estudiante de prueba' },
        signOut: vi.fn(),
    }}>
        <MemoryRouter><RecommendedPlanPage standalone /></MemoryRouter>
    </AuthContext.Provider>,
)

describe('Plan recomendado: siguiente unidad según desempeño', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        getCurrentDiagnostic.mockResolvedValue({
            state: 'completed',
            result: {
                resultingDifficulty: { name: 'Intermedio' },
                overallScore: 67,
            },
            assessment: { questionCount: 12 },
        })
        getCurrentStudentOnboarding.mockResolvedValue({
            state: 'completed',
            onboarding: {
                learningGoal: 'web_development',
                weeklyTimeCommitment: 'five_to_ten',
                language: { name: 'JavaScript' },
            },
        })
        getCurrentLearningPlan.mockResolvedValue({
            state: 'generated',
            plan: {
                title: 'Desarrollo Frontend',
                specializationKey: 'frontend',
                reason: 'Por tus intereses y resultados.',
                estimatedWeeks: 12,
                steps: [{ id: 'one', title: 'Conceptos básicos', description: 'Bases.' }],
            },
        })
        getAcademicCatalog.mockResolvedValue({
            personalization: { status: 'personalized' },
            specializations: [{
                key: 'frontend',
                name: 'Desarrollo Frontend',
                stages: [{
                    modules: [{
                        title: 'JavaScript',
                        units: [{
                            id: 'unidad-personal',
                            title: 'Practicar funciones',
                            personalization: {
                                recommended: true,
                                message: 'Reforzar por dominio registrado.',
                            },
                        }],
                    }],
                }],
            }],
        })
    })

    it('muestra la unidad recomendada con enlace individual', async () => {
        renderPlan()
        expect(await screen.findByRole('link', {
            name: /Abrir unidad recomendada/,
        })).toHaveAttribute('href', '/exercises/units/unidad-personal')
        expect(screen.getByText('Practicar funciones')).toBeInTheDocument()
        expect(screen.getByText('Reforzar por dominio registrado.'))
            .toBeInTheDocument()
        expect(getAcademicCatalog).toHaveBeenCalledWith('token')
    })

    it('sin recomendación no inventa una siguiente unidad', async () => {
        getAcademicCatalog.mockResolvedValue({
            personalization: { status: 'personalized' },
            specializations: [],
        })
        renderPlan()
        expect(await screen.findByText(
            'Consulta las unidades académicas disponibles para continuar.',
        )).toBeInTheDocument()
        expect(screen.queryByRole('link', {
            name: /Abrir unidad recomendada/,
        })).not.toBeInTheDocument()
    })
})

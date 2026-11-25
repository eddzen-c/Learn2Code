import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAcademicCatalog } from '../api/exercise.api.js'
import { AuthContext } from '../auth/auth-context.js'
import { AcademicSpecializationPage } from './AcademicSpecializationPage.jsx'

vi.mock('../api/exercise.api.js', () => ({
    getAcademicCatalog: vi.fn(),
}))

const catalogo = {
    specializations: [
        {
            key: 'fullstack',
            name: 'Desarrollo Full Stack',
            description: 'Aplicaciones de extremo a extremo.',
            stages: [
                {
                    id: 'stage-1',
                    position: 1,
                    title: 'Frontend Avanzado',
                    description: 'Interfaces con JavaScript.',
                    status: 'published',
                    modules: [{
                        id: 'module-1',
                        title: 'Procesamiento de datos',
                        units: [{
                            id: 'unit-1',
                            title: 'Listas y cálculos',
                        }],
                    }],
                },
                {
                    id: 'stage-2',
                    position: 2,
                    title: 'Integración Full Stack',
                    status: 'planned',
                    modules: [],
                },
            ],
        },
    ],
}

function renderSpecialization(
    path = '/exercises/specializations/fullstack',
) {
    return render(
        <AuthContext.Provider
            value={{
                accessToken: 'token',
                user: { fullName: 'Estudiante Learn2Code' },
                signOut: vi.fn(),
            }}
        >
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route
                        path="/exercises/specializations/:specializationKey"
                        element={<AcademicSpecializationPage />}
                    />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>,
    )
}

describe('AcademicSpecializationPage', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        getAcademicCatalog.mockResolvedValue(catalogo)
    })

    it('muestra las etapas y los conteos reales dentro de Ejercicios', async () => {
        renderSpecialization()

        expect(
            await screen.findByRole('heading', {
                name: 'Desarrollo Full Stack',
                level: 1,
            }),
        ).toBeInTheDocument()

        expect(screen.getByText('2 etapas')).toBeInTheDocument()
        expect(screen.getAllByText('1 módulo registrado')).toHaveLength(2)
        expect(screen.getByText('1 unidad registrada')).toBeInTheDocument()

        const panel = screen.getByRole('region', {
            name: 'Etapas de la especialización',
        })

        expect(
            within(panel).getByRole('link', {
                name: /Frontend Avanzado/,
            }),
        ).toHaveAttribute('href', '/exercises/stages/stage-1')

        expect(
            within(panel).getByRole('link', {
                name: /Integración Full Stack/,
            }),
        ).toHaveAttribute('href', '/exercises/stages/stage-2')

        expect(
            within(panel).getByText('En preparación'),
        ).toBeInTheDocument()

        expect(screen.queryByText('60%')).not.toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Volver a ejercicios' }),
        ).toHaveAttribute('href', '/exercises')
    })

    it('no inventa una especialización inexistente', async () => {
        renderSpecialization('/exercises/specializations/desconocida')

        expect(
            await screen.findByText(
                'Esta especialización no está disponible.',
            ),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('link', { name: /Frontend Avanzado/ }),
        ).not.toBeInTheDocument()
    })

    it('informa errores de consulta sin mostrar datos de ejemplo', async () => {
        getAcademicCatalog.mockRejectedValue(new Error('Sin conexión'))
        renderSpecialization()

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No fue posible consultar la especialización.',
        )
        expect(
            screen.queryByRole('link', { name: /Frontend Avanzado/ }),
        ).not.toBeInTheDocument()
    })

    it('descarta una respuesta de catálogo inválida', async () => {
        getAcademicCatalog.mockResolvedValue({ specializations: null })
        renderSpecialization()

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No fue posible consultar la especialización.',
        )
    })
})

describe('AcademicSpecializationPage - recorrido personalizado', () => {
    it('destaca una etapa recomendada para un estudiante con diagnóstico', async () => {
        getAcademicCatalog.mockResolvedValue({
            ...catalogo,
            personalization: {
                status: 'personalized',
                difficulty: { id: 2, name: 'intermedio' },
            },
            specializations: catalogo.specializations.map((specialization) => ({
                ...specialization,
                personalization: { recommendedStageId: 'stage-1' },
                stages: specialization.stages.map((stage) => ({
                    ...stage,
                    personalization: { recommended: stage.id === 'stage-1' },
                })),
            })),
        })
        renderSpecialization()

        expect(await screen.findByText('Recomendado para ti')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Ir a mi etapa recomendada/ }))
            .toHaveAttribute('href', '/exercises/stages/stage-1')
        expect(screen.getByText('intermedio')).toBeInTheDocument()
    })
})

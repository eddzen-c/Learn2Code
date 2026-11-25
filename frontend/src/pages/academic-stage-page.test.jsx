
import {
    render,
    screen,
} from '@testing-library/react'

import {
    MemoryRouter,
    Route,
    Routes,
} from 'react-router-dom'

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    getAcademicCatalog,
} from '../api/exercise.api.js'

import {
    AuthContext,
} from '../auth/auth-context.js'

import {
    AcademicStagePage,
} from './AcademicStagePage.jsx'

vi.mock('../api/exercise.api.js', () => ({
    getAcademicCatalog: vi.fn(),
}))

const catalogo = {
    specializations: [
        {
            key: 'frontend',
            name: 'Desarrollo Frontend',
            stages: [
                {
                    id: '10',
                    title: 'Fundamentos Web',
                    status: 'planned',
                    modules: [],
                },
                {
                    id: '11',
                    title: 'HTML y CSS',
                    status: 'published',
                    modules: [
                        {
                            id: 'module-1',
                            title: 'HTML',
                            description: 'Estructura web',
                            units: [
                                {
                                    id: 'unit-1',
                                    title: 'Elementos HTML',
                                    description: 'Etiquetas y contenido',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
}

const renderStage = (
    path = '/exercises/stages/10',
) => render(
    <AuthContext.Provider
        value={{
            accessToken: 'access-token',
            user: {
                fullName: 'Estudiante Learn2Code',
                emailVerified: true,
            },
            signOut: vi.fn(),
        }}
    >
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route
                    path="/exercises/stages/:stageId"
                    element={<AcademicStagePage />}
                />
            </Routes>
        </MemoryRouter>
    </AuthContext.Provider>,
)

describe('AcademicStagePage', () => {
    beforeEach(() => {
        vi.resetAllMocks()

        getAcademicCatalog.mockResolvedValue(catalogo)
    })

    it('muestra una etapa en preparación sin inventar módulos', async () => {
        renderStage()

        expect(
            await screen.findByRole('heading', {
                name: 'Fundamentos Web',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('En preparación'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Todavía no hay módulos publicados',
            ),
        ).toBeInTheDocument()

        expect(
            getAcademicCatalog,
        ).toHaveBeenCalledWith('access-token')
    })

    it('muestra módulos y unidades publicados', async () => {
        renderStage('/exercises/stages/11')

        expect(
            await screen.findByRole('heading', {
                name: 'HTML y CSS',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: 'HTML',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Elementos HTML'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Etiquetas y contenido'),
        ).toBeInTheDocument()
    })

    it('rechaza una etapa inexistente', async () => {
        renderStage('/exercises/stages/999')

        expect(
            await screen.findByText(
                'La etapa solicitada no está disponible.',
            ),
        ).toBeInTheDocument()
    })

    it('muestra un error si la API falla', async () => {
        getAcademicCatalog.mockRejectedValue(
            new Error('Servicio no disponible'),
        )

        renderStage()

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No fue posible consultar la etapa',
        )
    })

    it('permite navegar desde una etapa hacia su unidad publicada', async () => {
        renderStage('/exercises/stages/11')

        expect(
            await screen.findByRole('link', {
                name: 'Elementos HTML',
            }),
        ).toHaveAttribute(
            'href',
            '/exercises/units/unit-1',
        )
    })

    it('permite abrir el módulo desde la etapa', async () => {
        renderStage('/exercises/stages/11')

        const enlace = await screen.findByRole('link', {
            name: 'Abrir módulo: HTML',
        })

        expect(enlace).toHaveAttribute(
            'href',
            '/exercises/modules/module-1',
        )
    })
})

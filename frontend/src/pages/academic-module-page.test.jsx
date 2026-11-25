
import { render, screen } from '@testing-library/react'
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

import { getAcademicCatalog } from '../api/exercise.api.js'
import { AuthContext } from '../auth/auth-context.js'
import { AcademicModulePage } from './AcademicModulePage.jsx'

vi.mock('../api/exercise.api.js', () => ({
    getAcademicCatalog: vi.fn(),
}))

const catalogo = {
    specializations: [
        {
            key: 'fullstack',
            name: 'Desarrollo Full Stack',
            stages: [
                {
                    id: 11,
                    title: 'Frontend Avanzado',
                    modules: [
                        {
                            id: 'module-1',
                            title: 'Procesamiento de datos',
                            description: 'Practica con JavaScript.',
                            units: [
                                {
                                    id: 'unit-1',
                                    title: 'Listas y cálculos',
                                    description: 'Procesa arreglos.',
                                },
                            ],
                        },
                        {
                            id: 'module-2',
                            title: 'Componentes avanzados',
                            description: 'Contenido en preparación.',
                            units: [],
                        },
                    ],
                },
            ],
        },
    ],
}

function renderModule(
    path = '/exercises/modules/module-1',
) {
    return render(
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
                        path="/exercises/modules/:moduleId"
                        element={<AcademicModulePage />}
                    />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>,
    )
}

describe('AcademicModulePage', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        getAcademicCatalog.mockResolvedValue(catalogo)
    })

    it('muestra el módulo publicado con datos reales', async () => {
        renderModule()

        expect(
            await screen.findByRole('heading', {
                name: 'Procesamiento de datos',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('1 tema publicado'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Procesa arreglos.'),
        ).toBeInTheDocument()

        expect(
            getAcademicCatalog,
        ).toHaveBeenCalledWith('access-token')
    })

    it('permite acceder a la unidad y regresar a la etapa', async () => {
        renderModule()

        const enlace = await screen.findByRole('link', {
            name: 'Abrir tema: Listas y cálculos',
        })

        expect(enlace).toHaveAttribute(
            'href',
            '/exercises/units/unit-1',
        )

        expect(
            screen.getByRole('link', {
                name: 'Volver a la etapa',
            }),
        ).toHaveAttribute(
            'href',
            '/exercises/stages/11',
        )
    })

    it('no inventa temas en módulos vacíos', async () => {
        renderModule('/exercises/modules/module-2')

        expect(
            await screen.findByText(
                'Todavía no hay temas publicados',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText('0 temas publicados'),
        ).toBeInTheDocument()

        expect(
            screen.queryByText('Listas y cálculos'),
        ).not.toBeInTheDocument()
    })

    it('rechaza módulos inexistentes', async () => {
        renderModule('/exercises/modules/no-existe')

        expect(
            await screen.findByText('Módulo no disponible'),
        ).toBeInTheDocument()
    })

    it('informa cuando la API falla', async () => {
        getAcademicCatalog.mockRejectedValue(
            new Error('Servicio no disponible'),
        )

        renderModule()

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No fue posible consultar el módulo',
        )
    })
})

describe('AcademicModulePage - temas según dominio', () => {
    it('identifica los temas prioritarios con el dominio registrado', async () => {
        getAcademicCatalog.mockResolvedValue({
            specializations: catalogo.specializations.map((specialization) => ({
                ...specialization,
                stages: specialization.stages.map((stage) => ({
                    ...stage,
                    modules: stage.modules.map((mod) => ({
                        ...mod,
                        units: mod.units.map((unit) => ({
                            ...unit,
                            personalization: {
                                recommended: true,
                                state: 'reinforce',
                                mastery: 32,
                                message: 'Tu desempeño en este tema sugiere reforzar sus fundamentos.',
                            },
                        })),
                    })),
                })),
            })),
        })

        renderModule()
        expect(await screen.findByText('Recomendado para ti')).toBeInTheDocument()
        expect(screen.getByText(
            'Tu desempeño en este tema sugiere reforzar sus fundamentos.',
        )).toBeInTheDocument()
    })
})

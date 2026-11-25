
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import {
    MemoryRouter,
} from 'react-router-dom'

import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    PanelEnunciado,
} from './ResolverEjercicioPage.jsx'

describe('PanelEnunciado', () => {
    it('muestra el enunciado real del ejercicio', () => {
        render(
            <MemoryRouter>
                <PanelEnunciado
                    ejercicio={{
                        enunciado: 'Filtra los productos disponibles.',
                        requisitos: [
                            'Devuelve un arreglo nuevo.',
                        ],
                        entrada: '[1, 2]',
                        salida: '[2]',
                    }}
                    intentos={[]}
                    onPedirPista={vi.fn()}
                />
            </MemoryRouter>,
        )

        expect(
            screen.getByText(
                'Filtra los productos disponibles.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Devuelve un arreglo nuevo.'),
        ).toBeInTheDocument()
    })

    it('permite copiar los ejemplos públicos desde botones accesibles', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText },
        })

        render(
            <MemoryRouter>
                <PanelEnunciado
                    ejercicio={{
                        enunciado: 'Normaliza un método HTTP.',
                        requisitos: ['Solo JSON.'],
                        entrada: '"get"',
                        salida: '{"metodo":"GET","lectura":true}',
                    }}
                    intentos={[]}
                    onPedirPista={vi.fn()}
                    modoReal
                    recursos={[]}
                />
            </MemoryRouter>,
        )

        const copiarEntrada = screen.getByRole('button', {
            name: 'Copiar entrada',
        })
        const copiarSalida = screen.getByRole('button', {
            name: 'Copiar salida',
        })

        expect(copiarEntrada.closest('.resolver-ejemplo-codigo'))
            .toBeInTheDocument()
        expect(copiarSalida.closest('.resolver-ejemplo-codigo'))
            .toBeInTheDocument()

        fireEvent.click(copiarEntrada)
        await waitFor(() => {
            expect(writeText).toHaveBeenCalledWith('"get"')
        })

        fireEvent.click(copiarSalida)
        await waitFor(() => {
            expect(writeText).toHaveBeenCalledWith(
                '{"metodo":"GET","lectura":true}',
            )
        })
    })

    it('informa cuando no hay ejemplos públicos', () => {
        render(
            <MemoryRouter>
                <PanelEnunciado
                    ejercicio={{
                        enunciado: 'Resuelve el ejercicio.',
                        requisitos: [],
                        entrada: null,
                        salida: null,
                    }}
                    intentos={[]}
                    onPedirPista={vi.fn()}
                />
            </MemoryRouter>,
        )

        expect(
            screen.getByText(
                'No hay ejemplos públicos disponibles para este ejercicio.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('heading', {
                name: 'Requisitos',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: 'Copiar entrada',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: 'Copiar salida',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText('Entrada'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText('Salida esperada'),
        ).not.toBeInTheDocument()
    })
})

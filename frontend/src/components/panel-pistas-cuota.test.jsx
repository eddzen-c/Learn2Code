import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PanelPistasEjercicio } from './PanelPistasEjercicio.jsx'

describe('PanelPistasEjercicio question limit', () => {
    it('shows the server quota and blocks the 31st chat question', async () => {
        const consultar = vi.fn()
        const getQuota = vi.fn().mockResolvedValue({ used: 30, limit: 30 })

        render(
            <PanelPistasEjercicio
                abierto
                alCerrar={vi.fn()}
                modoReal
                pistas={[]}
                tituloEjercicio="Filtrar productos"
                onConsultarIA={consultar}
                onConsultarCuota={getQuota}
            />,
        )

        expect(await screen.findByText('30/30')).toBeInTheDocument()
        expect(screen.getByText('30/30').closest('.pistas-panel__cabecera'))
            .toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }))
            .toBeDisabled()
        expect(screen.getByRole('button', { name: 'Enviar pregunta' }))
            .toBeDisabled()
        expect(screen.getByRole('button', { name: 'Generar primera pista' }))
            .toBeEnabled()
        expect(consultar).not.toHaveBeenCalled()
    })

    it('shows the remaining count for this assignment', async () => {
        const getQuota = vi.fn().mockResolvedValue({ used: 11, limit: 30 })

        render(
            <PanelPistasEjercicio
                abierto
                alCerrar={vi.fn()}
                modoReal
                pistas={[]}
                tituloEjercicio="Normalizar HTTP"
                onConsultarIA={vi.fn()}
                onConsultarCuota={getQuota}
            />,
        )

        expect(await screen.findByText('11/30')).toBeInTheDocument()
        expect(screen.getByText('11/30').closest('.pistas-panel__cabecera'))
            .toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }))
            .toBeEnabled()
    })

    it('muestra el modelo compacto y permite escribir directamente', async () => {
        render(
            <PanelPistasEjercicio
                abierto
                alCerrar={vi.fn()}
                modoReal
                pistas={[]}
                tituloEjercicio="Normalizar HTTP"
                onConsultarIA={vi.fn()}
                onConsultarCuota={vi.fn().mockResolvedValue({ used: 2, limit: 30 })}
            />,
        )

        expect(await screen.findByText('2/30')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Mostrar chat del tutor' }))
            .not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Volver al ejercicio' }))
            .toBeVisible()

        const entrada = screen.getByRole('textbox', { name: 'Escribe tu pregunta' })
        fireEvent.change(entrada, { target: { value: '¿Qué necesito revisar?' } })
        const selector = screen.getByRole('combobox', { name: 'Modelo de chat' })
        expect(selector).toHaveClass('pistas-panel__modelo-compacto')
        fireEvent.change(selector, {
            target: { value: 'gpt-5.4-mini' },
        })
        expect(entrada).toHaveValue('¿Qué necesito revisar?')
        expect(selector).toHaveValue('gpt-5.4-mini')
        expect(screen.getByText('2/30')).toBeInTheDocument()
    })
})

import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TutorMessageContent } from './TutorMessageContent.jsx'

describe('TutorMessageContent', () => {
    it('separa los tres pasos aunque la IA los entregue corridos', () => {
        render(
            <TutorMessageContent text={
                'Piensa en 3 pasos: 1. **Filtrar:** selecciona los productos.'
                + ' 2. **Transformar:** conserva solo los nombres.'
                + ' 3. **Comprobar:** revisa los casos límite.'
            } />,
        )

        expect(screen.getByText('Piensa en 3 pasos:')).toBeInTheDocument()

        const lista = screen.getByRole('list')
        const items = within(lista).getAllByRole('listitem')
        expect(items).toHaveLength(3)
        expect(items[0]).toHaveTextContent('1. Filtrar: selecciona los productos.')
        expect(items[1]).toHaveTextContent('2. Transformar: conserva solo los nombres.')
        expect(items[2]).toHaveTextContent('3. Comprobar: revisa los casos límite.')
        expect(within(items[0]).getByText('Filtrar:').tagName).toBe('STRONG')
        expect(within(items[0]).getByText('1.').tagName).toBe('STRONG')
    })

    it('distingue los párrafos y las listas con viñetas', () => {
        render(
            <TutorMessageContent text={
                'Primero identifica la entrada.\n'
                + 'Luego revisa estas opciones:\n'
                + '- **filter:** selecciona registros\n'
                + '- **map:** transforma datos'
            } />,
        )

        expect(screen.getAllByRole('listitem')).toHaveLength(2)
        expect(screen.getByText('filter:').tagName).toBe('STRONG')
        expect(screen.getByText('Primero identifica la entrada.')).toBeInTheDocument()
    })

    it('no ejecuta el contenido HTML enviado por el modelo', () => {
        const { container } = render(
            <TutorMessageContent text={
                '<img src=x onerror=alert(1)>'
                + '\n1. **Revisa:** tus datos'
            } />,
        )

        expect(container.querySelector('img')).toBeNull()
        expect(container).toHaveTextContent('<img src=x onerror=alert(1)>')
        expect(screen.getAllByRole('listitem')).toHaveLength(1)
    })
})

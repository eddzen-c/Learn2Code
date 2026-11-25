
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'

import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    EditorCodigo,
} from './ResolverEjercicioPage.jsx'

function crearPropiedades(cambios = {}) {
    return {
        ejercicio: {
            archivo: 'solucion.js',
            tecnologia: 'JavaScript',
            imagen:
                '/images/imagen_ejercicios/tecnologia-javascript-256.png',
        },
        codigo: 'const numero = 1',
        onCodigo: vi.fn(),
        onRestablecer: vi.fn(),
        onEjecutar: vi.fn(),
        onComprobar: vi.fn(),
        ...cambios,
    }
}

describe('EditorCodigo', () => {
    it('deshabilita las acciones durante una evaluación', () => {
        const propiedades = crearPropiedades({
            accionesDeshabilitadas: true,
        })

        render(<EditorCodigo {...propiedades} />)

        const ejecutar = screen.getByRole('button', {
            name: 'Ejecutar',
        })

        const comprobar = screen.getByRole('button', {
            name: 'Comprobar solución',
        })

        expect(ejecutar).toBeDisabled()
        expect(comprobar).toBeDisabled()

        fireEvent.click(ejecutar)
        fireEvent.click(comprobar)

        expect(
            propiedades.onEjecutar,
        ).not.toHaveBeenCalled()

        expect(
            propiedades.onComprobar,
        ).not.toHaveBeenCalled()
    })

    it('permite ejecutar y comprobar cuando está habilitado', () => {
        const propiedades = crearPropiedades()

        render(<EditorCodigo {...propiedades} />)

        const ejecutar = screen.getByRole('button', {
            name: 'Ejecutar',
        })

        const comprobar = screen.getByRole('button', {
            name: 'Comprobar solución',
        })

        expect(ejecutar).toBeEnabled()
        expect(comprobar).toBeEnabled()

        fireEvent.click(ejecutar)
        fireEvent.click(comprobar)

        expect(
            propiedades.onEjecutar,
        ).toHaveBeenCalledOnce()

        expect(
            propiedades.onComprobar,
        ).toHaveBeenCalledOnce()
    })

    it('oculta Ejecutar cuando el flujo no dispone de ejecutor real', () => {
        const propiedades = crearPropiedades({ mostrarEjecutar: false })

        render(<EditorCodigo {...propiedades} />)

        expect(
            screen.queryByRole('button', { name: 'Ejecutar' }),
        ).not.toBeInTheDocument()

        expect(
            screen.getByText('Comprueba el código para ver los resultados.'),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', { name: 'Comprobar solución' }),
        )

        expect(propiedades.onEjecutar).not.toHaveBeenCalled()
        expect(propiedades.onComprobar).toHaveBeenCalledOnce()
    })

    it('mantiene solo controles superiores funcionales en el editor real', () => {
        const propiedades = crearPropiedades({ modoReal: true })
        const { container } = render(<EditorCodigo {...propiedades} />)

        // En el modo real no hay botón para cerrar un archivo
        // ni desplegable de lenguaje sin funcionalidad.
        expect(
            container.querySelectorAll('.resolver-editor-archivo svg'),
        ).toHaveLength(1)
        expect(
            container.querySelectorAll('.resolver-editor-lenguaje svg'),
        ).toHaveLength(0)

        fireEvent.click(
            screen.getByRole('button', { name: 'Restablecer' }),
        )
        expect(propiedades.onRestablecer).toHaveBeenCalledOnce()
    })

    it('permite editar y restablecer el código', () => {
        const propiedades = crearPropiedades()

        render(<EditorCodigo {...propiedades} />)

        const editor = screen.getByRole('textbox', {
            name: 'Editor de solución',
        })

        expect(editor).toHaveValue('const numero = 1')

        fireEvent.change(editor, {
            target: {
                value: 'const numero = 2',
            },
        })

        expect(
            propiedades.onCodigo,
        ).toHaveBeenCalledWith('const numero = 2')

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Restablecer',
            }),
        )

        expect(
            propiedades.onRestablecer,
        ).toHaveBeenCalledOnce()
    })
})

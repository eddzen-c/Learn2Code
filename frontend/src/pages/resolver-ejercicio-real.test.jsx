
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import { MemoryRouter } from 'react-router-dom'

import {
    askExerciseTutor,
    getExerciseTutorUsage,
    submitExerciseAttempt,
} from '../api/exercise.api.js'

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import { AuthContext } from '../auth/auth-context.js'
import { useExerciseSession } from './useExerciseSession.js'

import {
    ResolverEjercicioRealPage,
} from './ResolverEjercicioRealPage.jsx'

vi.mock('./useExerciseSession.js', () => ({
    useExerciseSession: vi.fn(),
}))

vi.mock('../api/exercise.api.js', () => ({
    submitExerciseAttempt: vi.fn(),
    askExerciseTutor: vi.fn(),
    getExerciseTutorUsage: vi.fn(),
}))

function renderPage() {
    return render(
        <AuthContext.Provider
            value={{
                accessToken: 'token',
                user: {
                    fullName: 'Estudiante Learn2Code',
                },
                signOut: vi.fn(),
            }}
        >
            <MemoryRouter
                initialEntries={[
                    '/resolver-ejercicio?assignment=assignment-123',
                ]}
            >
                <ResolverEjercicioRealPage />
            </MemoryRouter>
        </AuthContext.Provider>,
    )
}

describe('ResolverEjercicioRealPage', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        getExerciseTutorUsage.mockResolvedValue({ used: 0, limit: 30 })
    })

    it('muestra el ejercicio real con el editor diseñado', () => {
        useExerciseSession.mockReturnValue({
            session: {
                assignment: {
                    id: 'assignment-123',
                    academicUnitId: 'unit-1',
                },
            },
            exercise: {
                id: 'exercise-1',
                titulo: 'Filtrar productos',
                tecnologia: 'JavaScript',
                dificultad: 'Intermedio',
                minutos: 15,
                imagen: null,
                archivo: 'solucion.js',
                enunciado: 'Filtra una lista de productos.',
                requisitos: [],
                entrada: null,
                salida: null,
                codigo: 'function filtrar() {}',
            },
            code: 'function filtrar() {}',
            setCode: vi.fn(),
            isLoading: false,
            error: null,
        })

        renderPage()

        expect(screen.getByRole('main')).toHaveClass('inicio-layout')
        expect(document.querySelector('.inicio-workspace')).toBeInTheDocument()
        expect(document.querySelector('.learning-sidebar--profile')).toBeInTheDocument()
        expect(document.querySelector('.profile-topbar')).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: 'Filtrar productos',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('textbox', {
                name: 'Editor de solución',
            }),
        ).toHaveValue('function filtrar() {}')

        expect(
            screen.getByRole('button', {
                name: 'Comprobar solución',
            }),
        ).toBeEnabled()

        expect(
            screen.queryByRole('button', {
                name: 'Ejecutar',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText(/100 XP al completar/i),
        ).not.toBeInTheDocument()

        expect(useExerciseSession).toHaveBeenCalledWith({
            accessToken: 'token',
            assignmentId: 'assignment-123',
        })
    })

    it('habilita pistas generadas por IA, chat y recursos ligados al ejercicio real', async () => {
        askExerciseTutor.mockImplementation(async (request) => ({
            reply: request.kind === 'hint'
                ? `Pista IA nivel ${request.hintLevel}: analiza la entrada.`
                : 'Elige un método de arreglos y comprueba sus casos límite.',
        }))
        useExerciseSession.mockReturnValue({
            session: {
                assignment: {
                    id: 'assignment-123',
                    academicUnitId: 'unit-1',
                    status: 'assigned',
                },
            },
            exercise: {
                id: 'exercise-1',
                titulo: 'Filtrar productos',
                tecnologia: 'JavaScript',
                tema: 'estructuras_de_datos',
                dificultad: 'Intermedio',
                minutos: 15,
                imagen: null,
                archivo: 'solucion.js',
                enunciado: 'Filtra productos con stock positivo.',
                requisitos: ['Imprime solo la salida JSON.'],
                entrada: '[{"stock":2}]',
                salida: '[2]',
                codigo: '// Completa la solución',
            },
            code: '// Completa la solución',
            setCode: vi.fn(),
            isLoading: false,
            error: null,
        })

        renderPage()

        const pistasButton = screen.getByRole('button', { name: 'Pistas' })
        const recursosButton = screen.getByRole('button', { name: 'Recursos' })
        expect(pistasButton).toBeEnabled()
        expect(recursosButton).toBeEnabled()

        fireEvent.click(pistasButton)
        const panel = screen.getByRole('dialog', { name: 'Pistas del ejercicio' })
        expect(panel).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Mis pistas' }))
            .toBeInTheDocument()
        expect(panel.querySelector('.pistas-panel__contador'))
            .toHaveTextContent('0 / 3')
        expect(screen.getByText('¿Necesitas más orientación?'))
            .toBeInTheDocument()
        expect(screen.getByText('Pregunta a tu tutor')).toBeInTheDocument()
        expect(screen.getByRole('combobox', { name: 'Modelo de chat' }))
            .toHaveClass('pistas-panel__modelo-compacto')
        expect(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }))
            .toBeInTheDocument()
        expect(screen.getByText('Filtra productos con stock positivo.')).toBeInTheDocument()
        expect(screen.queryByText(/Precio 100/)).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Enviar pregunta' })).toBeDisabled()

        fireEvent.click(screen.getByRole('button', { name: 'Generar primera pista' }))
        expect(await screen.findByRole('button', { name: /Pista 1/ })).toBeInTheDocument()
        expect(screen.getByText('Pista IA nivel 1: analiza la entrada.')).toBeInTheDocument()
        expect(askExerciseTutor).toHaveBeenCalledWith({
            accessToken: 'token',
            assignmentId: 'assignment-123',
            kind: 'hint',
            hintLevel: 1,
            history: [],
            model: 'gpt-4.1-mini',
        })

        fireEvent.click(screen.getByRole('button', { name: 'Mostrar siguiente pista' }))
        expect(await screen.findByRole('button', { name: /Pista 2/ })).toBeInTheDocument()

        fireEvent.change(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), {
            target: { value: '¿Qué método de arreglos me conviene?' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Enviar pregunta' }))
        expect(await screen.findByText('Elige un método de arreglos y comprueba sus casos límite.'))
            .toBeInTheDocument()
        expect(askExerciseTutor).toHaveBeenCalledWith(expect.objectContaining({
            kind: 'question',
            message: '¿Qué método de arreglos me conviene?',
            assignmentId: 'assignment-123',
        }))

        fireEvent.click(screen.getByRole('button', { name: 'Cerrar pistas' }))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

        fireEvent.click(recursosButton)
        expect(screen.getByRole('heading', { name: 'Recursos de aprendizaje' }))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Métodos de Array/ }))
            .toHaveAttribute('href', 'https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Array')
        expect(screen.getByRole('link', { name: /Métodos de Array/ }))
            .toHaveAttribute('rel', 'noopener noreferrer')

        fireEvent.click(screen.getByRole('button', { name: 'Enunciado' }))
        expect(screen.getByRole('heading', { name: 'El reto' })).toBeInTheDocument()
    })

    it('permite cambiar de modelo y reintentar sin duplicar la pregunta', async () => {
        askExerciseTutor
            .mockRejectedValueOnce(new Error('Servicio temporalmente no disponible'))
            .mockResolvedValueOnce({ reply: 'Puedes empezar por identificar la entrada.' })

        useExerciseSession.mockReturnValue({
            session: {
                assignment: {
                    id: 'assignment-123',
                    academicUnitId: 'unit-1',
                    status: 'assigned',
                },
            },
            exercise: {
                id: 'exercise-1',
                titulo: 'Normalizar HTTP',
                tecnologia: 'JavaScript',
                tema: 'condicionales',
                dificultad: 'Básico',
                minutos: 12,
                imagen: null,
                archivo: 'solucion.js',
                enunciado: 'Normaliza un método HTTP.',
                requisitos: [],
                entrada: '"get"',
                salida: '"GET"',
                codigo: '// Completa',
            },
            code: '// Completa',
            setCode: vi.fn(),
            isLoading: false,
            error: null,
        })

        renderPage()
        fireEvent.click(screen.getByRole('button', { name: 'Pistas' }))

        expect(screen.getByRole('combobox', { name: 'Modelo de chat' }))
            .toHaveValue('gpt-4.1-mini')
        expect(screen.getAllByRole('option')).toHaveLength(3)

        fireEvent.change(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), {
            target: { value: '¿Cómo empiezo?' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Enviar pregunta' }))

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('No fue posible consultar al tutor.')

        expect(screen.getAllByText('¿Cómo empiezo?')).toHaveLength(1)

        fireEvent.change(screen.getByRole('combobox', { name: 'Modelo de chat' }), {
            target: { value: 'gpt-5.4-mini' },
        })

        fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

        expect(await screen.findByText('Puedes empezar por identificar la entrada.'))
            .toBeInTheDocument()
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        expect(screen.getAllByText('¿Cómo empiezo?')).toHaveLength(1)
        expect(askExerciseTutor).toHaveBeenCalledTimes(2)
        expect(askExerciseTutor).toHaveBeenNthCalledWith(2, expect.objectContaining({
            model: 'gpt-5.4-mini',
            kind: 'question',
            message: '¿Cómo empiezo?',
            assignmentId: 'assignment-123',
        }))
    })

    it('muestra un error sin inventar ejercicios', () => {
        useExerciseSession.mockReturnValue({
            session: null,
            exercise: null,
            code: '',
            setCode: vi.fn(),
            isLoading: false,
            error: new Error('Servicio no disponible'),
        })

        renderPage()

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'No fue posible cargar el ejercicio',
        )

        expect(
            screen.queryByRole('textbox', {
                name: 'Editor de solución',
            }),
        ).not.toBeInTheDocument()
    })


    it('envía el código y muestra la evaluación real', async () => {
        useExerciseSession.mockReturnValue({
            session: {
                assignment: {
                    id: 'assignment-123',
                    status: 'assigned',
                },
            },
            exercise: {
                id: 'exercise-1',
                titulo: 'Filtrar productos',
                tecnologia: 'JavaScript',
                dificultad: 'Intermedio',
                minutos: 15,
                imagen: null,
                archivo: 'solucion.js',
                enunciado: 'Filtra productos.',
                requisitos: [],
                entrada: null,
                salida: null,
                codigo: 'function filtrar() {}',
            },
            code: 'function filtrar() {}',
            setCode: vi.fn(),
            isLoading: false,
            error: null,
        })

        submitExerciseAttempt.mockResolvedValue({
            assignment: {
                id: 'assignment-123',
                status: 'completed',
            },
            attempt: {
                passed: true,
                score: 100,
                testsPassed: 2,
                testsTotal: 2,
                feedback: 'Todas las pruebas aprobadas.',
            },
            progress: {
                applied: true,
                xpAwarded: 25,
            },
            results: [],
        })

        renderPage()

        expect(
            screen.queryByRole('button', {
                name: 'Ejecutar',
            }),
        ).not.toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Comprobar solución',
            }),
        )

        await waitFor(() => {
            expect(
                submitExerciseAttempt,
            ).toHaveBeenCalledWith({
                accessToken: 'token',
                assignmentId: 'assignment-123',
                submittedCode: 'function filtrar() {}',
            })
        })

        expect(
            await screen.findByText('¡Ejercicio superado!'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('+25 XP'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Comprobar solución',
            }),
        ).toBeDisabled()
    })

})

describe('ResolverEjercicioRealPage - ejercicio terminado', () => {
    it('recupera un ejercicio aprobado y muestra Finalizado sin permitir otra evaluación', () => {
        vi.resetAllMocks()
        getExerciseTutorUsage.mockResolvedValue({ used: 0, limit: 30 })
        useExerciseSession.mockReturnValue({
            session: {
                assignment: {
                    id: 'assignment-123',
                    academicUnitId: 'unit-1',
                    status: 'completed',
                },
            },
            exercise: {
                id: 'exercise-1',
                titulo: 'Filtrar productos',
                tecnologia: 'JavaScript',
                dificultad: 'Básico',
                minutos: 10,
                imagen: null,
                archivo: 'solucion.js',
                enunciado: 'Resuelve el problema.',
                requisitos: [],
                entrada: null,
                salida: null,
                codigo: 'console.log(1)',
            },
            code: 'console.log(1)',
            setCode: vi.fn(),
            isLoading: false,
            error: null,
        })
        renderPage()
        expect(screen.getByText('Finalizado')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Ejercicio finalizado' }))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Comprobar solución' }))
            .toBeDisabled()
        expect(submitExerciseAttempt).not.toHaveBeenCalled()
    })
})

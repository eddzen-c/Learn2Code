
/**
 * LEARN2CODE - PANEL LATERAL DE PISTAS
 *
 * Chatbot visual del módulo Ejercicios.
 * El estudiante puede:
 * - Abrir y cerrar el panel.
 * - Consultar pistas progresivamente.
 * - Escribir preguntas demostrativas.
 * - Volver al catálogo sin perder su posición.
 *
 * No utiliza una API de inteligencia artificial todavía.
 */

import { useEffect, useRef, useState } from 'react'

import {
    FiChevronDown,
    FiChevronUp,
    FiCode,
    FiInfo,
    FiMessageCircle,
    FiSend,
    FiX,
} from 'react-icons/fi'

import { FaLightbulb } from 'react-icons/fa'

import './panel-pistas-ejercicio.css'

// Imagen transparente del dragón de Learn2Code.
const MASCOTA_CHAT = '/images/mascota-chatbot-learn2code.png'

// Pistas temporales del ejercicio mostrado en el mockup.
const PISTAS_DEMO = [
    {
        title: 'Filtra productos',
        description:
            'Tu función ya filtra productos. Revisa qué sucede cuando el precio es exactamente 100.',
        example:
            'Precio 80  → incluir\n'
            + 'Precio 100 → incluir\n'
            + 'Precio 250 → excluir',
    },
    {
        title: 'Compara los operadores',
        description:
            'El operador <= incluye el valor límite. Observa la diferencia frente a <.',
        example:
            '100 < 100   → false\n'
            + '100 <= 100  → true',
    },
    {
        title: 'Revisa la condición',
        description:
            'Utiliza filter() y revisa que cada producto cumpla la condición.',
        example:
            'productos.filter(\n'
            + '  producto => producto.precio <= 100\n'
            + ')',
    },
]

// Tarjeta individual expandible.
function TarjetaPista({ pista, numero, abierta, onToggle }) {
    return (
        <article
            className={
                `pistas-tarjeta${abierta ? ' is-open' : ''}`
            }
        >
            <button
                type="button"
                className="pistas-tarjeta__encabezado"
                onClick={onToggle}
                aria-expanded={abierta}
            >
                <FaLightbulb aria-hidden="true" />

                <span>
                    Pista {numero} · {pista.title}
                </span>

                {abierta ? (
                    <FiChevronUp aria-hidden="true" />
                ) : (
                    <FiChevronDown aria-hidden="true" />
                )}
            </button>

            {abierta && (
                <div className="pistas-tarjeta__contenido">
                    <p>{pista.description}</p>

                    {pista.example && (
                        <div className="pistas-tarjeta__ejemplo">
                            <FiCode aria-hidden="true" />
                            <pre>{pista.example}</pre>
                        </div>
                    )}
                </div>
            )}
        </article>
    )
}

// Burbuja del chat.
function MensajeChat({ mensaje }) {
    const esAsistente = mensaje.tipo === 'asistente'

    return (
        <div
            className={
                'pistas-chat__fila'
                + (esAsistente ? ' is-assistant' : ' is-user')
            }
        >
            {esAsistente && (
                <img
                    src={MASCOTA_CHAT}
                    alt=""
                    className="pistas-chat__avatar"
                />
            )}

            <div
                className={
                    'pistas-chat__mensaje'
                    + (esAsistente ? ' is-assistant' : ' is-user')
                }
            >
                {mensaje.texto}
            </div>
        </div>
    )
}

/**
 * Props:
 * abierto: panel visible.
 * alCerrar: función para cerrar el panel.
 * tituloEjercicio: texto de cabecera.
 * pistas: pistas propias del ejercicio.
 */
export function PanelPistasEjercicio({
    abierto,
    alCerrar,
    tituloEjercicio = 'Filtrar una lista de productos (demo)',
    pistas = PISTAS_DEMO,
}) {
    const [cantidadVisible, setCantidadVisible] = useState(1)
    const [pistaAbierta, setPistaAbierta] = useState(0)

    const [mensajes, setMensajes] = useState([])
    const [pregunta, setPregunta] = useState('')

    const panelRef = useRef(null)
    const cerrarRef = useRef(null)
    const scrollRef = useRef(null)
    const contadorRef = useRef(0)

    // Control de teclado, foco y bloqueo del fondo.
    useEffect(() => {
        if (!abierto) return undefined

        const focoAnterior = document.activeElement
        const overflowAnterior = document.body.style.overflow

        document.body.style.overflow = 'hidden'
        cerrarRef.current?.focus()

        const manejarTeclado = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                alCerrar()
                return
            }

            if (event.key !== 'Tab' || !panelRef.current) return

            const elementos = Array.from(
                panelRef.current.querySelectorAll(
                    'button:not(:disabled), input:not(:disabled)',
                ),
            ).filter((elemento) => elemento.getClientRects().length)

            if (!elementos.length) return

            const primero = elementos[0]
            const ultimo = elementos[elementos.length - 1]

            if (
                event.shiftKey
                && document.activeElement === primero
            ) {
                event.preventDefault()
                ultimo.focus()
            }

            if (
                !event.shiftKey
                && document.activeElement === ultimo
            ) {
                event.preventDefault()
                primero.focus()
            }
        }

        document.addEventListener('keydown', manejarTeclado)

        return () => {
            document.body.style.overflow = overflowAnterior
            document.removeEventListener('keydown', manejarTeclado)

            if (focoAnterior?.isConnected) {
                focoAnterior.focus()
            }
        }
    }, [abierto, alCerrar])

    // Desbloquea una pista a la vez.
    const mostrarSiguiente = () => {
        if (cantidadVisible >= pistas.length) return

        setPistaAbierta(cantidadVisible)
        setCantidadVisible((actual) => actual + 1)
    }

    // Envía preguntas locales y muestra una respuesta de prueba.
    const enviarPregunta = (event) => {
        event.preventDefault()

        const texto = pregunta.trim()
        if (!texto) return

        contadorRef.current += 1
        const idUsuario = contadorRef.current

        contadorRef.current += 1
        const idAsistente = contadorRef.current

        setMensajes((actuales) => [
            ...actuales,
            {
                id: idUsuario,
                tipo: 'usuario',
                texto,
            },
            {
                id: idAsistente,
                tipo: 'asistente',
                texto:
                    'Respuesta de demostración: revisa la '
                    + 'condición que usas para filtrar los productos. '
                    + 'Prueba con valores menores, iguales y '
                    + 'mayores que 100.',
            },
        ])

        setPregunta('')

        // Se desplaza al final cuando llegan nuevos mensajes.
        requestAnimationFrame(() => {
            if (!scrollRef.current) return

            scrollRef.current.scrollTop =
                scrollRef.current.scrollHeight
        })
    }

    if (!abierto) return null

    return (
        <div className="pistas-overlay">
            {/* Fondo semitransparente del mockup. */}
            <button
                type="button"
                className="pistas-overlay__fondo"
                onClick={alCerrar}
                aria-label="Cerrar asistente"
                tabIndex={-1}
            />

            {/* Panel lateral derecho. */}
            <aside
                ref={panelRef}
                className="pistas-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pistas-panel-titulo"
            >
                {/* Cabecera con la cabeza del dragón. */}
                <header className="pistas-panel__cabecera">
                    <div className="pistas-panel__mascota">
                        <img
                            src={MASCOTA_CHAT}
                            alt="Mascota de Learn2Code"
                        />
                    </div>

                    <div className="pistas-panel__titulos">
                        <h2 id="pistas-panel-titulo">
                            Pistas del ejercicio
                        </h2>

                        <strong>{tituloEjercicio}</strong>

                        <span>
                            Recibe ayuda paso a paso y vuelve a probar.
                        </span>
                    </div>

                    <button
                        ref={cerrarRef}
                        type="button"
                        className="pistas-panel__cerrar"
                        onClick={alCerrar}
                        aria-label="Cerrar pistas"
                    >
                        <FiX aria-hidden="true" />
                    </button>
                </header>

                {/* Pistas y conversación. */}
                <div
                    ref={scrollRef}
                    className="pistas-panel__cuerpo"
                >
                    <div className="pistas-panel__lista">
                        {pistas
                            .slice(0, cantidadVisible)
                            .map((pista, indice) => (
                                <TarjetaPista
                                    key={`${indice}-${pista.title}`}
                                    pista={pista}
                                    numero={indice + 1}
                                    abierta={pistaAbierta === indice}
                                    onToggle={() => {
                                        setPistaAbierta(
                                            pistaAbierta === indice
                                                ? -1
                                                : indice,
                                        )
                                    }}
                                />
                            ))}
                    </div>

                    {cantidadVisible < pistas.length && (
                        <button
                            type="button"
                            className="pistas-panel__siguiente"
                            onClick={mostrarSiguiente}
                        >
                            Mostrar siguiente pista
                        </button>
                    )}

                    {/* Mensaje de bienvenida, como el mockup. */}
                    <div className="pistas-chat__bienvenida">
                        <img
                            src={MASCOTA_CHAT}
                            alt=""
                            className="pistas-chat__avatar"
                        />

                        <p>
                            ¿Qué crees que sucede con tu función
                            cuando un producto tiene precio 100?
                        </p>
                    </div>

                    {/* Respuestas del chat de demostración. */}
                    <div
                        className="pistas-chat__mensajes"
                        aria-live="polite"
                    >
                        {mensajes.map((mensaje) => (
                            <MensajeChat
                                key={mensaje.id}
                                mensaje={mensaje}
                            />
                        ))}
                    </div>
                </div>

                {/* Entrada para enviar preguntas. */}
                <footer className="pistas-panel__pie">
                    <form
                        className="pistas-chat__formulario"
                        onSubmit={enviarPregunta}
                    >
                        <label
                            htmlFor="pistas-chat-pregunta"
                            className="pistas-sr-only"
                        >
                            Escribe tu pregunta
                        </label>

                        <input
                            id="pistas-chat-pregunta"
                            type="text"
                            value={pregunta}
                            onChange={(event) =>
                                setPregunta(event.target.value)
                            }
                            placeholder="Escribe tu duda sobre el ejercicio..."
                        />

                        <button
                            type="submit"
                            disabled={!pregunta.trim()}
                            aria-label="Enviar pregunta"
                        >
                            <FiSend aria-hidden="true" />
                        </button>
                    </form>

                    <p className="pistas-panel__aviso">
                        <FiInfo aria-hidden="true" />
                        Chat demostrativo. Las pistas no modifican
                        tu código.
                    </p>

                    <button
                        type="button"
                        className="pistas-panel__volver"
                        onClick={alCerrar}
                    >
                        <FiMessageCircle aria-hidden="true" />
                        Volver a mis ejercicios
                    </button>
                </footer>
            </aside>
        </div>
    )
}

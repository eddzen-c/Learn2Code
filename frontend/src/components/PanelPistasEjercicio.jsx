
/**
 * LEARN2CODE - PANEL LATERAL DE PISTAS
 *
 * Chatbot visual del módulo Ejercicios.
 * El estudiante puede:
 * - Abrir y cerrar el panel.
 * - Consultar pistas progresivamente.
 * - Consultar al tutor de IA cuando se trata de un ejercicio real.
 * - Mantener separado el contenido de demostración de las respuestas reales.
 * - Volver al ejercicio sin perder el código escrito.
 */

import { useEffect, useRef, useState } from 'react'

import {
    FiArrowRight,
    FiChevronDown,
    FiChevronUp,
    FiCode,
    FiInfo,
    FiMessageCircle,
    FiRefreshCw,
    FiSend,
    FiX,
} from 'react-icons/fi'

import { FaLightbulb } from 'react-icons/fa'

import { TutorMessageContent } from './TutorMessageContent.jsx'

import './panel-pistas-ejercicio.css'

// Imagen transparente del dragón de Learn2Code.
const MASCOTA_CHAT = '/images/mascota-chatbot-learn2code.png'

const crearIdPregunta = () => {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
    // Compatibilidad con navegadores antiguos sin randomUUID.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
        const n = Math.floor(Math.random() * 16)
        return (char === 'x' ? n : (n & 3) | 8).toString(16)
    })
}


const MODELOS_TUTOR = Object.freeze([
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
    { id: 'gpt-5.4-mini', label: 'GPT-5.4 mini' },
    { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
])

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
                    <TutorMessageContent text={pista.description} />

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
                {esAsistente
                    ? <TutorMessageContent text={mensaje.texto} />
                    : mensaje.texto}
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
    modoReal = false,
    onConsultarIA = null,
    onConsultarCuota = null,
}) {
    const [cantidadVisible, setCantidadVisible] = useState(1)
    const [pistaAbierta, setPistaAbierta] = useState(0)

    const [mensajes, setMensajes] = useState([])
    const [pregunta, setPregunta] = useState('')
    const [pistasIA, setPistasIA] = useState([])
    const [consultando, setConsultando] = useState(false)
    const [errorIA, setErrorIA] = useState(null)
    const [modeloTutor, setModeloTutor] = useState('gpt-4.1-mini')
    const [solicitudFallida, setSolicitudFallida] = useState(null)
    const [preguntasUsadas, setPreguntasUsadas] = useState(null)
    const limitePreguntas = 30
    const limiteAlcanzado = modoReal && preguntasUsadas !== null
        && preguntasUsadas >= limitePreguntas

    const listaPistas = modoReal ? pistasIA : pistas

    const panelRef = useRef(null)
    const cerrarRef = useRef(null)
    const scrollRef = useRef(null)
    const contadorRef = useRef(0)

    // Consulta el cupo real al abrir el panel. El contador está en el
    // servidor y no se reinicia cuando se actualiza la página.
    useEffect(() => {
        if (!abierto || !modoReal || !onConsultarCuota) return undefined

        let activo = true
        onConsultarCuota()
            .then((cuota) => {
                if (activo && Number.isInteger(cuota?.used)) {
                    setPreguntasUsadas(cuota.used)
                }
            })
            .catch(() => {
                // La consulta al tutor seguirá protegida por el backend.
                if (activo) setPreguntasUsadas(null)
            })

        return () => { activo = false }
    }, [abierto, modoReal, onConsultarCuota])

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
                    'button:not(:disabled), input:not(:disabled), select:not(:disabled)',
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

    // Un único envío para pistas, preguntas y reintentos.
    // El reintento reutiliza la consulta original: no duplica al estudiante.
    const consultarTutor = async (solicitud) => {
        if (!onConsultarIA || consultando) return

        setConsultando(true)
        setErrorIA(null)
        setSolicitudFallida(null)

        try {
            const result = await onConsultarIA({
                ...solicitud,
                model: modeloTutor,
            })

            if (!result?.reply?.trim()) {
                throw new Error('El tutor no devolvió una respuesta.')
            }

            if (solicitud.kind === 'hint') {
                setPistasIA((actual) => [...actual, {
                    title: 'Orientación personalizada',
                    description: result.reply,
                    example: null,
                }])
                setPistaAbierta(solicitud.hintLevel - 1)
            } else {
                if (Number.isInteger(result.chatUsage?.used)) {
                    setPreguntasUsadas(result.chatUsage.used)
                }
                contadorRef.current += 1
                setMensajes((actual) => [...actual, {
                    id: contadorRef.current,
                    tipo: 'asistente',
                    texto: result.reply,
                }])
            }
        } catch (error) {
            if (error?.code === 'EXERCISE_TUTOR_CHAT_LIMIT') {
                setPreguntasUsadas(limitePreguntas)
                setSolicitudFallida(null)
                setErrorIA('Alcanzaste las 30 preguntas de este ejercicio.')
            } else {
                setSolicitudFallida(solicitud)
                setErrorIA(solicitud.kind === 'hint'
                    ? 'No fue posible generar la pista.'
                    : 'No fue posible consultar al tutor.')
            }
        } finally {
            setConsultando(false)
        }
    }

    // Desbloquea una pista a la vez.
    const mostrarSiguiente = async () => {
        if (modoReal) {
            if (consultando || pistasIA.length >= 3 || !onConsultarIA) return
            await consultarTutor({
                kind: 'hint',
                hintLevel: pistasIA.length + 1,
                history: [],
            })
            return
        }

        if (cantidadVisible >= pistas.length) return
        setPistaAbierta(cantidadVisible)
        setCantidadVisible((actual) => actual + 1)
    }

    const reintentarConsulta = () => {
        if (solicitudFallida && !consultando) {
            void consultarTutor(solicitudFallida)
        }
    }

    // Envía preguntas locales y muestra una respuesta de prueba.
    const enviarPregunta = async (event) => {
        event.preventDefault()

        const texto = pregunta.trim()
        if (!texto || consultando || (modoReal && limiteAlcanzado)) return

        if (modoReal) {
            if (!onConsultarIA) return
            const history = mensajes.slice(-6).map((m) => ({
                role: m.tipo === 'asistente' ? 'assistant' : 'user',
                content: m.texto,
            }))
            contadorRef.current += 1
            setMensajes((actual) => [...actual, {
                id: contadorRef.current,
                tipo: 'usuario',
                texto,
            }])
            setPregunta('')
            await consultarTutor({
                kind: 'question',
                requestId: crearIdPregunta(),
                message: texto,
                history,
            })
            return
        }

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
                        <div className="pistas-panel__titulo-fila">
                            <h2 id="pistas-panel-titulo">
                                Pistas del ejercicio
                            </h2>
                            {modoReal && (
                                <span
                                    className={
                                        limiteAlcanzado
                                            ? 'pistas-panel__conteo-chat is-full'
                                            : 'pistas-panel__conteo-chat'
                                    }
                                    aria-label={`Preguntas usadas: ${preguntasUsadas ?? 'sin consultar'} de ${limitePreguntas}`}
                                    title="Preguntas utilizadas en este ejercicio"
                                >
                                    {preguntasUsadas ?? '—'}/{limitePreguntas}
                                </span>
                            )}
                        </div>

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
                    <div className="pistas-panel__seccion-titulo">
                        <div>
                            <span className="pistas-panel__etiqueta">
                                APRENDE PASO A PASO
                            </span>
                            <h3>Mis pistas</h3>
                        </div>
                        <span className="pistas-panel__contador">
                            {modoReal
                                ? pistasIA.length
                                : Math.min(cantidadVisible, pistas.length)}
                            {' / '}
                            {modoReal ? 3 : pistas.length}
                        </span>
                    </div>

                    <div className="pistas-panel__lista">
                        {listaPistas
                            .slice(0, modoReal ? listaPistas.length : cantidadVisible)
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

                    {(modoReal ? pistasIA.length < 3 : cantidadVisible < pistas.length) && (
                        <button
                            type="button"
                            className="pistas-panel__siguiente"
                            onClick={mostrarSiguiente}
                            disabled={consultando}
                        >
                            <span>
                                {consultando
                                    ? 'Preparando tu pista...'
                                    : modoReal && pistasIA.length === 0
                                        ? 'Generar primera pista'
                                        : 'Mostrar siguiente pista'}
                            </span>
                            {!consultando && <FiArrowRight aria-hidden="true" />}
                        </button>
                    )}

                    {!modoReal && (
                    <>
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
                    </>
                    )}
                    {modoReal && mensajes.length === 0 && (
                        <div className="pistas-panel__ayuda-chat">
                            <FiMessageCircle aria-hidden="true" />
                            <div>
                                <strong>¿Necesitas más orientación?</strong>
                                <p>
                                    Escribe tu duda abajo y continúa
                                    resolviendo el ejercicio a tu ritmo.
                                </p>
                            </div>
                        </div>
                    )}
                    {modoReal && (
                        <div className="pistas-chat__mensajes" aria-live="polite">
                            {mensajes.map((mensaje) => (
                                <MensajeChat key={mensaje.id} mensaje={mensaje} />
                            ))}
                        </div>
                    )}
                    {errorIA && modoReal && (
                        <div className="pistas-panel__error">
                            <p role="alert">{errorIA}</p>
                            <button
                                type="button"
                                onClick={reintentarConsulta}
                                disabled={consultando || !solicitudFallida}
                            >
                                <FiRefreshCw aria-hidden="true" />
                                Reintentar
                            </button>
                        </div>
                    )}
                </div>

                {/* Entrada para enviar preguntas. */}
                <footer className="pistas-panel__pie">
                    {modoReal && (
                        <div className="pistas-panel__chat-barra">
                            <div className="pistas-panel__chat-titulo">
                                <FiMessageCircle aria-hidden="true" />
                                <span>Pregunta a tu tutor</span>
                            </div>
                            <label
                                htmlFor="pistas-modelo-tutor"
                                className="pistas-sr-only"
                            >
                                Modelo de chat
                            </label>
                            <select
                                id="pistas-modelo-tutor"
                                className="pistas-panel__modelo-compacto"
                                value={modeloTutor}
                                onChange={(event) => setModeloTutor(event.target.value)}
                                disabled={consultando}
                            >
                                {MODELOS_TUTOR.map(({ id, label }) => (
                                    <option value={id} key={id}>{label}</option>
                                ))}
                            </select>
                        </div>
                    )}
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
                            placeholder={limiteAlcanzado
                                ? 'Has alcanzado el límite de preguntas.'
                                : 'Escribe tu duda sobre el ejercicio...'}
                            disabled={limiteAlcanzado}
                        />

                        <button
                            type="submit"
                            disabled={!pregunta.trim() || consultando || limiteAlcanzado}
                            aria-label="Enviar pregunta"
                        >
                            <FiSend aria-hidden="true" />
                        </button>
                    </form>

                    {!modoReal && (
                        <p className="pistas-panel__aviso">
                            <FiInfo aria-hidden="true" />
                            Chat demostrativo. Las pistas no modifican tu código.
                        </p>
                    )}
                    <button
                        type="button"
                        className="pistas-panel__volver"
                        onClick={alCerrar}
                    >
                        <FiMessageCircle aria-hidden="true" />
                        Volver al ejercicio
                    </button>
                </footer>
            </aside>
        </div>
    )
}

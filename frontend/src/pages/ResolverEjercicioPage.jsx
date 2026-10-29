
/**
 * ============================================================
 * LEARN2CODE - RESOLVER EJERCICIO
 * ============================================================
 *
 * Pantalla de ejercicios basada en el mockup.
 *
 * Incluye:
 * - Navegación y usuario de sesión.
 * - Enunciado y requisitos.
 * - Editor de código.
 * - Resultados demostrativos.
 * - Panel de pistas.
 * - Botón Finalizar ejercicio con borde azul.
 *
 * La ejecución real del código está pendiente
 * de conectarse con el backend.
 * ============================================================
 */

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import {
    FiAlertTriangle,
    FiArrowLeft,
    FiBarChart2,
    FiBookmark,
    FiCheck,
    FiChevronDown,
    FiChevronRight,
    FiClock,
    FiCloud,
    FiCopy,
    FiFileText,
    FiInfo,
    FiPlay,
    FiRefreshCcw,
    FiStar,
    FiTerminal,
    FiX,
} from 'react-icons/fi'

import { FaLightbulb } from 'react-icons/fa'

import { useAuth } from '../auth/useAuth.js'
import { LearningSidebar } from '../components/LearningSidebar.jsx'
import { ProfileTopbar } from '../components/ProfileTopbar.jsx'
import { PanelPistasEjercicio } from '../components/PanelPistasEjercicio.jsx'

import './resolver-ejercicio.css'

// ============================================================
// IMÁGENES DEL PROYECTO
// ============================================================

const IMAGENES = {
    mascota: '/images/learn2code-mascot-laptop-transparent.png',
    javascript: '/images/imagen_ejercicios/tecnologia-javascript-256.png',
    html: '/images/imagen_ejercicios/tecnologia-html-256.png',
    css: '/images/imagen_ejercicios/tecnologia-css-256.png',
    react: '/images/imagen_ejercicios/tecnologia-react-256.png',
    postgresql: '/images/imagen_ejercicios/tecnologia-postgresql-256.png',
}

// ============================================================
// EJERCICIOS DISPONIBLES
// ============================================================

const EJERCICIOS = {
    filter: {
        id: 'filter',
        titulo: 'Filtrar una lista de productos',
        tecnologia: 'JavaScript',
        dificultad: 'Intermedio',
        minutos: 15,
        xp: 100,
        imagen: IMAGENES.javascript,
        archivo: 'solucion.js',
        enunciado:
            'Completa filtrarProductos para devolver los productos cuyo precio sea menor o igual a 100.',
        requisitos: [
            'Devuelve un nuevo array.',
            'Incluye los productos de precio 100.',
            'No modifiques la lista original.',
        ],
        entrada:
            '[{nombre: "Mouse", precio: 80},\n' +
            ' {nombre: "Teclado", precio: 100},\n' +
            ' {nombre: "Monitor", precio: 250}]',
        salida:
            '[{nombre: "Mouse", precio: 80},\n' +
            ' {nombre: "Teclado", precio: 100}]',
        codigo:
            'function filtrarProductos(productos) {\n' +
            '  return productos.filter(producto => producto.precio < 100);\n' +
            '}',
    },

    variables: {
        id: 'variables',
        titulo: 'Variables y operaciones',
        tecnologia: 'JavaScript',
        dificultad: 'Principiante',
        minutos: 10,
        xp: 50,
        imagen: IMAGENES.javascript,
        archivo: 'solucion.js',
        enunciado: 'Calcula el total de una compra utilizando precio y cantidad.',
        requisitos: [
            'Recibe dos parámetros.',
            'Multiplica precio por cantidad.',
            'Devuelve el total.',
        ],
        entrada: 'calcularTotal(50, 3)',
        salida: '150',
        codigo:
            'function calcularTotal(precio, cantidad) {\n' +
            '  // Escribe tu solución\n' +
            '}',
    },

    html: {
        id: 'html',
        titulo: 'Estructura una página web',
        tecnologia: 'HTML',
        dificultad: 'Principiante',
        minutos: 10,
        xp: 50,
        imagen: IMAGENES.html,
        archivo: 'index.html',
        enunciado: 'Organiza una página utilizando HTML semántico.',
        requisitos: [
            'Incluye un encabezado.',
            'Agrega un contenido principal.',
            'Utiliza un pie de página.',
        ],
        entrada: 'Documento HTML inicial',
        salida: 'Documento HTML con estructura semántica',
        codigo:
            '<!DOCTYPE html>\n' +
            '<html lang="es">\n' +
            '  <body>\n' +
            '    <!-- Completa tu página -->\n' +
            '  </body>\n' +
            '</html>',
    },

    flexbox: {
        id: 'flexbox',
        titulo: 'Tarjeta con Flexbox',
        tecnologia: 'CSS',
        dificultad: 'Principiante',
        minutos: 15,
        xp: 75,
        imagen: IMAGENES.css,
        archivo: 'estilos.css',
        enunciado: 'Alinea los elementos de una tarjeta usando Flexbox.',
        requisitos: [
            'Utiliza display: flex.',
            'Alinea los elementos.',
            'Agrega espacios entre los elementos.',
        ],
        entrada: 'Una tarjeta con título y descripción',
        salida: 'Una tarjeta organizada con Flexbox',
        codigo:
            '.tarjeta {\n' +
            '  display: flex;\n' +
            '  /* Completa los estilos */\n' +
            '}',
    },

    react: {
        id: 'react',
        titulo: 'Contador con useState',
        tecnologia: 'React',
        dificultad: 'Intermedio',
        minutos: 20,
        xp: 100,
        imagen: IMAGENES.react,
        archivo: 'Contador.jsx',
        enunciado: 'Actualiza un contador al pulsar un botón.',
        requisitos: [
            'Declara el estado con useState.',
            'Muestra el contador.',
            'Incrementa el valor al pulsar.',
        ],
        entrada: 'Clic en el botón',
        salida: 'El contador aumenta en una unidad',
        codigo:
            "import { useState } from 'react'\n\n" +
            'export function Contador() {\n' +
            '  // Completa el componente\n' +
            '}',
    },

    sql: {
        id: 'sql',
        titulo: 'Consulta tus primeros datos',
        tecnologia: 'PostgreSQL',
        dificultad: 'Intermedio',
        minutos: 15,
        xp: 100,
        imagen: IMAGENES.postgresql,
        archivo: 'consulta.sql',
        enunciado: 'Consulta registros utilizando SELECT y WHERE.',
        requisitos: [
            'Utiliza SELECT.',
            'Consulta la tabla productos.',
            'Agrega una condición WHERE.',
        ],
        entrada: 'Tabla productos',
        salida: 'Registros que cumplen la condición',
        codigo:
            'SELECT *\n' +
            'FROM productos\n' +
            '-- Completa WHERE',
    },
}

// ============================================================
// RESALTADO DE SINTAXIS DEL EDITOR
// ============================================================

function colorearLinea(linea) {
    const patron =
        /(\/\/[^\n]*|--[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:function|return|const|let|import|export|from|SELECT|FROM|WHERE)\b|\b(?:filtrarProductos|calcularTotal|filter)\b|<=|>=|=>|\b\d+\b)/g

    return linea.split(patron).map((fragmento, indice) => {
        let clase = ''

        if (/^(\/\/|--)/.test(fragmento)) {
            clase = 'resolver-sintaxis-comentario'
        } else if (/^["']/.test(fragmento)) {
            clase = 'resolver-sintaxis-cadena'
        } else if (
            /^(function|return|const|let|import|export|from|SELECT|FROM|WHERE)$/.test(fragmento)
        ) {
            clase = 'resolver-sintaxis-palabra'
        } else if (
            /^(filtrarProductos|calcularTotal|filter)$/.test(fragmento)
        ) {
            clase = 'resolver-sintaxis-funcion'
        } else if (/^(<=|>=|=>|\d+)$/.test(fragmento)) {
            clase = 'resolver-sintaxis-operador'
        }

        return (
            <span key={indice} className={clase}>
                {fragmento}
            </span>
        )
    })
}

// ============================================================
// PANEL IZQUIERDO
// ============================================================

function PanelEnunciado({ ejercicio, intentos, onPedirPista }) {
    const [pestana, setPestana] = useState('enunciado')
    const [mensajeCopiado, setMensajeCopiado] = useState('')

    // Copia el contenido del ejemplo al portapapeles.
    const copiar = async (texto) => {
        try {
            await navigator.clipboard.writeText(texto)
            setMensajeCopiado('Copiado correctamente')
        } catch {
            setMensajeCopiado('No fue posible copiar')
        }
    }

    return (
        <section className="resolver-enunciado">
            <div className="resolver-enunciado-tabs">
                <button
                    type="button"
                    className={pestana === 'enunciado' ? 'is-active' : ''}
                    onClick={() => setPestana('enunciado')}
                >
                    <FiFileText />
                    Enunciado
                </button>

                <button
                    type="button"
                    className={pestana === 'intentos' ? 'is-active' : ''}
                    onClick={() => setPestana('intentos')}
                >
                    <FiClock />
                    Mis intentos
                </button>
            </div>

            {pestana === 'enunciado' ? (
                <div className="resolver-enunciado-contenido">
                    <section className="resolver-seccion">
                        <h2>El reto</h2>
                        <p>{ejercicio.enunciado}</p>
                    </section>

                    <section className="resolver-seccion">
                        <h2>Requisitos</h2>
                        <ul className="resolver-requisitos">
                            {ejercicio.requisitos.map((requisito) => (
                                <li key={requisito}>
                                    <span className="resolver-check-verde">
                                        <FiCheck />
                                    </span>
                                    <span>{requisito}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="resolver-seccion resolver-seccion-ejemplos">
                        <h2>Ejemplo de entrada y salida</h2>

                        <div className="resolver-ejemplo">
                            <div className="resolver-ejemplo-titulo">
                                <strong>Entrada</strong>
                            </div>

                            <div className="resolver-ejemplo-codigo">
                                <pre>{ejercicio.entrada}</pre>
                                <button
                                    type="button"
                                    aria-label="Copiar entrada"
                                    onClick={() => copiar(ejercicio.entrada)}
                                >
                                    <FiCopy />
                                </button>
                            </div>
                        </div>

                        <div className="resolver-ejemplo">
                            <div className="resolver-ejemplo-titulo">
                                <strong>Salida esperada</strong>
                            </div>

                            <div className="resolver-ejemplo-codigo">
                                <pre>{ejercicio.salida}</pre>
                                <button
                                    type="button"
                                    aria-label="Copiar salida"
                                    onClick={() => copiar(ejercicio.salida)}
                                >
                                    <FiCopy />
                                </button>
                            </div>
                        </div>

                        {mensajeCopiado && (
                            <p role="status" className="resolver-mensaje-copiado">
                                {mensajeCopiado}
                            </p>
                        )}
                    </section>

                    <div className="resolver-enunciado-ayuda">
                        <button
                            type="button"
                            className="resolver-boton-pista"
                            onClick={onPedirPista}
                        >
                            <FaLightbulb />
                            Pedir una pista
                        </button>

                        <p className="resolver-guardado-nota">
                            <FiCloud />
                            El código se mantiene mientras estés en esta pantalla.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="resolver-intentos">
                    <h2>Mis intentos</h2>
                    {intentos.length === 0 ? (
                        <p>No tienes intentos en esta sesión.</p>
                    ) : (
                        <div className="resolver-lista-intentos">
                            {intentos.map((intento, indice) => (
                                <div key={intento.id}>
                                    <strong>Intento {indice + 1}</strong>
                                    <span>{intento.accion}</span>
                                    <small>Demostración sin evaluación real</small>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="resolver-enunciado-pie">
                <Link to="/exercises">
                    <FiArrowLeft />
                    Volver al catálogo
                </Link>
            </div>
        </section>
    )
}

// ============================================================
// EDITOR DE CÓDIGO
// ============================================================

function EditorCodigo({
    ejercicio,
    codigo,
    onCodigo,
    onRestablecer,
    onEjecutar,
    onComprobar,
}) {
    const lineas = codigo.split('\n')
    const [desplazamiento, setDesplazamiento] = useState(0)

    return (
        <div className="resolver-editor-completo">
            <section className="resolver-editor">
                <div className="resolver-editor-barra">
                    <div className="resolver-editor-archivo">
                        <FiFileText />
                        <span>{ejercicio.archivo}</span>
                        <FiX />
                    </div>

                    <div className="resolver-editor-herramientas">
                        <div className="resolver-editor-lenguaje">
                            <img src={ejercicio.imagen} alt="" />
                            <span>{ejercicio.tecnologia}</span>
                            <FiChevronDown />
                        </div>

                        <button
                            type="button"
                            className="resolver-editor-restablecer"
                            onClick={onRestablecer}
                        >
                            <FiRefreshCcw />
                            Restablecer
                        </button>
                    </div>
                </div>

                <div className="resolver-editor-superficie">
                    {/* Capa visual con números y colores */}
                    <div
                        className="resolver-editor-resaltado"
                        aria-hidden="true"
                        style={{
                            transform: `translateY(-${desplazamiento}px)`,
                        }}
                    >
                        <div className="resolver-editor-numeros">
                            {lineas.map((_, indice) => (
                                <span key={indice}>{indice + 1}</span>
                            ))}
                        </div>

                        <pre>
                            {lineas.map((linea, indice) => (
                                <div
                                    key={indice}
                                    className="resolver-editor-linea"
                                >
                                    {colorearLinea(linea)}
                                </div>
                            ))}
                        </pre>
                    </div>

                    {/* Área editable superpuesta */}
                    <textarea
                        aria-label="Editor de solución"
                        value={codigo}
                        onChange={(event) => onCodigo(event.target.value)}
                        onScroll={(event) =>
                            setDesplazamiento(event.currentTarget.scrollTop)
                        }
                        spellCheck={false}
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        wrap="off"
                    />
                </div>
            </section>

            <div className="resolver-botones-ejecucion">
                <button
                    type="button"
                    className="resolver-boton-ejecutar"
                    onClick={onEjecutar}
                >
                    <FiPlay />
                    Ejecutar
                </button>

                <button
                    type="button"
                    className="resolver-boton-comprobar"
                    onClick={onComprobar}
                >
                    Comprobar solución
                </button>
            </div>
        </div>
    )
}

// ============================================================
// RESULTADOS DEL MOCKUP
// ============================================================

function PanelResultados({ ejercicio, vista, onVista, accion }) {
    const [detalleAbierto, setDetalleAbierto] = useState(true)
    const esFiltro = ejercicio.id === 'filter'

    return (
        <section className="resolver-resultados">
            <div className="resolver-resultados-tabs">
                <button
                    type="button"
                    className={vista === 'consola' ? 'is-active' : ''}
                    onClick={() => onVista('consola')}
                >
                    <FiTerminal />
                    Consola
                </button>

                <button
                    type="button"
                    className={vista === 'resultados' ? 'is-active' : ''}
                    onClick={() => onVista('resultados')}
                >
                    <FiBarChart2 />
                    Resultados
                </button>
            </div>

            {vista === 'consola' ? (
                <div className="resolver-consola">
                    <FiTerminal />
                    <p>
                        {accion === 'inicial'
                            ? 'Consola preparada para la práctica.'
                            : 'La ejecución real estará disponible al conectar el backend.'}
                    </p>
                </div>
            ) : (
                <div className="resolver-resultados-cuerpo">
                    <h2>
                        {esFiltro
                            ? '2 de 3 pruebas (ejemplo)'
                            : 'Resultados del ejercicio'}
                    </h2>

                    <p className="resolver-aviso-demo">
                        Vista demostrativa: las pruebas no se han ejecutado.
                    </p>

                    {esFiltro ? (
                        <div className="resolver-pruebas">
                            <div className="resolver-prueba is-ok">
                                <span className="resolver-estado-verde">
                                    <FiCheck />
                                </span>
                                <span>Filtra productos por debajo de 100</span>
                                <FiChevronRight className="resolver-prueba-flecha" />
                            </div>

                            <div className="resolver-prueba is-ok">
                                <span className="resolver-estado-verde">
                                    <FiCheck />
                                </span>
                                <span>
                                    Devuelve un array vacío si no hay coincidencias
                                </span>
                                <FiChevronRight className="resolver-prueba-flecha" />
                            </div>

                            <div className="resolver-prueba is-warning">
                                <span className="resolver-estado-naranja">
                                    <FiAlertTriangle />
                                </span>
                                <span>
                                    Incluye productos con precio igual a 100
                                </span>
                                <button
                                    type="button"
                                    aria-label="Mostrar u ocultar detalle"
                                    aria-expanded={detalleAbierto}
                                    onClick={() =>
                                        setDetalleAbierto((actual) => !actual)
                                    }
                                >
                                    <FiChevronDown
                                        className={detalleAbierto ? 'is-open' : ''}
                                    />
                                </button>
                            </div>

                            {detalleAbierto && (
                                <div className="resolver-caso-limite">
                                    <div className="resolver-caso-titulo">
                                        <FiAlertTriangle />
                                        <strong>Caso límite: precio 100</strong>
                                    </div>

                                    <div className="resolver-caso-comparacion">
                                        <div>
                                            <small>Esperado:</small>
                                            <span>1 producto</span>
                                        </div>
                                        <div>
                                            <small>Obtenido:</small>
                                            <span className="is-error">
                                                0 productos (ejemplo)
                                            </span>
                                        </div>
                                    </div>

                                    <p>
                                        <FaLightbulb />
                                        Revisa cómo comparas el precio con el límite.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="resolver-resultados-genericos">
                            <FiInfo />
                            Las comprobaciones reales aún no están conectadas.
                        </div>
                    )}

                    {accion !== 'inicial' && (
                        <p
                            className="resolver-mensaje-ejecucion"
                            role="status"
                        >
                            {accion === 'ejecutar'
                                ? 'La ejecución requiere conectar el backend.'
                                : 'La evaluación requiere conectar el backend.'}
                        </p>
                    )}
                </div>
            )}
        </section>
    )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function ResolverEjercicioPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { user, signOut } = useAuth()

    // Leer el ejercicio elegido en el catálogo.
    const id = searchParams.get('ejercicio') || 'filter'
    const ejercicio = EJERCICIOS[id] || EJERCICIOS.filter

    // Conservar las ediciones de cada ejercicio en esta pantalla.
    const [codigos, setCodigos] = useState({})
    const [guardados, setGuardados] = useState([])
    const [intentos, setIntentos] = useState([])

    // Estados visuales.
    const [panelPistasAbierto, setPanelPistasAbierto] = useState(false)
    const [vistaResultados, setVistaResultados] = useState('resultados')
    const [accion, setAccion] = useState('inicial')

    const codigo = codigos[ejercicio.id] ?? ejercicio.codigo
    const guardado = guardados.includes(ejercicio.id)

    const actualizarCodigo = (valor) => {
        setCodigos((actual) => ({
            ...actual,
            [ejercicio.id]: valor,
        }))
    }

    const alternarGuardado = () => {
        setGuardados((actual) =>
            actual.includes(ejercicio.id)
                ? actual.filter((valor) => valor !== ejercicio.id)
                : [...actual, ejercicio.id],
        )
    }

    // Registrar únicamente acciones locales demostrativas.
    const registrarIntento = (tipo) => {
        setAccion(tipo)
        setVistaResultados(
            tipo === 'ejecutar' ? 'consola' : 'resultados',
        )

        setIntentos((actual) => [
            ...actual,
            {
                id: `${Date.now()}-${actual.length}`,
                accion:
                    tipo === 'ejecutar'
                        ? 'Ejecución demostrativa'
                        : 'Comprobación demostrativa',
            },
        ])
    }

    const restablecer = () => {
        actualizarCodigo(ejercicio.codigo)
        setAccion('inicial')
        setVistaResultados('resultados')
    }

    /**
     * Finalizar ejercicio:
     *
     * Abre la pantalla final del mockup.
     * Se envía el código editado y el indicador
     * de que se trata de una vista demostrativa.
     */
    const finalizarEjercicio = () => {
        navigate(
            '/ejercicio-completado?ejercicio=' +
                encodeURIComponent(ejercicio.id),
            {
                state: {
                    vistaPrevia: true,
                    resultado: {
                        codigo,
                        verificadoPorBackend: false,
                    },
                },
            },
        )
    }

    const cerrarSesion = async () => {
        await signOut()
    }

    const nombreUsuario =
        user?.fullName?.trim() ||
        user?.name?.trim() ||
        'Estudiante'

    return (
        <main className="resolver-layout">
            {/* Barra lateral existente */}
            <LearningSidebar
                variant="profile"
                activeItem="exercises"
                mascotSrc={IMAGENES.mascota}
                mascotAlt="Dragón Learn2Code programando"
            />

            <div className="resolver-workspace">
                {/* Barra superior existente */}
                <ProfileTopbar
                    userName={nombreUsuario}
                    streakDays={14}
                    notificationCount={3}
                    onLogout={cerrarSesion}
                    onOpenNotifications={() =>
                        navigate('/profile', {
                            state: { openTab: 'notifications' },
                        })
                    }
                />

                <div className="resolver-content">
                    {/* Navegación del catálogo */}
                    <div className="resolver-navegacion">
                        <div className="resolver-migas">
                            <Link to="/exercises">
                                <FiArrowLeft />
                                Ejercicios
                            </Link>
                            <span>/</span>
                            <strong>{ejercicio.tecnologia}</strong>
                        </div>

                        <Link
                            to="/exercises"
                            className="resolver-volver-superior"
                        >
                            <FiArrowLeft />
                            Volver a ejercicios
                        </Link>
                    </div>

                    {/* Encabezado del ejercicio */}
                    <header className="resolver-cabecera">
                        <div className="resolver-cabecera-imagen">
                            <img
                                src={ejercicio.imagen}
                                alt={ejercicio.tecnologia}
                            />
                        </div>

                        <div className="resolver-cabecera-info">
                            <h1>{ejercicio.titulo}</h1>

                            <div className="resolver-cabecera-metadatos">
                                <span>
                                    <FiFileText />
                                    {ejercicio.tecnologia}
                                </span>

                                <span>
                                    <FiBarChart2 />
                                    <strong className="resolver-dificultad">
                                        {ejercicio.dificultad}
                                    </strong>
                                </span>

                                <span>
                                    <FiClock />
                                    {ejercicio.minutos} min
                                </span>

                                <span>
                                    <FiStar className="resolver-estrella" />
                                    +{ejercicio.xp} XP al completar
                                </span>

                                <button
                                    type="button"
                                    className={
                                        'resolver-guardar-ejercicio' +
                                        (guardado ? ' is-saved' : '')
                                    }
                                    aria-pressed={guardado}
                                    onClick={alternarGuardado}
                                >
                                    <FiBookmark />
                                    {guardado
                                        ? 'Ejercicio guardado'
                                        : 'Guardar ejercicio'}
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Panel izquierdo y derecho */}
                    <div className="resolver-columnas">
                        <PanelEnunciado
                            ejercicio={ejercicio}
                            intentos={intentos}
                            onPedirPista={() =>
                                setPanelPistasAbierto(true)
                            }
                        />

                        <div className="resolver-columna-derecha">
                            <EditorCodigo
                                ejercicio={ejercicio}
                                codigo={codigo}
                                onCodigo={actualizarCodigo}
                                onRestablecer={restablecer}
                                onEjecutar={() =>
                                    registrarIntento('ejecutar')
                                }
                                onComprobar={() =>
                                    registrarIntento('comprobar')
                                }
                            />

                            <PanelResultados
                                ejercicio={ejercicio}
                                vista={vistaResultados}
                                onVista={setVistaResultados}
                                accion={accion}
                            />

                            {/* ===================================
                                BOTÓN FINALIZAR EJERCICIO

                                Estilo blanco con borde azul,
                                igual al botón de referencia.
                               =================================== */}
                            <div className="resolver-finalizar-contenedor">
                                <button
                                    type="button"
                                    className="resolver-finalizar-boton-demo"
                                    onClick={finalizarEjercicio}
                                >
                                    Finalizar ejercicio
                                    <FiChevronRight aria-hidden="true" />
                                </button>


                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chatbot lateral de pistas */}
            <PanelPistasEjercicio
                abierto={panelPistasAbierto}
                alCerrar={() => setPanelPistasAbierto(false)}
                tituloEjercicio={ejercicio.titulo}
            />
        </main>
    )
}

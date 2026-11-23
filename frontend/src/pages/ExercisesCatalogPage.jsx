
/**
 * ============================================================
 * LEARN2CODE - CATÁLOGO DE EJERCICIOS
 * ============================================================
 *
 * Archivo: ExercisesCatalogPage.jsx
 *
 * Incluye:
 * - Sidebar de Perfil.
 * - Mascota transparente.
 * - Racha semanal.
 * - Cuatro pestañas.
 * - Búsqueda y filtros.
 * - Tarjetas de ejercicios.
 * - Guardados temporales.
 * - Ejercicio recomendado.
 * - Imagen especial de Completados.
 * - Chatbot lateral de pistas.
 *
 * Cada ejercicio abre:
 * /resolver-ejercicio?ejercicio=ID
 *
 * Los datos del catálogo son demostrativos.
 * ============================================================
 */

import {
    useCallback,
    useMemo,
    useState,
} from 'react'

import {
    Link,
    useNavigate,
    useSearchParams,
} from 'react-router-dom'

import {
    FiActivity,
    FiArrowRight,
    FiBookmark,
    FiCheck,
    FiCheckCircle,
    FiChevronDown,
    FiClock,
    FiGrid,
    FiMessageCircle,
    FiPlay,
    FiSearch,
    FiStar,
    FiTarget,
} from 'react-icons/fi'

import { useAuth } from '../auth/useAuth.js'

import {
    LearningSidebar,
} from '../components/LearningSidebar.jsx'

import {
    ProfileTopbar,
} from '../components/ProfileTopbar.jsx'

import {
    PanelPistasEjercicio,
} from '../components/PanelPistasEjercicio.jsx'

import './exercises-catalog.css'

// ============================================================
// 1. IMÁGENES DEL REPOSITORIO
// ============================================================

const IMAGENES = {
    dragon:
        '/images/learn2code-mascot-laptop-transparent.png',

    completado:
        '/images/ejercicio_completado.png',

    javascript:
        '/images/imagen_ejercicios/tecnologia-javascript-256.png',

    html:
        '/images/imagen_ejercicios/tecnologia-html-256.png',

    css:
        '/images/imagen_ejercicios/tecnologia-css-256.png',

    react:
        '/images/imagen_ejercicios/tecnologia-react-256.png',

    postgresql:
        '/images/imagen_ejercicios/tecnologia-postgresql-256.png',
}

// ============================================================
// 2. EJERCICIOS DEMOSTRATIVOS
// ============================================================

const EJERCICIOS = [
    {
        id: 'variables',
        title: 'Variables y operaciones',
        description: 'Calcula el total de una compra.',
        technology: 'JavaScript',
        difficulty: 'Principiante',
        minutes: 10,
        xp: 50,
        status: 'not-started',
        image: IMAGENES.javascript,
    },
    {
        id: 'filter',
        title: 'Filtrar una lista de productos',
        description: 'Selecciona productos según su precio.',
        technology: 'JavaScript',
        difficulty: 'Intermedio',
        minutes: 15,
        xp: 100,
        status: 'in-progress',
        image: IMAGENES.javascript,
    },
    {
        id: 'html',
        title: 'Estructura una página web',
        description: 'Organiza el contenido con HTML semántico.',
        technology: 'HTML',
        difficulty: 'Principiante',
        minutes: 10,
        xp: 50,
        status: 'not-started',
        image: IMAGENES.html,
    },
    {
        id: 'flexbox',
        title: 'Tarjeta con Flexbox',
        description:
            'Alinea y distribuye los elementos de una tarjeta.',
        technology: 'CSS',
        difficulty: 'Principiante',
        minutes: 15,
        xp: 75,
        status: 'completed',
        image: IMAGENES.css,
    },
    {
        id: 'react',
        title: 'Contador con useState',
        description:
            'Actualiza un contador al pulsar un botón.',
        technology: 'React',
        difficulty: 'Intermedio',
        minutes: 20,
        xp: 100,
        status: 'not-started',
        image: IMAGENES.react,
    },
    {
        id: 'sql',
        title: 'Consulta tus primeros datos',
        description:
            'Obtén registros usando SELECT y WHERE.',
        technology: 'PostgreSQL',
        difficulty: 'Intermedio',
        minutes: 15,
        xp: 100,
        status: 'not-started',
        image: IMAGENES.postgresql,
    },
]

// ============================================================
// 3. PESTAÑAS
// ============================================================

const PESTANAS = [
    {
        id: 'all',
        label: 'Todos los ejercicios',
        Icon: FiGrid,
    },
    {
        id: 'in-progress',
        label: 'En progreso',
        Icon: FiPlay,
    },
    {
        id: 'completed',
        label: 'Completados',
        Icon: FiCheckCircle,
    },
    {
        id: 'saved',
        label: 'Guardados',
        Icon: FiBookmark,
    },
]

// ============================================================
// 4. FUNCIONES AUXILIARES
// ============================================================

function obtenerEstado(status) {
    if (status === 'completed') {
        return 'Completado'
    }

    if (status === 'in-progress') {
        return 'En progreso'
    }

    return 'Sin comenzar'
}

/**
 * Genera la ruta del nuevo editor.
 * Cada ejercicio conserva su identificador.
 */
function obtenerRutaEjercicio(id) {
    return (
        '/resolver-ejercicio?ejercicio='
        + encodeURIComponent(id)
    )
}

// ============================================================
// 5. COMPONENTE DE TARJETA
// ============================================================

function TarjetaEjercicio({
    exercise,
    saved,
    onToggleSaved,
}) {
    const completado = exercise.status === 'completed'
    const enProgreso = exercise.status === 'in-progress'

    const textoBoton = completado
        ? 'Volver a practicar'
        : enProgreso
            ? 'Continuar ejercicio'
            : 'Resolver ejercicio'

    return (
        <article className="excat-card">

            {/* Encabezado de la tarjeta */}
            <div className="excat-card__header">

                <div className="excat-card__image">
                    <img
                        src={exercise.image}
                        alt={`Tecnología ${exercise.technology}`}
                    />
                </div>

                <div className="excat-card__details">

                    <span
                        className={
                            'excat-difficulty '
                            + (
                                exercise.difficulty === 'Principiante'
                                    ? 'excat-difficulty--beginner'
                                    : 'excat-difficulty--intermediate'
                            )
                        }
                    >
                        {exercise.difficulty}
                    </span>

                    <h3>{exercise.title}</h3>

                    <p>{exercise.description}</p>
                </div>

                {/* Guardar o quitar de guardados */}
                <button
                    type="button"
                    className={
                        'excat-save'
                        + (saved ? ' is-saved' : '')
                    }
                    aria-label={
                        saved
                            ? `Quitar ${exercise.title} de guardados`
                            : `Guardar ${exercise.title}`
                    }
                    aria-pressed={saved}
                    onClick={() => onToggleSaved(exercise.id)}
                >
                    <FiBookmark aria-hidden="true" />
                </button>

            </div>

            {/* Datos del ejercicio */}
            <div className="excat-card__meta">

                <span>
                    <FiClock aria-hidden="true" />
                    {exercise.minutes} min
                </span>

                <span>
                    <FiStar
                        className="excat-star"
                        aria-hidden="true"
                    />
                    +{exercise.xp} XP
                </span>

                <span
                    className={
                        'excat-status excat-status--'
                        + exercise.status
                    }
                >
                    {completado && (
                        <FiCheck aria-hidden="true" />
                    )}

                    {enProgreso && (
                        <FiPlay aria-hidden="true" />
                    )}

                    {obtenerEstado(exercise.status)}
                </span>

            </div>

            {/*
             * NAVEGACIÓN CORREGIDA
             *
             * Abre ResolverEjercicioPage.jsx con el ID
             * correspondiente a esta tarjeta.
             */}
            <Link
                className={
                    'excat-card__action'
                    + (enProgreso ? ' is-primary' : '')
                }
                to={obtenerRutaEjercicio(exercise.id)}
            >
                {textoBoton}
            </Link>

        </article>
    )
}

// ============================================================
// 6. BANNER INFERIOR DEL CHATBOT
// ============================================================

function BannerAyuda({ onOpen, dragon }) {
    return (
        <section className="excat-help">

            <img
                src={dragon}
                alt="Mascota Learn2Code"
            />

            <div>
                <h2>¿Te atascaste en un ejercicio?</h2>

                <p>
                    Pide una pista y sigue avanzando.
                </p>
            </div>

            <button
                type="button"
                className="excat-help__button"
                onClick={onOpen}
            >
                <FiMessageCircle aria-hidden="true" />
                Pide una pista
                <FiArrowRight aria-hidden="true" />
            </button>

        </section>
    )
}

// ============================================================
// 7. PÁGINA PRINCIPAL
// ============================================================

export function ExercisesCatalogPage() {
    const navigate = useNavigate()
    const { user, signOut } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()

    // ========================================================
    // PESTAÑA ACTIVA
    // ========================================================

    const tabParam = searchParams.get('tab') || 'all'

    const tabActiva = PESTANAS.some(
        (tab) => tab.id === tabParam,
    )
        ? tabParam
        : 'all'

    const esCompletados = tabActiva === 'completed'

    // ========================================================
    // ESTADOS DEL CATÁLOGO
    // ========================================================

    const [busqueda, setBusqueda] = useState('')
    const [tecnologia, setTecnologia] = useState('')
    const [dificultad, setDificultad] = useState('')
    const [estado, setEstado] = useState('')
    const [orden, setOrden] = useState('recommended')

    // Guardados locales: no se envían al backend.
    const [guardados, setGuardados] = useState([])

    // Panel lateral de pistas.
    const [panelAbierto, setPanelAbierto] = useState(false)

    // ========================================================
    // CONTROL DEL CHATBOT
    // ========================================================

    const abrirPistas = useCallback(() => {
        setPanelAbierto(true)
    }, [])

    const cerrarPistas = useCallback(() => {
        setPanelAbierto(false)
    }, [])

    // ========================================================
    // GUARDAR Y QUITAR EJERCICIOS
    // ========================================================

    const alternarGuardado = (id) => {
        setGuardados((actuales) =>
            actuales.includes(id)
                ? actuales.filter((item) => item !== id)
                : [...actuales, id],
        )
    }

    // ========================================================
    // CAMBIAR PESTAÑA
    // ========================================================

    const cambiarPestana = (tab) => {
        setSearchParams(
            tab === 'all'
                ? {}
                : { tab },
        )

        setEstado('')
    }

    // ========================================================
    // FILTROS Y ORDENAMIENTO
    // ========================================================

    const ejerciciosFiltrados = useMemo(() => {
        const texto = busqueda
            .trim()
            .toLocaleLowerCase('es-MX')

        const filtrados = EJERCICIOS.filter((exercise) => {
            const contenido = [
                exercise.title,
                exercise.description,
                exercise.technology,
            ]
                .join(' ')
                .toLocaleLowerCase('es-MX')

            const coincideBusqueda =
                !texto || contenido.includes(texto)

            const coincideTecnologia =
                !tecnologia
                || exercise.technology === tecnologia

            const coincideDificultad =
                !dificultad
                || exercise.difficulty === dificultad

            const coincideEstado =
                !estado
                || exercise.status === estado

            const coincidePestana =
                tabActiva === 'all'
                || (
                    tabActiva === 'saved'
                    && guardados.includes(exercise.id)
                )
                || (
                    tabActiva !== 'saved'
                    && exercise.status === tabActiva
                )

            return (
                coincideBusqueda
                && coincideTecnologia
                && coincideDificultad
                && coincideEstado
                && coincidePestana
            )
        })

        if (orden === 'shortest') {
            return [...filtrados].sort(
                (a, b) => a.minutes - b.minutes,
            )
        }

        if (orden === 'xp') {
            return [...filtrados].sort(
                (a, b) => b.xp - a.xp,
            )
        }

        return filtrados
    }, [
        busqueda,
        tecnologia,
        dificultad,
        estado,
        orden,
        tabActiva,
        guardados,
    ])

    // ========================================================
    // SESIÓN DEL ESTUDIANTE
    // ========================================================

    const cerrarSesion = async () => {
        await signOut()
    }

    const nombre =
        user?.fullName?.trim() || 'Estudiante'

    // ========================================================
    // TÍTULOS SEGÚN PESTAÑA
    // ========================================================

    const titulosResultados = {
        all: 'Explora los ejercicios',
        'in-progress': 'Pendientes de terminar',
        completed: 'Tu historial de práctica',
        saved: 'Tu lista de ejercicios',
    }

    // ========================================================
    // INTERFAZ PRINCIPAL
    // ========================================================

    return (
        <main className="excat-layout">

            {/*
             * SIDEBAR COMPARTIDO CON PERFIL
             *
             * Se reutilizan:
             * - Navegación.
             * - Tarjeta Pro.
             * - Mascota transparente.
             * - Racha semanal.
             */}
            <LearningSidebar
                variant="profile"
                activeItem="exercises"
                mascotSrc={IMAGENES.dragon}
                mascotAlt="Dragón Learn2Code programando"
            />

            <div className="excat-workspace">

                {/* Barra superior */}
                <ProfileTopbar
                    userName={nombre}
                    streakDays={14}
                    notificationCount={3}
                    onLogout={cerrarSesion}
                    onOpenNotifications={() =>
                        navigate('/profile', {
                            state: {
                                openTab: 'notifications',
                            },
                        })
                    }
                />

                <div className="excat-content">

                    {/* =========================================
                        ENCABEZADO DEL CATÁLOGO

                        Completados utiliza la imagen especial.
                        Las demás pestañas conservan el dragón
                        con laptop.
                       ========================================= */}

                    <header
                        className={
                            'excat-intro'
                            + (
                                esCompletados
                                    ? ' excat-intro--completed'
                                    : ''
                            )
                        }
                    >
                        <div>
                            <h1>
                                {esCompletados
                                    ? '¡Tus ejercicios completados!'
                                    : 'Pon a prueba tus habilidades'}
                            </h1>

                            <p>
                                {esCompletados
                                    ? 'Cada ejercicio completado es un paso más en tu aprendizaje.'
                                    : 'Resuelve ejercicios, practica a tu ritmo y refuerza lo aprendido.'}
                            </p>
                        </div>

                        <img
                            src={
                                esCompletados
                                    ? IMAGENES.completado
                                    : IMAGENES.dragon
                            }
                            alt={
                                esCompletados
                                    ? 'Dragón celebrando un ejercicio completado'
                                    : 'Dragón Learn2Code programando'
                            }
                        />
                    </header>

                    {/* =========================================
                        PESTAÑAS
                       ========================================= */}

                    <nav
                        className="excat-tabs"
                        aria-label="Pestañas de ejercicios"
                    >
                        {PESTANAS.map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                type="button"
                                className={
                                    'excat-tab'
                                    + (
                                        tabActiva === id
                                            ? ' is-active'
                                            : ''
                                    )
                                }
                                aria-current={
                                    tabActiva === id
                                        ? 'page'
                                        : undefined
                                }
                                onClick={() => cambiarPestana(id)}
                            >
                                <Icon aria-hidden="true" />
                                {label}
                            </button>
                        ))}
                    </nav>

                    {/* =========================================
                        FILTROS
                       ========================================= */}

                    <section
                        className="excat-filters"
                        aria-label="Filtros de ejercicios"
                    >

                        {/* Búsqueda */}
                        <label className="excat-search">
                            <span className="excat-sr-only">
                                Buscar un ejercicio
                            </span>

                            <input
                                type="search"
                                value={busqueda}
                                placeholder="Buscar un ejercicio..."
                                onChange={(event) =>
                                    setBusqueda(event.target.value)
                                }
                            />

                            <FiSearch aria-hidden="true" />
                        </label>

                        {/* Tecnología */}
                        <label className="excat-select">
                            <span className="excat-sr-only">
                                Tecnología
                            </span>

                            <select
                                value={tecnologia}
                                onChange={(event) =>
                                    setTecnologia(event.target.value)
                                }
                            >
                                <option value="">
                                    Tecnología
                                </option>
                                <option value="JavaScript">
                                    JavaScript
                                </option>
                                <option value="HTML">
                                    HTML
                                </option>
                                <option value="CSS">
                                    CSS
                                </option>
                                <option value="React">
                                    React
                                </option>
                                <option value="PostgreSQL">
                                    PostgreSQL
                                </option>
                            </select>

                            <FiChevronDown aria-hidden="true" />
                        </label>

                        {/* Dificultad */}
                        <label className="excat-select">
                            <span className="excat-sr-only">
                                Dificultad
                            </span>

                            <select
                                value={dificultad}
                                onChange={(event) =>
                                    setDificultad(event.target.value)
                                }
                            >
                                <option value="">
                                    Dificultad
                                </option>
                                <option value="Principiante">
                                    Principiante
                                </option>
                                <option value="Intermedio">
                                    Intermedio
                                </option>
                            </select>

                            <FiChevronDown aria-hidden="true" />
                        </label>

                        {/* Estado */}
                        <label className="excat-select">
                            <span className="excat-sr-only">
                                Estado
                            </span>

                            <select
                                value={estado}
                                onChange={(event) =>
                                    setEstado(event.target.value)
                                }
                            >
                                <option value="">
                                    Estado
                                </option>
                                <option value="not-started">
                                    Sin comenzar
                                </option>
                                <option value="in-progress">
                                    En progreso
                                </option>
                                <option value="completed">
                                    Completado
                                </option>
                            </select>

                            <FiChevronDown aria-hidden="true" />
                        </label>

                        {/* Orden */}
                        <label className="excat-select">
                            <span className="excat-sr-only">
                                Ordenar ejercicios
                            </span>

                            <select
                                value={orden}
                                onChange={(event) =>
                                    setOrden(event.target.value)
                                }
                            >
                                <option value="recommended">
                                    Recomendados
                                </option>
                                <option value="shortest">
                                    Menor duración
                                </option>
                                <option value="xp">
                                    Mayor XP
                                </option>
                            </select>

                            <FiChevronDown aria-hidden="true" />
                        </label>

                    </section>

                    {/* =========================================
                        EJERCICIO RECOMENDADO
                       ========================================= */}

                    {tabActiva === 'all' && (
                        <section className="excat-featured">

                            <img
                                src={IMAGENES.javascript}
                                alt="JavaScript"
                                className="excat-featured__image"
                            />

                            <div className="excat-featured__content">

                                <span className="excat-featured__badge">
                                    <FiTarget aria-hidden="true" />
                                    Tu práctica recomendada
                                </span>

                                <h2>
                                    Filtrar una lista de productos
                                </h2>

                                <p>
                                    Selecciona productos según su
                                    precio utilizando JavaScript.
                                </p>

                                <div className="excat-featured__meta">
                                    <span>
                                        <FiActivity aria-hidden="true" />
                                        Intermedio
                                    </span>

                                    <span>
                                        <FiClock aria-hidden="true" />
                                        15 min
                                    </span>

                                    <span>
                                        <FiStar aria-hidden="true" />
                                        +100 XP
                                    </span>
                                </div>
                            </div>

                            <div className="excat-featured__route">
                                <FiTarget aria-hidden="true" />
                                Según tu Ruta Frontend
                            </div>

                            {/* Abre el ejercicio recomendado real
                                dentro del catálogo demostrativo. */}
                            <Link
                                className="excat-featured__button"
                                to={obtenerRutaEjercicio('filter')}
                            >
                                <FiPlay aria-hidden="true" />
                                Comenzar ejercicio
                            </Link>
                        </section>
                    )}

                    {/* =========================================
                        RESULTADOS DE BÚSQUEDA
                       ========================================= */}

                    <section className="excat-results">

                        <div className="excat-results__heading">
                            <h2>
                                {titulosResultados[tabActiva]}
                            </h2>

                            <span>
                                {ejerciciosFiltrados.length}{' '}
                                {ejerciciosFiltrados.length === 1
                                    ? 'ejercicio'
                                    : 'ejercicios'}
                            </span>
                        </div>

                        {ejerciciosFiltrados.length > 0 ? (
                            <div className="excat-grid">
                                {ejerciciosFiltrados.map((exercise) => (
                                    <TarjetaEjercicio
                                        key={exercise.id}
                                        exercise={exercise}
                                        saved={guardados.includes(
                                            exercise.id,
                                        )}
                                        onToggleSaved={alternarGuardado}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="excat-empty">
                                <FiSearch aria-hidden="true" />

                                <h3>
                                    No encontramos ejercicios
                                </h3>

                                <p>
                                    Prueba con otros filtros o
                                    selecciona otra pestaña.
                                </p>
                            </div>
                        )}

                    </section>

                    {/* =========================================
                        BANNER DEL CHATBOT
                       ========================================= */}

                    <BannerAyuda
                        onOpen={abrirPistas}
                        dragon={IMAGENES.dragon}
                    />

                </div>
            </div>

            {/* =============================================
                CHATBOT LATERAL EXISTENTE
               ============================================= */}

            <PanelPistasEjercicio
                abierto={panelAbierto}
                alCerrar={cerrarPistas}
                tituloEjercicio="Filtrar una lista de productos (demo)"
            />

        </main>
    )
}

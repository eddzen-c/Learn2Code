import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'

import {
    Link,
    useSearchParams,
} from 'react-router-dom'

import {
    FiActivity,
    FiArrowRight,
    FiBookmark,
    FiCheck,
    FiCheckCircle,
    FiChevronDown,
    FiChevronRight,
    FiCloud,
    FiCode,
    FiClock,
    FiHome,
    FiLayers,
    FiMonitor,
    FiServer,
    FiGrid,
    FiMessageCircle,
    FiPlay,
    FiSearch,
    FiStar,
    FiTarget,
} from 'react-icons/fi'

import { useAuth } from '../auth/useAuth.js'
import { useExercisesChrome } from '../hooks/useExercisesChrome.js'
import {
    getCurrentLearningPlan,
} from '../api/learning-paths.api.js'

import {
    getAcademicCatalog,
} from '../api/exercise.api.js'

import {
    LearningSidebar,
} from '../components/LearningSidebar.jsx'

import {
    ProfileTopbar,
} from '../components/ProfileTopbar.jsx'

import {
    PanelPistasEjercicio,
} from '../components/PanelPistasEjercicio.jsx'
import { AcademicPersonalizationBadge } from '../components/AcademicPersonalizationBadge.jsx'

import './exercises-catalog.css'
import './exercises-catalog-redesign.css'
import './academic-hierarchy-redesign.css'

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

const EJERCICIOS = []

// Exposición: ocultar pestañas/filtros que aún dependen de EJERCICIOS vacío.
const EXHIBITION_MODE = true

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

const ICONOS_ESPECIALIZACION = Object.freeze({
    frontend: FiMonitor,
    backend: FiServer,
    fullstack: FiLayers,
    devops: FiCloud,
})

function IconoEspecializacion({ tipo }) {
    const Icono = ICONOS_ESPECIALIZACION[tipo] || FiCode
    return <Icono aria-hidden="true" />
}

const NOMBRES_ESPECIALIZACIONES = Object.freeze({
    frontend: 'Frontend',
    backend: 'Backend',
    fullstack: 'Full Stack',
    devops: 'DevOps',
})

export function ExercisesCatalogPage() {
    const { accessToken, user, signOut } = useAuth()
    const { sidebar, topbar } = useExercisesChrome()
    const [searchParams, setSearchParams] = useSearchParams()

    const [planConsultado, setPlanConsultado] = useState(null)

    useEffect(() => {
        if (!accessToken) {
            return undefined
        }

        let activo = true

        getCurrentLearningPlan(accessToken)
            .then((resultado) => {
                if (!activo) {
                    return
                }

                const ruta = resultado?.plan?.specializationKey

                const esValida = (
                    ['recommended', 'confirmed'].includes(
                        resultado?.state,
                    )
                    && Object.hasOwn(
                        NOMBRES_ESPECIALIZACIONES,
                        ruta,
                    )
                )

                setPlanConsultado({
                    token: accessToken,
                    ruta: esValida ? ruta : null,
                    error: false,
                })
            })
            .catch(() => {
                if (activo) {
                    setPlanConsultado({
                        token: accessToken,
                        ruta: null,
                        error: true,
                    })
                }
            })

        return () => {
            activo = false
        }
    }, [accessToken])

    const planVigente = (
        planConsultado?.token === accessToken
            ? planConsultado
            : null
    )

    // ========================================================
    // PESTAÑA ACTIVA
    // ========================================================

    const tabParam = searchParams.get('tab') || 'all'

    const tabActiva = EXHIBITION_MODE ? 'all' : PESTANAS.some(
        (tab) => tab.id === tabParam,
    )
        ? tabParam
        : 'all'

    const esCompletados = tabActiva === 'completed'

    // ========================================================
    // ESTADOS DEL CATÁLOGO
    // ========================================================

    const [catalogoConsultado, setCatalogoConsultado] =
        useState(null)

    useEffect(() => {
        if (!accessToken) {
            return undefined
        }

        let activo = true

        getAcademicCatalog(accessToken)
            .then((resultado) => {
                if (!activo) {
                    return
                }

                if (!Array.isArray(resultado?.specializations)) {
                    throw new Error('Respuesta académica inválida')
                }

                setCatalogoConsultado({
                    token: accessToken,
                    especializaciones: resultado.specializations,
                    personalization: resultado.personalization ?? null,
                    error: false,
                })
            })
            .catch(() => {
                if (activo) {
                    setCatalogoConsultado({
                        token: accessToken,
                        especializaciones: [],
                        error: true,
                    })
                }
            })

        return () => {
            activo = false
        }
    }, [accessToken])

    const catalogoVigente =
        catalogoConsultado?.token === accessToken
            ? catalogoConsultado
            : null

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
        <main className="inicio-layout excat-layout">

            {/*
             * SIDEBAR COMPARTIDO CON PERFIL
             *
             * Se reutilizan:
             * - Navegación.
             * - Tarjeta Pro.
             * - Mascota transparente.
             * - Racha semanal.
             */}
            <LearningSidebar {...sidebar} />

            <div className="inicio-workspace excat-workspace">

                {/* Barra superior */}
                <ProfileTopbar
                    userName={nombre}
                    onLogout={cerrarSesion}
                    {...topbar}
                />

                <div className="excat-content excat-content--catalog">
                    <nav className="excat-breadcrumbs" aria-label="Navegación del catálogo">
                        <Link to="/dashboard"><FiHome aria-hidden="true" /> Inicio</Link>
                        <FiChevronRight aria-hidden="true" />
                        <span>Ejercicios</span>
                    </nav>

                    {/* =========================================
                        ENCABEZADO DEL CATÁLOGO

                        Completados utiliza la imagen especial.
                        Las demás pestañas conservan el dragón
                        con laptop.
                       ========================================= */}

                    <header
                        className={
                            'excat-intro excat-intro--catalog'
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
                                    : '/images/dragon-laptop-512.png'
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

                    {/* Exposición: controles de un catálogo anterior aún no integrado al API. */}
                    {!EXHIBITION_MODE && <>
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
                    </>}

                    {/* =========================================
                        EJERCICIO RECOMENDADO
                       ========================================= */}


                    {tabActiva === 'all' && (
                        <section className="excat-featured excat-featured--catalog">
                            <img
                                src={IMAGENES.dragon}
                                alt="Mascota Learn2Code"
                                className="excat-featured__image"
                            />

                            <div className="excat-featured__content">
                                <span className="excat-featured__badge">
                                    <FiTarget aria-hidden="true" />
                                    Catálogo académico
                                </span>

                                <h2>
                                    Explora tu camino de aprendizaje
                                </h2>

                                <p>
                                    Explora las especializaciones y sus
                                    etapas. Encuentra ejercicios reales
                                    en las unidades académicas publicadas.
                                </p>

                                {catalogoVigente?.personalization?.status === 'personalized' && (
                                    <p className="exacademy-personal-note">
                                        Nivel obtenido: <strong>
                                            {catalogoVigente.personalization.difficulty.name}
                                        </strong>. Las etapas recomendadas se calculan
                                        con tu diagnóstico y tu desempeño.
                                    </p>
                                )}
                                {catalogoVigente?.personalization?.status === 'diagnostic_required' && (
                                    <p className="exacademy-personal-note">
                                        Realiza el diagnóstico para activar recomendaciones
                                        personalizadas.
                                        <Link
                                            to="/diagnostic"
                                            className="exacademy-personal-note__action"
                                        >
                                            Iniciar diagnóstico
                                        </Link>
                                    </p>
                                )}

                                <div className="excat-featured__meta">
                                    <span>
                                        <FiActivity aria-hidden="true" />
                                        {catalogoVigente?.especializaciones
                                            ?.length ?? 0} especializaciones
                                    </span>
                                </div>
                            </div>

                            <div
                                className="excat-featured__route"
                                aria-live="polite"
                            >
                                <FiTarget aria-hidden="true" />

                                {planVigente?.ruta
                                    ? `IA recomienda: ${NOMBRES_ESPECIALIZACIONES[
                                    planVigente.ruta
                                    ]
                                    }`
                                    : planVigente?.error
                                        ? 'No se pudo consultar la recomendación'
                                        : planVigente
                                            ? 'Sin recomendación de IA disponible'
                                            : 'Consultando recomendación...'}
                            </div>

                            <Link
                                className="excat-featured__button"
                                to={planVigente?.ruta
                                    ? `/exercises/specializations/${planVigente.ruta}`
                                    : '/exercises#catalogo-academico'}
                            >
                                <FiArrowRight aria-hidden="true" />
                                {planVigente?.ruta
                                    ? 'Ver mi especialización'
                                    : 'Explorar especializaciones'}
                            </Link>
                        </section>
                    )}


                    {/* =========================================
                        RESULTADOS DE BÚSQUEDA
                       ========================================= */}


                    <section
                        className="excat-results"
                        id="catalogo-academico"
                        aria-label="Catálogo académico"
                    >
                        <div className="excat-results__heading">
                            <h2>Especializaciones y etapas</h2>

                            <span>
                                {catalogoVigente?.error
                                    ? 'No disponible'
                                    : catalogoVigente
                                        ? `${catalogoVigente.especializaciones.length} especializaciones`
                                        : 'Consultando...'}
                            </span>
                        </div>

                        {!catalogoVigente ? (
                            <div
                                className="excat-empty"
                                role="status"
                            >
                                <h3>
                                    Consultando el catálogo académico...
                                </h3>
                            </div>
                        ) : catalogoVigente.error ? (
                            <div
                                className="excat-empty"
                                role="alert"
                            >
                                <h3>
                                    No pudimos consultar el catálogo académico
                                </h3>

                                <p>
                                    Comprueba tu conexión e inténtalo
                                    nuevamente.
                                </p>
                            </div>
                        ) : catalogoVigente.especializaciones.length === 0 ? (
                            <div className="excat-empty">
                                <h3>
                                    No hay especializaciones registradas
                                </h3>
                            </div>
                        ) : (
                            <div className="excat-grid">
                                {[...catalogoVigente.especializaciones]
                                    .sort((a, b) =>
                                        Number(b.key === planVigente?.ruta)
                                        - Number(a.key === planVigente?.ruta))
                                    .map((especializacion) => (
                                        <article
                                            className={
                                                'excat-card excat-specialization'
                                                + (
                                                    ICONOS_ESPECIALIZACION[especializacion.key]
                                                        ? ' excat-specialization--' + especializacion.key
                                                        : ''
                                                )
                                            }
                                            key={especializacion.key}
                                        >
                                            <div className="excat-specialization__header">
                                                <span className="excat-specialization__icon">
                                                    <IconoEspecializacion tipo={especializacion.key} />
                                                </span>
                                                <div className="excat-card__details">
                                                    <h3>{especializacion.name}</h3>
                                                    <p>
                                                        {especializacion.stages.length}
                                                        {' '}etapas registradas
                                                    </p>
                                                    {especializacion.key === planVigente?.ruta
                                                        && especializacion.personalization?.recommendedStageId && (
                                                        <span className="exacademy-personalization-badge is-compact">
                                                            <FiTarget aria-hidden="true" />
                                                            Recorrido sugerido para ti
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <ol className="excat-specialization__stages">
                                                {especializacion.stages.map(
                                                    (etapa) => (
                                                        <li
                                                            key={etapa.id}
                                                            className="excat-specialization__stage"
                                                        >
                                                            <div className="excat-specialization__stage-main">
                                                                <FiCode
                                                                    aria-hidden="true"
                                                                    className="excat-specialization__stage-icon"
                                                                />
                                                                <div className="excat-specialization__stage-info">
                                                                    <strong>
                                                                {etapa.modules.some(
                                                                    (modulo) =>
                                                                        modulo.units.length > 0
                                                                ) ? (
                                                                    <Link
                                                                        to={`/exercises/stages/${etapa.id}`}
                                                                    >
                                                                        {etapa.title}
                                                                    </Link>
                                                                ) : (
                                                                    <span>
                                                                        {etapa.title}
                                                                    </span>
                                                                )}
                                                                    </strong>
                                                                    {especializacion.key === planVigente?.ruta
                                                                        && etapa.personalization?.recommended && (
                                                                        <AcademicPersonalizationBadge
                                                                            compact
                                                                            personalization={{
                                                                                recommended: true,
                                                                            }}
                                                                        />
                                                                    )}
                                                                    <span className={
                                                                        etapa.status === 'planned'
                                                                            ? 'excat-specialization__stage-status'
                                                                            : 'excat-specialization__stage-status is-published'
                                                                    }>
                                                                        {etapa.status === 'planned'
                                                                            ? 'En preparación'
                                                                            : 'Etapa publicada'}
                                                                    </span>
                                                                </div>
                                                                <FiChevronRight
                                                                    className="excat-specialization__stage-arrow"
                                                                    aria-hidden="true"
                                                                />
                                                            </div>

                                                            {etapa.modules.length > 0 && (
                                                                <details className="excat-specialization__details">
                                                                    <summary>Ver contenido de la etapa</summary>
                                                                    <ul>
                                                                    {etapa.modules.map(
                                                                        (modulo) => (
                                                                            <li key={modulo.id}>
                                                                                {modulo.title}

                                                                                {modulo.units.length > 0 ? (
                                                                                    <ul>
                                                                                        {modulo.units.map(
                                                                                            (unidad) => (
                                                                                                <li key={unidad.id}>
                                                                                                    {unidad.title}
                                                                                                </li>
                                                                                            ),
                                                                                        )}
                                                                                    </ul>
                                                                                ) : (
                                                                                    <span>
                                                                                        {' · Sin unidades publicadas'}
                                                                                    </span>
                                                                                )}
                                                                            </li>
                                                                        ),
                                                                    )}
                                                                    </ul>
                                                                </details>
                                                            )}
                                                        </li>
                                                    ),
                                                )}
                                            </ol>

                                            {Object.hasOwn(
                                                NOMBRES_ESPECIALIZACIONES,
                                                especializacion.key,
                                            ) && (
                                                    <Link
                                                        className="excat-card__action excat-specialization__action"
                                                        to={`/exercises/specializations/${especializacion.key}`}
                                                    >
                                                        <FiArrowRight aria-hidden="true" />
                                                        Ver especialización
                                                    </Link>
                                                )}
                                        </article>
                                    ),
                                )}
                            </div>
                        )}
                    </section>

                    {(tabActiva !== 'all' || ejerciciosFiltrados.length > 0) && (
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
                                    {tabActiva === 'all'
                                        ? 'Todavía no hay ejercicios publicados'
                                        : 'No hay ejercicios en esta sección'}
                                </h3>

                                <p>
                                    {tabActiva === 'all'
                                        ? 'Las actividades aparecerán cuando se publiquen las unidades académicas.'
                                        : 'Aún no hay registros disponibles para esta pestaña.'}
                                </p>
                            </div>
                        )}

                        </section>
                    )}

                    {/* =========================================
                        BANNER DEL CHATBOT
                       ========================================= */}

                    {!EXHIBITION_MODE && ejerciciosFiltrados.length > 0 && (
                        <BannerAyuda
                            onOpen={abrirPistas}
                            dragon={IMAGENES.dragon}
                        />
                    )}

                </div>
            </div>

            {/* =============================================
                CHATBOT LATERAL EXISTENTE
               ============================================= */}

            {!EXHIBITION_MODE && <PanelPistasEjercicio
                abierto={panelAbierto}
                alCerrar={cerrarPistas}
                tituloEjercicio="Catálogo de ejercicios"
            />}

        </main>
    )
}

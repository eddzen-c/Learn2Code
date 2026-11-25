
import {
    useEffect,
    useState,
} from 'react'

import {
    Link,
    useNavigate,
    useParams,
} from 'react-router-dom'

import {
    FiArrowLeft,
    FiArrowRight,
    FiBookOpen,
    FiCheckCircle,
    FiClock,
    FiLayers,
    FiTarget,
    FiTag,
} from 'react-icons/fi'

import {
    assignAcademicExerciseAssignment,
    generateAcademicUnitPractice,
    getAcademicCatalog,
    getAcademicUnitExercises,
} from '../api/exercise.api.js'

import { useAuth } from '../auth/useAuth.js'
import { useExercisesChrome } from '../hooks/useExercisesChrome.js'

import {
    LearningSidebar,
} from '../components/LearningSidebar.jsx'

import {
    ProfileTopbar,
} from '../components/ProfileTopbar.jsx'

import {
    isSuggestedUnitExercise,
    prioritizeUnitExercises,
} from './academic-unit-prioritization.js'

import './exercises-catalog.css'
import './academic-unit-redesign.css'

const buscarUnidad = (especializaciones, unitId) => {
    for (const especializacion of especializaciones) {
        for (const etapa of especializacion.stages ?? []) {
            for (const modulo of etapa.modules ?? []) {
                const unidad = modulo.units?.find(
                    (item) => item.id === unitId,
                )

                if (unidad) {
                    return {
                        especializacion,
                        etapa,
                        modulo,
                        unidad,
                    }
                }
            }
        }
    }

    return null
}

export function AcademicUnitPage() {
    const { unitId } = useParams()
    const navigate = useNavigate()

    const {
        accessToken,
        user,
        signOut,
    } = useAuth()
    const { sidebar, topbar } = useExercisesChrome()

    const [consulta, setConsulta] = useState(null)
    const [consultaEjercicios, setConsultaEjercicios] =
        useState(null)

    const [asignandoId, setAsignandoId] = useState(null)
    const [errorAsignacion, setErrorAsignacion] = useState('')

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

                setConsulta({
                    token: accessToken,
                    unitId,
                    detalle: buscarUnidad(
                        resultado.specializations,
                        unitId,
                    ),
                    personalization: resultado.personalization ?? null,
                    error: false,
                })
            })
            .catch(() => {
                if (activo) {
                    setConsulta({
                        token: accessToken,
                        unitId,
                        detalle: null,
                        error: true,
                    })
                }
            })

        return () => {
            activo = false
        }
    }, [accessToken, unitId])

    const vigente = (
        consulta?.token === accessToken
        && consulta?.unitId === unitId
    )
        ? consulta
        : null

    const detalle = vigente?.detalle
    const perfilAcademico = vigente?.personalization
    const consejoUnidad = detalle?.unidad?.personalization ?? null
    const diagnosticoCompletado =
        perfilAcademico?.status === 'personalized'
    const dificultadSugerida = diagnosticoCompletado
        ? consejoUnidad?.suggestedDifficulty : null

    useEffect(() => {
        if (!accessToken || !detalle) {
            return undefined
        }

        let activo = true

        getAcademicUnitExercises({
            accessToken,
            unitId,
        })
            .then((resultado) => {
                if (!activo) {
                    return
                }

                if (
                    resultado?.unit?.id !== unitId
                    || !Array.isArray(resultado?.exercises)
                ) {
                    throw new Error(
                        'Respuesta de ejercicios inválida',
                    )
                }

                setConsultaEjercicios({
                    token: accessToken,
                    unitId,
                    ejercicios: resultado.exercises,
                    error: false,
                })
            })
            .catch(() => {
                if (activo) {
                    setConsultaEjercicios({
                        token: accessToken,
                        unitId,
                        ejercicios: [],
                        error: true,
                    })
                }
            })

        return () => {
            activo = false
        }
    }, [accessToken, detalle, unitId])

    const ejerciciosVigentes = (
        consultaEjercicios?.token === accessToken
        && consultaEjercicios?.unitId === unitId
        && Boolean(detalle)
    )
        ? consultaEjercicios
        : null

    const ejerciciosOrdenados = prioritizeUnitExercises(
        ejerciciosVigentes?.ejercicios,
        dificultadSugerida,
    )
    const ejerciciosFinalizados = ejerciciosOrdenados.filter(
        (ejercicio) => ejercicio.completed,
    ).length

    const temasDeLaUnidad = [...new Set(
        (ejerciciosVigentes?.ejercicios ?? [])
            .map((ejercicio) => ejercicio.topic)
            .filter((tema) => typeof tema === 'string' && tema.trim()),
    )]

    const handlePracticaPersonalizada = async () => {
        if (!accessToken || !detalle || asignandoId) return

        setAsignandoId('personalized')
        setErrorAsignacion('')
        try {
            const resultado = await generateAcademicUnitPractice({
                accessToken,
                unitId,
            })
            const assignmentId = resultado?.assignment?.id
            if (!assignmentId) throw new Error('La práctica no tiene identificador.')

            navigate(
                `/resolver-ejercicio-real?assignment=${encodeURIComponent(assignmentId)}`,
            )
        } catch (error) {
            setErrorAsignacion(
                error?.code === 'ACADEMIC_DIAGNOSTIC_REQUIRED'
                    ? 'Completa el diagnóstico para recibir ejercicios a tu nivel.'
                    : 'No fue posible preparar la práctica personalizada. Puedes usar los ejercicios publicados.',
            )
        } finally {
            setAsignandoId(null)
        }
    }

    const handleResolverEjercicio = async (exerciseId) => {
        if (
            !accessToken
            || !detalle
            || asignandoId
        ) {
            return
        }

        setAsignandoId(exerciseId)
        setErrorAsignacion('')

        try {
            const resultado =
                await assignAcademicExerciseAssignment({
                    accessToken,
                    unitId,
                    exerciseId,
                })

            const assignmentId =
                resultado?.assignment?.id

            if (!assignmentId) {
                throw new Error(
                    'La asignación no tiene identificador.',
                )
            }

            navigate(
                `/resolver-ejercicio-real?assignment=${encodeURIComponent(assignmentId)}`,
            )
        } catch (error) {
            if (
                error?.code ===
                'ACADEMIC_EXERCISE_ASSIGNMENT_CONFLICT'
            ) {
                setErrorAsignacion(
                    'Este ejercicio ya tiene una asignación activa en otro contexto.',
                )
            } else {
                setErrorAsignacion(
                    'No fue posible abrir el ejercicio. Inténtalo nuevamente.',
                )
            }
        } finally {
            setAsignandoId(null)
        }
    }

    return (
        <main className="inicio-layout excat-layout">
            <LearningSidebar {...sidebar} />

            <div className="inicio-workspace excat-workspace">
                <ProfileTopbar
                    userName={user?.fullName?.trim() || 'Estudiante'}
                    onLogout={signOut}
                    {...topbar}
                />

                <div className="excat-content excat-content--academic-unit">
                    <nav className="exunit-breadcrumbs" aria-label="Ruta académica">
                        <Link to="/dashboard">Inicio</Link>
                        <span aria-hidden="true">/</span>
                        <Link to="/routes">Rutas</Link>
                        {detalle && (
                            <>
                                <span aria-hidden="true">/</span>
                                <Link to={`/routes/${detalle.especializacion.key}`}>
                                    {detalle.especializacion.name}
                                </Link>
                                <span aria-hidden="true">/</span>
                                <Link to={`/exercises/stages/${detalle.etapa.id}`}>
                                    {detalle.etapa.title}
                                </Link>
                                <span aria-hidden="true">/</span>
                                <strong>{detalle.modulo.title}</strong>
                            </>
                        )}
                    </nav>
                    <Link
                        className="excat-card__action exunit-back"
                        to={
                            detalle
                                ? `/exercises/stages/${detalle.etapa.id}`
                                : '/exercises'
                        }
                    >
                        <FiArrowLeft aria-hidden="true" />
                        {detalle
                            ? 'Volver a la etapa'
                            : 'Volver al catálogo'}
                    </Link>

                    <header className="excat-intro exunit-hero">
                        <div>
                            <h1>
                                {detalle
                                    ? detalle.unidad.title
                                    : 'Unidad académica'}
                            </h1>

                            <p>
                                {detalle
                                    ? `${detalle.especializacion.name} · ${detalle.etapa.title} · ${detalle.modulo.title}`
                                    : 'Contenido académico de Learn2Code'}
                            </p>
                        </div>

                        <img
                            src="/images/exercises-redesign/unit-dragon.jpg"
                            alt=""
                        />
                    </header>

                    <div className="exunit-body">
                    <section
                        className="excat-results exunit-missions"
                        aria-label="Detalle de unidad académica"
                    >
                        {!vigente ? (
                            <div
                                className="excat-empty"
                                role="status"
                            >
                                <h2>
                                    Consultando la unidad académica...
                                </h2>
                            </div>
                        ) : vigente.error ? (
                            <div
                                className="excat-empty"
                                role="alert"
                            >
                                <h2>
                                    No fue posible consultar la unidad
                                </h2>
                            </div>
                        ) : !detalle ? (
                            <div
                                className="excat-empty"
                                role="status"
                            >
                                <h2>Unidad no disponible</h2>

                                <p>
                                    La unidad solicitada no está
                                    publicada o no existe.
                                </p>
                            </div>
                        ) : (
                            <>
                                <header className="exunit-missions__banner">
                                    <span className="exunit-missions__mark">
                                        <FiLayers aria-hidden="true" />
                                    </span>
                                    <div>
                                        <h2>Misiones de la unidad</h2>
                                        <p>Practica lo aprendido con ejercicios publicados.</p>
                                    </div>
                                    {ejerciciosVigentes && !ejerciciosVigentes.error && (
                                        <span className="exunit-missions__count">
                                            {ejerciciosFinalizados} de {ejerciciosVigentes.ejercicios.length}
                                            {' '}finalizados
                                        </span>
                                    )}
                                </header>

                                {perfilAcademico && (
                                    <section
                                        className="exunit-personalizada"
                                        aria-label="Práctica recomendada para ti"
                                    >
                                        <div>
                                            <span className="exunit-personalizada__eyebrow">
                                                Tu aprendizaje personalizado
                                            </span>
                                            <h3>
                                                {diagnosticoCompletado
                                                    ? 'Practica a tu nivel'
                                                    : 'Descubre tu nivel de conocimientos'}
                                            </h3>
                                            <p>
                                                {diagnosticoCompletado
                                                    ? consejoUnidad?.message
                                                        ?? 'Prepara una práctica según tu diagnóstico y tu desempeño.'
                                                    : 'Completa el diagnóstico para recibir retos ajustados a tus conocimientos.'}
                                            </p>
                                            {diagnosticoCompletado && perfilAcademico?.difficulty?.name && (
                                                <small>
                                                    Nivel de referencia: {perfilAcademico.difficulty.name}
                                                    {consejoUnidad?.mastery !== null
                                                        && consejoUnidad?.mastery !== undefined
                                                        ? ` · Dominio registrado: ${consejoUnidad.mastery}%`
                                                        : ''}
                                                </small>
                                            )}
                                        </div>
                                        {diagnosticoCompletado ? (
                                            <button
                                                type="button"
                                                className="exunit-personalizada__button"
                                                onClick={handlePracticaPersonalizada}
                                                disabled={Boolean(asignandoId)}
                                            >
                                                {asignandoId === 'personalized'
                                                    ? 'Preparando tu práctica...'
                                                    : 'Generar ejercicio a mi nivel'}
                                                <FiArrowRight aria-hidden="true" />
                                            </button>
                                        ) : (
                                            <Link
                                                to="/diagnostic"
                                                className="exunit-personalizada__button"
                                            >
                                                Realizar diagnóstico
                                                <FiArrowRight aria-hidden="true" />
                                            </Link>
                                        )}
                                    </section>
                                )}

                                <div className="excat-results__heading exunit-missions__subtitle">
                                    <h2>
                                        <FiBookOpen aria-hidden="true" />
                                        Ejercicios de la unidad
                                    </h2>
                                </div>

                                {errorAsignacion && (
                                    <div
                                        className="excat-empty"
                                        role="alert"
                                    >
                                        <p>{errorAsignacion}</p>
                                    </div>
                                )}

                                {!ejerciciosVigentes ? (
                                    <div
                                        className="excat-empty"
                                        role="status"
                                    >
                                        <h3>
                                            Consultando ejercicios...
                                        </h3>
                                    </div>
                                ) : ejerciciosVigentes.error ? (
                                    <div
                                        className="excat-empty"
                                        role="alert"
                                    >
                                        <h3>
                                            No fue posible consultar los ejercicios
                                        </h3>
                                    </div>
                                ) : ejerciciosVigentes.ejercicios.length === 0 ? (
                                    <div
                                        className="excat-empty"
                                        role="status"
                                    >
                                        <h3>
                                            Esta unidad todavía no tiene ejercicios publicados.
                                        </h3>
                                    </div>
                                ) : (
                                    ejerciciosOrdenados.map(
                                        (ejercicio) => (
                                            <article
                                                className={
                                                    'excat-card exunit-mission-card'
                                                    + (ejercicio.completed ? ' is-completed' : '')
                                                }
                                                key={ejercicio.id}
                                            >
                                                <span className="exunit-mission-card__icon">
                                                    <FiLayers aria-hidden="true" />
                                                </span>
                                                <div className="excat-card__details">
                                                    <div className="exunit-mission-card__title">
                                                        <h3>{ejercicio.title}</h3>
                                                        <span className={
                                                            'exunit-badge'
                                                            + (ejercicio.completed ? ' is-completed' : '')
                                                        }>
                                                            <FiCheckCircle aria-hidden="true" />
                                                            {ejercicio.completed
                                                                ? 'Finalizado'
                                                                : ejercicio.inProgress
                                                                    ? 'En progreso'
                                                                    : isSuggestedUnitExercise(ejercicio, dificultadSugerida)
                                                                        ? 'Sugerido para tu nivel'
                                                                        : 'Disponible'}
                                                        </span>
                                                    </div>

                                                    <p>
                                                        {ejercicio.statement}
                                                    </p>

                                                    {ejercicio.instructions && (
                                                        <p>
                                                            {ejercicio.instructions}
                                                        </p>
                                                    )}

                                                    {(
                                                        ejercicio.topic
                                                        || ejercicio.difficulty
                                                        || ejercicio.language
                                                    ) && (
                                                            <p>
                                                                {[
                                                                    ejercicio.topic,
                                                                    ejercicio.difficulty,
                                                                    ejercicio.language,
                                                                ]
                                                                    .filter(Boolean)
                                                                    .join(' · ')}
                                                            </p>
                                                        )}

                                                    {Number.isFinite(
                                                        ejercicio.estimatedMinutes,
                                                    ) && ejercicio.estimatedMinutes > 0 && (
                                                            <p className="exunit-mission-card__time">
                                                                <FiClock aria-hidden="true" />
                                                                Tiempo estimado:{' '}
                                                                {ejercicio.estimatedMinutes}
                                                                {' '}minutos
                                                            </p>
                                                        )}
                                                </div>

                                                <button
                                                    className="excat-card__action exunit-mission-card__button"
                                                    type="button"
                                                    aria-label={`Resolver ejercicio: ${ejercicio.title}`}
                                                    disabled={Boolean(asignandoId)}
                                                    onClick={() => {
                                                        handleResolverEjercicio(
                                                            ejercicio.id,
                                                        )
                                                    }}
                                                >
                                                    {asignandoId === ejercicio.id
                                                        ? 'Abriendo ejercicio...'
                                                        : ejercicio.completed
                                                            ? 'Volver a practicar'
                                                            : ejercicio.inProgress
                                                                ? 'Continuar ejercicio'
                                                                : 'Resolver ejercicio'}
                                                    <FiArrowRight aria-hidden="true" />
                                                </button>
                                            </article>
                                        ),
                                    )
                                )}
                            </>
                        )}
                    </section>

                    {detalle && !vigente?.error && (
                        <aside className="exunit-sidebar" aria-label="Información de la unidad">
                            <section className="exunit-sidebar__panel">
                                <h2>
                                    <FiTarget aria-hidden="true" />
                                    Objetivo de la unidad
                                </h2>
                                <p>
                                    {detalle.unidad.description
                                        || 'Esta unidad todavía no tiene una descripción.'}
                                </p>
                            </section>

                            <section className="exunit-sidebar__panel">
                                <h2>
                                    <FiTag aria-hidden="true" />
                                    Lo que practicarás
                                </h2>
                                {temasDeLaUnidad.length > 0 ? (
                                    <ul>
                                        {temasDeLaUnidad.map((tema) => (
                                            <li key={tema}>
                                                <FiCheckCircle aria-hidden="true" />
                                                <span>{tema}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>
                                        Los temas aparecerán cuando se publiquen
                                        los ejercicios de la unidad.
                                    </p>
                                )}
                            </section>

                            {detalle.etapa.status === 'planned' && (
                                <p className="exunit-sidebar__note">
                                    El contenido de esta etapa sigue en preparación.
                                </p>
                            )}
                        </aside>
                    )}
                    </div>
                </div>
            </div>
        </main>
    )
}

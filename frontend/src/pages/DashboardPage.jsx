
/**
 * Learn2Code - Dashboard del estudiante.
 *
 * Reutiliza LearningSidebar y ProfileTopbar.
 * Muestra estadísticas reales del backend y conserva
 * los módulos demostrativos del mockup de Inicio.
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
    FiActivity,
    FiArrowRight,
    FiAward,
    FiBookOpen,
    FiCheckCircle,
    FiClock,
    FiCode,
    FiFlag,
    FiLayers,
    FiMessageCircle,
    FiPlay,
    FiTarget,
    FiTrendingUp,
    FiZap,
} from 'react-icons/fi'

import { FaFire, FaStar } from 'react-icons/fa'

import { useAuth } from '../auth/useAuth.js'
import { getDashboardSummary } from '../api/dashboard.api.js'
import { getAcademicCatalog } from '../api/exercise.api.js'
import { getAuthErrorMessage } from '../auth/auth-error-message.js'

import { LearningSidebar } from '../components/LearningSidebar.jsx'
import { ProfileTopbar } from '../components/ProfileTopbar.jsx'

import './dashboard.css'

// Recursos disponibles para las tarjetas del Dashboard.
const IMAGES = {
    dragon: '/images/learn2code-mascot-laptop-transparent.png',
    dragonSidebar: '/images/dragon-laptop-512.png',
    javascript: '/images/tecnologia-javascript-32_dashboard.png',
}


// Mantiene los valores de progreso entre 0 y 100.
function normalizePercentage(value) {
    const number = Number(value)

    if (!Number.isFinite(number)) return 0

    return Math.max(0, Math.min(100, Math.round(number)))
}

// Indicador circular de progreso.
function ProgressCircle({ value, size = 'normal' }) {
    const percentage = normalizePercentage(value)

    return (
        <div
            className={`inicio-progress-circle inicio-progress-circle--${size}`}
            style={{
                '--percentage': `${percentage}%`,
            }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            aria-label="Porcentaje completado"
        >
            <div className="inicio-progress-circle__inside">
                <strong>{percentage}%</strong>
                <span>completado</span>
            </div>
        </div>
    )
}

// Encabezado de las tarjetas, utilizando iconos React.
// No depende de imágenes externas.
function CardHeading({
    icon: Icon,
    title,
    action,
    to,
    onAction,
}) {
    return (
        <div className="inicio-card-heading">
            <h2>
                {Icon && <Icon aria-hidden="true" />}
                <span>{title}</span>
            </h2>

            {action && to && (
                <Link
                    className="inicio-card-heading__action"
                    to={to}
                >
                    {action}
                    <FiArrowRight aria-hidden="true" />
                </Link>
            )}

            {action && onAction && (
                <button
                    type="button"
                    className="inicio-card-heading__action"
                    onClick={onAction}
                >
                    {action}
                </button>
            )}
        </div>
    )
}

// Actividad registrada en el backend.
function ActivityRow({ activity }) {
    const amount = Number(activity.amount) || 0

    return (
        <div className="inicio-activity-item">
            <div className="inicio-activity-item__icon">
                <FiCheckCircle aria-hidden="true" />
            </div>

            <div className="inicio-activity-item__content">
                <strong>
                    {activity.reason || 'Actividad registrada'}
                </strong>

                <p>
                    Movimiento registrado en tu aprendizaje.
                </p>
            </div>

            <div className="inicio-activity-item__meta">
                <strong>
                    {amount > 0 ? '+' : ''}
                    {amount} XP
                </strong>
            </div>
        </div>
    )
}

// Dashboard principal.
export function DashboardPage() {
    const navigate = useNavigate()

    const {
        user,
        accessToken,
        signOut,
    } = useAuth()

    // Información real de progreso del estudiante.
    const [summary, setSummary] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [reloadKey, setReloadKey] = useState(0)
    const [academicCatalog, setAcademicCatalog] = useState(null)


    // Carga el resumen del usuario autenticado.
    useEffect(() => {
        let active = true

        getDashboardSummary(accessToken)
            .then((data) => {
                if (!active) return

                setSummary(data)
                setError('')
            })
            .catch((requestError) => {
                if (!active) return

                setError(getAuthErrorMessage(requestError))
            })
            .finally(() => {
                if (active) {
                    setLoading(false)
                }
            })

        return () => {
            active = false
        }
    }, [accessToken, reloadKey])

    useEffect(() => {
        if (!accessToken) return undefined
        let active = true
        getAcademicCatalog(accessToken)
            .then((result) => {
                if (active) setAcademicCatalog(result)
            })
            .catch(() => {
                if (active) setAcademicCatalog(null)
            })
        return () => { active = false }
    }, [accessToken, reloadKey])

    // Conserva el cierre de sesión implementado.
    const handleLogout = async () => {
        try {
            await signOut()
        } catch {
            setError(
                'No fue posible completar el cierre de sesión.',
            )
        }
    }

    const handleRetry = () => {
        setLoading(true)
        setError('')
        setReloadKey((current) => current + 1)
    }

    const handleNotifications = () => {
        navigate('/profile', {
            state: {
                openTab: 'notifications',
            },
        })
    }


    // Datos de la sesión actual.
    const fullName =
        user?.fullName?.trim() || 'Estudiante'

    const firstName =
        fullName.split(/\s+/)[0] || 'Estudiante'

    // Estadísticas recuperadas del backend.
    const gamification = summary?.gamification
    const progress = summary?.progress

    const totalXp =
        Number(gamification?.totalXp) || 0

    const currentStreak =
        Number(gamification?.currentStreak) || 0

    const longestStreak =
        Number(gamification?.longestStreak) || 0

    // Porcentaje real de ejercicios resueltos.
    // No representa el avance de una ruta de aprendizaje.
    const exerciseSuccessRate = normalizePercentage(
        progress?.catalogCompletionRate,
    )

    const availableExercises =
        Number(progress?.exercisesAvailable) || 0

    const solvedExercises =
        Number(progress?.exercisesCompleted) || 0

    const codeExecutions =
        Number(progress?.codeExecutions) || 0

    const recentActivity =
        Array.isArray(summary?.recentActivity)
            ? summary.recentActivity
            : []

    const catalogUnits = (academicCatalog?.specializations ?? []).flatMap(
        (specialization) => (specialization.stages ?? []).flatMap(
            (stage) => (stage.modules ?? []).flatMap(
                (module) => (module.units ?? []).map((unit) => ({
                    ...unit,
                    specializationName: specialization.name,
                    stageTitle: stage.title,
                    moduleTitle: module.title,
                })),
            ),
        ),
    )
    const recommendedUnit = catalogUnits.find(
        (unit) => unit.personalization?.recommended === true,
    ) ?? null
    const suggestedUnits = catalogUnits
        .filter((unit) => unit.personalization && unit.personalization.state !== 'completed')
        .sort((a, b) => (
            (a.personalization?.priority ?? Infinity)
            - (b.personalization?.priority ?? Infinity)
        ))
        .slice(0, 3)
    const recommendedLink = recommendedUnit
        ? `/exercises/units/${recommendedUnit.id}`
        : '/routes'
    const personalized = academicCatalog?.personalization?.status === 'personalized'

    return (
        <main className="inicio-layout">

            {/* Barra lateral original de Learn2Code. */}
            <LearningSidebar
                variant="profile"
                activeItem="home"
                mascotSrc={IMAGES.dragonSidebar}
                streakDays={currentStreak}
            />

            <div className="inicio-workspace">

                {/* Cabecera compartida con Perfil. */}
                <ProfileTopbar
                    userName={fullName}
                    onLogout={handleLogout}
                    onOpenNotifications={handleNotifications}
                    streakDays={currentStreak}
                    notificationCount={0}
                />

                <div className="inicio-content">

                    {/* Bienvenida del estudiante. */}
                    <header className="inicio-welcome">
                        <h1>
                            ¡Hola, {firstName}!{' '}
                            <span aria-hidden="true">👋</span>
                        </h1>

                        <p>
                            Continúa tu camino de aprendizaje
                            en programación.
                        </p>
                    </header>

                    {/* Banner de continuación. */}
                    <section className="inicio-banner">
                        <div className="inicio-banner__icon">
                            <FiTarget aria-hidden="true" />
                        </div>

                        <div className="inicio-banner__content">
                            <h2>{recommendedUnit ? 'Tu siguiente unidad recomendada' : 'Tu siguiente paso está aquí'}</h2>
                            <p>{recommendedUnit
                                ? recommendedUnit.title + ' · ' + recommendedUnit.moduleTitle
                                : personalized
                                    ? 'Explora las unidades publicadas para continuar aprendiendo.'
                                    : 'Completa tu diagnóstico para recibir recomendaciones a tu nivel.'}</p>
                            <Link to={recommendedUnit ? recommendedLink : personalized ? '/routes' : '/diagnostic'}>
                                {recommendedUnit ? 'Continuar esta unidad' : personalized ? 'Explorar rutas' : 'Realizar diagnóstico'}
                                <FiArrowRight aria-hidden="true" />
                            </Link>
                        </div>

                        <img
                            src={IMAGES.dragon}
                            alt="Mascota Learn2Code programando"
                            className="inicio-banner__dragon"
                        />
                    </section>

                    {/* Estado de la consulta a la API. */}
                    {loading && (
                        <p
                            className="inicio-loading"
                            role="status"
                        >
                            Actualizando tus estadísticas...
                        </p>
                    )}

                    {error && (
                        <div
                            className="inicio-error"
                            role="alert"
                        >
                            <span>
                                No fue posible actualizar tus datos:
                                {' '}
                                {error}
                            </span>

                            <button
                                type="button"
                                onClick={handleRetry}
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {/* Tarjetas de progreso. */}
                    <section className="inicio-stat-grid">

                        <article className="inicio-card inicio-stat-route">
                            <CardHeading
                                icon={FiBookOpen}
                                title="Ejercicios resueltos"
                            />

                            <div className="inicio-stat-route__body">
                                <ProgressCircle
                                    value={exerciseSuccessRate}
                                />

                                <div className="inicio-route-details">
                                    <span className="inicio-route-name">
                                        <FiCheckCircle aria-hidden="true" />
                                        {solvedExercises} de{' '}
                                        {availableExercises} ejercicios
                                    </span>
                                    <small className="inicio-route-details__scope">
                                        Todas las rutas y tus prácticas asignadas
                                    </small>

                                    <Link to="/exercises">
                                        Continuar practicando
                                        <FiArrowRight
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </div>
                            </div>
                        </article>

                        <article className="inicio-card inicio-stat">
                            <div className="inicio-stat__icon inicio-stat__icon--fire">
                                <FaFire aria-hidden="true" />
                            </div>

                            <div className="inicio-stat__content">
                                <span>Racha actual</span>
                                <strong>
                                    {currentStreak} días
                                </strong>
                                <p>
                                    Mejor racha: {longestStreak} días
                                </p>
                            </div>
                        </article>

                        <article className="inicio-card inicio-stat">
                            <div className="inicio-stat__icon inicio-stat__icon--clock">
                                <FiCode aria-hidden="true" />
                            </div>

                            <div className="inicio-stat__content">
                                <span>
                                    Ejecuciones de código
                                </span>

                                <strong>{codeExecutions}</strong>

                                <p>
                                    Registradas en tu aprendizaje
                                </p>
                            </div>
                        </article>

                        <article className="inicio-card inicio-stat">
                            <div className="inicio-stat__icon inicio-stat__icon--star">
                                <FaStar aria-hidden="true" />
                            </div>

                            <div className="inicio-stat__content">
                                <span>XP total</span>

                                <strong>
                                    {totalXp.toLocaleString('es-MX')} XP
                                </strong>

                                <p>
                                    {gamification?.xpToNextLevel == null
                                        ? 'Experiencia acumulada'
                                        : `${gamification.xpToNextLevel} XP para el próximo nivel`}
                                </p>
                            </div>
                        </article>
                    </section>

                    {/* Aprendizaje y metas. */}
                    <div className="inicio-main-grid">

                        <div className="inicio-main-left">

                            {/* Continúa aprendiendo: icono React. */}
                            <section className="inicio-card inicio-learning">
                                <CardHeading
                                    icon={FiBookOpen}
                                    title="Continúa aprendiendo"
                                    action="Explorar rutas"
                                    to="/routes"
                                />

                                <div className="inicio-lesson">
                                    <div className="inicio-lesson__info">
                                        <div className="inicio-lesson__art"><FiCode aria-hidden="true" /></div>
                                        <div className="inicio-lesson__text">
                                            <small>{recommendedUnit?.specializationName ?? 'Rutas de aprendizaje'}</small>
                                            <h3>{recommendedUnit?.title ?? 'Explora tu siguiente unidad'}</h3>
                                            <strong>{recommendedUnit?.moduleTitle ?? 'Contenido académico publicado'}</strong>
                                            <p>{recommendedUnit?.personalization?.message
                                                ?? 'Realiza el diagnóstico para recibir una recomendación acorde con tus conocimientos.'}</p>
                                        </div>
                                    </div>
                                    <div className="inicio-lesson__footer">
                                        {recommendedUnit?.personalization?.mastery != null && (
                                            <span><FiActivity aria-hidden="true" />
                                                Dominio registrado: {recommendedUnit.personalization.mastery}%
                                            </span>
                                        )}
                                        <Link className="inicio-btn-primary" to={recommendedLink}>
                                            <FiPlay aria-hidden="true" />
                                            {recommendedUnit ? 'Practicar esta unidad' : 'Explorar rutas'}
                                        </Link>
                                    </div>
                                </div>
                            </section>

                            {/* Práctica y proyecto del mockup. */}
                            <div className="inicio-secondary-grid">
                                <section className="inicio-card inicio-small-card">
                                    <CardHeading icon={FiActivity} title="Tu práctica sugerida" />
                                    <div className="inicio-small-card__body">
                                        <div className="inicio-project-icon"><FiTarget aria-hidden="true" /></div>
                                        <div className="inicio-small-card__text">
                                            <h3>{recommendedUnit?.title ?? 'Sin práctica recomendada todavía'}</h3>
                                            <p>{recommendedUnit?.personalization?.message
                                                ?? 'Completa tu diagnóstico para adaptar la práctica a tu nivel.'}</p>
                                        </div>
                                    </div>
                                    <Link className="inicio-btn-outline" to={recommendedLink}>
                                        {recommendedUnit ? 'Abrir práctica' : 'Explorar rutas'}
                                        <FiArrowRight aria-hidden="true" />
                                    </Link>
                                </section>
                                <section className="inicio-card inicio-small-card">
                                    <CardHeading icon={FiLayers} title="Mi plan de aprendizaje" />
                                    <div className="inicio-small-card__body">
                                        <div className="inicio-project-icon"><FiLayers aria-hidden="true" /></div>
                                        <div className="inicio-small-card__text">
                                            <h3>Ruta adaptada a tu perfil</h3>
                                            <p>Consulta tu recomendación basada en el diagnóstico y tus preferencias.</p>
                                        </div>
                                    </div>
                                    <Link className="inicio-btn-outline" to="/my-recommendation">
                                        Ver mi plan <FiArrowRight aria-hidden="true" />
                                    </Link>
                                </section>
                            </div>
                        </div>

                        <div className="inicio-main-right">

                            {/* Exposición: Tu dedicación oculto hasta registrar tiempo real. */}

                            {/* Unidades recomendadas desde los datos reales. */}
                            <section className="inicio-card inicio-challenges">
                                <CardHeading icon={FiFlag} title="Próximas unidades"
                                    action="Ver todas" to="/exercises" />
                                <div className="inicio-challenges__list">
                                    {suggestedUnits.length > 0 ? suggestedUnits.map((unit, index) => (
                                        <Link key={unit.id} className="inicio-challenge"
                                            to={'/exercises/units/' + unit.id}>
                                            <span className="inicio-challenge__number">{index + 1}</span>
                                            <span className="inicio-challenge__content">
                                                <strong>{unit.title}</strong>
                                                <small>{unit.personalization?.message ?? unit.moduleTitle}</small>
                                            </span>
                                            <span className="inicio-challenge__check">
                                                <FiArrowRight aria-hidden="true" />
                                            </span>
                                        </Link>
                                    )) : (
                                        <p>{personalized
                                            ? 'No hay unidades pendientes recomendadas.'
                                            : 'Completa tu diagnóstico para recibir los siguientes retos.'}</p>
                                    )}
                                </div>
                            </section>

                        </div>
                    </div>

                    {/* Actividad y ayuda. */}
                    <div className="inicio-bottom-grid">

                        <section className="inicio-card inicio-activity">
                            <CardHeading
                                icon={FiClock}
                                title="Actividad reciente"
                                action="Ver ejercicios"
                                to="/exercises"
                            />

                            <div className="inicio-activity__list">
                                {recentActivity.length > 0 ? (
                                    recentActivity
                                        .slice(0, 2)
                                        .map((activity) => (
                                            <ActivityRow
                                                key={activity.id}
                                                activity={activity}
                                            />
                                        ))
                                ) : (
                                    <div className="inicio-activity__empty">
                                        <FiAward />

                                        <p>
                                            Tus actividades aparecerán
                                            aquí conforme avances.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="inicio-help">
                            <img
                                src={IMAGES.dragon}
                                alt="Mascota de Learn2Code"
                                className="inicio-help__dragon"
                            />

                            <div className="inicio-help__content">
                                <h2>
                                    ¿Necesitas una mano?
                                </h2>

                                <p>
                                    Haz preguntas, resuelve dudas
                                    y obtén recomendaciones
                                    personalizadas.
                                </p>

                                <Link
                                    to="/routes"
                                    className="inicio-btn-primary"
                                >
                                    <FiMessageCircle />
                                    Explorar mi aprendizaje
                                    <FiArrowRight />
                                </Link>
                            </div>
                        </section>

                    </div>

                    {/* Accesos a funcionalidades existentes. */}
                    <div className="inicio-quick-links">
                        <Link to="/exercises">
                            <FiZap />
                            Ejercicios
                        </Link>

                        <Link to="/routes">
                            <FiTrendingUp />
                            Explorar rutas
                        </Link>

                        <Link to="/my-recommendation">
                            <FiBookOpen />
                            Mi recomendación
                        </Link>

                        <Link to="/badges">
                            <FiAward />
                            Mis logros
                        </Link>
                    </div>

                </div>
            </div>
        </main>
    )
}

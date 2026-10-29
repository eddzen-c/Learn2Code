
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
    FiCheck,
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

// Retos ilustrativos mientras se integra su API.
const initialChallenges = [
    {
        id: 1,
        title: 'Completar Manipulación del DOM',
        description: 'Termina la lección 3.2 de tu ruta.',
    },
    {
        id: 2,
        title: 'Resolver 3 ejercicios',
        description: 'Practica para afianzar lo aprendido.',
    },
    {
        id: 3,
        title: 'Avanzar en tu proyecto',
        description: 'Completa la siguiente etapa.',
    },
]

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

    // Estados locales de las secciones demostrativas.
    const [completedChallenges, setCompletedChallenges] =
        useState([])

    const [weeklyGoalMinutes, setWeeklyGoalMinutes] =
        useState(240)

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

    // Permite marcar retos sin modificar el backend.
    const toggleChallenge = (id) => {
        setCompletedChallenges((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id],
        )
    }

    // Alterna una meta de ejemplo entre 4 y 5 horas.
    const handleEditGoal = () => {
        setWeeklyGoalMinutes((current) =>
            current === 240 ? 300 : 240,
        )
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

    const routeProgress = normalizePercentage(
        progress?.completionRate,
    )

    const recentActivity =
        Array.isArray(summary?.recentActivity)
            ? summary.recentActivity
            : []

    // Datos visuales pendientes de conectar a la API.
    const weeklyMinutes = 165
    const weeklyPercentage = normalizePercentage(
        (weeklyMinutes / weeklyGoalMinutes) * 100,
    )

    const missingMinutes = Math.max(
        0,
        weeklyGoalMinutes - weeklyMinutes,
    )

    const missingHours = Math.floor(missingMinutes / 60)
    const missingRest = missingMinutes % 60
    const lessonProgress = 60

    return (
        <main className="inicio-layout">

            {/* Barra lateral original de Learn2Code. */}
            <LearningSidebar
                variant="profile"
                activeItem="home"
                mascotSrc={IMAGES.dragonSidebar}
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
                            <h2>
                                Tu siguiente paso está aquí
                            </h2>

                            <p>
                                Retoma tu lección y avanza
                                en tu Ruta Frontend.
                            </p>
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
                                title="Progreso de tu ruta"
                            />

                            <div className="inicio-stat-route__body">
                                <ProgressCircle
                                    value={routeProgress}
                                />

                                <div className="inicio-route-details">
                                    <span className="inicio-route-name">
                                        <FiLayers aria-hidden="true" />
                                        Ruta Frontend
                                    </span>

                                    <Link to="/onboarding">
                                        Ver mi ruta
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
                                <FiClock aria-hidden="true" />
                            </div>

                            <div className="inicio-stat__content">
                                <span>
                                    Tiempo esta semana
                                </span>

                                <strong>2 h 45 min</strong>
                                <p>Tiempo de ejemplo</p>
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
                                    action="Ver mi ruta"
                                    to="/onboarding"
                                />

                                <div className="inicio-lesson">

                                    <div className="inicio-lesson__info">
                                        <div className="inicio-lesson__art">
                                            <FiCode aria-hidden="true" />
                                        </div>

                                        <div className="inicio-lesson__text">
                                            <small>
                                                Ruta Frontend
                                            </small>

                                            <h3>
                                                Manipulación del DOM
                                            </h3>

                                            <strong>
                                                Lección 3.2 ·
                                                Seleccionar elementos
                                            </strong>

                                            <p>
                                                Aprende a seleccionar
                                                elementos del DOM usando
                                                diferentes métodos de
                                                JavaScript.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="inicio-lesson__progress">
                                        <div className="inicio-line">
                                            <span
                                                style={{
                                                    width:
                                                        `${lessonProgress}%`,
                                                }}
                                            />
                                        </div>

                                        <span>
                                            {lessonProgress}% completado
                                        </span>
                                    </div>

                                    <div className="inicio-lesson__footer">
                                        <span>
                                            <FiClock />
                                            20 min
                                        </span>

                                        <span>
                                            <FaStar />
                                            +150 XP
                                        </span>

                                        <span>
                                            <FiActivity />
                                            Intermedio
                                        </span>

                                        <Link
                                            className="inicio-btn-primary"
                                            to="/onboarding"
                                        >
                                            <FiPlay />
                                            Continuar lección
                                        </Link>
                                    </div>

                                </div>
                            </section>

                            {/* Práctica y proyecto del mockup. */}
                            <div className="inicio-secondary-grid">

                                <section className="inicio-card inicio-small-card">
                                    <CardHeading
                                        icon={FiActivity}
                                        title="Tu práctica de hoy"
                                    />

                                    <div className="inicio-small-card__body">
                                        <div className="inicio-javascript-icon">
                                            <img
                                                src={IMAGES.javascript}
                                                alt="JavaScript"
                                            />
                                        </div>

                                        <div className="inicio-small-card__text">
                                            <h3>
                                                Arrays y funciones
                                            </h3>

                                            <small>
                                                JavaScript · Intermedio
                                                · 15 min
                                            </small>

                                            <p>
                                                Pon en práctica lo aprendido
                                                con ejercicios reales y
                                                recibe retroalimentación.
                                            </p>
                                        </div>
                                    </div>

                                    <Link
                                        className="inicio-btn-outline"
                                        to="/exercises"
                                    >
                                        Resolver ejercicio
                                        <FiArrowRight />
                                    </Link>
                                </section>

                                <section className="inicio-card inicio-small-card">
                                    <CardHeading
                                        icon={FiLayers}
                                        title="Proyecto en curso"
                                    />

                                    <div className="inicio-small-card__body">
                                        <div className="inicio-project-icon">
                                            <FiLayers />
                                        </div>

                                        <div className="inicio-small-card__text">
                                            <h3>
                                                Dashboard interactivo
                                            </h3>

                                            <small>
                                                1 de 3 etapas completadas
                                            </small>

                                            <div className="inicio-line inicio-line--small">
                                                <span
                                                    style={{
                                                        width: '33%',
                                                    }}
                                                />
                                            </div>

                                            <p>
                                                Crea un dashboard moderno
                                                con React, gráficos y datos
                                                en tiempo real.
                                            </p>
                                        </div>
                                    </div>

                                    <Link
                                        className="inicio-btn-outline"
                                        to="/onboarding"
                                    >
                                        Continuar proyecto
                                        <FiArrowRight />
                                    </Link>
                                </section>

                            </div>
                        </div>

                        <div className="inicio-main-right">

                            {/* Meta semanal. */}
                            <section className="inicio-card inicio-weekly">
                                <CardHeading
                                    icon={FiTarget}
                                    title="Tu meta semanal"
                                    action="Editar meta"
                                    onAction={handleEditGoal}
                                />

                                <div className="inicio-weekly__body">
                                    <ProgressCircle
                                        value={weeklyPercentage}
                                        size="large"
                                    />

                                    <div className="inicio-weekly__details">
                                        <strong>
                                            2 h 45 min
                                            <span>
                                                {' '}de{' '}
                                                {weeklyGoalMinutes / 60} h
                                            </span>
                                        </strong>

                                        <div className="inicio-line inicio-line--green">
                                            <span
                                                style={{
                                                    width:
                                                        `${weeklyPercentage}%`,
                                                }}
                                            />
                                        </div>

                                        <p>
                                            <FiClock />
                                            {missingHours} h{' '}
                                            {missingRest} min restantes
                                            para alcanzar tu meta.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Lista interactiva de retos. */}
                            <section className="inicio-card inicio-challenges">
                                <CardHeading
                                    icon={FiFlag}
                                    title="Próximos retos"
                                    action="Ver todos"
                                    to="/exercises"
                                />

                                <div className="inicio-challenges__list">
                                    {initialChallenges.map((challenge) => {
                                        const completed =
                                            completedChallenges.includes(
                                                challenge.id,
                                            )

                                        return (
                                            <button
                                                key={challenge.id}
                                                type="button"
                                                className={
                                                    'inicio-challenge'
                                                    + (completed
                                                        ? ' is-complete'
                                                        : '')
                                                }
                                                aria-pressed={completed}
                                                onClick={() =>
                                                    toggleChallenge(
                                                        challenge.id,
                                                    )
                                                }
                                            >
                                                <span className="inicio-challenge__number">
                                                    {challenge.id}
                                                </span>

                                                <span className="inicio-challenge__content">
                                                    <strong>
                                                        {challenge.title}
                                                    </strong>

                                                    <small>
                                                        {challenge.description}
                                                    </small>
                                                </span>

                                                <span className="inicio-challenge__check">
                                                    {completed && (
                                                        <FiCheck />
                                                    )}
                                                </span>
                                            </button>
                                        )
                                    })}
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
                                    to="/onboarding"
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

                        <Link to="/diagnostic">
                            <FiTrendingUp />
                            Diagnóstico
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

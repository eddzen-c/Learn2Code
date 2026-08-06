import {
    useEffect,
    useState,
} from 'react'

import {
    Link,
} from 'react-router-dom'

import {
    getDashboardSummary,
} from '../api/dashboard.api.js'

import {
    getAuthErrorMessage,
} from '../auth/auth-error-message.js'

import {
    useAuth,
} from '../auth/useAuth.js'

import './dashboard.css'

export function DashboardPage() {
    const {
        user,
        accessToken,
        signOut,
    } = useAuth()

    const [summary, setSummary] = useState(null)
    const [dashboardError, setDashboardError] =
        useState('')
    const [logoutError, setLogoutError] =
        useState('')
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let active = true

        getDashboardSummary(accessToken)
            .then((data) => {
                if (active) {
                    setSummary(data)
                    setDashboardError('')
                }
            })
            .catch((error) => {
                if (active) {
                    setSummary(null)

                    setDashboardError(
                        getAuthErrorMessage(error),
                    )
                }
            })

        return () => {
            active = false
        }
    }, [
        accessToken,
        reloadKey,
    ])

    const handleLogout = async () => {
        setLogoutError('')

        try {
            await signOut()
        } catch {
            setLogoutError(
                'La sesión se cerró localmente, pero no fue posible contactar al servidor.',
            )
        }
    }

    const handleRetry = () => {
        setSummary(null)
        setDashboardError('')
        setReloadKey((current) => current + 1)
    }

    // Generador seguro de iniciales si no hay foto de perfil
    const getInitials = (name) => {
        if (!name) return 'U'
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()
    }

    return (
        <main className="dashboard-container light-theme">
            {/* Header principal basado en el Mockup de Learn2Code */}
            <header className="dashboard-main-header">
                <div className="brand-title-group">
                    <div className="brand-logo-badge">
                        <span>[&lt;/&gt;]</span>
                    </div>
                    <h1>
                        Learn<span className="brand-highlight">2Code</span>{' '}
                        <span className="header-divider">—</span> Dashboard del estudiante
                    </h1>
                </div>
                <p className="header-subtitle">
                    Tu progreso, tus metas y todo lo que necesitas para seguir aprendiendo a programar.
                </p>
            </header>

            {/* Barra de Bienvenida y Usuario */}
            <section className="dashboard-header-card">
                <div className="user-welcome">
                    <p className="eyebrow">Panel de control</p>
                    <h2>Hola, {user?.fullName || 'Estudiante'} 👋</h2>
                    <p>{user?.email}</p>
                </div>
                <div className="user-avatar-badge">
                    <div className="avatar-circle">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Perfil del estudiante" />
                        ) : (
                            <span>{getInitials(user?.fullName)}</span>
                        )}
                    </div>
                    <Link to="/profile" className="btn-secondary profile-link-btn">
                        Editar perfil
                    </Link>
                </div>
            </section>

            {/* Pantalla de carga */}
            {!summary && !dashboardError && (
                <p className="dashboard-loading" role="status">
                    Cargando tu progreso...
                </p>
            )}

            {/* Manejo de errores */}
            {dashboardError && (
                <div className="dashboard-error">
                    <p className="form-error" role="alert">
                        {dashboardError}
                    </p>
                    <button onClick={handleRetry} type="button" className="btn-secondary">
                        Reintentar
                    </button>
                </div>
            )}

            {/* Contenido principal cuando llega el summary */}
            {summary && (
                <>
                    {/* Tarjetas de Estadísticas (Gamification) con Iconos */}
                    <section className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-card-header">
                                <span>XP total</span>
                                <span className="stat-icon">⚡</span>
                            </div>
                            <h2>{summary.gamification.totalXp}</h2>
                            <small>
                                {summary.gamification.xpToNextLevel == null
                                    ? 'Nivel máximo alcanzado'
                                    : `${summary.gamification.xpToNextLevel} XP para el siguiente nivel`}
                            </small>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-header">
                                <span>Nivel actual</span>
                                <span className="stat-icon">⭐</span>
                            </div>
                            <h2>
                                {summary.gamification.currentLevel?.name ?? 'Sin nivel'}
                            </h2>
                            <small>
                                Progreso: {summary.gamification.levelProgressPercentage}%
                            </small>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-header">
                                <span>Racha actual</span>
                                <span className="stat-icon">🔥</span>
                            </div>
                            <h2>{summary.gamification.currentStreak} días</h2>
                            <small>Mejor racha: {summary.gamification.longestStreak} días</small>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-header">
                                <span>Insignias</span>
                                <span className="stat-icon">🏆</span>
                            </div>
                            <h2>{summary.gamification.badgesEarned}</h2>
                            <small>Logros obtenidos</small>
                        </div>
                    </section>

                    {/* Panel de Progreso de Ejercicios */}
                    <section className="progress-section">
                        <div className="progress-heading">
                            <div>
                                <p className="eyebrow">Tu progreso</p>
                                <h3>Ejercicios completados</h3>
                            </div>
                            <span className="progress-percentage-badge">
                                {summary.progress.completionRate}%
                            </span>
                        </div>

                        <div
                            aria-label="Progreso de ejercicios"
                            aria-valuemax="100"
                            aria-valuemin="0"
                            aria-valuenow={summary.progress.completionRate}
                            className="progress-track"
                            role="progressbar"
                        >
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${summary.progress.completionRate}%`,
                                }}
                            />
                        </div>

                        <div className="progress-details">
                            <span>Intentados: {summary.progress.exercisesAttempted}</span>
                            <span>Resueltos: {summary.progress.exercisesSolved}</span>
                            <span>Ejecuciones: {summary.progress.codeExecutions}</span>
                        </div>
                    </section>

                    {/* Actividad Reciente */}
                    <section className="activity-panel">
                        <div className="activity-header">
                            <p className="eyebrow">Actividad reciente</p>
                            <h3>Últimos movimientos</h3>
                        </div>

                        {summary.recentActivity.length === 0 ? (
                            <p className="no-activity-text">Aún no hay actividad reciente.</p>
                        ) : (
                            <ul className="activity-list">
                                {summary.recentActivity.map((activity) => (
                                    <li key={activity.id} className="activity-item">
                                        <span>{activity.reason}</span>
                                        <strong className={activity.amount > 0 ? 'xp-positive' : ''}>
                                            {activity.amount > 0 ? '+' : ''}
                                            {activity.amount} XP
                                        </strong>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </>
            )}

            {logoutError && (
                <p className="form-error" role="alert">
                    {logoutError}
                </p>
            )}

            {/* Botones de Navegación Inferior (Footer Actions) */}
            <footer className="dashboard-actions">
                <Link className="btn-primary-blue" to="/exercises">
                    Ejercicios personalizados
                </Link>
                <Link className="btn-secondary" to="/diagnostic">
                    Evaluación de nivel
                </Link>
                <Link className="btn-secondary" to="/badges">
                    Mis insignias
                </Link>
                <button onClick={handleLogout} type="button" className="btn-danger">
                    Cerrar sesión
                </button>
            </footer>
        </main>
    )
}
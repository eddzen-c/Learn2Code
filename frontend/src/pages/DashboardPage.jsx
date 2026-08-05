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

    return (
        <main className="dashboard-page">
            <section className="dashboard-card">
                <header className="dashboard-header">
                    <div>
                        <p className="eyebrow">
                            Panel de aprendizaje
                        </p>

                        <h1>
                            Hola, {user.fullName}
                        </h1>

                        <p>{user.email}</p>
                    </div>

                    <Link to="/profile">
                        Editar perfil
                    </Link>
                </header>

                {!summary && !dashboardError && (
                    <p
                        className="dashboard-loading"
                        role="status"
                    >
                        Cargando tu progreso...
                    </p>
                )}

                {dashboardError && (
                    <div className="dashboard-error">
                        <p
                            className="form-error"
                            role="alert"
                        >
                            {dashboardError}
                        </p>

                        <button
                            onClick={handleRetry}
                            type="button"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {summary && (
                    <>
                        <section className="dashboard-stats">
                            <article>
                                <span>XP total</span>

                                <strong>
                                    {
                                        summary
                                            .gamification
                                            .totalXp
                                    }
                                </strong>

                                <small>
                                    {
                                        summary
                                            .gamification
                                            .xpToNextLevel
                                            == null
                                            ? 'Nivel máximo alcanzado'
                                            : `${summary
                                                .gamification
                                                .xpToNextLevel
                                            } XP para el siguiente nivel`
                                    }
                                </small>
                            </article>

                            <article>
                                <span>Nivel actual</span>

                                <strong>
                                    {
                                        summary
                                            .gamification
                                            .currentLevel
                                            ?.name
                                        ?? 'Sin nivel'
                                    }
                                </strong>

                                <small>
                                    Progreso:{' '}
                                    {
                                        summary
                                            .gamification
                                            .levelProgressPercentage
                                    }%
                                </small>
                            </article>

                            <article>
                                <span>Racha actual</span>

                                <strong>
                                    {
                                        summary
                                            .gamification
                                            .currentStreak
                                    } días
                                </strong>

                                <small>
                                    Mejor racha:{' '}
                                    {
                                        summary
                                            .gamification
                                            .longestStreak
                                    } días
                                </small>
                            </article>

                            <article>
                                <span>Insignias</span>

                                <strong>
                                    {
                                        summary
                                            .gamification
                                            .badgesEarned
                                    }
                                </strong>

                                <small>
                                    Logros obtenidos
                                </small>
                            </article>
                        </section>

                        <section className="progress-panel">
                            <div className="progress-heading">
                                <div>
                                    <p className="eyebrow">
                                        Tu progreso
                                    </p>

                                    <h2>
                                        Ejercicios completados
                                    </h2>
                                </div>

                                <strong>
                                    {
                                        summary
                                            .progress
                                            .completionRate
                                    }%
                                </strong>
                            </div>

                            <div
                                aria-label="Progreso de ejercicios"
                                aria-valuemax="100"
                                aria-valuemin="0"
                                aria-valuenow={
                                    summary
                                        .progress
                                        .completionRate
                                }
                                className="progress-track"
                                role="progressbar"
                            >
                                <span
                                    style={{
                                        width:
                                            `${summary
                                                .progress
                                                .completionRate
                                            }%`,
                                    }}
                                />
                            </div>

                            <div className="progress-details">
                                <span>
                                    Intentados:{' '}
                                    {
                                        summary
                                            .progress
                                            .exercisesAttempted
                                    }
                                </span>

                                <span>
                                    Resueltos:{' '}
                                    {
                                        summary
                                            .progress
                                            .exercisesSolved
                                    }
                                </span>

                                <span>
                                    Ejecuciones:{' '}
                                    {
                                        summary
                                            .progress
                                            .codeExecutions
                                    }
                                </span>
                            </div>
                        </section>

                        <section className="activity-panel">
                            <div>
                                <p className="eyebrow">
                                    Actividad reciente
                                </p>

                                <h2>Últimos movimientos</h2>
                            </div>

                            {
                                summary.recentActivity.length
                                    === 0
                                    ? (
                                        <p>
                                            Aún no hay actividad reciente.
                                        </p>
                                    )
                                    : (
                                        <ul>
                                            {
                                                summary
                                                    .recentActivity
                                                    .map(
                                                        (activity) => (
                                                            <li
                                                                key={
                                                                    activity.id
                                                                }
                                                            >
                                                                <span>
                                                                    {
                                                                        activity.reason
                                                                    }
                                                                </span>

                                                                <strong>
                                                                    {
                                                                        activity.amount
                                                                            > 0
                                                                            ? '+'
                                                                            : ''
                                                                    }
                                                                    {
                                                                        activity.amount
                                                                    } XP
                                                                </strong>
                                                            </li>
                                                        ),
                                                    )
                                            }
                                        </ul>
                                    )
                            }
                        </section>
                    </>
                )}

                {logoutError && (
                    <p
                        className="form-error"
                        role="alert"
                    >
                        {logoutError}
                    </p>
                )}

                <div className="dashboard-actions">
                    <Link
                        className="dashboard-action-link"
                        to="/exercises"
                    >
                        Ejercicios personalizados
                    </Link>
                    <Link
                        className="dashboard-action-link"
                        to="/diagnostic"
                    >
                        Evaluación de nivel
                    </Link>
                    <Link
                        className="dashboard-action-link"
                        to="/badges"
                    >
                        Mis insignias
                    </Link>
                    <button
                        onClick={handleLogout}
                        type="button"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </section>
        </main>
    )
}
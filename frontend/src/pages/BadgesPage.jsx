import {
    useEffect,
    useState,
} from 'react'

import {
    Link,
} from 'react-router-dom'

import {
    getBadgeCatalog,
} from '../api/gamification.api.js'

import {
    useAuth,
} from '../auth/useAuth.js'

const CRITERIA_LABELS = Object.freeze({
    exercises_completed:
        'Ejercicios completados',
    total_xp:
        'Experiencia acumulada',
    current_level:
        'Nivel alcanzado',
    current_streak:
        'Racha actual',
})

const formatEarnedDate = (value) => {
    if (!value) {
        return null
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return null
    }

    return new Intl.DateTimeFormat(
        'es-MX',
        {
            dateStyle: 'medium',
        },
    ).format(date)
}

export function BadgesPage() {
    const {
        accessToken,
    } = useAuth()

    const [catalog, setCatalog] =
        useState(null)

    const [errorMessage, setErrorMessage] =
        useState('')

    const [isLoading, setIsLoading] =
        useState(true)

    const [requestVersion, setRequestVersion] =
        useState(0)

    useEffect(() => {
        let active = true

        getBadgeCatalog(accessToken)
            .then((data) => {
                if (!active) {
                    return
                }

                setCatalog(data)
                setErrorMessage('')
                setIsLoading(false)
            })
            .catch(() => {
                if (!active) {
                    return
                }

                setErrorMessage(
                    'No fue posible cargar tus insignias.',
                )
                setIsLoading(false)
            })

        return () => {
            active = false
        }
    }, [
        accessToken,
        requestVersion,
    ])

    const handleRetry = () => {
        setErrorMessage('')
        setIsLoading(true)

        setRequestVersion(
            (currentVersion) => (
                currentVersion + 1
            ),
        )
    }

    return (
        <main className="badges-page">
            <section className="badges-container">
                <header className="badges-header">
                    <div>
                        <p className="eyebrow">
                            Gamificación
                        </p>

                        <h1>Mis insignias</h1>

                        <p>
                            Desbloquea reconocimientos
                            mientras avanzas en tu
                            aprendizaje.
                        </p>
                    </div>

                    <Link to="/dashboard">
                        Volver al panel
                    </Link>
                </header>

                {isLoading && (
                    <p
                        className="badges-loading"
                        role="status"
                    >
                        Cargando insignias...
                    </p>
                )}

                {errorMessage && (
                    <section
                        className="badges-error"
                        role="alert"
                    >
                        <p>{errorMessage}</p>

                        <button
                            onClick={handleRetry}
                            type="button"
                        >
                            Intentar nuevamente
                        </button>
                    </section>
                )}

                {catalog && !isLoading && (
                    <>
                        <section
                            aria-label="Resumen de insignias"
                            className="badges-summary"
                        >
                            <article>
                                <span>Total</span>
                                <strong>
                                    {catalog.total}
                                </strong>
                            </article>

                            <article>
                                <span>Obtenidas</span>
                                <strong>
                                    {
                                        catalog
                                            .earnedCount
                                    }
                                </strong>
                            </article>

                            <article>
                                <span>Pendientes</span>
                                <strong>
                                    {
                                        catalog
                                            .pendingCount
                                    }
                                </strong>
                            </article>
                        </section>

                        {catalog.badges.length === 0 ? (
                            <p className="badges-empty">
                                Todavía no hay insignias
                                disponibles.
                            </p>
                        ) : (
                            <ul className="badges-grid">
                                {catalog.badges.map(
                                    (badge) => {
                                        const earnedDate =
                                            formatEarnedDate(
                                                badge
                                                    .earnedAt,
                                            )

                                        return (
                                            <li
                                                className={
                                                    badge.earned
                                                        ? 'badge-card badge-card-earned'
                                                        : 'badge-card badge-card-pending'
                                                }
                                                key={badge.id}
                                            >
                                                <div
                                                    aria-hidden="true"
                                                    className="badge-icon"
                                                >
                                                    {badge.earned
                                                        ? '🏆'
                                                        : '🔒'}
                                                </div>

                                                <div className="badge-card-heading">
                                                    <div>
                                                        <p>
                                                            {
                                                                CRITERIA_LABELS[
                                                                badge
                                                                    .criteriaType
                                                                ]
                                                                ?? 'Progreso'
                                                            }
                                                        </p>

                                                        <h2>
                                                            {
                                                                badge.name
                                                            }
                                                        </h2>
                                                    </div>

                                                    <span>
                                                        {badge.earned
                                                            ? 'Obtenida'
                                                            : 'Pendiente'}
                                                    </span>
                                                </div>

                                                <p>
                                                    {
                                                        badge
                                                            .description
                                                    }
                                                </p>

                                                <div
                                                    aria-label={`Progreso de ${badge.name}`}
                                                    aria-valuemax="100"
                                                    aria-valuemin="0"
                                                    aria-valuenow={
                                                        badge
                                                            .progressPercentage
                                                    }
                                                    className="badge-progress-track"
                                                    role="progressbar"
                                                >
                                                    <span
                                                        style={{
                                                            width:
                                                                `${badge.progressPercentage}%`,
                                                        }}
                                                    />
                                                </div>

                                                <div className="badge-progress-detail">
                                                    <span>
                                                        {
                                                            badge
                                                                .currentValue
                                                        }
                                                        /
                                                        {
                                                            badge
                                                                .threshold
                                                        }
                                                    </span>

                                                    <strong>
                                                        {
                                                            badge
                                                                .progressPercentage
                                                        }
                                                        %
                                                    </strong>
                                                </div>

                                                {earnedDate && (
                                                    <p className="badge-earned-date">
                                                        Obtenida el{' '}
                                                        {earnedDate}
                                                    </p>
                                                )}
                                            </li>
                                        )
                                    },
                                )}
                            </ul>
                        )}
                    </>
                )}
            </section>
        </main>
    )
}
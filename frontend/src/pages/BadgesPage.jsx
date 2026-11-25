import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    FiArrowLeft, FiArrowRight, FiAward, FiCheckCircle, FiClock,
    FiLock, FiTarget, FiTrendingUp, FiX,
} from 'react-icons/fi'
import { getBadgeCatalog } from '../api/gamification.api.js'
import { getDashboardSummary } from '../api/dashboard.api.js'
import { useAuth } from '../auth/useAuth.js'
import { LearningSidebar } from '../components/LearningSidebar.jsx'
import { ProfileTopbar } from '../components/ProfileTopbar.jsx'
import './dashboard.css'
import './badges-redesign.css'

const FILTERS = [
    { key: 'all', name: 'Todos los logros', Icon: FiAward },
    { key: 'earned', name: 'Obtenidos', Icon: FiCheckCircle },
    { key: 'pending', name: 'Por desbloquear', Icon: FiLock },
]

const CRITERIA_LABELS = {
    exercises_completed: 'Práctica',
    total_xp: 'Aprendizaje',
    current_level: 'Aprendizaje',
    current_streak: 'Constancia',
}

// Ilustraciones originales del paquete de recursos de las 55 pantallas.
function badgeImage(badge) {
    const name = (badge.name ?? '').normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const images = [
        [/constancia|imparable/, 'insignia-constancia-imparable'],
        [/semana|racha|dias/, 'insignia-semana-aprendiendo'],
        [/primeros pasos|primer paso|primera leccion/, 'insignia-primeros-pasos'],
        [/manos al codigo|ejercicios|practica/, 'insignia-manos-al-codigo'],
        [/curso completado/, 'insignia-curso-completado'],
        [/companera|comunidad/, 'insignia-companera-aprendizaje'],
        [/proyecto terminado/, 'insignia-proyecto-terminado'],
        [/explorador.*ruta/, 'insignia-exploradora-rutas'],
        [/html/, 'insignia-html-en-accion'],
        [/primer aporte/, 'insignia-primer-aporte'],
        [/primera pregunta/, 'insignia-primera-pregunta'],
        [/react/, 'insignia-react-completado'],
        [/dashboard/, 'insignia-dashboard-terminado'],
        [/sql/, 'insignia-exploradora-sql'],
    ]
    const matched = images.find(([pattern]) => pattern.test(name))
    // Una imagen genérica nunca se presenta como insignia obtenida.
    return '/images/logros/' + (matched?.[1] ?? 'insignia-primeros-pasos') + '-128.webp'
}

function formatDate(value) {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat(
        'es-MX', { dateStyle: 'medium' },
    ).format(date)
}

function BadgeCard({ badge, onOpen }) {
    const progress = Math.max(0, Math.min(100, Number(badge.progressPercentage) || 0))
    return (
        <article className={'l2c-badge-card' + (badge.earned ? ' is-earned' : ' is-pending')}>
            <div className="l2c-badge-card__image">
                <img src={badgeImage(badge)} alt="" />
                {!badge.earned && <FiLock className="l2c-badge-lock" aria-label="Bloqueada" />}
            </div>
            <div className="l2c-badge-card__content">
                <span className="l2c-badge-card__category">
                    {CRITERIA_LABELS[badge.criteriaType] ?? 'Logro'}
                </span>
                <h3>{badge.name}</h3>
                <p>{badge.description}</p>
                <span className={'l2c-badge-state ' + (badge.earned ? 'is-earned' : 'is-pending')}>
                    {badge.earned ? <FiCheckCircle aria-hidden="true" /> : <FiLock aria-hidden="true" />}
                    {badge.earned ? 'Obtenido' : 'Por desbloquear'}
                </span>
                {!badge.earned && (
                    <div className="l2c-badge-card__progress">
                        <div role="progressbar" aria-label={`Progreso de ${badge.name}`}
                            aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                            <span style={{ width: `${progress}%` }} />
                        </div>
                        <small>{badge.currentValue} / {badge.threshold} · {progress}%</small>
                    </div>
                )}
                <button type="button" className="l2c-badge-detail" onClick={() => onOpen(badge)}>
                    Ver detalle <FiArrowRight aria-hidden="true" />
                </button>
            </div>
        </article>
    )
}

export function BadgesPage() {
    const { accessToken, user, signOut } = useAuth()
    const [catalog, setCatalog] = useState(null)
    const [dashboard, setDashboard] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [requestVersion, setRequestVersion] = useState(0)
    const [filter, setFilter] = useState('all')
    const [selectedBadge, setSelectedBadge] = useState(null)

    useEffect(() => {
        if (!accessToken) return undefined
        let active = true
        Promise.all([
            getBadgeCatalog(accessToken),
            getDashboardSummary(accessToken).catch(() => null),
        ]).then(([badges, summary]) => {
            if (!active) return
            setCatalog(badges)
            setDashboard(summary)
            setErrorMessage('')
        }).catch(() => {
            if (!active) return
            setCatalog(null)
            setErrorMessage('No fue posible cargar tus insignias.')
        }).finally(() => { if (active) setIsLoading(false) })
        return () => { active = false }
    }, [accessToken, requestVersion])

    const allBadges = useMemo(() => catalog?.badges ?? [], [catalog])
    const displayedBadges = useMemo(() => allBadges.filter((badge) =>
        filter === 'all' || (filter === 'earned' ? badge.earned : !badge.earned)
    ), [allBadges, filter])
    const nextBadge = allBadges
        .filter((badge) => !badge.earned)
        .sort((a, b) => (Number(b.progressPercentage) || 0) - (Number(a.progressPercentage) || 0))[0]
    const totalXp = dashboard?.gamification?.totalXp
    const level = dashboard?.gamification?.currentLevel
    const streak = dashboard?.gamification?.currentStreak
    const levelProgress = dashboard?.gamification?.levelProgressPercentage
    const selected = selectedBadge
        ? allBadges.find((badge) => badge.id === selectedBadge.id)
        : null

    return (
        <main className="inicio-layout l2c-achievements">
            <LearningSidebar activeItem="achievements" variant="profile"
                streakDays={streak ?? null}
                mascotSrc="/images/learn2code-mascot-laptop.png" />
            <section className="inicio-workspace">
                <ProfileTopbar userName={user?.fullName || 'Estudiante'}
                    onLogout={signOut} streakDays={streak ?? null} />
                <div className="l2c-achievements__content">
                    <header className="l2c-achievements__intro">
                        <div>
                            <h1>{filter === 'earned' ? 'Tus logros obtenidos' : filter === 'pending'
                                ? 'Tu próximo logro está en camino' : 'Cada paso cuenta'} <span aria-hidden="true">🏆</span></h1>
                            <p>{filter === 'earned' ? 'Cada insignia representa un avance real.'
                                : 'Celebra tus avances y descubre tu próximo reto.'}</p>
                        </div>
                        <img src="/images/logros/dragon-trofeo-512.webp" alt="Dragón de Learn2Code con un trofeo" />
                    </header>
                    {isLoading && <p role="status" className="l2c-achievements__message">Cargando insignias...</p>}
                    {errorMessage && <div className="l2c-achievements__message" role="alert">
                        <p>{errorMessage}</p>
                        <button type="button" onClick={() => { setIsLoading(true); setRequestVersion((count) => count + 1) }}>
                            Intentar nuevamente
                        </button>
                    </div>}
                    {catalog && !isLoading && <>
                        <section className="l2c-achievements__summary" aria-label="Resumen de insignias">
                            <div className="l2c-achievements__level">
                                <div className="l2c-achievements__level-art"><FiAward aria-hidden="true" /></div>
                                <div>
                                    <strong>{level ? `Nivel ${level.id} · ${level.name}` : 'Tu camino de aprendizaje'}</strong>
                                    <small>{level ? 'Continúa desarrollando tus habilidades' : 'Avanza para descubrir tu nivel'}</small>
                                </div>
                            </div>
                            {totalXp != null && <div className="l2c-achievements__xp">
                                <strong>{Number(totalXp).toLocaleString('es-MX')} XP</strong>
                                {levelProgress != null && <div role="progressbar" aria-label="Progreso de nivel"
                                    aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(levelProgress)}>
                                    <span style={{ width: `${levelProgress}%` }} />
                                </div>}
                            </div>}
                            <div className="l2c-achievements__metric">
                                <FiAward aria-hidden="true" /><strong>{catalog.earnedCount}</strong><small>Logros obtenidos</small>
                            </div>
                            {streak != null && <div className="l2c-achievements__metric">
                                <span aria-hidden="true">🔥</span><strong>{streak} días</strong><small>Racha actual</small>
                            </div>}
                        </section>

                        <nav className="l2c-achievements__tabs" aria-label="Filtrar logros">
                            {FILTERS.map(({ key, name, Icon }) => (
                                <button type="button" key={key} className={filter === key ? 'is-active' : ''}
                                    aria-pressed={filter === key} onClick={() => { setFilter(key); setSelectedBadge(null) }}>
                                    <Icon aria-hidden="true" /> {name}
                                </button>
                            ))}
                        </nav>
                        {nextBadge && filter !== 'earned' && (
                            <section className="l2c-achievements__next">
                                <img src={badgeImage(nextBadge)} alt="" />
                                <div className="l2c-achievements__next-copy">
                                    <span>Tu próximo logro</span>
                                    <h2>{nextBadge.name}</h2>
                                    <p>{nextBadge.description}</p>
                                </div>
                                <div className="l2c-achievements__next-progress">
                                    <strong>{nextBadge.currentValue} / {nextBadge.threshold}</strong>
                                    <div role="progressbar" aria-label={`Meta de ${nextBadge.name}`}
                                        aria-valuemin={0} aria-valuemax={100}
                                        aria-valuenow={Number(nextBadge.progressPercentage) || 0}>
                                        <span style={{ width: `${Math.max(0, Math.min(100, Number(nextBadge.progressPercentage) || 0))}%` }} />
                                    </div>
                                    <small>{nextBadge.progressPercentage}% completado</small>
                                </div>
                                <button type="button" onClick={() => setSelectedBadge(nextBadge)}>
                                    Ver detalle <FiArrowRight aria-hidden="true" />
                                </button>
                            </section>
                        )}
                        <div className="l2c-achievements__collection-head">
                            <div>
                                <h2>{filter === 'earned' ? 'Tu colección' : filter === 'pending' ? 'Sigue avanzando' : 'Tu colección de logros'}</h2>
                                <p>{filter === 'earned' ? catalog.earnedCount : filter === 'pending' ? catalog.pendingCount : catalog.total} insignias</p>
                            </div>
                        </div>
                        {displayedBadges.length ? (
                            <div className="l2c-achievements__grid">
                                {displayedBadges.map((badge) =>
                                    <BadgeCard key={badge.id} badge={badge} onOpen={setSelectedBadge} />)}
                            </div>
                        ) : (
                            <div className="l2c-achievements__empty">
                                <FiAward aria-hidden="true" />
                                <p>{catalog.total === 0 ? 'Todavía no hay insignias disponibles.'
                                    : filter === 'earned' ? 'Aún no has obtenido insignias.'
                                        : 'No tienes insignias pendientes.'}</p>
                            </div>
                        )}
                        <footer className="l2c-achievements__footer">
                            <FiTrendingUp aria-hidden="true" />
                            <div>
                                <strong>Tu esfuerzo se convierte en progreso</strong>
                                <p>Las insignias se desbloquean al cumplir sus requisitos reales.</p>
                            </div>
                            <Link to="/exercises">Continuar aprendiendo <FiArrowRight aria-hidden="true" /></Link>
                        </footer>
                    </>}

                    {selected && <div className="l2c-achievements__overlay" role="presentation"
                        onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedBadge(null) }}>
                        <section className="l2c-achievements__dialog" role="dialog" aria-modal="true"
                            aria-label={`Detalle de ${selected.name}`}>
                            <button type="button" className="l2c-achievements__close"
                                aria-label="Cerrar detalle" onClick={() => setSelectedBadge(null)}><FiX /></button>
                            <div className="l2c-achievements__dialog-banner">
                                <img src={badgeImage(selected)} alt="" />
                                <div>
                                    <span>{CRITERIA_LABELS[selected.criteriaType] ?? 'Insignia'}</span>
                                    <h2>{selected.name}</h2>
                                    <p>{selected.description}</p>
                                </div>
                            </div>
                            <div className="l2c-achievements__dialog-body">
                                <h3>Cómo se obtiene</h3>
                                <p>Alcanza {selected.threshold} en: {CRITERIA_LABELS[selected.criteriaType] ?? 'el requisito de esta insignia'}.</p>
                                <div className="l2c-achievements__dialog-row">
                                    {selected.earned ? <FiCheckCircle /> : <FiTarget />}
                                    <span>{selected.earned ? 'Obtenida' : 'En progreso'}</span>
                                    <strong>{selected.currentValue} / {selected.threshold}</strong>
                                </div>
                                <div role="progressbar" className="l2c-achievements__dialog-progress"
                                    aria-label={`Progreso de ${selected.name}`} aria-valuemin={0} aria-valuemax={100}
                                    aria-valuenow={Number(selected.progressPercentage) || 0}>
                                    <span style={{ width: `${selected.progressPercentage}%` }} />
                                </div>
                                {formatDate(selected.earnedAt) &&
                                    <p><FiClock aria-hidden="true" /> Obtenida el {formatDate(selected.earnedAt)}</p>}
                                <Link to="/exercises" onClick={() => setSelectedBadge(null)}>
                                    <FiArrowLeft aria-hidden="true" /> Continuar aprendiendo
                                </Link>
                            </div>
                        </section>
                    </div>}
                </div>
            </section>
        </main>
    )
}

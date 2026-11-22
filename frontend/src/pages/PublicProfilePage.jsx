import {
    useEffect,
    useState,
} from 'react'

import {
    Link,
    useLocation,
    useNavigate,
} from 'react-router-dom'

import {
    FiArrowLeft,
    FiArrowRight,
    FiBox,
    FiCode,
    FiEye,
    FiFileText,
    FiHeart,
    FiInfo,
    FiMessageCircle,
    FiShield,
} from 'react-icons/fi'

import { useAuth } from '../auth/useAuth.js'

import {
    getAuthErrorMessage,
} from '../auth/auth-error-message.js'

import {
    getCurrentUserPrivacyPreferences,
} from '../api/auth.api.js'

import {
    getDashboardSummary,
} from '../api/dashboard.api.js'

import {
    getCurrentStudentOnboarding,
} from '../api/onboarding.api.js'

import {
    getCurrentStudentRoute,
} from '../api/student-routes.api.js'

import {
    getBadgeCatalog,
} from '../api/gamification.api.js'

import {
    LearningSidebar,
} from '../components/LearningSidebar.jsx'

import {
    ProfileTopbar,
} from '../components/ProfileTopbar.jsx'

import {
    DEFAULT_PRIVACY_SETTINGS,
    getProfileUsername,
} from '../components/profile-privacy.shared.js'

import './PublicProfilePage.css'

// ============================================================
// IMÁGENES DEL MOCKUP
// ============================================================

const images = {
    react: '/images/tecnologia-react-64.png',
    javascript: '/images/tecnologia-javascript-32.png',
    css: '/images/tecnologia-css-64.png',
}


const routeLabels = {
    frontend: 'Frontend',
    backend: 'Backend',
    fullstack: 'Full Stack',
    devops: 'DevOps',
}

const technologyOptions = {
    javascript: {
        name: 'JavaScript',
        src: images.javascript,
    },
    python: { name: 'Python' },
    react: {
        name: 'React',
        src: images.react,
    },
    html_css: {
        name: 'HTML y CSS',
        src: images.css,
    },
    nodejs: { name: 'Node.js' },
    typescript: { name: 'TypeScript' },
    java: { name: 'Java' },
    sql: { name: 'SQL' },
    other: { name: 'Otra' },
}

// ============================================================
// ETIQUETAS DE TECNOLOGÍA
// ============================================================

function TechnologyTags({
    items,
    emptyMessage = 'Sin tecnologías registradas.',
}) {
    return (
        <div className="public-profile-tech-list">
            {items.length === 0 ? (
                <span>{emptyMessage}</span>
            ) : (
                items.map((item) => (
                    <span key={item.name}>
                        {item.src ? (
                            <img src={item.src} alt="" />
                        ) : (
                            <FiCode aria-hidden="true" />
                        )}
                        {item.name}
                    </span>
                ))
            )}
        </div>
    )
}



// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function PublicProfilePage() {
    const navigate = useNavigate()
    const location = useLocation()

    const {
        user,
        accessToken,
        loadProfile,
        signOut,
    } = useAuth()

    const [profile, setProfile] = useState(user ?? null)
    const [activeSection, setActiveSection] =
        useState('projects')

    // Filtro visual de publicaciones del perfil público.
    const [postFilter, setPostFilter] = useState('Todas')

    const [storedPrivacy, setStoredPrivacy] =
        useState(null)

    const [privacyLoadError, setPrivacyLoadError] =
        useState('')


    // --------------------------------------------------------
    // PROGRESO REAL DEL ESTUDIANTE
    // --------------------------------------------------------

    const [gamificationResult, setGamificationResult] =
        useState(null)

    const [gamificationLoadError, setGamificationLoadError] =
        useState(false)

    const [learningResult, setLearningResult] =
        useState(null)

    // Catálogo real de insignias del estudiante.
    const [badgeResult, setBadgeResult] = useState(null)

    const [badgeLoadError, setBadgeLoadError] =
        useState(false)

    // --------------------------------------------------------
    // CARGAR DATOS REALES DEL USUARIO
    // --------------------------------------------------------

    useEffect(() => {
        let active = true

        loadProfile()
            .then((result) => {
                if (active) {
                    setProfile(result)
                }
            })
            .catch(() => {
                // Se conserva el perfil disponible en AuthProvider.
            })

        return () => {
            active = false
        }
    }, [loadProfile])

    // --------------------------------------------------------
    // CARGAR PRIVACIDAD GUARDADA
    // --------------------------------------------------------

    useEffect(() => {
        if (
            !accessToken
            || location.state?.privacySettings != null
        ) {
            return
        }

        let active = true

        getCurrentUserPrivacyPreferences(accessToken)
            .then((preferences) => {
                if (!active) return

                setStoredPrivacy({
                    accessToken,
                    preferences,
                })

                setPrivacyLoadError('')
            })
            .catch((error) => {
                if (!active) return

                setPrivacyLoadError(
                    getAuthErrorMessage(error),
                )
            })

        return () => {
            active = false
        }
    }, [accessToken, location.state?.privacySettings])

    // --------------------------------------------------------
    // PREFERENCIAS RECIBIDAS DE PRIVACIDAD
    // --------------------------------------------------------

    const previewSettings =
        location.state?.privacySettings

    const savedPreferences =
        storedPrivacy?.accessToken === accessToken
            ? storedPrivacy.preferences
            : null

    const preferences = {
        ...DEFAULT_PRIVACY_SETTINGS,
        ...(savedPreferences || {}),
        ...(previewSettings || {}),
    }

    // --------------------------------------------------------
    // CARGAR GAMIFICACIÓN SEGÚN LAS PREFERENCIAS
    // --------------------------------------------------------

    useEffect(() => {
        if (
            !accessToken
            || (
                !preferences.showLevel
                && !preferences.showStreak
            )
        ) {
            return
        }

        let active = true

        getDashboardSummary(accessToken)
            .then((summary) => {
                if (!active) return

                setGamificationResult({
                    accessToken,
                    data: summary?.gamification ?? null,
                })

                setGamificationLoadError(false)
            })
            .catch(() => {
                if (!active) return

                setGamificationResult({
                    accessToken,
                    data: null,
                })

                setGamificationLoadError(true)
            })

        return () => {
            active = false
        }
    }, [
        accessToken,
        preferences.showLevel,
        preferences.showStreak,
    ])

    // --------------------------------------------------------
    // CARGAR INSIGNIAS REALES PARA PERFIL PÚBLICO
    // --------------------------------------------------------

    useEffect(() => {
        if (
            activeSection !== 'badges'
            || !accessToken
            || !preferences.showAchievements
        ) {
            return
        }

        let active = true

        getBadgeCatalog(accessToken)
            .then((catalog) => {
                if (!active) return

                setBadgeResult({
                    accessToken,
                    catalog,
                })

                setBadgeLoadError(false)
            })
            .catch(() => {
                if (!active) return

                setBadgeResult({
                    accessToken,
                    catalog: null,
                })

                setBadgeLoadError(true)
            })

        return () => {
            active = false
        }
    }, [
        activeSection,
        accessToken,
        preferences.showAchievements,
    ])

    // --------------------------------------------------------
    // RUTA Y TECNOLOGÍAS REALES DEL ESTUDIANTE
    // --------------------------------------------------------

    useEffect(() => {
        if (
            !accessToken
            || !preferences.showRoute
            || (
                previewSettings == null
                && savedPreferences == null
            )
        ) {
            return
        }

        let active = true

        Promise.allSettled([
            getCurrentStudentOnboarding(accessToken),
            getCurrentStudentRoute(accessToken),
        ]).then(([onboardingResult, routeResult]) => {
            if (!active) {
                return
            }

            const onboardingResponse =
                onboardingResult.status === 'fulfilled'
                    ? onboardingResult.value
                    : null

            const routeResponse =
                routeResult.status === 'fulfilled'
                    ? routeResult.value
                    : null

            const onboarding =
                onboardingResponse?.state === 'completed'
                    ? onboardingResponse.onboarding
                    : null

            const selection =
                routeResponse?.state === 'selected'
                    ? routeResponse.selection
                    : null

            const route =
                routeResult.status === 'rejected'
                    ? 'No disponible'
                    : selection
                        ? routeLabels[
                        selection.specializationKey
                        ] ?? 'No disponible'
                        : 'Pendiente'

            const technologyKeys =
                onboardingResult.status === 'rejected'
                    ? null
                    : Array.isArray(
                        onboarding?.technologyInterestKeys,
                    )
                        ? onboarding.technologyInterestKeys
                        : []

            setLearningResult({
                accessToken,
                route,
                technologyKeys,
            })
        })

        return () => {
            active = false
        }
    }, [
        accessToken,
        preferences.showRoute,
        previewSettings,
        savedPreferences,
    ])

    // --------------------------------------------------------
    // NORMALIZAR ESTADÍSTICAS REALES
    // --------------------------------------------------------

    const gamification =
        gamificationResult?.accessToken === accessToken
            ? gamificationResult.data
            : null

    const learning =
        learningResult?.accessToken === accessToken
            ? learningResult
            : null

    const routeText =
        !learning
            ? 'Consultando ruta...'
            : learning.route === 'No disponible'
                ? 'Ruta no disponible'
                : learning.route === 'Pendiente'
                    ? 'Ruta pendiente'
                    : `Ruta ${learning.route}`

    const technologyItems = Array.isArray(
        learning?.technologyKeys,
    )
        ? learning.technologyKeys.map(
            (key) => technologyOptions[key] ?? { name: key },
        )
        : []

    const technologyMessage =
        !learning
            ? 'Consultando tecnologías...'
            : learning.technologyKeys === null
                ? 'No fue posible cargar las tecnologías.'
                : 'Sin tecnologías registradas.'

    // Insignias obtenidas y pendientes, sin valores ficticios.
    const badgeCatalog =
        badgeResult?.accessToken === accessToken
            ? badgeResult.catalog
            : null

    const badges = Array.isArray(badgeCatalog?.badges)
        ? badgeCatalog.badges
        : []

    const earnedBadges = badges.filter(
        (badge) => badge.earned === true,
    )

    const levelName =
        typeof gamification?.currentLevel?.name === 'string'
            ? gamification.currentLevel.name.trim()
            : ''

    const totalXp =
        gamification?.totalXp == null
            ? null
            : Number(gamification.totalXp)

    const currentStreak =
        gamification?.currentStreak == null
            ? null
            : Number(gamification.currentStreak)

    // --------------------------------------------------------
    // IDENTIDAD DEL ESTUDIANTE
    // --------------------------------------------------------

    const displayUser = profile || user || {}

    const name =
        displayUser.fullName?.trim() || 'Estudiante'

    const username = getProfileUsername(displayUser)

    const initial = name.charAt(0).toUpperCase()

    const avatarUrl =
        displayUser.avatarUrl
        || displayUser.profileImageUrl
        || ''

    // --------------------------------------------------------
    // CERRAR SESIÓN
    // --------------------------------------------------------

    const handleLogout = async () => {
        try {
            await signOut()
        } finally {
            navigate('/login', {
                replace: true,
            })
        }
    }

    // ========================================================
    // INTERFAZ
    // ========================================================
    if (
        previewSettings == null
        && (
            privacyLoadError
            || savedPreferences === null
        )
    ) {
        return (
            <main className="profile-layout">
                <LearningSidebar
                    variant="profile"
                    activeItem="profile"
                    mascotSrc="/images/learn2code-mascot-laptop-transparent.png"
                />

                <div className="profile-main">
                    <ProfileTopbar
                        userName={name}
                        onLogout={handleLogout}
                    />

                    <div className="public-profile-content">
                        <p
                            role={
                                privacyLoadError
                                    ? 'alert'
                                    : 'status'
                            }
                        >
                            {privacyLoadError
                                || 'Cargando preferencias de privacidad...'}
                        </p>

                        <Link
                            to="/profile"
                            state={{ openTab: 'privacy' }}
                        >
                            Volver a privacidad
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="profile-layout">

            <LearningSidebar
                variant="profile"
                activeItem="profile"
                mascotSrc="/images/learn2code-mascot-laptop-transparent.png"
            />

            <div className="profile-main">

                {/* TOPBAR EXISTENTE */}
                <ProfileTopbar
                    userName={name}
                    onLogout={handleLogout}
                />

                <div className="public-profile-content">

                    {/* =========================================
                        RUTA DE NAVEGACIÓN
                        ========================================= */}

                    <div className="public-profile-breadcrumb">
                        <Link
                            to="/profile"
                            state={{ openTab: 'privacy' }}
                        >
                            Perfil
                        </Link>

                        <span>/</span>

                        <strong>Vista pública</strong>
                    </div>

                    {/* =========================================
                        AVISO SUPERIOR
                        ========================================= */}

                    <div className="public-profile-banner">

                        <div>
                            <FiEye aria-hidden="true" />

                            <span>
                                Así te ven otros miembros
                                de Learn2Code.
                            </span>
                        </div>

                        <Link
                            to="/profile"
                            state={{ openTab: 'privacy' }}
                            className="public-profile-back"
                        >
                            <FiArrowLeft aria-hidden="true" />

                            Volver a editar perfil
                        </Link>

                    </div>

                    {/* =========================================
                        ENCABEZADO DEL ESTUDIANTE
                        ========================================= */}

                    <section className="public-profile-hero">

                        {/* AVATAR */}
                        <div className="public-profile-avatar">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={`Avatar de ${name}`}
                                />
                            ) : (
                                <span>{initial}</span>
                            )}
                        </div>

                        <div className="public-profile-identity">

                            {/* NOMBRE Y ROL */}
                            <div className="public-profile-name-row">
                                <h1>{name}</h1>
                                <span>Estudiante</span>
                            </div>

                            {/* IDENTIFICADOR PÚBLICO */}
                            <p className="public-profile-handle">
                                @{username}
                            </p>

                            {/* NIVEL Y EXPERIENCIA REAL */}
                            {preferences.showLevel && (
                                <>
                                    {(levelName || Number.isFinite(totalXp)) && (
                                        <div className="public-profile-route">
                                            <FiCode aria-hidden="true" />

                                            {levelName && (
                                                <span>
                                                    Nivel: {levelName}
                                                </span>
                                            )}

                                            {Number.isFinite(totalXp) && (
                                                <span>
                                                    {totalXp.toLocaleString('es-MX')} XP
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* RACHA REAL */}
                            {preferences.showStreak
                                && Number.isFinite(currentStreak) && (
                                    <div className="public-profile-route">
                                        <FiHeart aria-hidden="true" />

                                        Racha actual: {currentStreak} días
                                    </div>
                                )}

                            {/* ERROR DE CONSULTA */}
                            {(preferences.showLevel || preferences.showStreak)
                                && gamificationLoadError && (
                                    <p role="status">
                                        No fue posible cargar la información
                                        de progreso.
                                    </p>
                                )}

                            {/* RUTA REAL */}
                            {preferences.showRoute && (
                                <div className="public-profile-route">
                                    <FiBox aria-hidden="true" />
                                    {routeText}
                                </div>
                            )}

                            {/* BIOGRAFÍA REAL */}
                            <p className="public-profile-bio">
                                {displayUser.bio?.trim()
                                    || 'Aún no has agregado una biografía.'}
                            </p>

                            {/* TECNOLOGÍAS REALES */}
                            {preferences.showRoute && (
                                <TechnologyTags
                                    items={technologyItems}
                                    emptyMessage={technologyMessage}
                                />
                            )}

                            {preferences.audience === 'private' && (
                                <p className="public-profile-private">
                                    <FiShield aria-hidden="true" />
                                    Esta es una vista previa privada.
                                </p>
                            )}

                        </div>

                    </section>

                    {/* =========================================
                        PESTAÑAS
                        ========================================= */}

                    <div
                        className="public-profile-tabs"
                        role="tablist"
                        aria-label="Secciones del perfil público"
                    >

                        <button
                            type="button"
                            role="tab"
                            aria-selected={
                                activeSection === 'projects'
                            }
                            className={
                                activeSection === 'projects'
                                    ? 'is-active'
                                    : ''
                            }
                            onClick={() => {
                                setActiveSection('projects')
                            }}
                        >
                            <FiCode aria-hidden="true" />
                            Proyectos compartidos
                        </button>

                        <button
                            type="button"
                            role="tab"
                            aria-selected={
                                activeSection === 'posts'
                            }
                            className={
                                activeSection === 'posts'
                                    ? 'is-active'
                                    : ''
                            }
                            onClick={() => {
                                setActiveSection('posts')
                            }}
                        >
                            <FiFileText aria-hidden="true" />
                            Publicaciones
                        </button>

                        <button
                            type="button"
                            role="tab"
                            aria-selected={
                                activeSection === 'badges'
                            }
                            className={
                                activeSection === 'badges'
                                    ? 'is-active'
                                    : ''
                            }
                            onClick={() => {
                                setActiveSection('badges')
                            }}
                        >
                            <FiShield aria-hidden="true" />
                            Logros
                        </button>

                    </div>

                    {/* =========================================
                        CONTENIDO EN DOS COLUMNAS
                        ========================================= */}

                    <div className="public-profile-grid">

                        {/* COLUMNA IZQUIERDA */}
                        <div className="public-profile-main-column">

                            {/* -----------------------------
                                PROYECTOS
                                ----------------------------- */}

                            {activeSection === 'projects' && (
                                <>
                                    <section className="public-profile-card">

                                        <h2>
                                            Proyectos compartidos
                                        </h2>

                                        <div className="public-profile-post">

                                            <h3>
                                                Proyectos compartidos
                                                no disponibles
                                            </h3>

                                            <p>
                                                Los proyectos que compartas
                                                aparecerán aquí cuando
                                                se integre su consulta
                                                con el backend.
                                            </p>

                                        </div>

                                    </section>

                                    <section className="public-profile-card">

                                        <h2>Última publicación</h2>

                                        <div className="public-profile-post">

                                            <h3>
                                                <FiMessageCircle
                                                    aria-hidden="true"
                                                />
                                                {' '}Publicaciones no disponibles
                                            </h3>

                                            <p>
                                                La última publicación
                                                aparecerá aquí cuando
                                                se conecte el módulo
                                                de comunidad.
                                            </p>

                                        </div>

                                        <button
                                            type="button"
                                            className="public-profile-outline"
                                            onClick={() => {
                                                setActiveSection('posts')
                                            }}
                                        >
                                            Ver sección de publicaciones
                                            <FiArrowRight aria-hidden="true" />
                                        </button>

                                    </section>
                                </>
                            )}

                            {/* -----------------------------
                                PUBLICACIONES
                                ----------------------------- */}

                            {activeSection === 'posts' && (
                                <section className="public-profile-card public-profile-posts-section">

                                    <header className="public-profile-posts-header">
                                        <div>
                                            <h2>Publicaciones</h2>
                                            <p>
                                                Preguntas y aportes compartidos
                                                con la comunidad.
                                            </p>
                                        </div>
                                    </header>

                                    <div
                                        className="public-profile-posts-filters"
                                        role="group"
                                        aria-label="Filtrar publicaciones"
                                    >
                                        {['Todas', 'Preguntas', 'Aportes'].map(
                                            (filter) => (
                                                <button
                                                    key={filter}
                                                    type="button"
                                                    aria-pressed={
                                                        postFilter === filter
                                                    }
                                                    className={
                                                        postFilter === filter
                                                            ? 'is-active'
                                                            : ''
                                                    }
                                                    onClick={() => {
                                                        setPostFilter(filter)
                                                    }}
                                                >
                                                    {filter}
                                                </button>
                                            ),
                                        )}
                                    </div>

                                    <div className="public-profile-posts-empty">
                                        <FiFileText aria-hidden="true" />

                                        <h3>
                                            Publicaciones no disponibles
                                        </h3>

                                        <p>
                                            {postFilter === 'Todas'
                                                ? 'Las publicaciones aparecerán aquí cuando se integre el módulo de comunidad.'
                                                : postFilter === 'Preguntas'
                                                    ? 'Las preguntas estarán disponibles cuando se integre el módulo de comunidad.'
                                                    : 'Los aportes estarán disponibles cuando se integre el módulo de comunidad.'}
                                        </p>
                                    </div>

                                </section>
                            )}

                            {/* -----------------------------
                                LOGROS
                                ----------------------------- */}

                            {activeSection === 'badges' && (
                                <section className="public-profile-card">

                                    <h2>Logros destacados</h2>

                                    {!preferences.showAchievements ? (
                                        <p className="public-profile-description">
                                            Los logros están ocultos
                                            por tus preferencias.
                                        </p>
                                    ) : badgeLoadError ? (
                                        <p
                                            role="alert"
                                            className="public-profile-description"
                                        >
                                            No fue posible cargar las insignias.
                                        </p>
                                    ) : badgeCatalog === null ? (
                                        <p
                                            role="status"
                                            className="public-profile-description"
                                        >
                                            Cargando insignias...
                                        </p>
                                    ) : (
                                        <>
                                            <p className="public-profile-description">
                                                {earnedBadges.length} de{' '}
                                                {badges.length} insignias
                                                desbloqueadas.
                                            </p>

                                            {badges.length === 0 ? (
                                                <p className="public-profile-description">
                                                    Todavía no hay insignias
                                                    disponibles.
                                                </p>
                                            ) : (
                                                <div className="public-profile-achievements-grid">
                                                    {badges.map((badge) => (
                                                        <article
                                                            key={badge.id}
                                                            className={
                                                                'public-profile-achievement'
                                                                + (
                                                                    badge.earned
                                                                        ? ' is-earned'
                                                                        : ' is-pending'
                                                                )
                                                            }
                                                        >
                                                            <div className="public-profile-achievement-icon">
                                                                {badge.earned
                                                                    ? '🏆'
                                                                    : '🔒'}
                                                            </div>

                                                            <h3>{badge.name}</h3>

                                                            <p>
                                                                {badge.description}
                                                            </p>

                                                            <span>
                                                                {badge.earned
                                                                    ? 'Desbloqueado'
                                                                    : 'Pendiente'}
                                                            </span>
                                                        </article>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}

                                </section>
                            )}

                        </div>

                        {/* COLUMNA DERECHA */}
                        <aside className="public-profile-aside">

                            {/* -----------------------------
                                SOBRE MÍ
                                ----------------------------- */}

                            <section className="public-profile-card">

                                <h2>Sobre mí</h2>

                                <p className="public-profile-description">
                                    {displayUser.bio?.trim()
                                        || 'Aún no has agregado una biografía.'}
                                </p>

                                {preferences.showRoute && (
                                    <>
                                        <div className="public-profile-separator" />

                                        <h3>Tecnologías</h3>

                                        <TechnologyTags
                                            items={technologyItems}
                                            emptyMessage={technologyMessage}
                                        />
                                    </>
                                )}

                            </section>

                            {/* -----------------------------
                                LOGROS DESTACADOS
                                ----------------------------- */}

                            {preferences.showAchievements && (
                                <section className="public-profile-card">

                                    <h2>Logros destacados</h2>

                                    {earnedBadges.length > 0 ? (
                                        <div className="public-profile-featured-badges">
                                            {earnedBadges.slice(0, 3).map(
                                                (badge) => (
                                                    <div key={badge.id}>
                                                        <FiShield aria-hidden="true" />
                                                        <span>{badge.name}</span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <p className="public-profile-description">
                                            {badgeCatalog
                                                ? 'Todavía no hay insignias desbloqueadas.'
                                                : 'Consulta tus insignias en la pestaña Logros.'}
                                        </p>
                                    )}

                                    <button
                                        type="button"
                                        className="public-profile-outline"
                                        onClick={() => {
                                            setActiveSection('badges')
                                        }}
                                    >
                                        Ver todos los logros
                                        <FiArrowRight />
                                    </button>

                                </section>
                            )}

                            {/* -----------------------------
                                NOTA INFORMATIVA
                                ----------------------------- */}

                            <div className="public-profile-note">
                                <FiInfo aria-hidden="true" />

                                <span>
                                    Esta es una vista previa de tu perfil.
                                    Los proyectos y publicaciones estarán
                                    disponibles cuando se integren sus
                                    módulos correspondientes.
                                    Los logros mostrados provienen
                                    del catálogo real.
                                </span>
                            </div>

                        </aside>

                    </div>

                </div>

            </div>

        </main>
    )
}

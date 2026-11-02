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

    firstSteps: '/images/insignia-primeros-pasos-128.png',
    learningWeek: '/images/insignia-semana-aprendiendo-128.png',
    handsOnCode: '/images/insignia-manos-al-codigo-64.png',

    dashboard: '/images/miniatura-dashboard-512.png',
}

// ============================================================
// TECNOLOGÍAS ILUSTRATIVAS
// ============================================================

const sampleTechnologies = [
    { name: 'React', src: images.react },
    { name: 'JavaScript', src: images.javascript },
    { name: 'CSS', src: images.css },
]

// ============================================================
// INSIGNIAS ILUSTRATIVAS
// ============================================================

const sampleBadges = [
    {
        name: 'Primeros pasos',
        src: images.firstSteps,
    },
    {
        name: 'Una semana aprendiendo',
        src: images.learningWeek,
    },
    {
        name: 'Manos al código',
        src: images.handsOnCode,
    },
]

// ============================================================
// ETIQUETAS DE TECNOLOGÍA
// ============================================================

function TechnologyTags({ items }) {
    return (
        <div className="public-profile-tech-list">
            {items.map((item) => (
                <span key={item.name}>
                    <img src={item.src} alt="" />
                    {item.name}
                </span>
            ))}
        </div>
    )
}

// ============================================================
// INSIGNIAS
// ============================================================

function BadgeList() {
    return (
        <div className="public-profile-badge-list">
            {sampleBadges.map((badge) => (
                <div key={badge.name}>
                    <img
                        src={badge.src}
                        alt=""
                    />
                    <span>{badge.name}</span>
                </div>
            ))}
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
    // NORMALIZAR ESTADÍSTICAS REALES
    // --------------------------------------------------------

    const gamification =
        gamificationResult?.accessToken === accessToken
            ? gamificationResult.data
            : null

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

                            {/* RUTA */}
                            {preferences.showRoute && (
                                <div className="public-profile-route">
                                    <FiBox aria-hidden="true" />
                                    Ruta Frontend
                                </div>
                            )}

                            {/* BIOGRAFÍA */}
                            <p className="public-profile-bio">
                                {displayUser.bio ||
                                    'Aprendiendo desarrollo frontend '
                                    + 'y creando proyectos con React.'}
                            </p>

                            {/* TECNOLOGÍAS */}
                            {preferences.showRoute && (
                                <TechnologyTags
                                    items={sampleTechnologies}
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

                                        <div className="public-profile-project">

                                            <img
                                                src={images.dashboard}
                                                alt="Dashboard interactivo"
                                            />

                                            <div>
                                                <h3>
                                                    Dashboard interactivo
                                                </h3>

                                                <p>
                                                    Métricas y filtros
                                                    por categoría con React.
                                                </p>

                                                <TechnologyTags
                                                    items={[
                                                        sampleTechnologies[0],
                                                        sampleTechnologies[2],
                                                    ]}
                                                />

                                                <div className="public-profile-social">
                                                    <span>
                                                        <FiMessageCircle />
                                                        3 comentarios
                                                    </span>

                                                    <span>
                                                        <FiHeart />
                                                        12 me gusta
                                                    </span>
                                                </div>

                                                <span className="public-profile-demo-label">
                                                    Proyecto de ejemplo
                                                </span>
                                            </div>

                                        </div>

                                    </section>

                                    <section className="public-profile-card">

                                        <h2>Última publicación</h2>

                                        <div className="public-profile-post">

                                            <div className="public-profile-post-heading">

                                                <span className="public-profile-post-avatar">
                                                    {initial}
                                                </span>

                                                <div>
                                                    <strong>{name}</strong>
                                                    <small>
                                                        Pregunta · JavaScript · Arrays
                                                    </small>
                                                </div>

                                                <span className="public-profile-solved">
                                                    Resuelta
                                                </span>

                                            </div>

                                            <h3>
                                                ¿Cómo puedo filtrar
                                                productos por precio?
                                            </h3>

                                            <p>
                                                Gracias por ayudarme a
                                                entender el valor límite.
                                            </p>

                                            <div className="public-profile-social">
                                                <span>
                                                    <FiMessageCircle />
                                                    2 respuestas
                                                </span>

                                                <span>
                                                    <FiHeart />
                                                    12 me gusta
                                                </span>
                                            </div>

                                            <span className="public-profile-demo-label">
                                                Publicación de ejemplo
                                            </span>

                                        </div>

                                    </section>
                                </>
                            )}

                            {/* -----------------------------
                                PUBLICACIONES
                                ----------------------------- */}

                            {activeSection === 'posts' && (
                                <section className="public-profile-card">
                                    <h2>Publicaciones</h2>

                                    <p className="public-profile-description">
                                        Las publicaciones reales
                                        aparecerán aquí cuando esté
                                        integrado el módulo de comunidad.
                                    </p>
                                </section>
                            )}

                            {/* -----------------------------
                                LOGROS
                                ----------------------------- */}

                            {activeSection === 'badges' && (
                                <section className="public-profile-card">

                                    <h2>Logros destacados</h2>

                                    {preferences.showAchievements ? (
                                        <>
                                            <BadgeList />

                                            <p className="public-profile-demo-note">
                                                Insignias ilustrativas del mockup.
                                            </p>
                                        </>
                                    ) : (
                                        <p className="public-profile-description">
                                            Los logros están ocultos
                                            por tus preferencias.
                                        </p>
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
                                    {displayUser.bio ||
                                        'Me interesa crear interfaces claras '
                                        + 'y seguir mejorando con proyectos prácticos.'}
                                </p>

                                {preferences.showRoute && (
                                    <>
                                        <div className="public-profile-separator" />

                                        <h3>Tecnologías</h3>

                                        <TechnologyTags
                                            items={[
                                                sampleTechnologies[0],
                                                sampleTechnologies[2],
                                            ]}
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

                                    <BadgeList />

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
                                    Esta es una vista previa.
                                    Los proyectos, publicaciones
                                    e insignias son ejemplos
                                    visuales del diseño.
                                </span>
                            </div>

                        </aside>

                    </div>

                </div>

            </div>

        </main>
    )
}

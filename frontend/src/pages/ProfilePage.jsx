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
    FiBell,
    FiBookOpen,
    FiLock,
    FiShield,
    FiUser,
} from 'react-icons/fi'

import {
    useAuth,
} from '../auth/useAuth.js'

import {
    getAuthErrorMessage,
} from '../auth/auth-error-message.js'

import {
    FullPageLoader,
} from '../components/FullPageLoader.jsx'

import {
    LearningSidebar,
} from '../components/LearningSidebar.jsx'

import {
    ProfileTopbar,
} from '../components/ProfileTopbar.jsx'

import {
    ProfileHeader,
} from '../components/ProfileHeader.jsx'

import {
    ProfilePersonalInfo,
} from '../components/ProfilePersonalInfo.jsx'

import {
    ProfileLearning,
} from '../components/ProfileLearning.jsx'

import {
    ProfileSecurity,
} from '../components/ProfileSecurity.jsx'

import {
    ProfileNotifications,
} from '../components/ProfileNotifications.jsx'

import {
    ProfilePrivacy,
} from '../components/ProfilePrivacy.jsx'

import './ProfilePage.css'

import {
    getCurrentStudentOnboarding,
} from '../api/onboarding.api.js'

import {
    getCurrentDiagnostic,
} from '../api/diagnostic.api.js'

import {
    getCurrentStudentRoute,
} from '../api/student-routes.api.js'

import {
    getDashboardSummary,
} from '../api/dashboard.api.js'

import {
    getCurrentUserPrivacyPreferences,
    updateCurrentUserPrivacyPreferences,
    getCurrentUserNotificationPreferences,
    updateCurrentUserNotificationPreferences,
} from '../api/auth.api.js'

// ============================================================
// 1. PESTAÑAS
// ============================================================

const tabs = [
    {
        id: 'personal',
        label: 'Información personal',
        Icon: FiUser,
    },
    {
        id: 'learning',
        label: 'Aprendizaje',
        Icon: FiBookOpen,
    },
    {
        id: 'security',
        label: 'Seguridad',
        Icon: FiLock,
    },
    {
        id: 'notifications',
        label: 'Notificaciones',
        Icon: FiBell,
    },
    {
        id: 'privacy',
        label: 'Privacidad',
        Icon: FiShield,
    },
]

// ============================================================
// 2. PREPARAR FORMULARIO
// ============================================================


function createProfileForm(user) {
    return {
        fullName: user?.fullName ?? '',
        email: user?.email ?? '',
        username: user?.username ?? null,
        bio: user?.bio ?? null,
        githubUrl: user?.githubUrl ?? null,
        portfolioUrl: user?.portfolioUrl ?? null,
        preferredLocale:
            user?.preferredLocale ?? 'es-MX',
        preferredProgrammingLanguageId:
            user?.preferredProgrammingLanguageId == null
                ? ''
                : String(user.preferredProgrammingLanguageId),
    }
}

const routeLabels = {
    frontend: 'Frontend',
    backend: 'Backend',
    fullstack: 'Full Stack',
    devops: 'DevOps',
}

const goalLabels = {
    career_preparation: 'Conseguir trabajo como desarrollador',
    professional_growth: 'Mejorar en mi trabajo actual',
    build_product: 'Crear mis propios proyectos',
    personal_interest: 'Explorar por interés personal',
}

const weeklyLabels = {
    less_than_5: 'Menos de 5 horas',
    five_to_ten: '5 - 10 horas',
    ten_to_twenty: '10 - 20 horas',
    more_than_twenty: 'Más de 20 horas',
}


// ============================================================
// 3. COMPONENTE PRINCIPAL
// ============================================================

export function ProfilePage() {
    const navigate = useNavigate()
    const location = useLocation()

    const {
        user,
        accessToken,
        loadProfile,
        updateProfile,
        signOut,
    } = useAuth()

    // --------------------------------------------------------
    // ESTADO DEL PERFIL
    // --------------------------------------------------------

    const [form, setForm] = useState(null)
    const [loadError, setLoadError] = useState('')
    const [formError, setFormError] = useState('')
    const [successMessage, setSuccessMessage] =
        useState('')
    const [isSubmitting, setIsSubmitting] =
        useState(false)
    const [learningData, setLearningData] = useState(null)
    // Estadísticas reales del Dashboard.
    const [dashboardResult, setDashboardResult] =
        useState(null)
    const gamification =
        dashboardResult?.accessToken === accessToken
            ? dashboardResult.gamification
            : null
    const headerStats = {
        levelName: gamification?.currentLevel?.name ?? null,
        xp: gamification?.totalXp ?? null,
        streakDays: gamification?.currentStreak ?? null,
        route: learningData?.route ?? null,
        initialLevel: learningData?.initialLevel ?? null,
    }

    // --------------------------------------------------------
    // PREFERENCIAS DE PRIVACIDAD
    // --------------------------------------------------------

    const [privacyPreferences, setPrivacyPreferences] =
        useState(null)

    const [privacyLoadError, setPrivacyLoadError] =
        useState('')

    // --------------------------------------------------------
    // PREFERENCIAS DE NOTIFICACIONES
    // --------------------------------------------------------

    const [notificationPreferences, setNotificationPreferences] =
        useState(null)

    const [notificationLoadError, setNotificationLoadError] =
        useState('')

    // --------------------------------------------------------
    // PESTAÑA ACTIVA
    // --------------------------------------------------------

    /**
     * Cuando se regresa de /profile/public,
     * recibimos openTab: 'privacy'.
     */
    const [activeTab, setActiveTab] = useState(() => {
        return location.state?.openTab || 'personal'
    })

    // --------------------------------------------------------
    // CARGAR INFORMACIÓN REAL
    // --------------------------------------------------------

    useEffect(() => {
        let active = true

        loadProfile()
            .then((profile) => {
                if (!active) return

                setForm(createProfileForm(profile))
                setLoadError('')
            })
            .catch((error) => {
                if (!active) return

                setLoadError(
                    getAuthErrorMessage(error),
                )
            })

        return () => {
            active = false
        }
    }, [loadProfile])

    // --------------------------------------------------------
    // CARGAR ESTADÍSTICAS REALES
    // --------------------------------------------------------

    useEffect(() => {
        if (!accessToken) {
            return
        }

        let active = true

        getDashboardSummary(accessToken)
            .then((summary) => {
                if (!active) return
                setDashboardResult({
                    accessToken,
                    gamification: summary?.gamification ?? null,
                })
            })
            .catch(() => {
                if (!active) return
                setDashboardResult({
                    accessToken,
                    gamification: null,
                })
            })

        return () => {
            active = false
        }
    }, [accessToken])

    // --------------------------------------------------------
    // CARGAR PREFERENCIAS DE PRIVACIDAD
    // --------------------------------------------------------

    useEffect(() => {
        if (
            activeTab !== 'privacy'
            || !accessToken
        ) {
            return
        }

        let active = true

        getCurrentUserPrivacyPreferences(accessToken)
            .then((preferences) => {
                if (!active) return

                setPrivacyPreferences(preferences)
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
    }, [accessToken, activeTab])


    useEffect(() => {
        if (!accessToken) {
            return
        }

        let active = true

        Promise.allSettled([
            getCurrentStudentOnboarding(accessToken),
            getCurrentDiagnostic(accessToken),
            getCurrentStudentRoute(accessToken),
        ]).then((results) => {
            if (!active) {
                return
            }

            const [onboardingResult, diagnosticResult, routeResult] =
                results

            const onboardingResponse =
                onboardingResult.status === 'fulfilled'
                    ? onboardingResult.value
                    : null

            const diagnosticResponse =
                diagnosticResult.status === 'fulfilled'
                    ? diagnosticResult.value
                    : null

            const routeResponse =
                routeResult.status === 'fulfilled'
                    ? routeResult.value
                    : null

            const onboarding =
                onboardingResponse?.state === 'completed'
                    ? onboardingResponse.onboarding
                    : null

            const diagnostic =
                diagnosticResponse?.state === 'completed'
                    ? diagnosticResponse.result
                    : null

            const selectedRoute =
                routeResponse?.state === 'selected'
                    ? routeResponse.selection
                    : null

            setLearningData({
                route:
                    routeResult.status === 'rejected'
                        ? 'No disponible'
                        : selectedRoute
                            ? routeLabels[
                            selectedRoute.specializationKey
                            ] ?? 'No disponible'
                            : 'Sin ruta seleccionada',

                initialLevel:
                    diagnosticResult.status === 'rejected'
                        ? 'No disponible'
                        : diagnostic?.resultingDifficulty?.name
                        ?? 'Pendiente',

                objective:
                    onboardingResult.status === 'rejected'
                        ? 'No disponible'
                        : onboarding?.learningGoal
                            ? goalLabels[onboarding.learningGoal]
                            ?? 'No disponible'
                            : 'Sin objetivo registrado',

                weeklyGoal:
                    onboardingResult.status === 'rejected'
                        ? 'No disponible'
                        : onboarding?.weeklyTimeCommitment
                            ? weeklyLabels[
                            onboarding.weeklyTimeCommitment
                            ] ?? 'No disponible'
                            : 'Sin meta registrada',
            })
        })

        return () => {
            active = false
        }
    }, [accessToken])

    // --------------------------------------------------------
    // GUARDAR INFORMACIÓN PERSONAL
    // --------------------------------------------------------


    const handleSavePersonal = async (changes) => {
        setFormError('')
        setSuccessMessage('')
        setIsSubmitting(true)

        try {
            const updated = await updateProfile(changes)

            setForm(createProfileForm(updated))

            setSuccessMessage(
                'Información personal actualizada correctamente.',
            )

            return true
        } catch (error) {
            setFormError(getAuthErrorMessage(error))

            return false
        } finally {
            setIsSubmitting(false)
        }
    }

    // --------------------------------------------------------
    // CARGAR PREFERENCIAS DE NOTIFICACIONES
    // --------------------------------------------------------

    useEffect(() => {
        if (
            activeTab !== 'notifications'
            || !accessToken
        ) {
            return
        }

        let active = true

        getCurrentUserNotificationPreferences(accessToken)
            .then((preferences) => {
                if (!active) return

                setNotificationPreferences(preferences)
                setNotificationLoadError('')
            })
            .catch((error) => {
                if (!active) return

                setNotificationLoadError(
                    getAuthErrorMessage(error),
                )
            })

        return () => {
            active = false
        }
    }, [activeTab, accessToken])

    // --------------------------------------------------------
    // GUARDAR PREFERENCIAS DE PRIVACIDAD
    // --------------------------------------------------------

    const handleSavePrivacy = async (changes) => {
        const savedPreferences =
            await updateCurrentUserPrivacyPreferences({
                accessToken,
                preferences: changes,
            })

        setPrivacyPreferences(savedPreferences)

        return true
    }

    // --------------------------------------------------------
    // GUARDAR PREFERENCIAS DE NOTIFICACIONES
    // --------------------------------------------------------

    const handleSaveNotifications = async (changes) => {
        const savedPreferences =
            await updateCurrentUserNotificationPreferences({
                accessToken,
                preferences: changes,
            })

        setNotificationPreferences(savedPreferences)

        return true
    }

    // --------------------------------------------------------
    // CERRAR SESIÓN
    // --------------------------------------------------------

    const handleSignOut = async () => {
        try {
            await signOut()
        } finally {
            navigate('/login', {
                replace: true,
            })
        }
    }

    // --------------------------------------------------------
    // CAMBIAR PESTAÑA
    // --------------------------------------------------------

    const changeTab = (tab) => {
        setActiveTab(tab)
        setFormError('')
        setSuccessMessage('')
    }

    // --------------------------------------------------------
    // NOMBRE DEL USUARIO
    // --------------------------------------------------------

    const profileUser = {
        ...(user ?? {}),
        fullName:
            user?.fullName
            || form?.fullName
            || '',
        email:
            user?.email
            || form?.email
            || '',
        username: user?.username ?? form?.username ?? null,
        bio: user?.bio ?? form?.bio ?? null,
        githubUrl: user?.githubUrl ?? form?.githubUrl ?? null,
        portfolioUrl: user?.portfolioUrl ?? form?.portfolioUrl ?? null,
    }

    const displayName =
        profileUser.fullName.trim() || 'Estudiante'

    // ========================================================
    // 4. CARGA / ERROR
    // ========================================================

    if (!form && !loadError) {
        return <FullPageLoader />
    }

    if (loadError) {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <h1>No fue posible cargar tu perfil</h1>

                    <p className="form-error" role="alert">
                        {loadError}
                    </p>

                    <Link to="/dashboard">
                        Volver al dashboard
                    </Link>
                </section>
            </main>
        )
    }

    // ========================================================
    // 5. INTERFAZ PRINCIPAL
    // ========================================================

    return (
        <main className="profile-layout">

            <LearningSidebar
                variant="profile"
                activeItem="profile"
                mascotSrc="/images/learn2code-mascot-laptop-transparent.png"
                streakDays={headerStats.streakDays}
            />

            <div className="profile-main">

                {/* TOPBAR */}
                <ProfileTopbar
                    userName={displayName}
                    onLogout={handleSignOut}
                    streakDays={headerStats.streakDays}
                    onOpenNotifications={() => {
                        changeTab('notifications')
                    }}
                />

                <div className="profile-layout-content">

                    {/* ENCABEZADO */}
                    <ProfileHeader
                        user={profileUser}
                        stats={headerStats}
                        mascotSrc="/images/trofeo_perfil.png"
                    />

                    {/* PESTAÑAS */}
                    <div
                        className="profile-tabs"
                        role="tablist"
                        aria-label="Secciones del perfil"
                    >
                        {tabs.map((tab) => {
                            const Icon = tab.Icon
                            const selected = activeTab === tab.id

                            return (
                                <button
                                    key={tab.id}
                                    id={`profile-tab-${tab.id}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={selected}
                                    aria-controls={
                                        `profile-panel-${tab.id}`
                                    }
                                    className={
                                        'profile-tab'
                                        + (selected ? ' is-active' : '')
                                    }
                                    onClick={() => {
                                        changeTab(tab.id)
                                    }}
                                >
                                    <Icon aria-hidden="true" />

                                    <span>{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>

                    {/* CONTENIDO */}
                    <div className="profile-tab-content">

                        {/* INFORMACIÓN PERSONAL */}
                        {activeTab === 'personal' && (
                            <div
                                id="profile-panel-personal"
                                role="tabpanel"
                                aria-labelledby="profile-tab-personal"
                            >
                                <ProfilePersonalInfo
                                    user={profileUser}
                                    onSave={handleSavePersonal}
                                    isSaving={isSubmitting}
                                    error={formError}
                                    success={successMessage}
                                    onOpenLearning={() => {
                                        changeTab('learning')
                                    }}
                                    onPublicProfile={() => {
                                        navigate('/profile/public')
                                    }}
                                    learningData={learningData}
                                />
                            </div>
                        )}

                        {/* APRENDIZAJE */}
                        {activeTab === 'learning' && (
                            <div
                                id="profile-panel-learning"
                                role="tabpanel"
                                aria-labelledby="profile-tab-learning"
                            >
                                <ProfileLearning />
                            </div>
                        )}

                        {/* SEGURIDAD */}
                        {activeTab === 'security' && (
                            <div
                                id="profile-panel-security"
                                role="tabpanel"
                                aria-labelledby="profile-tab-security"
                            >
                                <ProfileSecurity
                                    email={profileUser.email}
                                    isEmailVerified={Boolean(
                                        profileUser.emailVerified
                                        || profileUser.emailVerifiedAt,
                                    )}
                                />
                            </div>
                        )}

                        {/* NOTIFICACIONES */}
                        {activeTab === 'notifications' && (
                            <div
                                id="profile-panel-notifications"
                                role="tabpanel"
                                aria-labelledby="profile-tab-notifications"
                            >
                                {notificationLoadError ? (
                                    <p role="alert">
                                        {notificationLoadError}
                                    </p>
                                ) : notificationPreferences === null ? (
                                    <p role="status">
                                        Cargando preferencias de notificaciones...
                                    </p>
                                ) : (
                                    <ProfileNotifications
                                        initialPreferences={notificationPreferences}
                                        onSave={handleSaveNotifications}
                                        mascotSrc="/images/learn2code-mascot-laptop-transparent.png"
                                    />
                                )}
                            </div>
                        )}

                        {/* PRIVACIDAD */}
                        {activeTab === 'privacy' && (
                            <div
                                id="profile-panel-privacy"
                                role="tabpanel"
                                aria-labelledby="profile-tab-privacy"
                            >
                                {privacyLoadError ? (
                                    <p role="alert">
                                        {privacyLoadError}
                                    </p>
                                ) : privacyPreferences === null ? (
                                    <p role="status">
                                        Cargando preferencias de privacidad...
                                    </p>
                                ) : (
                                    <ProfilePrivacy
                                        user={profileUser}
                                        initialPreferences={privacyPreferences}
                                        onSave={handleSavePrivacy}
                                        mascotSrc="/images/learn2code-mascot-laptop-transparent.png"
                                    />
                                )}
                            </div>
                        )}

                    </div>

                </div>
            </div>
        </main>
    )
}


/**
 * ============================================================
 * LEARN2CODE - PÁGINA PRINCIPAL DEL PERFIL
 * ============================================================
 *
 * ARCHIVO:
 * frontend/src/pages/ProfilePage.jsx
 *
 * PESTAÑAS:
 * 1. Información personal
 * 2. Aprendizaje
 * 3. Seguridad
 * 4. Notificaciones
 * 5. Privacidad
 *
 * FUNCIONALIDAD:
 * - Datos de sesión reales.
 * - Carga y actualización del perfil.
 * - Cierre de sesión.
 * - Cambio entre pestañas.
 * - Acceso a la vista pública.
 *
 * ============================================================
 */

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
        preferredLocale:
            user?.preferredLocale ?? 'es-MX',
        preferredProgrammingLanguageId:
            user?.preferredProgrammingLanguageId == null
                ? ''
                : String(
                    user.preferredProgrammingLanguageId,
                ),
    }
}

// ============================================================
// 3. COMPONENTE PRINCIPAL
// ============================================================

export function ProfilePage() {
    const navigate = useNavigate()
    const location = useLocation()

    const {
        user,
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
    // GUARDAR INFORMACIÓN PERSONAL
    // --------------------------------------------------------

    const handleSavePersonal = async ({ fullName }) => {
        setFormError('')
        setSuccessMessage('')
        setIsSubmitting(true)

        try {
            const updated = await updateProfile({
                fullName,
                preferredLocale:
                    form?.preferredLocale ?? 'es-MX',
                preferredProgrammingLanguageId:
                    form?.preferredProgrammingLanguageId === ''
                    || form?.preferredProgrammingLanguageId == null
                        ? null
                        : Number(
                            form.preferredProgrammingLanguageId,
                        ),
            })

            setForm(createProfileForm(updated))

            setSuccessMessage(
                'Información personal actualizada correctamente.',
            )

            return true
        } catch (error) {
            setFormError(
                getAuthErrorMessage(error),
            )

            return false
        } finally {
            setIsSubmitting(false)
        }
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

            {/* SIDEBAR */}
            <LearningSidebar variant="profile" />

            <div className="profile-main">

                {/* TOPBAR */}
                <ProfileTopbar
                    userName={displayName}
                    onLogout={handleSignOut}
                    onOpenNotifications={() => {
                        changeTab('notifications')
                    }}
                />

                <div className="profile-layout-content">

                    {/* ENCABEZADO */}
                    <ProfileHeader
                        user={profileUser}
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
                                <ProfileNotifications
                                    mascotSrc="/images/learn2code-mascot-laptop-transparent.png"
                                />
                            </div>
                        )}

                        {/* PRIVACIDAD */}
                        {activeTab === 'privacy' && (
                            <div
                                id="profile-panel-privacy"
                                role="tabpanel"
                                aria-labelledby="profile-tab-privacy"
                            >
                                <ProfilePrivacy
                                    user={profileUser}
                                    mascotSrc="/images/learn2code-mascot-laptop-transparent.png"
                                />
                            </div>
                        )}

                    </div>

                </div>
            </div>
        </main>
    )
}

import {
    useEffect,
    useRef,
    useState,
} from 'react'

import {
    FiBell,
    FiChevronDown,
    FiLogOut,
    FiSearch,
    FiUser,
} from 'react-icons/fi'

import {
    FaFire,
} from 'react-icons/fa'

import {
    Link,
} from 'react-router-dom'

import './ProfileTopbar.css'

export function ProfileTopbar({
    userName = 'Estudiante',
    onLogout,
    onOpenNotifications,
    streakDays = null,
    notificationCount = 0,
}) {
    // ========================================================
    // 6.1 NORMALIZAR EL NOMBRE DEL ESTUDIANTE
    // ========================================================

    const normalizedName =
        typeof userName === 'string' && userName.trim()
            ? userName.trim()
            : 'Estudiante'

    const userInitial = normalizedName
        .charAt(0)
        .toUpperCase()

    // ========================================================
    // 6.2 ESTADOS
    // ========================================================

    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const accountRef = useRef(null)

    // ========================================================
    // 6.3 CERRAR EL MENÚ CON ESCAPE
    // ========================================================

    useEffect(() => {
        if (!isMenuOpen) {
            return undefined
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false)
            }
        }
        window.addEventListener(
            'keydown',
            handleKeyDown,
        )

        return () => {
            window.removeEventListener(
                'keydown',
                handleKeyDown,
            )
        }
    }, [isMenuOpen])

    // ========================================================
    // 6.4 CERRAR EL MENÚ AL HACER CLIC FUERA
    // ========================================================

    useEffect(() => {
        if (!isMenuOpen) {
            return undefined
        }

        const handleOutsideClick = (event) => {
            if (
                accountRef.current
                && !accountRef.current.contains(event.target)
            ) {
                setIsMenuOpen(false)
            }
        }
        document.addEventListener(
            'pointerdown',
            handleOutsideClick,
        )

        return () => {
            document.removeEventListener(
                'pointerdown',
                handleOutsideClick,
            )
        }
    }, [isMenuOpen])

    // ========================================================
    // 6.5 CIERRE DE SESIÓN
    // ========================================================

    const handleLogout = async () => {
        setIsMenuOpen(false)
        if (typeof onLogout === 'function') {
            await onLogout()
        }
    }

    // ========================================================
    // 6.6 ABRIR NOTIFICACIONES
    // ========================================================

    const handleNotifications = () => {
        if (typeof onOpenNotifications === 'function') {
            onOpenNotifications()
        }
    }

    // ========================================================
    // 6.7 VALIDAR VALORES VISUALES
    // ========================================================

    const safeStreakDays =
        Number.isFinite(Number(streakDays))
            ? Math.max(0, Number(streakDays))
            : 0

    const safeNotificationCount =
        Number.isFinite(Number(notificationCount))
            ? Math.max(0, Number(notificationCount))
            : 0

    // ========================================================
    // 7. RENDERIZADO
    // ========================================================

    return (
        <header className="profile-topbar">
            {/* =================================================
                7.1 BUSCADOR
                ================================================= */}
            <div
                className="profile-topbar-search"
                role="search"
            >
                <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => {
                        setSearchQuery(event.target.value)
                    }}
                    placeholder="Buscar cursos, temas o tecnologías..."
                    aria-label="Buscar cursos, temas o tecnologías"
                />
                <FiSearch aria-hidden="true" />
            </div>

            {/* =================================================
                7.2 CONTENEDOR DE ACCIONES
                ================================================= */}
            <div className="profile-topbar-actions">
                {/* =============================================
                    RACHA DE ESTUDIO
                    ============================================= */}
                {streakDays != null && (
                    <div className="profile-topbar-streak">
                        <FaFire aria-hidden="true" />
                        <div>
                            <span>Racha</span>
                            <strong>{safeStreakDays} días</strong>
                        </div>
                    </div>
                )}

                {/* =============================================
                    NOTIFICACIONES
                    ============================================= */}
                <button
                    className="profile-topbar-notifications"
                    type="button"
                    aria-label="Notificaciones"
                    title="Notificaciones"
                    onClick={handleNotifications}
                    disabled={typeof onOpenNotifications !== 'function'}
                >
                    <FiBell aria-hidden="true" />
                    {safeNotificationCount > 0 && (
                        <span className="profile-topbar-notification-count">
                            {safeNotificationCount > 99
                                ? '99+'
                                : safeNotificationCount}
                        </span>
                    )}
                </button>

                {/* =============================================
                    MENÚ DE CUENTA
                    ============================================= */}
                <div
                    className="profile-topbar-account"
                    ref={accountRef}
                >
                    {/* -----------------------------------------
                        BOTÓN PRINCIPAL DEL USUARIO
                        ----------------------------------------- */}
                    <button
                        className="profile-topbar-account-button"
                        type="button"
                        aria-expanded={isMenuOpen}
                        aria-haspopup="menu"
                        aria-label={`Opciones de cuenta de ${normalizedName}`}
                        onClick={() => {
                            setIsMenuOpen((current) => !current)
                        }}
                    >
                        <span className="profile-topbar-avatar">
                            {userInitial}
                        </span>
                        <span className="profile-topbar-account-info">
                            <strong>{normalizedName}</strong>
                            <small>Estudiante</small>
                        </span>
                        <FiChevronDown aria-hidden="true" />
                    </button>

                    {/* =========================================
                        MENÚ DESPLEGABLE
                        ========================================= */}
                    {isMenuOpen && (
                        <div
                            className="profile-topbar-dropdown"
                            role="menu"
                            aria-label="Opciones de cuenta"
                        >
                            {/* MI PERFIL */}
                            <Link
                                to="/profile"
                                role="menuitem"
                                onClick={() => {
                                    setIsMenuOpen(false)
                                }}
                            >
                                <FiUser aria-hidden="true" />
                                Mi perfil
                            </Link>

                            {/* CERRAR SESIÓN */}
                            {typeof onLogout === 'function' && (
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={handleLogout}
                                >
                                    <FiLogOut aria-hidden="true" />
                                    Cerrar sesión
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

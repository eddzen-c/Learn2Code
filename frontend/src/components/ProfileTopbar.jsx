
/**
 * ============================================================
 * LEARN2CODE - BARRA SUPERIOR DEL PERFIL
 * ============================================================
 *
 * ARCHIVO:
 * frontend/src/components/ProfileTopbar.jsx
 *
 * OBJETIVO:
 * Mostrar la barra superior del estudiante respetando
 * el diseño utilizado en los mockups de Learn2Code.
 *
 * CONTIENE:
 * 1. Buscador de cursos, temas y tecnologías.
 * 2. Indicador de racha de estudio.
 * 3. Acceso a notificaciones.
 * 4. Avatar con la inicial del estudiante.
 * 5. Nombre real del usuario autenticado.
 * 6. Menú desplegable de cuenta.
 * 7. Enlace a Mi perfil.
 * 8. Cierre de sesión.
 *
 * DATOS REALES:
 * - userName se recibe desde ProfilePage.
 * - onLogout utiliza el flujo de autenticación existente.
 *
 * DATOS PENDIENTES:
 * - Racha de estudio.
 * - Número de notificaciones.
 * - Resultados del buscador.
 *
 * IMPORTANTE:
 * El indicador de racha y las notificaciones utilizan
 * actualmente los valores visuales del mockup.
 *
 * ============================================================
 */

// ============================================================
// 1. IMPORTACIONES DE REACT
// ============================================================

import {
    useEffect,
    useRef,
    useState,
} from 'react'

// ============================================================
// 2. ICONOS FEATHER
// ============================================================

import {
    FiBell,
    FiChevronDown,
    FiLogOut,
    FiSearch,
    FiUser,
} from 'react-icons/fi'

// ============================================================
// 3. ICONO DE RACHA
// ============================================================

/**
 * Utilizamos FaFire porque react-icons/fi
 * no contiene un icono llamado FiFlame.
 */
import {
    FaFire,
} from 'react-icons/fa'

// ============================================================
// 4. NAVEGACIÓN
// ============================================================

import {
    Link,
} from 'react-router-dom'

// ============================================================
// 5. ESTILOS
// ============================================================

import './ProfileTopbar.css'

// ============================================================
// 6. COMPONENTE PRINCIPAL
// ============================================================

export function ProfileTopbar({

    // Nombre obtenido del usuario autenticado.
    userName = 'Estudiante',

    // Función de cierre de sesión proporcionada por ProfilePage.
    onLogout,

    // Función opcional para cambiar a la pestaña Notificaciones.
    onOpenNotifications,

    // Datos opcionales para integrar estadísticas reales.
    streakDays = 14,

    // Contador visual de notificaciones.
    notificationCount = 3,

}) {

    // ========================================================
    // 6.1 NORMALIZAR EL NOMBRE DEL ESTUDIANTE
    // ========================================================

    /**
     * Evitamos mostrar:
     * - undefined
     * - null
     * - cadenas vacías
     *
     * Cuando todavía no existe un nombre disponible,
     * utilizamos "Estudiante".
     */
    const normalizedName =
        typeof userName === 'string' && userName.trim()
            ? userName.trim()
            : 'Estudiante'

    /**
     * Obtenemos la primera letra del nombre
     * para mostrarla dentro del avatar.
     */
    const userInitial = normalizedName
        .charAt(0)
        .toUpperCase()

    // ========================================================
    // 6.2 ESTADOS
    // ========================================================

    /**
     * Indica si el menú de cuenta está abierto.
     */
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    /**
     * Texto escrito en el buscador.
     */
    const [searchQuery, setSearchQuery] = useState('')

    /**
     * Referencia al contenedor de cuenta.
     *
     * Permite detectar clics fuera del menú.
     */
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

            /**
             * Si el elemento seleccionado no pertenece
             * al contenedor de la cuenta, cerramos el menú.
             */
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

    /**
     * Este componente no elimina tokens manualmente.
     *
     * ProfilePage administra el cierre mediante
     * la función signOut del contexto de autenticación.
     *
     * De esta manera conservamos el comportamiento
     * real de Learn2Code.
     */
    const handleLogout = async () => {

        // Cerrar el menú antes de finalizar la sesión.
        setIsMenuOpen(false)

        if (typeof onLogout === 'function') {
            await onLogout()
        }
    }

    // ========================================================
    // 6.6 ABRIR NOTIFICACIONES
    // ========================================================

    /**
     * Si ProfilePage proporciona onOpenNotifications,
     * activamos directamente la pestaña correspondiente.
     *
     * En caso contrario, no modificamos manualmente
     * la URL ni el hash del navegador.
     */
    const handleNotifications = () => {

        if (typeof onOpenNotifications === 'function') {
            onOpenNotifications()
        }
    }

    // ========================================================
    // 6.7 VALIDAR VALORES VISUALES
    // ========================================================

    /**
     * Mientras las estadísticas no estén conectadas,
     * los valores iniciales representan el mockup.
     *
     * Posteriormente podrán reemplazarse por datos
     * reales obtenidos de la API.
     */
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
                =================================================

                Por el momento es un campo visual.

                TODO:
                Implementar un servicio de búsqueda
                para cursos, rutas y tecnologías.
            */}

            <div
                className="profile-topbar-search"
                role="search"
            >

                {/* Campo de búsqueda */}
                <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => {

                        setSearchQuery(event.target.value)

                    }}
                    placeholder="Buscar cursos, temas o tecnologías..."
                    aria-label="Buscar cursos, temas o tecnologías"
                />

                {/* Icono de búsqueda */}
                <FiSearch aria-hidden="true" />

            </div>

            {/* =================================================
                7.2 CONTENEDOR DE ACCIONES
                ================================================= */}

            <div className="profile-topbar-actions">

                {/* =============================================
                    RACHA DE ESTUDIO
                    ============================================= */}

                <div className="profile-topbar-streak">

                    {/* Icono de fuego */}
                    <FaFire aria-hidden="true" />

                    {/* Texto de racha */}
                    <div>

                        <span>
                            Racha
                        </span>

                        <strong>
                            {safeStreakDays} días
                        </strong>

                    </div>

                </div>

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

                    {/* Icono de campana */}
                    <FiBell aria-hidden="true" />

                    {/* Contador de notificaciones */}
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

                        {/* Avatar con inicial real */}
                        <span className="profile-topbar-avatar">

                            {userInitial}

                        </span>

                        {/* Nombre y rol */}
                        <span className="profile-topbar-account-info">

                            <strong>
                                {normalizedName}
                            </strong>

                            <small>
                                Estudiante
                            </small>

                        </span>

                        {/* Flecha indicadora */}
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

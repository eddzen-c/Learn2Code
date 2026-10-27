/**
 * ============================================================
 * LEARN2CODE - PESTAÑA DE SEGURIDAD
 * ============================================================
 *
 * Este componente representa el mockup de la pestaña
 * "Seguridad" dentro de la página de perfil.
 *
 * CONTIENE:
 * 1. Formulario para cambiar contraseña.
 * 2. Tarjeta de acceso a la cuenta.
 * 3. Tarjeta de verificación en dos pasos.
 * 4. Tarjeta de sesiones activas.
 * 5. Tarjeta visual de "Revisa tus accesos".
 *
 * NOTA:
 * La lógica real de backend se puede conectar después.
 * Por ahora la meta es que el diseño quede muy parecido
 * al mockup original.
 */

import {
    useMemo,
    useState,
} from 'react'

import {
    FiCheckCircle,
    FiClock,
    FiEdit2,
    FiEye,
    FiEyeOff,
    FiMail,
    FiMonitor,
    FiSettings,
    FiShield,
    FiSmartphone,
} from 'react-icons/fi'

import './ProfileSecurity.css'

/**
 * ============================================================
 * DATOS DE SESIONES DE EJEMPLO
 * ============================================================
 *
 * Si todavía no se envían sesiones reales desde el backend,
 * se usan estas sesiones visuales para el mockup.
 */
const fallbackSessions = [
    {
        id: 'current-session',
        device: 'Windows',
        browser: 'Chrome',
        subtitle: 'Este equipo',
        isCurrent: true,
    },
    {
        id: 'mobile-session',
        device: 'Android',
        browser: 'Chrome',
        subtitle: 'Última actividad hace 2 días',
        isCurrent: false,
    },
]

export function ProfileSecurity({
    email = 'ana@example.com',
    isEmailVerified = true,
    twoFactorEnabled = false,
    sessions = fallbackSessions,
    onSubmitPassword,
    onChangeEmail,
    onConfigureTwoFactor,
    onCloseSession,
    onCloseOtherSessions,
}) {
    // ========================================================
    // 1. ESTADOS DEL FORMULARIO
    // ========================================================

    const [currentPassword, setCurrentPassword] =
        useState('••••••••••••')

    const [newPassword, setNewPassword] =
        useState('••••••••••••')

    const [confirmPassword, setConfirmPassword] =
        useState('••••••••••••')

    // ========================================================
    // 2. CONTROL VISUAL DE LOS INPUTS PASSWORD
    // ========================================================

    const [showCurrentPassword, setShowCurrentPassword] =
        useState(false)

    const [showNewPassword, setShowNewPassword] =
        useState(false)

    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false)

    // ========================================================
    // 3. MENSAJES DEL FORMULARIO
    // ========================================================

    const [formError, setFormError] = useState('')
    const [successMessage, setSuccessMessage] =
        useState('')

    // ========================================================
    // 4. ESTADO VISUAL DE 2FA
    // ========================================================

    const twoFactorLabel = twoFactorEnabled
        ? 'Activa'
        : 'Desactivada'

    // ========================================================
    // 5. SESIONES RESUELTAS
    // ========================================================

    const resolvedSessions = useMemo(() => {
        if (
            Array.isArray(sessions) &&
            sessions.length > 0
        ) {
            return sessions
        }

        return fallbackSessions
    }, [sessions])

    // ========================================================
    // 6. ENVÍO DEL FORMULARIO
    // ========================================================

    const handleSubmit = async (event) => {
        event.preventDefault()

        setFormError('')
        setSuccessMessage('')

        if (
            !currentPassword.trim() ||
            !newPassword.trim() ||
            !confirmPassword.trim()
        ) {
            setFormError(
                'Completa todos los campos para actualizar tu contraseña.',
            )
            return
        }

        if (newPassword.length < 12) {
            setFormError(
                'La nueva contraseña debe tener al menos 12 caracteres.',
            )
            return
        }

        if (newPassword !== confirmPassword) {
            setFormError(
                'La confirmación de contraseña no coincide.',
            )
            return
        }

        try {
            if (typeof onSubmitPassword === 'function') {
                await onSubmitPassword({
                    currentPassword,
                    newPassword,
                    confirmPassword,
                })
            }

            setSuccessMessage(
                'Tu contraseña se actualizó correctamente.',
            )
        } catch (error) {
            setFormError(
                error?.message ??
                    'No fue posible actualizar la contraseña.',
            )
        }
    }

    // ========================================================
    // 7. LIMPIAR FORMULARIO
    // ========================================================

    const handleReset = () => {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setFormError('')
        setSuccessMessage('')
    }

    // ========================================================
    // 8. CERRAR OTRAS SESIONES
    // ========================================================

    const handleCloseOtherSessions = () => {
        if (typeof onCloseOtherSessions === 'function') {
            onCloseOtherSessions()
        }
    }

    // ========================================================
    // 9. INTERFAZ
    // ========================================================

    return (
        <section className="profile-security">
            {/* =================================================
                COLUMNA IZQUIERDA
                ================================================= */}
            <div className="profile-security__main">
                {/* =============================================
                    CAMBIAR CONTRASEÑA
                    ============================================= */}
                <article className="profile-security__card">
                    <header className="profile-security__card-header">
                        <h3>Cambiar contraseña</h3>

                        <p>
                            Confirma tu contraseña actual para
                            establecer una nueva.
                        </p>
                    </header>

                    <form
                        className="profile-security__form"
                        onSubmit={handleSubmit}
                    >
                        <div className="profile-security__field">
                            <label htmlFor="current-password">
                                Contraseña actual
                            </label>

                            <div className="profile-security__input-wrapper">
                                <input
                                    id="current-password"
                                    type={
                                        showCurrentPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    value={currentPassword}
                                    onChange={(event) => {
                                        setCurrentPassword(
                                            event.target.value,
                                        )
                                    }}
                                />

                                <button
                                    type="button"
                                    className="profile-security__eye-button"
                                    onClick={() => {
                                        setShowCurrentPassword(
                                            (current) =>
                                                !current,
                                        )
                                    }}
                                    aria-label="Mostrar contraseña actual"
                                >
                                    {showCurrentPassword ? (
                                        <FiEyeOff />
                                    ) : (
                                        <FiEye />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="profile-security__field">
                            <label htmlFor="new-password">
                                Nueva contraseña
                            </label>

                            <div className="profile-security__input-wrapper">
                                <input
                                    id="new-password"
                                    type={
                                        showNewPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    value={newPassword}
                                    onChange={(event) => {
                                        setNewPassword(
                                            event.target.value,
                                        )
                                    }}
                                />

                                <button
                                    type="button"
                                    className="profile-security__eye-button"
                                    onClick={() => {
                                        setShowNewPassword(
                                            (current) =>
                                                !current,
                                        )
                                    }}
                                    aria-label="Mostrar nueva contraseña"
                                >
                                    {showNewPassword ? (
                                        <FiEyeOff />
                                    ) : (
                                        <FiEye />
                                    )}
                                </button>
                            </div>

                            <p className="profile-security__helper-text">
                                Usa al menos 12 caracteres y evita
                                contraseñas que ya utilices.
                            </p>
                        </div>

                        <div className="profile-security__field">
                            <label htmlFor="confirm-password">
                                Confirmar nueva contraseña
                            </label>

                            <div className="profile-security__input-wrapper">
                                <input
                                    id="confirm-password"
                                    type={
                                        showConfirmPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    value={confirmPassword}
                                    onChange={(event) => {
                                        setConfirmPassword(
                                            event.target.value,
                                        )
                                    }}
                                />

                                <button
                                    type="button"
                                    className="profile-security__eye-button"
                                    onClick={() => {
                                        setShowConfirmPassword(
                                            (current) =>
                                                !current,
                                        )
                                    }}
                                    aria-label="Mostrar confirmación de contraseña"
                                >
                                    {showConfirmPassword ? (
                                        <FiEyeOff />
                                    ) : (
                                        <FiEye />
                                    )}
                                </button>
                            </div>
                        </div>

                        {formError && (
                            <p className="profile-security__form-error">
                                {formError}
                            </p>
                        )}

                        {successMessage && (
                            <p className="profile-security__form-success">
                                {successMessage}
                            </p>
                        )}

                        <div className="profile-security__actions">
                            <button
                                type="button"
                                className="profile-security__button profile-security__button--secondary"
                                onClick={handleReset}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="profile-security__button profile-security__button--primary"
                            >
                                Actualizar contraseña
                            </button>
                        </div>
                    </form>
                </article>

                {/* =============================================
                    SESIONES ACTIVAS
                    ============================================= */}
                <article className="profile-security__card">
                    <header className="profile-security__card-header">
                        <h3>Sesiones activas</h3>

                        <p>
                            Dispositivos donde has iniciado
                            sesión en tu cuenta.
                        </p>
                    </header>

                    <div className="profile-security__sessions-list">
                        {resolvedSessions.map((session) => (
                            <div
                                key={session.id}
                                className="profile-security__session-item"
                            >
                                <div className="profile-security__session-icon">
                                    {session.device
                                        .toLowerCase()
                                        .includes(
                                            'android',
                                        ) ? (
                                        <FiSmartphone />
                                    ) : (
                                        <FiMonitor />
                                    )}
                                </div>

                                <div className="profile-security__session-info">
                                    <strong>
                                        {session.device} ·{' '}
                                        {session.browser}
                                    </strong>

                                    <span>
                                        {session.subtitle}
                                    </span>
                                </div>

                                <div className="profile-security__session-side">
                                    {session.isCurrent ? (
                                        <div className="profile-security__current-session">
                                            <span>
                                                Sesión actual
                                            </span>

                                            <small>
                                                Activa ahora
                                            </small>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="profile-security__logout-session"
                                            onClick={() => {
                                                if (
                                                    typeof onCloseSession ===
                                                    'function'
                                                ) {
                                                    onCloseSession(
                                                        session,
                                                    )
                                                }
                                            }}
                                        >
                                            Cerrar sesión
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="profile-security__text-link"
                        onClick={handleCloseOtherSessions}
                    >
                        <FiClock />
                        Cerrar las otras sesiones
                    </button>
                </article>
            </div>

            {/* =================================================
                COLUMNA DERECHA
                ================================================= */}
            <aside className="profile-security__sidebar">
                {/* =============================================
                    ACCESO A TU CUENTA
                    ============================================= */}
                <article className="profile-security__card profile-security__card--side">
                    <header className="profile-security__side-header">
                        <div className="profile-security__title-icon">
                            <FiMail />
                        </div>

                        <div>
                            <h3>Acceso a tu cuenta</h3>

                            <p>
                                Gestiona el correo electrónico
                                asociado a tu cuenta.
                            </p>
                        </div>
                    </header>

                    <div className="profile-security__email-box">
                        <span className="profile-security__email-label">
                            Correo electrónico
                        </span>

                        <div className="profile-security__email-row">
                            <strong>{email}</strong>

                            {isEmailVerified && (
                                <span className="profile-security__verified-pill">
                                    <FiCheckCircle />
                                    Verificado
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="profile-security__action-link"
                        onClick={() => {
                            if (typeof onChangeEmail === 'function') {
                                onChangeEmail()
                            }
                        }}
                    >
                        <FiEdit2 />
                        Cambiar correo
                    </button>
                </article>

                {/* =============================================
                    VERIFICACIÓN EN DOS PASOS
                    ============================================= */}
                <article className="profile-security__card profile-security__card--side">
                    <header className="profile-security__side-header profile-security__side-header--space-between">
                        <div className="profile-security__side-heading-group">
                            <div className="profile-security__title-icon">
                                <FiShield />
                            </div>

                            <div>
                                <h3>
                                    Verificación en dos pasos
                                </h3>

                                <p>
                                    Añade una comprobación adicional
                                    al iniciar sesión.
                                </p>
                            </div>
                        </div>

                        <span className="profile-security__status-pill">
                            {twoFactorLabel}
                        </span>
                    </header>

                    <button
                        type="button"
                        className="profile-security__button profile-security__button--outline-danger profile-security__configure-button"
                        onClick={() => {
                            if (
                                typeof onConfigureTwoFactor ===
                                'function'
                            ) {
                                onConfigureTwoFactor()
                            }
                        }}
                    >
                        <FiSettings />
                        Configurar
                    </button>
                </article>

                {/* =============================================
                    REVISA TUS ACCESOS
                    ============================================= */}
                <article className="profile-security__security-tip">
                    <img
                        src="/images/learn2code-mascot-laptop-transparent.png"
                        alt="Mascota de Learn2Code revisando accesos"
                        className="profile-security__security-tip-image"
                    />

                    <div className="profile-security__security-tip-content">
                        <h4>Revisa tus accesos</h4>

                        <p>
                            Si no reconoces una sesión, ciérrala
                            y actualiza tu contraseña.
                        </p>
                    </div>
                </article>
            </aside>
        </section>
    )
}
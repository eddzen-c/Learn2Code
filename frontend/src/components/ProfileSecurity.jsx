import {
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

import {
    getPasswordValidation,
} from '../auth/password-policy.js'

import './ProfileSecurity.css'

export function ProfileSecurity({
    email = 'ana@example.com',
    isEmailVerified = true,
    twoFactorEnabled = null,
    sessions = [],
    onSubmitPassword,
    onRequestEmailChange,
    onConfirmEmailChange,
    onConfigureTwoFactor,
    onCloseSession,
    onCloseOtherSessions,
}) {
    // ========================================================
    // 1. ESTADOS DEL FORMULARIO
    // ========================================================

    const [currentPassword, setCurrentPassword] =
        useState('')

    const [newPassword, setNewPassword] =
        useState('')

    const [confirmPassword, setConfirmPassword] =
        useState('')

    // ========================================================
    // ESTADOS DEL CAMBIO DE CORREO
    // ========================================================

    const [emailChangeOpen, setEmailChangeOpen] =
        useState(false)

    const [emailCodeRequested, setEmailCodeRequested] =
        useState(false)

    const [emailDraft, setEmailDraft] =
        useState('')

    const [emailPassword, setEmailPassword] =
        useState('')

    const [pendingEmail, setPendingEmail] =
        useState('')

    const [emailCode, setEmailCode] =
        useState('')

    const [emailSubmitting, setEmailSubmitting] =
        useState(false)

    const [emailError, setEmailError] =
        useState('')

    const [emailNotice, setEmailNotice] =
        useState('')

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

    const twoFactorLabel =
        typeof twoFactorEnabled !== 'boolean'
            ? 'No disponible'
            : twoFactorEnabled
                ? 'Activa'
                : 'Desactivada'

    // ========================================================
    // 5. SESIONES RESUELTAS
    // ========================================================

    const resolvedSessions =
        Array.isArray(sessions) ? sessions : []

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

        const passwordValidation =
            getPasswordValidation(newPassword)

        if (!passwordValidation.minLength) {
            setFormError(
                'La nueva contraseña debe tener al menos 8 caracteres.',
            )
            return
        }

        if (
            !passwordValidation.uppercase ||
            !passwordValidation.number ||
            !passwordValidation.special
        ) {
            setFormError(
                'La nueva contraseña debe incluir una mayúscula, un número y un carácter especial.',
            )
            return
        }

        if (!passwordValidation.withinByteLimit) {
            setFormError(
                'La contraseña es demasiado larga. Prueba con una más corta.',
            )
            return
        }

        if (newPassword !== confirmPassword) {
            setFormError(
                'La confirmación de contraseña no coincide.',
            )
            return
        }

        if (typeof onSubmitPassword !== 'function') {
            setFormError(
                'El cambio de contraseña todavía no está disponible.',
            )
            return
        }

        try {
            await onSubmitPassword({
                currentPassword,
                newPassword,
                confirmPassword,
            })

            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')

            setSuccessMessage(
                'Tu contraseña se actualizó correctamente.',
            )
        } catch (error) {
            setFormError(
                error?.message
                ?? 'No fue posible actualizar la contraseña.',
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
    // 9. CAMBIO DE CORREO
    // ========================================================

    const resetEmailChangeForm = () => {
        if (emailSubmitting) {
            return
        }

        setEmailChangeOpen(false)
        setEmailCodeRequested(false)
        setEmailDraft('')
        setEmailPassword('')
        setPendingEmail('')
        setEmailCode('')
        setEmailError('')
        setEmailNotice('')
    }

    // --------------------------------------------------------
    // SOLICITAR CODIGO AL CORREO NUEVO
    // --------------------------------------------------------

    const handleRequestEmailChange = async (event) => {
        event.preventDefault()

        if (emailSubmitting) {
            return
        }

        setEmailError('')
        setEmailNotice('')

        const normalizedEmail =
            emailDraft.trim().toLowerCase()

        if (
            !normalizedEmail
            || normalizedEmail.length > 254
            || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ) {
            setEmailError(
                'Introduce un correo electrónico válido.',
            )
            return
        }

        if (!emailPassword.trim()) {
            setEmailError(
                'Introduce tu contraseña actual.',
            )
            return
        }

        if (
            normalizedEmail ===
            String(email).trim().toLowerCase()
        ) {
            setEmailError(
                'El nuevo correo debe ser diferente al actual.',
            )
            return
        }

        if (typeof onRequestEmailChange !== 'function') {
            setEmailError(
                'El cambio de correo todavía no está disponible.',
            )
            return
        }

        setEmailSubmitting(true)

        try {
            const result = await onRequestEmailChange({
                newEmail: normalizedEmail,
                currentPassword: emailPassword,
            })

            if (result?.requested !== true) {
                throw new Error(
                    'No fue posible solicitar el cambio de correo.',
                )
            }

            setPendingEmail(normalizedEmail)
            setEmailPassword('')
            setEmailCode('')
            setEmailCodeRequested(true)

            setEmailNotice(
                `Enviamos un código de seis dígitos a ${normalizedEmail}.`,
            )
        } catch (error) {
            setEmailError(
                error?.message
                ?? 'No fue posible solicitar el cambio de correo.',
            )
        } finally {
            setEmailSubmitting(false)
        }
    }

    // --------------------------------------------------------
    // CONFIRMAR CODIGO RECIBIDO
    // --------------------------------------------------------

    const handleConfirmEmailChange = async (event) => {
        event.preventDefault()

        if (emailSubmitting) {
            return
        }

        setEmailError('')

        if (!/^\d{6}$/.test(emailCode)) {
            setEmailError(
                'Introduce el código de seis dígitos.',
            )
            return
        }

        if (typeof onConfirmEmailChange !== 'function') {
            setEmailError(
                'La confirmación del correo no está disponible.',
            )
            return
        }

        setEmailSubmitting(true)

        try {
            const result = await onConfirmEmailChange({
                code: emailCode,
            })

            if (result?.changed !== true) {
                throw new Error(
                    'No fue posible confirmar el cambio de correo.',
                )
            }

            setEmailPassword('')
            setEmailCode('')

            setEmailNotice(
                'Tu correo se actualizó correctamente.',
            )
        } catch (error) {
            setEmailError(
                error?.message
                ?? 'No fue posible confirmar el cambio de correo.',
            )
        } finally {
            setEmailSubmitting(false)
        }
    }

    // ========================================================
    // 10. INTERFAZ
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
                                Usa al menos 8 caracteres, una mayúscula,
                                un número y un carácter especial.
                                Evita reutilizar tu contraseña actual.
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
                        {resolvedSessions.length === 0 && (
                            <p className="profile-security__helper-text">
                                La información de sesiones activas
                                todavía no está disponible.
                            </p>
                        )}
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
                                            disabled={typeof onCloseSession !== 'function'}
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
                        disabled={
                            typeof onCloseOtherSessions !== 'function'
                            || resolvedSessions.length === 0
                        }
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

                    {!emailChangeOpen && (
                        <button
                            type="button"
                            className="profile-security__action-link"
                            onClick={() => {
                                setEmailError('')
                                setEmailNotice('')
                                setEmailChangeOpen(true)
                            }}
                            disabled={
                                !isEmailVerified
                                || typeof onRequestEmailChange !== 'function'
                                || typeof onConfirmEmailChange !== 'function'
                            }
                        >
                            <FiEdit2 />
                            Cambiar correo
                        </button>
                    )}

                    {!isEmailVerified && (
                        <p className="profile-security__helper-text">
                            Verifica primero tu correo actual
                            para poder cambiarlo.
                        </p>
                    )}

                    {emailChangeOpen && (
                        <form
                            className="profile-security__form"
                            onSubmit={
                                emailCodeRequested
                                    ? handleConfirmEmailChange
                                    : handleRequestEmailChange
                            }
                        >
                            {!emailCodeRequested ? (
                                <>
                                    <div className="profile-security__field">
                                        <label htmlFor="email-change-new">
                                            Nuevo correo electrónico
                                        </label>

                                        <div className="profile-security__input-wrapper">
                                            <input
                                                id="email-change-new"
                                                type="email"
                                                autoComplete="email"
                                                maxLength={254}
                                                required
                                                value={emailDraft}
                                                onChange={(event) => {
                                                    setEmailDraft(
                                                        event.target.value,
                                                    )
                                                }}
                                                disabled={emailSubmitting}
                                            />
                                        </div>
                                    </div>

                                    <div className="profile-security__field">
                                        <label htmlFor="email-change-password">
                                            Contraseña actual para cambiar correo
                                        </label>

                                        <div className="profile-security__input-wrapper">
                                            <input
                                                id="email-change-password"
                                                type="password"
                                                autoComplete="current-password"
                                                required
                                                value={emailPassword}
                                                onChange={(event) => {
                                                    setEmailPassword(
                                                        event.target.value,
                                                    )
                                                }}
                                                disabled={emailSubmitting}
                                            />
                                        </div>
                                    </div>

                                    <p className="profile-security__helper-text">
                                        Enviaremos un código de verificación
                                        a tu nuevo correo electrónico.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="profile-security__helper-text">
                                        Introduce el código que enviamos a{' '}
                                        <strong>{pendingEmail}</strong>.
                                    </p>

                                    <div className="profile-security__field">
                                        <label htmlFor="email-change-code">
                                            Código de seis dígitos
                                        </label>

                                        <div className="profile-security__input-wrapper">
                                            <input
                                                id="email-change-code"
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete="one-time-code"
                                                maxLength={6}
                                                pattern="[0-9]{6}"
                                                required
                                                value={emailCode}
                                                onChange={(event) => {
                                                    setEmailCode(
                                                        event.target.value
                                                            .replace(/\D/g, '')
                                                            .slice(0, 6),
                                                    )
                                                }}
                                                disabled={emailSubmitting}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {emailError && (
                                <p
                                    className="profile-security__form-error"
                                    role="alert"
                                >
                                    {emailError}
                                </p>
                            )}

                            {emailNotice && (
                                <p
                                    className="profile-security__form-success"
                                    role="status"
                                >
                                    {emailNotice}
                                </p>
                            )}

                            <div className="profile-security__actions">
                                <button
                                    type="button"
                                    className="profile-security__button profile-security__button--secondary"
                                    onClick={resetEmailChangeForm}
                                    disabled={emailSubmitting}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="profile-security__button profile-security__button--primary"
                                    disabled={emailSubmitting}
                                >
                                    {emailSubmitting
                                        ? 'Procesando...'
                                        : emailCodeRequested
                                            ? 'Confirmar correo'
                                            : 'Enviar código'}
                                </button>
                            </div>
                        </form>
                    )}
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
                        disabled={typeof onConfigureTwoFactor !== 'function'}
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
                        src="/images/plan-recomendado/dragon-laptop-512.webp"
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
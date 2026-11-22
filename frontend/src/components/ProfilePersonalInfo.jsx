import { useState } from 'react'

import {
    FiArrowRight,
    FiBarChart2,
    FiBookOpen,
    FiBox,
    FiCheckCircle,
    FiClock,
    FiExternalLink,
    FiEye,
    FiGithub,
    FiLink,
    FiSettings,
    FiShield,
    FiTarget,
} from 'react-icons/fi'

import './ProfilePersonalInfo.css'

// ============================================================
// 4. DATOS VISUALES DE APRENDIZAJE
// ============================================================

function splitFullName(fullName = '') {

    const parts = String(fullName)
        .trim()
        .split(/\s+/)
        .filter(Boolean)

    return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' '),
    }
}

// ============================================================
// 6. CREAR ESTADO INICIAL DEL FORMULARIO
// ============================================================

function createPersonalForm(user) {

    const names = splitFullName(user?.fullName)

    return {
        firstName: names.firstName,
        lastName: names.lastName,
        username: user?.username ?? '',
        email: user?.email ?? '',
        bio: user?.bio ?? '',
        githubUrl: user?.githubUrl ?? '',
        portfolioUrl: user?.portfolioUrl ?? '',
    }
}

// ============================================================
// 7. CREAR IDENTIFICADOR VISUAL DEL USUARIO
// ============================================================

function createDisplayUsername(fullName = '') {

    return String(fullName)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') || 'estudiante'
}

// ============================================================
// 8. COMPONENTE PRINCIPAL
// ============================================================

export function ProfilePersonalInfo({
    user,
    onSave,
    isSaving = false,
    error = '',
    success = '',
    onOpenLearning,
    onPublicProfile,
    learningData,
}) {

    // ========================================================
    // 8.1 ESTADO DEL FORMULARIO
    // ========================================================

    const [form, setForm] = useState(
        () => createPersonalForm(user),
    )

    const [isDirty, setIsDirty] = useState(false)
    const [localError, setLocalError] = useState('')
    const [draftNotice, setDraftNotice] = useState('')
    const [failedAvatarUrl, setFailedAvatarUrl] = useState('')
    // ========================================================
    // 8.2 SINCRONIZAR DATOS DE LA SESIÓN
    // ========================================================
    const userFormKey = JSON.stringify([
        user?.fullName ?? '',
        user?.email ?? '',
        user?.username ?? '',
        user?.bio ?? '',
        user?.githubUrl ?? '',
        user?.portfolioUrl ?? '',
    ])

    const [previousUserFormKey, setPreviousUserFormKey] =
        useState(userFormKey)
    if (previousUserFormKey !== userFormKey) {
        setPreviousUserFormKey(userFormKey)

        if (!isDirty) {
            setForm(createPersonalForm(user))
        }
    }

    // ========================================================
    // 8.3 CAMBIOS EN LOS CAMPOS
    // ========================================================

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target

        setForm((current) => ({
            ...current,
            [name]: value,
        }))

        setIsDirty(true)
        setLocalError('')
        setDraftNotice('')
    }

    // ========================================================
    // 8.4 CANCELAR MODIFICACIONES
    // ========================================================

    const handleCancel = () => {

        setForm(createPersonalForm(user))

        setIsDirty(false)
        setLocalError('')
        setDraftNotice('')
    }

    // ========================================================
    // 8.5 GUARDAR CAMBIOS
    // ========================================================


    const handleSubmit = async (event) => {
        event.preventDefault()

        if (isSaving || typeof onSave !== 'function') {
            return
        }

        setLocalError('')
        setDraftNotice('')

        const fullName = [
            form.firstName.trim(),
            form.lastName.trim(),
        ]
            .filter(Boolean)
            .join(' ')

        if (fullName.length < 2 || fullName.length > 150) {
            setLocalError(
                'El nombre completo debe tener entre 2 y 150 caracteres.',
            )
            return
        }

        const username =
            form.username.trim().toLowerCase() || null

        if (
            username
            && !/^[a-z0-9_]{3,40}$/.test(username)
        ) {
            setLocalError(
                'El nombre de usuario debe tener de 3 a 40 caracteres: letras, números o guiones bajos.',
            )
            return
        }

        const githubUrl = form.githubUrl.trim() || null
        const portfolioUrl = form.portfolioUrl.trim() || null

        if (githubUrl) {
            try {
                const url = new URL(githubUrl)

                if (
                    url.protocol !== 'https:'
                    || ![
                        'github.com',
                        'www.github.com',
                    ].includes(url.hostname.toLowerCase())
                ) {
                    throw new Error('Invalid GitHub URL')
                }
            } catch {
                setLocalError(
                    'Ingresa un enlace HTTPS válido de GitHub.',
                )
                return
            }
        }

        if (portfolioUrl) {
            try {
                const url = new URL(portfolioUrl)

                if (url.protocol !== 'https:') {
                    throw new Error('Invalid portfolio URL')
                }
            } catch {
                setLocalError(
                    'El enlace del portafolio debe utilizar HTTPS.',
                )
                return
            }
        }

        const changes = {
            fullName,
            username,
            bio: form.bio.trim() || null,
            githubUrl,
            portfolioUrl,
        }

        const result = await onSave(changes)

        if (result === false) {
            return
        }

        // La respuesta actualizada llega mediante useAuth().
        setIsDirty(false)
    }


    // ========================================================
    // 8.6 DATOS VISIBLES DEL ESTUDIANTE
    // ========================================================

    // Nombre real.
    const displayName =
        user?.fullName?.trim()
        || [
            form.firstName,
            form.lastName,
        ].filter(Boolean).join(' ')
        || 'Estudiante'

    const displayUsername =
        user?.username?.trim()
        || createDisplayUsername(displayName)

    const avatarInitial =
        displayName.charAt(0).toUpperCase()

    const avatarUrl =
        user?.avatarUrl
        || user?.profileImageUrl
        || ''

    const avatarFailed =
        Boolean(avatarUrl) &&
        failedAvatarUrl === avatarUrl

    const learning = {
        route:
            learningData?.route ?? 'Sin ruta seleccionada',

        initialLevel:
            learningData?.initialLevel ?? 'Pendiente',

        objective:
            learningData?.objective ?? 'Sin objetivo registrado',

        weeklyGoal:
            learningData?.weeklyGoal ?? 'Sin meta registrada',
    }

    // ========================================================
    // 9. ESTRUCTURA JSX
    // ========================================================

    return (

        <div className="profile-personal-grid">

            <section className="profile-personal-card">

                {/* ENCABEZADO */}
                <header className="profile-personal-card-heading">

                    <h2>
                        Información personal
                    </h2>

                    <p>
                        Actualiza los datos que se muestran
                        en tu perfil.
                    </p>

                </header>

                {/* FORMULARIO */}
                <form onSubmit={handleSubmit}>

                    {/* =========================================
                        FILA 1: NOMBRE Y APELLIDOS
                        ========================================= */}
                    <div className="profile-personal-fields-two">
                        <label className="profile-personal-field">
                            <span>Nombre</span>
                            <input
                                type="text"
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                autoComplete="given-name"
                                maxLength={80}
                                required
                            />
                        </label>
                        <label className="profile-personal-field">
                            <span>Apellidos</span>
                            <input
                                type="text"
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                autoComplete="family-name"
                                maxLength={120}
                            />
                        </label>
                    </div>

                    {/* =========================================
                        FILA 2: USUARIO Y CORREO ELECTRÓNICO
                        ========================================= */}
                    <div className="profile-personal-fields-two">
                        <label className="profile-personal-field">
                            <span>Nombre de usuario</span>
                            <input
                                type="text"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                placeholder={displayUsername}
                                maxLength={40}
                            />
                        </label>
                        <label className="profile-personal-field">
                            <span>Correo electrónico</span>
                            <div className="profile-personal-email-wrap">
                                <input
                                    type="email"
                                    value={form.email}
                                    readOnly
                                    aria-label="Correo electrónico"
                                />
                                {user?.emailVerified && (
                                    <span className="profile-personal-verified">
                                        <FiCheckCircle
                                            aria-hidden="true"
                                        />
                                        Verificado
                                    </span>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* =========================================
                        BIOGRAFÍA
                        ========================================= */}

                    <label className="profile-personal-field">
                        <span>Sobre mí</span>
                        <textarea
                            name="bio"
                            value={form.bio}
                            onChange={handleChange}
                            placeholder="Cuéntale a la comunidad sobre ti y lo que estás aprendiendo."
                            maxLength={300}
                            rows={3}
                        />
                    </label>
                    <div className="profile-personal-bio-help">
                        <small>
                            Una breve presentación para la comunidad.
                        </small>
                        <small>
                            {form.bio.length}/300
                        </small>
                    </div>

                    {/* =========================================
                        GITHUB Y PORTAFOLIO
                        ========================================= */}

                    <div className="profile-personal-fields-two">
                        <label className="profile-personal-field">
                            <span>
                                GitHub (opcional)
                            </span>
                            <div className="profile-personal-input-icon">
                                <FiGithub aria-hidden="true" />
                                <input
                                    type="url"
                                    name="githubUrl"
                                    value={form.githubUrl}
                                    onChange={handleChange}
                                    placeholder="https://github.com/tuusuario"
                                />
                            </div>
                        </label>
                        <label className="profile-personal-field">
                            <span>
                                Portafolio (opcional)
                            </span>
                            <div className="profile-personal-input-icon">
                                <FiLink aria-hidden="true" />
                                <input
                                    type="url"
                                    name="portfolioUrl"
                                    value={form.portfolioUrl}
                                    onChange={handleChange}
                                    placeholder="https://tusitio.com"
                                />
                            </div>
                        </label>
                    </div>

                    {/* =========================================
                        AVISO DE PRIVACIDAD
                        ========================================= */}
                    <div className="profile-personal-privacy-note">
                        <FiShield aria-hidden="true" />
                        <span>
                            Tu correo electrónico no se muestra
                            en tu perfil público.
                        </span>
                    </div>
                    {/* =========================================
                        MENSAJES DE VALIDACIÓN
                        ========================================= */}
                    {localError && (
                        <p
                            className="profile-personal-error"
                            role="alert"
                        >
                            {localError}
                        </p>
                    )}
                    {error && (
                        <p
                            className="profile-personal-error"
                            role="alert"
                        >
                            {error}
                        </p>
                    )}
                    {success && (
                        <p
                            className="profile-personal-success"
                            role="status"
                        >
                            {success}
                        </p>
                    )}
                    {draftNotice && (
                        <p
                            className="profile-personal-notice"
                            role="status"
                        >
                            {draftNotice}
                        </p>
                    )}

                    {/* =========================================
                        BOTONES DE ACCIÓN
                        ========================================= */}
                    <div className="profile-personal-actions">
                        <button
                            type="button"
                            className="profile-personal-cancel"
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="profile-personal-save"
                            disabled={isSaving}
                        >
                            {isSaving
                                ? 'Guardando...'
                                : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </section>

            {/* =================================================
                COLUMNA DERECHA
                ================================================= */}
            <aside className="profile-personal-aside">
                {/* =============================================
                    TARJETA 1: TU APRENDIZAJE
                    ============================================= */}
                <section className="profile-personal-side-card">
                    <h3>
                        <FiBarChart2 aria-hidden="true" />
                        Tu aprendizaje
                    </h3>
                    {/* RUTA ACTUAL */}
                    <div className="profile-personal-learning-row">
                        <FiBookOpen aria-hidden="true" />
                        <span>
                            Ruta actual
                        </span>
                        <strong>
                            {learning.route}
                        </strong>
                    </div>
                    {/* NIVEL INICIAL */}
                    <div className="profile-personal-learning-row">
                        <FiBox aria-hidden="true" />
                        <span>
                            Nivel inicial
                        </span>
                        <strong>
                            {learning.initialLevel}
                        </strong>
                    </div>
                    {/* OBJETIVO */}
                    <div className="profile-personal-learning-row">
                        <FiTarget aria-hidden="true" />
                        <span>
                            Objetivo
                        </span>
                        <strong>
                            {learning.objective}
                        </strong>
                    </div>
                    {/* META SEMANAL */}
                    <div className="profile-personal-learning-row">
                        <FiClock aria-hidden="true" />
                        <span>
                            Meta semanal
                        </span>
                        <strong>
                            {learning.weeklyGoal}
                        </strong>
                    </div>

                    {/* BOTÓN AJUSTAR PREFERENCIAS */}
                    <button
                        type="button"
                        className="profile-personal-outline-button"
                        onClick={onOpenLearning}
                        disabled={!onOpenLearning}
                    >
                        <FiSettings aria-hidden="true" />
                        Ajustar preferencias
                        <FiArrowRight aria-hidden="true" />
                    </button>
                </section>

                {/* =============================================
                    TARJETA 2: VISTA PÚBLICA
                    ============================================= */}
                <section className="profile-personal-side-card">
                    <h3>
                        <FiEye aria-hidden="true" />
                        Vista pública
                    </h3>
                    <p className="profile-personal-side-description">
                        Así te verán otros estudiantes
                        en la comunidad.
                    </p>
                    <div className="profile-personal-preview-card">
                        <div className="profile-personal-preview-avatar">
                            {avatarUrl && !avatarFailed ? (
                                <img
                                    src={avatarUrl}
                                    alt={`Avatar de ${displayName}`}
                                    onError={() => {
                                        setFailedAvatarUrl(avatarUrl)
                                    }}
                                />
                            ) : (
                                <span>
                                    {avatarInitial}
                                </span>
                            )}
                        </div>

                        {/* -------------------------------------
                            NOMBRE Y USUARIO
                            ------------------------------------- */}
                        <div className="profile-personal-preview-info">
                            <strong className="profile-personal-preview-name">
                                {displayName}
                            </strong>
                            <span className="profile-personal-preview-username">
                                @{displayUsername}
                            </span>
                        </div>

                        {/* -------------------------------------
                            INSIGNIA DE RUTA CON FiBox
                            ------------------------------------- */}
                        <div className="profile-personal-preview-route-badge">
                            <span className="profile-personal-preview-route-icon">
                                <FiBox aria-hidden="true" />
                            </span>
                            <span>
                                {learning.route}
                            </span>
                        </div>
                    </div>

                    {/* =========================================
                        BOTÓN VER PERFIL PÚBLICO
                        ========================================= */}
                    <button
                        type="button"
                        className="
                            profile-personal-outline-button
                            profile-personal-public-button
                        "
                        onClick={onPublicProfile}
                        disabled={!onPublicProfile}
                    >
                        <FiExternalLink aria-hidden="true" />
                        Ver perfil público
                        <FiArrowRight aria-hidden="true" />
                    </button>
                </section>

                {/* =============================================
                    TARJETA 3: MASCOTA LEARN2CODE
                    ============================================= */}
                <section className="profile-personal-tip">
                    <img
                        src="/images/plan-recomendado/dragon-laptop-512.webp"
                        alt="Mascota de Learn2Code programando"
                    />
                    <div>
                        <strong>
                            Tu perfil también cuenta
                            tu progreso.
                        </strong>
                        <p>
                            Mantén tu información actualizada.
                        </p>
                    </div>
                </section>
            </aside>
        </div>
    )
}

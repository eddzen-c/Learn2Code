
/**
 * ============================================================
 * LEARN2CODE - PROFILE PERSONAL INFO
 * ============================================================
 *
 * ARCHIVO:
 * frontend/src/components/ProfilePersonalInfo.jsx
 *
 * DESCRIPCIÓN:
 * Pestaña "Información personal" del perfil.
 *
 * DISEÑO:
 * - Formulario principal a la izquierda.
 * - Tarjeta "Tu aprendizaje" a la derecha.
 * - Tarjeta "Vista pública" con icono FiBox.
 * - Tarjeta de la mascota Learn2Code.
 *
 * CORRECCIONES:
 * - Eliminados los useEffect que causaban errores ESLint.
 * - Formulario sincronizado con los datos de la sesión.
 * - Evita sobrescribir datos durante la edición.
 * - Avatar con manejo de errores por URL.
 * - Eliminada variable displayEmail sin utilizar.
 * - Botón "Ver perfil público" funcional.
 *
 * PERSISTENCIA:
 * - El nombre completo utiliza onSave().
 * - Username, biografía y enlaces continúan como
 *   borradores hasta que el backend los soporte.
 *
 * ============================================================
 */

// ============================================================
// 1. IMPORTACIONES
// ============================================================

import { useState } from 'react'

import { useNavigate } from 'react-router-dom'

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
// 2. DATOS ILUSTRATIVOS DE APRENDIZAJE
// ============================================================

/**
 * Se utilizan solamente para reproducir el mockup.
 *
 * Cuando ProfilePage envíe learningData desde el backend,
 * esos valores tendrán prioridad sobre los ilustrativos.
 */

const demoLearning = {
    route: 'Frontend',
    initialLevel: 'Intermedio',
    objective: 'Conseguir trabajo como desarrollador',
    weeklyGoal: '4 horas',
}

// ============================================================
// 3. SEPARAR NOMBRE COMPLETO
// ============================================================

/**
 * Actualmente el backend utiliza fullName.
 *
 * Dividimos el nombre para mostrarlo en los campos
 * Nombre y Apellidos del formulario.
 *
 * No se garantiza una división perfecta para nombres
 * compuestos. Eso requerirá campos independientes
 * en el backend.
 */

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
// 4. CREAR DATOS DEL FORMULARIO
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
// 5. CREAR IDENTIFICADOR VISUAL
// ============================================================

/**
 * Si el backend no proporciona un username, creamos
 * uno provisional basado en el nombre completo.
 *
 * Este valor NO significa que exista un identificador
 * público registrado en PostgreSQL.
 */

function createDisplayUsername(fullName = '') {
    return (
        String(fullName)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
        || 'estudiante'
    )
}

// ============================================================
// 6. COMPARAR BORRADOR CON DATOS REALES
// ============================================================

/**
 * Este método permite saber si existen modificaciones
 * sin mantener un segundo estado isDirty.
 *
 * De esta manera evitamos estados duplicados que
 * podrían quedar desincronizados.
 */

function hasPersonalChanges(form, original) {
    return (
        form.firstName !== original.firstName
        || form.lastName !== original.lastName
        || form.username !== original.username
        || form.bio !== original.bio
        || form.githubUrl !== original.githubUrl
        || form.portfolioUrl !== original.portfolioUrl
    )
}

// ============================================================
// 7. COMPONENTE PRINCIPAL
// ============================================================

export function ProfilePersonalInfo({
    // Usuario autenticado.
    user,

    // Función de guardado proporcionada por ProfilePage.
    onSave,

    // Indica si el backend está guardando.
    isSaving = false,

    // Mensajes enviados por ProfilePage.
    error = '',
    success = '',

    // Navegación hacia Aprendizaje.
    onOpenLearning,

    // Navegación opcional personalizada.
    onPublicProfile,

    // Estadísticas reales si están disponibles.
    learningData,
}) {
    const navigate = useNavigate()

    // ========================================================
    // 7.1 DATOS ORIGINALES DEL USUARIO
    // ========================================================

    /**
     * Obtenemos los datos directamente de user durante
     * el renderizado.
     *
     * Así, cuando ProfilePage recibe datos nuevos de
     * /auth/me, no necesitamos llamar setForm
     * dentro de un useEffect.
     */

    const originalForm = createPersonalForm(user)

    // ========================================================
    // 7.2 BORRADOR DEL FORMULARIO
    // ========================================================

    /**
     * null significa que no hay un borrador activo y
     * utilizamos los datos actuales del usuario.
     *
     * Cuando se edita un campo, se crea el borrador.
     *
     * Esta implementación reemplaza el useEffect
     * que sincronizaba form con user.
     */

    const [draft, setDraft] = useState(null)

    const form = draft ?? originalForm

    // Saber si el estudiante modificó campos.
    const isDirty = hasPersonalChanges(
        form,
        originalForm,
    )

    // ========================================================
    // 7.3 MENSAJES
    // ========================================================

    const [localError, setLocalError] = useState('')

    const [draftNotice, setDraftNotice] = useState('')

    // ========================================================
    // 7.4 CONTROL DEL AVATAR
    // ========================================================

    /**
     * Guardamos la URL que falló, no simplemente true/false.
     *
     * Si cambia la URL del avatar, la nueva imagen se
     * intentará cargar automáticamente.
     *
     * Esto elimina el segundo useEffect de la
     * implementación original.
     */

    const [failedAvatarUrl, setFailedAvatarUrl] =
        useState('')

    // ========================================================
    // 7.5 MODIFICAR CAMPOS
    // ========================================================

    const handleChange = (event) => {
        const { name, value } = event.target

        setDraft((current) => ({
            ...(current ?? createPersonalForm(user)),
            [name]: value,
        }))

        setLocalError('')
        setDraftNotice('')
    }

    // ========================================================
    // 7.6 CANCELAR CAMBIOS
    // ========================================================

    /**
     * Descartamos el borrador.
     *
     * Al volver a null, el formulario muestra
     * automáticamente los datos actuales de user.
     */

    const handleCancel = () => {
        setDraft(null)
        setLocalError('')
        setDraftNotice('')
    }

    // ========================================================
    // 7.7 GUARDAR CAMBIOS
    // ========================================================

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (isSaving) {
            return
        }

        setLocalError('')
        setDraftNotice('')

        // ----------------------------------------------------
        // RECONSTRUIR FULLNAME
        // ----------------------------------------------------

        const fullName = [
            form.firstName.trim(),
            form.lastName.trim(),
        ]
            .filter(Boolean)
            .join(' ')

        // ----------------------------------------------------
        // VALIDACIÓN
        // ----------------------------------------------------

        if (!fullName) {
            setLocalError('El nombre es obligatorio.')
            return
        }

        // ----------------------------------------------------
        // COMPROBAR SI CAMBIÓ EL NOMBRE
        // ----------------------------------------------------

        const originalName =
            String(user?.fullName ?? '').trim()

        const nameChanged =
            fullName !== originalName

        // ----------------------------------------------------
        // CAMPOS SIN PERSISTENCIA CONFIRMADA
        // ----------------------------------------------------

        const pendingFieldsChanged =
            form.username !== (user?.username ?? '')
            || form.bio !== (user?.bio ?? '')
            || form.githubUrl !== (user?.githubUrl ?? '')
            || form.portfolioUrl !== (user?.portfolioUrl ?? '')

        // ----------------------------------------------------
        // NO ENVIAR SI EL NOMBRE NO CAMBIÓ
        // ----------------------------------------------------

        if (!nameChanged) {
            if (pendingFieldsChanged) {
                setDraftNotice(
                    'Los cambios de usuario, biografía y enlaces '
                    + 'todavía no se guardan en la cuenta.',
                )
            } else {
                // No hay cambios pendientes.
                setDraft(null)
            }

            return
        }

        // ----------------------------------------------------
        // VERIFICAR DISPONIBILIDAD DE onSave
        // ----------------------------------------------------

        if (typeof onSave !== 'function') {
            setLocalError(
                'No está disponible el servicio para '
                + 'guardar el nombre.',
            )

            return
        }

        // ----------------------------------------------------
        // REALIZAR EL GUARDADO
        // ----------------------------------------------------

        try {
            /**
             * ProfilePage ejecuta la actualización real
             * del nombre completo.
             *
             * Esperamos true para confirmar el guardado.
             */

            const result = await onSave({
                fullName,
            })

            if (result !== true) {
                // El error de backend lo muestra ProfilePage.
                return
            }

            // ------------------------------------------------
            // CONSERVAR BORRADORES NO PERSISTIDOS
            // ------------------------------------------------

            if (pendingFieldsChanged) {
                /**
                 * Conservamos las modificaciones de los
                 * campos sin persistencia, para evitar
                 * perder lo que el estudiante escribió.
                 *
                 * El nombre ya fue enviado al backend.
                 */

                setDraft((current) => ({
                    ...(current ?? form),
                    firstName: form.firstName,
                    lastName: form.lastName,
                }))

                setDraftNotice(
                    'Tu nombre se guardó correctamente. '
                    + 'Los cambios de usuario, biografía '
                    + 'y enlaces todavía no se guardan.',
                )
            } else {
                /**
                 * Se descarta el borrador y el formulario
                 * vuelve a leer los datos actualizados
                 * proporcionados por ProfilePage.
                 */

                setDraft(null)
            }
        } catch {
            setLocalError(
                'No fue posible guardar los cambios.',
            )
        }
    }

    // ========================================================
    // 7.8 NAVEGACIÓN AL PERFIL PÚBLICO
    // ========================================================

    /**
     * Si ProfilePage proporciona onPublicProfile,
     * utilizamos esa función.
     *
     * Si no la proporciona, abrimos directamente
     * la ruta /profile/public.
     */

    const handleOpenPublicProfile = () => {
        if (typeof onPublicProfile === 'function') {
            onPublicProfile()
            return
        }

        navigate('/profile/public')
    }

    // ========================================================
    // 7.9 DATOS VISIBLES DEL ESTUDIANTE
    // ========================================================

    // Nombre real proveniente del backend.
    const displayName =
        user?.fullName?.trim()
        || [
            form.firstName,
            form.lastName,
        ]
            .filter(Boolean)
            .join(' ')
        || 'Estudiante'

    // Username real o identificador provisional.
    const displayUsername =
        user?.username?.trim()
        || createDisplayUsername(displayName)

    // Primera letra del avatar.
    const avatarInitial =
        displayName.charAt(0).toUpperCase()

    // URL de fotografía, si existe.
    const avatarUrl =
        user?.avatarUrl
        || user?.profileImageUrl
        || ''

    // Solo mostramos la imagen si no falló esa URL.
    const showAvatar =
        Boolean(avatarUrl)
        && avatarUrl !== failedAvatarUrl

    // Datos ilustrativos o reales de aprendizaje.
    const learning = {
        ...demoLearning,
        ...learningData,
    }

    // ========================================================
    // 8. ESTRUCTURA JSX
    // ========================================================

    return (
        <div className="profile-personal-grid">

            {/* ================================================
                COLUMNA IZQUIERDA
                INFORMACIÓN PERSONAL
                ================================================ */}

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
                        FILA 2: USUARIO Y CORREO
                        ========================================= */}

                    <div className="profile-personal-fields-two">

                        {/* NOMBRE DE USUARIO */}
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

                        {/* CORREO ELECTRÓNICO */}
                        <label className="profile-personal-field">
                            <span>Correo electrónico</span>

                            <div className="profile-personal-email-wrap">

                                <input
                                    type="email"
                                    value={user?.email ?? form.email}
                                    readOnly
                                    aria-label="Correo electrónico"
                                />

                                {(user?.emailVerified
                                    || user?.emailVerifiedAt) && (
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
                            placeholder={
                                'Cuéntale a la comunidad sobre ti '
                                + 'y lo que estás aprendiendo.'
                            }
                            maxLength={300}
                            rows={3}
                        />

                    </label>

                    {/* CONTADOR DE CARACTERES */}
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

                        {/* GITHUB */}
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

                        {/* PORTAFOLIO */}
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

                        {/* CANCELAR */}
                        <button
                            type="button"
                            className="profile-personal-cancel"
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            Cancelar
                        </button>

                        {/* GUARDAR */}
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

                    {/* Información de estado no intrusiva */}
                    {isDirty && !draftNotice && (
                        <span
                            className="profile-personal-draft-status"
                            aria-live="polite"
                        >
                            Tienes cambios sin guardar.
                        </span>
                    )}

                </form>

            </section>

            {/* ================================================
                COLUMNA DERECHA
                ================================================ */}

            <aside className="profile-personal-aside">

                {/* ============================================
                    TARJETA 1: TU APRENDIZAJE
                    ============================================ */}

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

                    {/* AJUSTAR PREFERENCIAS */}
                    <button
                        type="button"
                        className="profile-personal-outline-button"
                        onClick={onOpenLearning}
                        disabled={
                            typeof onOpenLearning !== 'function'
                        }
                    >

                        <FiSettings aria-hidden="true" />

                        Ajustar preferencias

                        <FiArrowRight aria-hidden="true" />

                    </button>

                </section>

                {/* ============================================
                    TARJETA 2: VISTA PÚBLICA
                    ============================================ */}

                <section className="profile-personal-side-card">

                    {/* TÍTULO */}
                    <h3>
                        <FiEye aria-hidden="true" />
                        Vista pública
                    </h3>

                    {/* DESCRIPCIÓN */}
                    <p className="profile-personal-side-description">
                        Así te verán otros estudiantes
                        en la comunidad.
                    </p>

                    {/* VISTA PREVIA */}
                    <div className="profile-personal-preview-card">

                        {/* AVATAR */}
                        <div className="profile-personal-preview-avatar">

                            {showAvatar ? (
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

                        {/* NOMBRE Y USUARIO */}
                        <div className="profile-personal-preview-info">

                            <strong className="profile-personal-preview-name">
                                {displayName}
                            </strong>

                            {/* Identificador visual o real */}
                            <span className="profile-personal-preview-username">
                                @{displayUsername}
                            </span>

                        </div>

                        {/* INSIGNIA DE RUTA */}
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
                        className={
                            'profile-personal-outline-button '
                            + 'profile-personal-public-button'
                        }
                        onClick={handleOpenPublicProfile}
                    >

                        <FiExternalLink aria-hidden="true" />

                        Ver perfil público

                        <FiArrowRight aria-hidden="true" />

                    </button>

                </section>

                {/* ============================================
                    TARJETA 3: MASCOTA
                    ============================================ */}

                <section className="profile-personal-tip">

                    <img
                        src="/images/learn2code-mascot-laptop-transparent.png"
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

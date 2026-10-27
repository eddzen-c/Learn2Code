
/**
 * ============================================================
 * LEARN2CODE - PROFILE PERSONAL INFO
 * ============================================================
 *
 * ARCHIVO:
 * frontend/src/components/ProfilePersonalInfo.jsx
 *
 * DESCRIPCIÓN:
 * Componente que representa la pestaña "Información personal"
 * dentro de la página Mi perfil de Learn2Code.
 *
 * DISEÑO:
 * - Formulario principal a la izquierda.
 * - Tarjeta Tu aprendizaje a la derecha.
 * - Tarjeta Vista pública con icono FiBox.
 * - Tarjeta informativa con la mascota de Learn2Code.
 *
 * DATOS REALES:
 * - Nombre completo.
 * - Correo electrónico.
 * - Estado de verificación del correo.
 * - Nombre de usuario (cuando exista en el backend).
 * - Imagen de perfil (cuando exista).
 *
 * NOTA SOBRE PERSISTENCIA:
 * Actualmente el componente delega el guardado del
 * nombre completo a ProfilePage mediante onSave().
 *
 * Los campos username, bio, githubUrl y portfolioUrl
 * requieren compatibilidad en la API para persistirse.
 *
 * ============================================================
 */

// ============================================================
// 1. IMPORTACIONES DE REACT
// ============================================================

import {
    useEffect,
    useState,
} from 'react'

// ============================================================
// 2. ICONOS
// ============================================================

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

// ============================================================
// 3. ESTILOS
// ============================================================

import './ProfilePersonalInfo.css'

// ============================================================
// 4. DATOS VISUALES DE APRENDIZAJE
// ============================================================

/**
 * Estos valores reproducen el contenido de las tarjetas
 * del mockup hasta conectar las estadísticas reales.
 *
 * El componente también acepta learningData para que
 * ProfilePage pueda proporcionar valores reales.
 */
const demoLearning = {
    route: 'Frontend',
    initialLevel: 'Intermedio',
    objective: 'Conseguir trabajo como desarrollador',
    weeklyGoal: '4 horas',
}

// ============================================================
// 5. SEPARAR NOMBRE COMPLETO
// ============================================================

/**
 * El backend utiliza fullName.
 *
 * Como el mockup solicita Nombre y Apellidos separados,
 * los dividimos provisionalmente.
 *
 * Ejemplo:
 * "Ana García" -> "Ana" / "García"
 *
 * IMPORTANTE:
 * Los nombres compuestos pueden necesitar una división
 * diferente. Una solución definitiva requeriría almacenar
 * nombre y apellidos como propiedades independientes.
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

/**
 * Cuando el backend todavía no proporciona un username,
 * construimos uno provisional utilizando el nombre.
 *
 * Ejemplo:
 * "Juan Luis Ortiz Galaviz"
 * ->
 * "juanluisortizgalaviz"
 *
 * Este identificador es únicamente visual:
 * NO significa que ya exista como usuario público
 * dentro de la base de datos.
 */
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

    // Información de la sesión autenticada.
    user,

    // Función que realiza el guardado desde ProfilePage.
    onSave,

    // Indica que el backend está procesando cambios.
    isSaving = false,

    // Mensajes que controla la página principal.
    error = '',
    success = '',

    // Navegación a la pestaña Aprendizaje.
    onOpenLearning,

    // Navegación a un perfil público, cuando esté disponible.
    onPublicProfile,

    // Datos reales de aprendizaje, cuando estén conectados.
    learningData,

}) {

    // ========================================================
    // 8.1 ESTADO DEL FORMULARIO
    // ========================================================

    const [form, setForm] = useState(
        () => createPersonalForm(user),
    )

    // Indica si se están editando campos del formulario.
    const [isDirty, setIsDirty] = useState(false)

    // Mensajes locales de validación.
    const [localError, setLocalError] = useState('')

    // Avisos sobre campos todavía no persistidos.
    const [draftNotice, setDraftNotice] = useState('')

    // Control de error en la fotografía del usuario.
    const [avatarFailed, setAvatarFailed] = useState(false)

    // ========================================================
    // 8.2 SINCRONIZAR DATOS DE LA SESIÓN
    // ========================================================

    /**
     * Sincronizamos el formulario cuando llegan los datos
     * del usuario desde /auth/me.
     *
     * Evitamos sobrescribir lo que el usuario está escribiendo.
     */
    useEffect(() => {

        if (!isDirty) {
            setForm(createPersonalForm(user))
        }

    }, [
        user?.fullName,
        user?.email,
        user?.username,
        user?.bio,
        user?.githubUrl,
        user?.portfolioUrl,
        isDirty,
    ])

    /**
     * Cuando cambie la imagen real, permitimos volver
     * a cargarla.
     */
    useEffect(() => {
        setAvatarFailed(false)
    }, [
        user?.avatarUrl,
        user?.profileImageUrl,
    ])

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

        if (
            isSaving ||
            typeof onSave !== 'function'
        ) {
            return
        }

        setLocalError('')
        setDraftNotice('')

        // Unir los campos para enviarlos a la API actual.
        const fullName = [
            form.firstName.trim(),
            form.lastName.trim(),
        ]
            .filter(Boolean)
            .join(' ')

        if (!fullName) {
            setLocalError('El nombre es obligatorio.')
            return
        }

        // Determinar si cambió el nombre completo.
        const nameChanged =
            fullName !== String(user?.fullName ?? '').trim()

        /**
         * Detectar cambios en los campos que todavía
         * no tienen soporte confirmado en el backend.
         */
        const pendingFieldsChanged =
            form.username !== (user?.username ?? '')
            || form.bio !== (user?.bio ?? '')
            || form.githubUrl !== (user?.githubUrl ?? '')
            || form.portfolioUrl !== (user?.portfolioUrl ?? '')

        // Si no cambió el nombre, no enviamos PATCH.
        if (!nameChanged) {

            if (pendingFieldsChanged) {
                setDraftNotice(
                    'Los cambios de usuario, biografía y enlaces '
                    + 'todavía no se guardan en la cuenta.',
                )
            }

            return
        }

        try {

            // La página principal realiza el PATCH /auth/me.
            const result = await onSave({
                fullName,
            })

            /**
             * Si ProfilePage devuelve false,
             * el guardado falló.
             *
             * Si ProfilePage lanza un error,
             * se capturará en el bloque catch.
             */
            if (result === false) {
                return
            }

            if (pendingFieldsChanged) {

                setDraftNotice(
                    'Tu nombre se guardó correctamente. '
                    + 'Los cambios de usuario, biografía '
                    + 'y enlaces todavía no se guardan.',
                )

                // Conservamos los campos pendientes editados.
                setIsDirty(true)

            } else {

                // Volver a sincronizar con el usuario actualizado.
                setIsDirty(false)
            }

        } catch {

            // El error de API es mostrado por ProfilePage.

        }
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

    /**
     * Username:
     * 1. Si existe en el backend, usamos ese valor.
     * 2. Si no existe, generamos uno provisional.
     *
     * Nunca sustituimos el nombre real por el del mockup.
     */
    const displayUsername =
        user?.username?.trim()
        || createDisplayUsername(displayName)

    // Correo real de la cuenta.
    const displayEmail =
        user?.email?.trim() || ''

    // Primera letra cuando no hay fotografía.
    const avatarInitial =
        displayName.charAt(0).toUpperCase()

    // Fotografía real, si está disponible.
    const avatarUrl =
        user?.avatarUrl
        || user?.profileImageUrl
        || ''

    // Datos de aprendizaje.
    const learning = {
        ...demoLearning,
        ...learningData,
    }

    // ========================================================
    // 9. ESTRUCTURA JSX
    // ========================================================

    return (

        <div className="profile-personal-grid">

            {/* =================================================
                COLUMNA IZQUIERDA
                INFORMACIÓN PERSONAL
                ================================================= */}

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

                    {/* TÍTULO CON ICONO */}
                    <h3>

                        <FiEye aria-hidden="true" />

                        Vista pública

                    </h3>

                    {/* DESCRIPCIÓN */}
                    <p className="profile-personal-side-description">
                        Así te verán otros estudiantes
                        en la comunidad.
                    </p>

                    {/* =========================================
                        VISTA PREVIA DEL PERFIL
                        ========================================= */}

                    <div className="profile-personal-preview-card">

                        {/* -------------------------------------
                            AVATAR DEL ESTUDIANTE
                            ------------------------------------- */}

                        <div className="profile-personal-preview-avatar">

                            {avatarUrl && !avatarFailed ? (

                                <img
                                    src={avatarUrl}
                                    alt={`Avatar de ${displayName}`}
                                    onError={() => {
                                        setAvatarFailed(true)
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

                            {/* Segunda línea como el mockup:
                                @usuario. Este identificador
                                es provisional si aún no existe
                                username en el backend. */}
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

                    {/* Mascota transparente utilizada
                        también en el sidebar. */}
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

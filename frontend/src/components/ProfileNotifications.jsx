
/**
 * ============================================================
 * LEARN2CODE - NOTIFICACIONES
 * ============================================================
 *
 * ARCHIVO:
 * frontend/src/components/ProfileNotifications.jsx
 *
 * FUNCIONALIDAD:
 * - Qué quieres recibir.
 * - Avisos en la web y por correo.
 * - Resumen semanal.
 * - Avisos de seguridad.
 * - Recordatorio de estudio.
 * - Hora y frecuencia.
 * - Cancelar modificaciones.
 * - Guardar mediante callback opcional.
 *
 * CORRECCIONES:
 * - Eliminado useEffect que causaba errores de ESLint.
 * - Sincronización inicial mediante useState.
 * - Conservadas todas las clases CSS del mockup.
 *
 * IMPORTANTE:
 * Sin onSave, las preferencias no se persisten.
 * ============================================================
 */

import { useState } from 'react'

import {
    FiAtSign,
    FiAward,
    FiBarChart2,
    FiCalendar,
    FiClock,
    FiLock,
    FiMonitor,
    FiShield,
    FiTarget,
    FiUsers,
    FiVolume2,
} from 'react-icons/fi'

import './ProfileNotifications.css'

// ============================================================
// 1. VALORES INICIALES
// ============================================================

const DEFAULT_FORM = {
    mentionsWeb: true,
    mentionsEmail: true,

    projectsWeb: true,
    projectsEmail: false,

    achievementsWeb: true,
    achievementsEmail: false,

    communityWeb: true,
    communityEmail: false,

    coursesWeb: false,
    coursesEmail: false,

    weeklySummary: false,

    studyReminderEnabled: true,
    reminderTime: '19:00',
    reminderFrequency: 'weekdays',
    reminderChannel: 'web',
}

// ============================================================
// 2. TIPOS DE NOTIFICACIONES
// ============================================================

const notificationRows = [
    {
        key: 'mentions',
        title: 'Respuestas y menciones',
        description:
            'Cuando alguien te mencione o responda a tus publicaciones.',
        Icon: FiAtSign,
    },
    {
        key: 'projects',
        title: 'Actividad en proyectos compartidos',
        description:
            'Actualizaciones en los proyectos donde participas.',
        Icon: FiUsers,
    },
    {
        key: 'achievements',
        title: 'Logros y progreso',
        description:
            'Nuevos logros, niveles y avances importantes.',
        Icon: FiAward,
    },
    {
        key: 'community',
        title: 'Retos de la comunidad',
        description:
            'Nuevos retos, resultados y actividades de la comunidad.',
        Icon: FiTarget,
    },
    {
        key: 'courses',
        title: 'Novedades de cursos',
        description:
            'Nuevos cursos, contenidos y recomendaciones.',
        Icon: FiVolume2,
    },
]

// ============================================================
// 3. NORMALIZAR PREFERENCIAS
// ============================================================

function createForm(preferences) {
    return {
        ...DEFAULT_FORM,
        ...(preferences || {}),
    }
}

// ============================================================
// 4. INTERRUPTOR REUTILIZABLE
// ============================================================

function NotificationSwitch({
    checked,
    label,
    onChange,
    disabled = false,
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={Boolean(checked)}
            aria-label={label}
            disabled={disabled}
            className={
                'profile-notifications-switch'
                + (checked
                    ? ' profile-notifications-switch--active'
                    : '')
            }
            onClick={() => onChange(!checked)}
        >
            <span className="profile-notifications-switch__thumb" />
        </button>
    )
}

// ============================================================
// 5. COMPONENTE PRINCIPAL
// ============================================================

export function ProfileNotifications({
    initialPreferences,
    onSave,
    mascotSrc =
        '/images/learn2code-mascot-laptop-transparent.png',
}) {
    // ========================================================
    // 5.1 ESTADOS
    // ========================================================

    /**
     * Se inicializan directamente desde las preferencias.
     * No utilizamos useEffect para actualizar estos estados.
     *
     * Cuando el padre obtenga nuevas preferencias de una API,
     * deberá montar nuevamente el componente con esos datos
     * o adaptar una sincronización específica.
     */

    const [form, setForm] = useState(
        () => createForm(initialPreferences),
    )

    const [savedForm, setSavedForm] = useState(
        () => createForm(initialPreferences),
    )

    const [isSaving, setIsSaving] = useState(false)

    const [message, setMessage] = useState('')

    const [messageType, setMessageType] = useState('info')

    // ========================================================
    // 5.2 MODIFICAR PREFERENCIAS
    // ========================================================

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }))

        setMessage('')
    }

    // ========================================================
    // 5.3 MODIFICAR SELECTS Y RADIO
    // ========================================================

    const handleInputChange = (event) => {
        const { name, value } = event.target

        updateField(name, value)
    }

    // ========================================================
    // 5.4 CANCELAR MODIFICACIONES
    // ========================================================

    const handleCancel = () => {
        setForm({ ...savedForm })
        setMessage('')
    }

    // ========================================================
    // 5.5 GUARDAR PREFERENCIAS
    // ========================================================

    const handleSave = async () => {
        if (isSaving) {
            return
        }

        // No afirmar que se guardó sin un callback real.
        if (typeof onSave !== 'function') {
            setMessageType('info')

            setMessage(
                'Los cambios están listos. '
                + 'Falta conectar el guardado de notificaciones '
                + 'con tu cuenta.',
            )

            return
        }

        setIsSaving(true)
        setMessage('')

        try {
            const nextPreferences = { ...form }

            const result = await onSave(nextPreferences)

            if (result === true) {
                setSavedForm(nextPreferences)
                setMessageType('success')

                setMessage(
                    'Tus preferencias se guardaron correctamente.',
                )
            } else {
                setMessageType('error')

                setMessage(
                    'No se confirmó el guardado de las preferencias.',
                )
            }
        } catch {
            setMessageType('error')

            setMessage(
                'No se pudieron guardar los cambios.',
            )
        } finally {
            setIsSaving(false)
        }
    }

    // ========================================================
    // 6. INTERFAZ
    // ========================================================

    return (
        <section className="profile-notifications-layout">

            {/* ================================================
                COLUMNA IZQUIERDA
                ================================================ */}

            <div className="profile-notifications-main">

                {/* ============================================
                    QUÉ QUIERES RECIBIR
                    ============================================ */}

                <article className="profile-notifications-card">

                    <header className="profile-notifications-card__header">
                        <h2>
                            Qué quieres recibir
                        </h2>

                        <p>
                            Elige tus avisos dentro de la web
                            y por correo.
                        </p>
                    </header>

                    {/* ENCABEZADO DE TABLA */}
                    <div className="profile-notifications-table__head">
                        <span>Tipo de aviso</span>
                        <span>En la web</span>
                        <span>Correo</span>
                    </div>

                    {/* LISTADO DE NOTIFICACIONES */}
                    <div className="profile-notifications-table">

                        {notificationRows.map((row) => {
                            const Icon = row.Icon

                            const webKey = `${row.key}Web`
                            const emailKey = `${row.key}Email`

                            return (
                                <div
                                    key={row.key}
                                    className="profile-notifications-table__row"
                                >
                                    {/* TIPO DE NOTIFICACIÓN */}
                                    <div className="profile-notifications-table__info">

                                        <span className="profile-notifications-table__icon">
                                            <Icon aria-hidden="true" />
                                        </span>

                                        <div className="profile-notifications-table__text">
                                            <strong>
                                                {row.title}
                                            </strong>

                                            <p>
                                                {row.description}
                                            </p>
                                        </div>

                                    </div>

                                    {/* SWITCH EN LA WEB */}
                                    <div className="profile-notifications-table__control">

                                        <NotificationSwitch
                                            label={`${row.title} en la web`}
                                            checked={Boolean(form[webKey])}
                                            disabled={isSaving}
                                            onChange={(value) => {
                                                updateField(webKey, value)
                                            }}
                                        />

                                    </div>

                                    {/* SWITCH POR CORREO */}
                                    <div className="profile-notifications-table__control">

                                        <NotificationSwitch
                                            label={`${row.title} por correo`}
                                            checked={Boolean(form[emailKey])}
                                            disabled={isSaving}
                                            onChange={(value) => {
                                                updateField(emailKey, value)
                                            }}
                                        />

                                    </div>
                                </div>
                            )
                        })}

                    </div>

                </article>

                {/* ============================================
                    RECORDATORIO DE ESTUDIO
                    ============================================ */}

                <article className="profile-notifications-card">

                    <header className="profile-notifications-card__header">
                        <h2>
                            Recordatorio de estudio
                        </h2>
                    </header>

                    <div className="profile-reminder__top">

                        {/* INTERRUPTOR PRINCIPAL */}
                        <div className="profile-reminder__toggle-block">

                            <NotificationSwitch
                                label="Enviar un recordatorio"
                                checked={Boolean(form.studyReminderEnabled)}
                                disabled={isSaving}
                                onChange={(value) => {
                                    updateField(
                                        'studyReminderEnabled',
                                        value,
                                    )
                                }}
                            />

                            <div className="profile-reminder__toggle-text">
                                <strong>
                                    Enviar un recordatorio
                                </strong>

                                <p>
                                    Recibe un aviso para seguir
                                    con tu aprendizaje.
                                </p>
                            </div>

                        </div>

                        {/* CANAL DEL RECORDATORIO */}
                        <div className="profile-reminder__channel">

                            <span className="profile-reminder__channel-label">
                                Canal del recordatorio
                            </span>

                            <label className="profile-reminder__radio-option">

                                <input
                                    type="radio"
                                    name="reminderChannel"
                                    value="web"
                                    checked={
                                        form.reminderChannel === 'web'
                                    }
                                    disabled={
                                        !form.studyReminderEnabled
                                        || isSaving
                                    }
                                    onChange={handleInputChange}
                                />

                                <span className="profile-reminder__radio-custom" />

                                <span className="profile-reminder__radio-content">

                                    <span className="profile-reminder__radio-title">
                                        <FiMonitor aria-hidden="true" />
                                        Solo en la web
                                    </span>

                                    <small>
                                        Se mostrará cuando tengas
                                        Learn2Code abierto.
                                    </small>

                                </span>

                            </label>

                        </div>

                    </div>

                    {/* HORA Y FRECUENCIA */}
                    <div className="profile-reminder__fields">

                        {/* HORA */}
                        <div className="profile-reminder__field">

                            <label htmlFor="notification-time">
                                Hora
                            </label>

                            <div className="profile-reminder__input-wrap">

                                <FiClock aria-hidden="true" />

                                <select
                                    id="notification-time"
                                    name="reminderTime"
                                    value={form.reminderTime}
                                    onChange={handleInputChange}
                                    disabled={
                                        !form.studyReminderEnabled
                                        || isSaving
                                    }
                                >
                                    <option value="07:00">07:00</option>
                                    <option value="08:00">08:00</option>
                                    <option value="09:00">09:00</option>
                                    <option value="12:00">12:00</option>
                                    <option value="18:00">18:00</option>
                                    <option value="19:00">19:00</option>
                                    <option value="20:00">20:00</option>
                                </select>

                            </div>

                        </div>

                        {/* FRECUENCIA */}
                        <div className="profile-reminder__field">

                            <label htmlFor="notification-frequency">
                                Frecuencia
                            </label>

                            <div className="profile-reminder__input-wrap">

                                <FiCalendar aria-hidden="true" />

                                <select
                                    id="notification-frequency"
                                    name="reminderFrequency"
                                    value={form.reminderFrequency}
                                    onChange={handleInputChange}
                                    disabled={
                                        !form.studyReminderEnabled
                                        || isSaving
                                    }
                                >
                                    <option value="weekdays">
                                        Lunes a viernes
                                    </option>

                                    <option value="everyday">
                                        Todos los días
                                    </option>

                                    <option value="weekends">
                                        Fines de semana
                                    </option>
                                </select>

                            </div>

                        </div>

                    </div>

                    {/* ZONA HORARIA */}
                    <p className="profile-reminder__timezone">
                        Zona horaria: Ciudad de México
                    </p>

                    {/* MENSAJES */}
                    {message && (
                        <p
                            role="status"
                            className={
                                'profile-notifications-message '
                                + `is-${messageType}`
                            }
                        >
                            {message}
                        </p>
                    )}

                    {/* BOTONES */}
                    <div className="profile-reminder__actions">

                        <button
                            type="button"
                            className="profile-reminder__cancel"
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            className="profile-reminder__save"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving
                                ? 'Guardando...'
                                : 'Guardar preferencias'}
                        </button>

                    </div>

                </article>

            </div>

            {/* ================================================
                COLUMNA DERECHA
                ================================================ */}

            <aside className="profile-notifications-sidebar">

                {/* ============================================
                    RESUMEN SEMANAL
                    ============================================ */}

                <article className="profile-notifications-card profile-notifications-card--side">

                    <div className="profile-side-card__title">

                        <FiBarChart2 aria-hidden="true" />

                        <h3>
                            Resumen semanal
                        </h3>

                    </div>

                    <div className="profile-weekly-summary">

                        <NotificationSwitch
                            label="Resumen semanal"
                            checked={Boolean(form.weeklySummary)}
                            disabled={isSaving}
                            onChange={(value) => {
                                updateField('weeklySummary', value)
                            }}
                        />

                        <div className="profile-weekly-summary__text">

                            <strong>
                                Un correo con tu avance
                                y próximos pasos.
                            </strong>

                            <p>
                                Será semanal si lo activas.
                            </p>

                        </div>

                    </div>

                </article>

                {/* ============================================
                    AVISOS DE SEGURIDAD
                    ============================================ */}

                <article className="profile-notifications-card profile-notifications-card--side">

                    <div className="profile-side-card__title profile-side-card__title--security">

                        <FiShield aria-hidden="true" />

                        <h3>
                            Avisos de seguridad
                        </h3>

                    </div>

                    <div className="profile-security-notice">

                        <div className="profile-security-notice__icon">
                            <FiLock aria-hidden="true" />
                        </div>

                        <div className="profile-security-notice__content">
                            <strong>
                                Los mensajes importantes sobre
                                tu cuenta se mantienen activos.
                            </strong>
                        </div>

                    </div>

                    <p className="profile-security-notice__description">
                        Te avisaremos sobre inicios de sesión,
                        cambios en tu cuenta y otra información
                        importante, aunque los demás avisos
                        estén desactivados.
                    </p>

                </article>

                {/* ============================================
                    MASCOTA LEARN2CODE
                    ============================================ */}

                <article className="profile-notifications-mascot-card">

                    <img
                        src={mascotSrc}
                        alt="Mascota de Learn2Code programando"
                    />

                    <div className="profile-notifications-mascot-card__text">

                        <h3>
                            Avisos a tu ritmo
                        </h3>

                        <p>
                            Activa solo lo que te ayude
                            a mantener tu hábito.
                        </p>

                    </div>

                </article>

            </aside>

        </section>
    )
}


/**
 * ============================================================
 * LEARN2CODE - PESTAÑA PRIVACIDAD
 * ============================================================
 *
 * Muestra:
 * - Visibilidad del perfil.
 * - Información visible.
 * - Vista previa del perfil.
 * - Protección del correo.
 * - Exportación de datos.
 * - Proyectos.
 * - Mascota.
 *
 * NOTA:
 * El guardado en backend queda preparado mediante onSave.
 * ============================================================
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
    FiArrowRight,
    FiBarChart2,
    FiBox,
    FiCode,
    FiEye,
    FiFileText,
    FiFolder,
    FiShare2,
    FiShield,
    FiTarget,
} from 'react-icons/fi'

import { FaFire } from 'react-icons/fa'

import './ProfilePrivacy.css'

// ============================================================
// CONFIGURACIÓN VISUAL INICIAL
// ============================================================

export const DEFAULT_PRIVACY_SETTINGS = {
    audience: 'members',
    showRoute: true,
    showAchievements: true,
    showLevel: false,
    showStreak: false,
}

// ============================================================
// RECURSOS DEL MOCKUP
// ============================================================

const technologyImages = [
    {
        name: 'React',
        src: '/images/tecnologia-react-64.png',
    },
    {
        name: 'JavaScript',
        src: '/images/tecnologia-javascript-32.png',
    },
    {
        name: 'CSS',
        src: '/images/tecnologia-css-64.png',
    },
]

// ============================================================
// OPCIONES DE PRIVACIDAD
// ============================================================

const privacyOptions = [
    {
        key: 'showRoute',
        title: 'Mostrar ruta y tecnologías',
        description:
            'Muestra la ruta que sigues y las tecnologías que utilizas.',
        Icon: FiShare2,
        color: 'dark',
    },
    {
        key: 'showAchievements',
        title: 'Mostrar logros obtenidos',
        description:
            'Muestra tus logros y badges conseguidos.',
        Icon: FiTarget,
        color: 'gold',
    },
    {
        key: 'showLevel',
        title: 'Mostrar nivel y XP',
        description:
            'Muestra tu nivel actual y los puntos de experiencia.',
        Icon: FiBarChart2,
        color: 'dark',
    },
    {
        key: 'showStreak',
        title: 'Mostrar racha y actividad de estudio',
        description:
            'Muestra tu racha actual y tu actividad de estudio.',
        Icon: FaFire,
        color: 'red',
    },
]

// ============================================================
// CREAR NOMBRE DE USUARIO VISUAL
// ============================================================

export function getProfileUsername(user) {
    if (typeof user?.username === 'string'
        && user.username.trim()) {
        return user.username.trim().replace(/^@/, '')
    }

    return (
        String(user?.fullName || 'estudiante')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
        || 'estudiante'
    )
}

// ============================================================
// SWITCH REUTILIZABLE
// ============================================================

function PrivacySwitch({
    checked,
    label,
    onChange,
    disabled = false,
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-label={label}
            aria-checked={checked}
            disabled={disabled}
            className={
                'profile-privacy-switch'
                + (checked ? ' is-active' : '')
            }
            onClick={() => onChange(!checked)}
        >
            <span className="profile-privacy-switch-thumb" />
        </button>
    )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function ProfilePrivacy({
    user,
    initialPreferences,
    onSave,
    mascotSrc =
        '/images/learn2code-mascot-laptop-transparent.png',
}) {
    const navigate = useNavigate()

    // --------------------------------------------------------
    // ESTADOS DEL FORMULARIO
    // --------------------------------------------------------

    const [form, setForm] = useState(() => ({
        ...DEFAULT_PRIVACY_SETTINGS,
        ...(initialPreferences || {}),
    }))

    const [savedForm, setSavedForm] = useState(() => ({
        ...DEFAULT_PRIVACY_SETTINGS,
        ...(initialPreferences || {}),
    }))

    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState('info')

    // --------------------------------------------------------
    // SINCRONIZAR PREFERENCIAS DEL BACKEND
    // --------------------------------------------------------

    useEffect(() => {
        if (!initialPreferences) return

        const next = {
            ...DEFAULT_PRIVACY_SETTINGS,
            ...initialPreferences,
        }

        setForm(next)
        setSavedForm({ ...next })
    }, [initialPreferences])

    // --------------------------------------------------------
    // DATOS DEL USUARIO AUTENTICADO
    // --------------------------------------------------------

    const name = user?.fullName?.trim() || 'Estudiante'
    const username = getProfileUsername(user)
    const initial = name.charAt(0).toUpperCase()

    const avatarUrl =
        user?.avatarUrl || user?.profileImageUrl || ''

    // --------------------------------------------------------
    // ACTUALIZAR CAMPOS
    // --------------------------------------------------------

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }))

        setMessage('')
    }

    // --------------------------------------------------------
    // CANCELAR CAMBIOS
    // --------------------------------------------------------

    const handleCancel = () => {
        setForm({ ...savedForm })
        setMessage('')
    }

    // --------------------------------------------------------
    // GUARDAR PREFERENCIAS
    // --------------------------------------------------------

    const handleSave = async () => {
        if (isSaving) return

        if (typeof onSave !== 'function') {
            setMessageType('info')
            setMessage(
                'Puedes revisar los cambios en la vista previa. '
                + 'El guardado permanente aún debe conectarse '
                + 'con el backend.',
            )
            return
        }

        setIsSaving(true)
        setMessage('')

        try {
            const result = await onSave({ ...form })

            if (result === true) {
                setSavedForm({ ...form })
                setMessageType('success')
                setMessage('Privacidad guardada correctamente.')
            } else {
                setMessageType('error')
                setMessage('No se confirmó el guardado.')
            }
        } catch {
            setMessageType('error')
            setMessage('No se pudieron guardar los cambios.')
        } finally {
            setIsSaving(false)
        }
    }

    // --------------------------------------------------------
    // ABRIR VISTA PREVIA PÚBLICA
    // --------------------------------------------------------

    const handlePublicProfile = () => {
        navigate('/profile/public', {
            state: {
                privacySettings: { ...form },
            },
        })
    }

    // ========================================================
    // INTERFAZ
    // ========================================================

    return (
        <section className="profile-privacy">

            {/* ================================================
                COLUMNA IZQUIERDA
                ================================================ */}

            <div className="profile-privacy-main">

                <article className="profile-privacy-card">

                    {/* VISIBILIDAD GENERAL */}
                    <header className="profile-privacy-heading">
                        <h2>Visibilidad de tu perfil</h2>
                        <p>
                            Controla qué información pueden ver
                            otros miembros de Learn2Code.
                        </p>
                    </header>

                    <label
                        htmlFor="profile-privacy-audience"
                        className="profile-privacy-label"
                    >
                        Quién puede ver mi perfil
                    </label>

                    <select
                        id="profile-privacy-audience"
                        className="profile-privacy-select"
                        value={form.audience}
                        onChange={(event) => {
                            updateField(
                                'audience',
                                event.target.value,
                            )
                        }}
                    >
                        <option value="members">
                            Miembros de Learn2Code
                        </option>

                        <option value="private">
                            Solo yo
                        </option>
                    </select>

                    <p className="profile-privacy-helper">
                        Tu perfil no se publica fuera de la comunidad.
                    </p>

                    <div className="profile-privacy-divider" />

                    {/* INFORMACIÓN VISIBLE */}
                    <header className="profile-privacy-heading">
                        <h2>Información visible</h2>
                        <p>
                            Elige qué elementos se muestran
                            en tu perfil público.
                        </p>
                    </header>

                    <div className="profile-privacy-options">
                        {privacyOptions.map((option) => {
                            const Icon = option.Icon

                            return (
                                <div
                                    key={option.key}
                                    className="profile-privacy-option"
                                >
                                    <span
                                        className={
                                            'profile-privacy-option-icon '
                                            + option.color
                                        }
                                    >
                                        <Icon aria-hidden="true" />
                                    </span>

                                    <div className="profile-privacy-option-text">
                                        <strong>{option.title}</strong>
                                        <p>{option.description}</p>
                                    </div>

                                    <PrivacySwitch
                                        label={option.title}
                                        checked={
                                            Boolean(form[option.key])
                                        }
                                        disabled={isSaving}
                                        onChange={(value) => {
                                            updateField(option.key, value)
                                        }}
                                    />
                                </div>
                            )
                        })}
                    </div>

                    {/* AVISO DE SEGURIDAD */}
                    <div className="profile-privacy-info">
                        <FiShield aria-hidden="true" />
                        <span>
                            Tu correo y tus ajustes de cuenta
                            nunca aparecen en tu perfil público.
                        </span>
                    </div>

                    {/* MENSAJES */}
                    {message && (
                        <p
                            role="status"
                            className={
                                'profile-privacy-message is-'
                                + messageType
                            }
                        >
                            {message}
                        </p>
                    )}

                    {/* BOTONES */}
                    <div className="profile-privacy-actions">
                        <button
                            type="button"
                            className="profile-privacy-cancel"
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            className="profile-privacy-save"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving
                                ? 'Guardando...'
                                : 'Guardar privacidad'}
                        </button>
                    </div>

                </article>

                {/* PROYECTOS */}
                <article className="profile-privacy-projects">
                    <FiFolder aria-hidden="true" />

                    <div>
                        <strong>Tus proyectos</strong>
                        <p>
                            Tus archivos y borradores son privados.
                            Solo se comparte la versión que elijas publicar.
                        </p>
                    </div>

                    <span className="profile-privacy-projects-note">
                        Gestionar proyectos compartidos
                        <FiArrowRight aria-hidden="true" />
                    </span>
                </article>

            </div>

            {/* ================================================
                COLUMNA DERECHA
                ================================================ */}

            <aside className="profile-privacy-sidebar">

                {/* VISTA PREVIA DEL PERFIL */}
                <article className="profile-privacy-card">

                    <header className="profile-privacy-side-title">
                        <FiEye aria-hidden="true" />

                        <div>
                            <h3>Así se verá tu perfil</h3>
                            <p>
                                Vista previa con la información
                                que otros miembros pueden ver.
                            </p>
                        </div>
                    </header>

                    <div className="profile-privacy-preview">

                        <div className="profile-privacy-preview-user">

                            {/* AVATAR */}
                            <div className="profile-privacy-preview-avatar">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt=""
                                    />
                                ) : (
                                    <span>{initial}</span>
                                )}
                            </div>

                            {/* NOMBRE Y USUARIO */}
                            <div className="profile-privacy-preview-name">
                                <strong>{name}</strong>
                                <span>@{username}</span>
                            </div>

                            {/* RUTA */}
                            {form.showRoute && (
                                <span className="profile-privacy-route">
                                    <FiBox aria-hidden="true" />
                                    Frontend
                                </span>
                            )}
                        </div>

                        {/* TECNOLOGÍAS */}
                        {form.showRoute && (
                            <div className="profile-privacy-techs">
                                {technologyImages.map((item) => (
                                    <span key={item.name}>
                                        <img
                                            src={item.src}
                                            alt=""
                                        />
                                        {item.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* INSIGNIAS VISUALES */}
                        {form.showAchievements && (
                            <div className="profile-privacy-preview-symbols">
                                <FiTarget aria-hidden="true" />
                                <FiBarChart2 aria-hidden="true" />
                                <FiCode aria-hidden="true" />
                            </div>
                        )}

                        {/* NIVEL Y RACHA */}
                        {(form.showLevel || form.showStreak) && (
                            <div className="profile-privacy-extra">
                                {form.showLevel && (
                                    <span>
                                        <FiBarChart2 />
                                        Nivel y XP
                                    </span>
                                )}

                                {form.showStreak && (
                                    <span>
                                        <FaFire />
                                        Racha de estudio
                                    </span>
                                )}
                            </div>
                        )}

                        {form.audience === 'private' && (
                            <p className="profile-privacy-private-note">
                                Perfil visible solo para ti
                            </p>
                        )}

                    </div>

                    {/* BOTÓN: VER PERFIL PÚBLICO */}
                    <button
                        type="button"
                        className="profile-privacy-outline"
                        onClick={handlePublicProfile}
                    >
                        <FiShare2 aria-hidden="true" />
                        Ver perfil público
                        <FiArrowRight aria-hidden="true" />
                    </button>

                </article>

                {/* TUS DATOS */}
                <article className="profile-privacy-card">

                    <header className="profile-privacy-side-title">
                        <FiFileText aria-hidden="true" />

                        <div>
                            <h3>Tus datos</h3>
                            <p>
                                Puedes solicitar una copia
                                de tu información.
                            </p>
                        </div>
                    </header>

                    {/* Endpoint todavía no integrado */}
                    <button
                        type="button"
                        className="profile-privacy-outline blue"
                        disabled
                        title="La exportación requiere integración con la API"
                    >
                        <FiFileText aria-hidden="true" />
                        Solicitar exportación
                        <FiArrowRight aria-hidden="true" />
                    </button>

                </article>

                {/* MASCOTA */}
                <article className="profile-privacy-tip">

                    <img
                        src={mascotSrc}
                        alt="Mascota de Learn2Code"
                    />

                    <div>
                        <strong>Comparte a tu manera</strong>
                        <p>
                            Elige qué mostrar y revisa
                            tu perfil antes de compartir.
                        </p>
                    </div>

                </article>

            </aside>

        </section>
    )
}

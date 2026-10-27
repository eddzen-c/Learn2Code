
/**
 * ============================================================
 * LEARN2CODE - ENCABEZADO DEL PERFIL
 * ============================================================
 *
 * DISEÑO:
 * Reproduce la tarjeta principal del mockup:
 *
 * 1. Título "Mi perfil".
 * 2. Subtítulo azul.
 * 3. Avatar con botón visual de cámara.
 * 4. Nombre real y @usuario.
 * 5. Etiquetas de ruta y nivel inicial.
 * 6. Insignia hexagonal del nivel actual.
 * 7. Experiencia acumulada.
 * 8. Racha de estudio.
 * 9. Mascota superpuesta sobre el borde superior.
 *
 * NOTA:
 * Las estadísticas predeterminadas son de demostración.
 * Se pueden sustituir mediante la propiedad stats.
 */

// ============================================================
// 1. IMPORTACIONES
// ============================================================

import { useState } from 'react'

import {
    FiBarChart2,
    FiBox,
    FiCamera,
} from 'react-icons/fi'

import { FaFire } from 'react-icons/fa'

import './ProfileHeader.css'

// ============================================================
// 2. FUNCIONES AUXILIARES
// ============================================================

/**
 * Genera un identificador visual cuando la API todavía
 * no proporciona un username real.
 *
 * No crea una cuenta pública en la base de datos.
 */
function getDisplayUsername(user, fullName) {
    const savedUsername = user?.username?.trim()

    if (savedUsername) {
        return savedUsername.replace(/^@/, '')
    }

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
// 3. COMPONENTE PRINCIPAL
// ============================================================

export function ProfileHeader({
    user,
    mascotSrc = '/images/trofeo_perfil.png',
    stats,
    onChangeAvatar,
}) {

    // --------------------------------------------------------
    // 3.1 DATOS DEL ESTUDIANTE
    // --------------------------------------------------------

    const fullName =
        user?.fullName?.trim() || 'Estudiante'

    const username = getDisplayUsername(
        user,
        fullName,
    )

    const initial = fullName.charAt(0).toUpperCase()

    // Fotografía real de la cuenta, si existe.
    const avatarUrl =
        user?.avatarUrl
        || user?.profileImageUrl
        || ''

    const [failedAvatarUrl, setFailedAvatarUrl] =
        useState('')

    const showAvatarImage =
        Boolean(avatarUrl)
        && avatarUrl !== failedAvatarUrl

    // --------------------------------------------------------
    // 3.2 ESTADÍSTICAS
    // --------------------------------------------------------

    /**
     * Datos de ejemplo para reproducir el mockup.
     *
     * Cuando estén disponibles los datos de aprendizaje
     * de la API, ProfilePage puede pasarlos en stats.
     */
    const profileStats = {
        level: 12,
        xp: 2450,
        streakDays: 14,
        route: 'Frontend',
        initialLevel: 'Intermedio',
        ...(stats || {}),
    }

    const formattedXP = Number(
        profileStats.xp || 0,
    ).toLocaleString('es-MX')

    // ========================================================
    // 4. INTERFAZ
    // ========================================================

    return (
        <section className="profile-header">

            {/* ================================================
                4.1 TÍTULO Y DESCRIPCIÓN
                ================================================ */}

            <div className="profile-header-heading">

                <h1>Mi perfil</h1>

                <p>
                    Personaliza tu información y tu
                    experiencia de aprendizaje.
                </p>

            </div>

            {/* ================================================
                4.2 TARJETA PRINCIPAL
                ================================================ */}

            <div className="profile-header-summary">

                {/* ============================================
                    MASCOTA SUPERPUESTA
                    ============================================

                    En CSS se posiciona respecto a esta
                    tarjeta con position: absolute.

                    La imagen debe ser transparente.
                */}

                <div className="profile-header-mascot">

                    <img
                        src={mascotSrc}
                        alt="Mascota de Learn2Code con trofeo"
                        draggable="false"
                    />

                </div>

                {/* ============================================
                    COLUMNA IZQUIERDA
                    ============================================ */}

                <div className="profile-header-identity">

                    {/* AVATAR */}
                    <div className="profile-header-avatar-wrapper">

                        <div className="profile-header-avatar">

                            {showAvatarImage ? (

                                <img
                                    src={avatarUrl}
                                    alt={`Avatar de ${fullName}`}
                                    onError={() => {
                                        setFailedAvatarUrl(avatarUrl)
                                    }}
                                />

                            ) : (

                                <span>{initial}</span>

                            )}

                        </div>

                        {/* Botón de cámara.
                            Solo se activa si ProfilePage
                            proporciona onChangeAvatar. */}
                        {typeof onChangeAvatar === 'function' ? (

                            <button
                                type="button"
                                className="profile-header-camera"
                                onClick={onChangeAvatar}
                                aria-label="Cambiar fotografía de perfil"
                            >
                                <FiCamera aria-hidden="true" />
                            </button>

                        ) : (

                            <span
                                className="profile-header-camera"
                                aria-hidden="true"
                            >
                                <FiCamera />
                            </span>

                        )}

                    </div>

                    {/* NOMBRE Y ETIQUETAS */}
                    <div className="profile-header-user-info">

                        <div className="profile-header-name-row">

                            <h2>{fullName}</h2>

                            <span className="profile-header-role">
                                Estudiante
                            </span>

                        </div>

                        {/* Solo @usuario, sin correo */}
                        <p className="profile-header-username">
                            @{username}
                        </p>

                        {/* Etiquetas del mockup */}
                        <div className="profile-header-tags">

                            <span className="profile-header-tag">

                                <FiBox aria-hidden="true" />

                                Ruta {profileStats.route}

                            </span>

                            <span className="profile-header-tag">

                                <FiBarChart2 aria-hidden="true" />

                                Nivel {String(
                                    profileStats.initialLevel,
                                ).toLowerCase()}

                            </span>

                        </div>

                    </div>

                </div>

                {/* ============================================
                    COLUMNA CENTRAL
                    NIVEL ACTUAL Y EXPERIENCIA
                    ============================================ */}

                <div className="profile-header-level">

                    {/* Insignia hexagonal creada con CSS */}
                    <div
                        className="profile-header-level-badge"
                        aria-label={`Nivel ${profileStats.level}`}
                    >

                        <div className="profile-header-level-badge-inner">

                            <strong>
                                {profileStats.level}
                            </strong>

                        </div>

                    </div>

                    {/* Nivel y puntos */}
                    <div className="profile-header-level-text">

                        <strong>
                            Nivel {profileStats.level}
                        </strong>

                        <span>
                            {formattedXP} XP
                        </span>

                    </div>

                </div>

                {/* ============================================
                    COLUMNA DERECHA
                    RACHA DE APRENDIZAJE
                    ============================================ */}

                <div className="profile-header-streak">

                    <FaFire aria-hidden="true" />

                    <div className="profile-header-streak-text">

                        <strong>
                            {profileStats.streakDays} días
                        </strong>

                        <span>
                            de racha
                        </span>

                    </div>

                </div>

            </div>

        </section>
    )
}

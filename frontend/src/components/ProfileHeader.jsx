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
    const profileStats = {
        levelName: stats?.levelName ?? null,
        xp: stats?.xp ?? null,
        streakDays: stats?.streakDays ?? null,
        route: stats?.route ?? null,
        initialLevel: stats?.initialLevel ?? null,
    }

    const formattedXP =
        profileStats.xp != null
            && Number.isFinite(Number(profileStats.xp))
            ? `${Number(profileStats.xp).toLocaleString('es-MX')} XP`
            : 'XP no disponible'

    const formattedStreak =
        profileStats.streakDays != null
            && Number.isFinite(Number(profileStats.streakDays))
            ? `${Number(profileStats.streakDays)} días`
            : 'Racha no disponible'

    // ========================================================
    // 4. INTERFAZ
    // ========================================================

    return (
        <section className="profile-header">
            <div className="profile-header-heading">
                <h1>Mi perfil</h1>
                <p>
                    Personaliza tu información y tu
                    experiencia de aprendizaje.
                </p>
            </div>
            <div className="profile-header-summary">
                <div className="profile-header-mascot">
                    <img
                        src={mascotSrc}
                        alt="Mascota de Learn2Code con trofeo"
                        draggable="false"
                    />
                </div>
                <div className="profile-header-identity">
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
                    <div className="profile-header-user-info">
                        <div className="profile-header-name-row">
                            <h2>{fullName}</h2>
                            <span className="profile-header-role">
                                Estudiante
                            </span>
                        </div>
                        <p className="profile-header-username">
                            @{username}
                        </p>
                        <div className="profile-header-tags">
                            <span className="profile-header-tag">
                                <FiBox aria-hidden="true" />
                                {profileStats.route
                                    ? `Ruta ${profileStats.route}`
                                    : 'Ruta pendiente'}
                            </span>
                            <span className="profile-header-tag">
                                <FiBarChart2 aria-hidden="true" />
                                {profileStats.initialLevel
                                    ? `Nivel ${String(
                                        profileStats.initialLevel,
                                    ).toLowerCase()}`
                                    : 'Diagnóstico pendiente'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="profile-header-level">
                    <div
                        className="profile-header-level-badge"
                        aria-label={
                            profileStats.levelName
                                ? `Nivel ${profileStats.levelName}`
                                : 'Nivel no disponible'
                        }
                    >
                        <div className="profile-header-level-badge-inner">
                            <strong>
                                XP
                            </strong>
                        </div>
                    </div>
                    <div className="profile-header-level-text">
                        <strong>
                            {profileStats.levelName
                                ? `Nivel ${profileStats.levelName}`
                                : 'Nivel no disponible'}
                        </strong>
                        <span>
                            {formattedXP}
                        </span>
                    </div>
                </div>
                <div className="profile-header-streak">
                    <FaFire aria-hidden="true" />
                    <div className="profile-header-streak-text">
                        <strong>
                            {formattedStreak}
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

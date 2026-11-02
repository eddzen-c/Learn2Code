import { databasePool } from '../../../config/database.js';

import {
    findUserPrivacyPreferences,
    upsertUserPrivacyPreferences,
} from '../repositories/profile-privacy.repository.js';

import {
    getCurrentUser,
} from './current-user.service.js';

// ============================================================
// 1. PREFERENCIAS PREDETERMINADAS
// ============================================================

export const DEFAULT_PRIVACY_PREFERENCES = Object.freeze({
    audience: 'members',
    showRoute: true,
    showAchievements: true,
    showLevel: false,
    showStreak: false,
});

// ============================================================
// 2. OBTENER PREFERENCIAS DEL USUARIO
// ============================================================

export const getCurrentUserPrivacyPreferences = async ({
    userId,
    client = databasePool,
}) => {
    // Verificar que el usuario exista y esté activo.
    await getCurrentUser({
        userId,
        client,
    });

    const preferences = await findUserPrivacyPreferences({
        userId,
        client,
    });

    if (!preferences) {
        return {
            ...DEFAULT_PRIVACY_PREFERENCES,
        };
    }

    return preferences;
};

// ============================================================
// 3. ACTUALIZAR PREFERENCIAS DEL USUARIO
// ============================================================

export const updateCurrentUserPrivacyPreferences = async ({
    userId,
    preferences = {},
    client = databasePool,
}) => {
    const current = await getCurrentUserPrivacyPreferences({
        userId,
        client,
    });

    const nextPreferences = {
        audience:
            preferences.audience ?? current.audience,

        showRoute:
            preferences.showRoute ?? current.showRoute,

        showAchievements:
            preferences.showAchievements
            ?? current.showAchievements,

        showLevel:
            preferences.showLevel ?? current.showLevel,

        showStreak:
            preferences.showStreak ?? current.showStreak,
    };

    return upsertUserPrivacyPreferences({
        userId,
        ...nextPreferences,
        client,
    });
};
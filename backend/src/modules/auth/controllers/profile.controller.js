import {
    updateCurrentUserProfile,
} from '../services/profile.service.js';

import {
    parseUpdateProfileBody,
} from '../validators/profile.validator.js';

import {
    getCurrentUserPrivacyPreferences,
    updateCurrentUserPrivacyPreferences,
} from '../services/profile-privacy.service.js';

import {
    parsePrivacyPreferencesBody,
} from '../validators/profile-privacy.validator.js';

import {
    getCurrentUserNotificationPreferences,
    updateCurrentUserNotificationPreferences,
} from '../services/profile-notifications.service.js';

import {
    parseNotificationPreferencesBody,
} from '../validators/profile-notifications.validator.js';

export const updateProfileController = async (
    req,
    res,
    next,
) => {
    try {
        const input = parseUpdateProfileBody(
            req.body,
        );

        const user =
            await updateCurrentUserProfile({
                userId: req.auth.userId,
                ...input,
            });

        res.status(200).json({
            status: 'success',
            data: {
                user,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// CONSULTAR PREFERENCIAS DE PRIVACIDAD
// ============================================================

export const getPrivacyPreferencesController = async (
    req,
    res,
    next,
) => {
    try {
        const preferences =
            await getCurrentUserPrivacyPreferences({
                userId: req.auth.userId,
            });

        res.status(200).json({
            status: 'success',
            data: {
                preferences,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// ACTUALIZAR PREFERENCIAS DE PRIVACIDAD
// ============================================================

export const updatePrivacyPreferencesController = async (
    req,
    res,
    next,
) => {
    try {
        const input = parsePrivacyPreferencesBody(
            req.body,
        );

        const preferences =
            await updateCurrentUserPrivacyPreferences({
                userId: req.auth.userId,
                preferences: input,
            });

        res.status(200).json({
            status: 'success',
            data: {
                preferences,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// CONSULTAR PREFERENCIAS DE NOTIFICACIONES
// ============================================================

export const getNotificationPreferencesController = async (
    req,
    res,
    next,
) => {
    try {
        const preferences =
            await getCurrentUserNotificationPreferences({
                userId: req.auth.userId,
            });

        res.status(200).json({
            status: 'success',
            data: {
                preferences,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// ACTUALIZAR PREFERENCIAS DE NOTIFICACIONES
// ============================================================

export const updateNotificationPreferencesController = async (
    req,
    res,
    next,
) => {
    try {
        const input = parseNotificationPreferencesBody(
            req.body,
        );

        const preferences =
            await updateCurrentUserNotificationPreferences({
                userId: req.auth.userId,
                preferences: input,
            });

        res.status(200).json({
            status: 'success',
            data: {
                preferences,
            },
        });
    } catch (error) {
        next(error);
    }
};
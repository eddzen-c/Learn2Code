import { databasePool } from '../../../config/database.js';

import {
    findUserNotificationPreferences,
    upsertUserNotificationPreferences,
} from '../repositories/profile-notifications.repository.js';

import {
    getCurrentUser,
} from './current-user.service.js';

// ============================================================
// PREFERENCIAS PREDETERMINADAS
// ============================================================

export const DEFAULT_NOTIFICATION_PREFERENCES = Object.freeze({
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
});

// ============================================================
// CONSULTAR PREFERENCIAS
// ============================================================

export const getCurrentUserNotificationPreferences = async ({
    userId,
    client = databasePool,
}) => {
    // Reutilizar la validación existente del usuario.
    await getCurrentUser({
        userId,
        client,
    });

    const preferences =
        await findUserNotificationPreferences({
            userId,
            client,
        });

    return preferences ?? {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
    };
};

// ============================================================
// ACTUALIZAR PREFERENCIAS
// ============================================================

export const updateCurrentUserNotificationPreferences = async ({
    userId,
    preferences = {},
    client = databasePool,
}) => {
    const current =
        await getCurrentUserNotificationPreferences({
            userId,
            client,
        });

    // Conservar los campos que no fueron enviados.
    const nextPreferences = Object.fromEntries(
        Object.keys(DEFAULT_NOTIFICATION_PREFERENCES)
            .map((field) => [
                field,
                preferences[field] ?? current[field],
            ]),
    );

    return upsertUserNotificationPreferences({
        userId,
        preferences: nextPreferences,
        client,
    });
};
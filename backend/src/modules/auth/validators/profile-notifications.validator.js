// ============================================================
// CAMPOS BOOLEANOS
// ============================================================

const BOOLEAN_FIELDS = new Set([
    'mentionsWeb',
    'mentionsEmail',
    'projectsWeb',
    'projectsEmail',
    'achievementsWeb',
    'achievementsEmail',
    'communityWeb',
    'communityEmail',
    'coursesWeb',
    'coursesEmail',
    'weeklySummary',
    'studyReminderEnabled',
]);

// ============================================================
// VALORES PERMITIDOS
// ============================================================

const ALLOWED_TIMES = new Set([
    '07:00',
    '08:00',
    '09:00',
    '12:00',
    '18:00',
    '19:00',
    '20:00',
]);

const ALLOWED_FREQUENCIES = new Set([
    'weekdays',
    'everyday',
    'weekends',
]);

const ALLOWED_CHANNELS = new Set([
    'web',
]);

const ALLOWED_FIELDS = new Set([
    ...BOOLEAN_FIELDS,
    'reminderTime',
    'reminderFrequency',
    'reminderChannel',
]);

// ============================================================
// ERROR DE VALIDACIÓN
// ============================================================

export class InvalidNotificationPreferencesError extends Error {
    constructor(message) {
        super(message);

        this.name = 'InvalidNotificationPreferencesError';
        this.statusCode = 400;
        this.code = 'INVALID_NOTIFICATION_PREFERENCES';
    }
}

// ============================================================
// VALIDAR PREFERENCIAS
// ============================================================

export const parseNotificationPreferencesBody = (body) => {
    if (
        body === null
        || typeof body !== 'object'
        || Array.isArray(body)
    ) {
        throw new InvalidNotificationPreferencesError(
            'Las preferencias de notificaciones deben ser un objeto.',
        );
    }

    const fields = Object.keys(body);

    if (fields.length === 0) {
        throw new InvalidNotificationPreferencesError(
            'Debes proporcionar al menos una preferencia.',
        );
    }

    for (const field of fields) {
        if (!ALLOWED_FIELDS.has(field)) {
            throw new InvalidNotificationPreferencesError(
                `El campo "${field}" no está permitido.`,
            );
        }

        if (
            BOOLEAN_FIELDS.has(field)
            && typeof body[field] !== 'boolean'
        ) {
            throw new InvalidNotificationPreferencesError(
                `El campo "${field}" debe ser un booleano.`,
            );
        }
    }

    if (
        Object.hasOwn(body, 'reminderTime')
        && !ALLOWED_TIMES.has(body.reminderTime)
    ) {
        throw new InvalidNotificationPreferencesError(
            'La hora del recordatorio no está permitida.',
        );
    }

    if (
        Object.hasOwn(body, 'reminderFrequency')
        && !ALLOWED_FREQUENCIES.has(
            body.reminderFrequency,
        )
    ) {
        throw new InvalidNotificationPreferencesError(
            'La frecuencia del recordatorio no está permitida.',
        );
    }

    if (
        Object.hasOwn(body, 'reminderChannel')
        && !ALLOWED_CHANNELS.has(
            body.reminderChannel,
        )
    ) {
        throw new InvalidNotificationPreferencesError(
            'El canal del recordatorio no está permitido.',
        );
    }

    return Object.fromEntries(
        fields.map((field) => [
            field,
            body[field],
        ]),
    );
};
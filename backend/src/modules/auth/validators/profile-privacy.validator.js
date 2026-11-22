// ============================================================
// LEARN2CODE - VALIDADOR DE PREFERENCIAS DE PRIVACIDAD
// ============================================================

// ============================================================
// 1. CAMPOS Y VALORES PERMITIDOS
// ============================================================

const ALLOWED_FIELDS = new Set([
    'audience',
    'showRoute',
    'showAchievements',
    'showLevel',
    'showStreak',
]);

const BOOLEAN_FIELDS = [
    'showRoute',
    'showAchievements',
    'showLevel',
    'showStreak',
];

const ALLOWED_AUDIENCES = new Set([
    'members',
    'private',
]);

// ============================================================
// 2. ERROR DE VALIDACIÓN
// ============================================================

export class InvalidPrivacyPreferencesError extends Error {
    constructor(message) {
        super(message);

        this.name = 'InvalidPrivacyPreferencesError';
        this.statusCode = 400;
        this.code = 'INVALID_PRIVACY_PREFERENCES';
    }
}

// ============================================================
// 3. VALIDAR EL CUERPO DE LA PETICIÓN
// ============================================================

export const parsePrivacyPreferencesBody = (body) => {
    if (
        body === null
        || typeof body !== 'object'
        || Array.isArray(body)
    ) {
        throw new InvalidPrivacyPreferencesError(
            'Las preferencias de privacidad deben ser un objeto.',
        );
    }

    const fields = Object.keys(body);

    if (fields.length === 0) {
        throw new InvalidPrivacyPreferencesError(
            'Debes proporcionar al menos una preferencia.',
        );
    }

    // --------------------------------------------------------
    // RECHAZAR CAMPOS NO PERMITIDOS
    // --------------------------------------------------------

    for (const field of fields) {
        if (!ALLOWED_FIELDS.has(field)) {
            throw new InvalidPrivacyPreferencesError(
                `El campo "${field}" no está permitido.`,
            );
        }
    }

    // --------------------------------------------------------
    // VALIDAR LA AUDIENCIA
    // --------------------------------------------------------

    if (
        Object.hasOwn(body, 'audience')
        && !ALLOWED_AUDIENCES.has(body.audience)
    ) {
        throw new InvalidPrivacyPreferencesError(
            'La audiencia debe ser "members" o "private".',
        );
    }

    // --------------------------------------------------------
    // VALIDAR LOS CAMPOS BOOLEANOS
    // --------------------------------------------------------

    for (const field of BOOLEAN_FIELDS) {
        if (
            Object.hasOwn(body, field)
            && typeof body[field] !== 'boolean'
        ) {
            throw new InvalidPrivacyPreferencesError(
                `El campo "${field}" debe ser un booleano.`,
            );
        }
    }

    // --------------------------------------------------------
    // DEVOLVER ÚNICAMENTE LOS CAMPOS VALIDADOS
    // --------------------------------------------------------

    return Object.fromEntries(
        fields.map((field) => [field, body[field]]),
    );
};
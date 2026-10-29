
/**
 * Utilidades compartidas por Perfil y Vista pública.
 * No contienen componentes React.
 */

export const DEFAULT_PRIVACY_SETTINGS = {
    audience: 'members',
    showRoute: true,
    showAchievements: true,
    showLevel: false,
    showStreak: false,
};

export function getProfileUsername(user) {
    if (
        typeof user?.username === 'string' &&
        user.username.trim()
    ) {
        return user.username.trim().replace(/^@/, '');
    }

    return (
        String(user?.fullName || 'estudiante')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '') ||
        'estudiante'
    );
}

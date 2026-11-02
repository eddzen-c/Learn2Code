import { databasePool } from '../../../config/database.js';

// ============================================================
// LEARN2CODE - REPOSITORIO DE PREFERENCIAS DE PRIVACIDAD
// ============================================================

// ============================================================
// 1. CONSULTAR PREFERENCIAS DEL USUARIO
// ============================================================

export const findUserPrivacyPreferences = async ({
    userId,
    client = databasePool,
}) => {
    const result = await client.query(
        `
        SELECT
            audience,
            show_route AS "showRoute",
            show_achievements AS "showAchievements",
            show_level AS "showLevel",
            show_streak AS "showStreak"
        FROM user_privacy_preferences
        WHERE user_id = $1
        `,
        [userId],
    );

    return result.rows[0] ?? null;
};

// ============================================================
// 2. CREAR O ACTUALIZAR PREFERENCIAS
// ============================================================

export const upsertUserPrivacyPreferences = async ({
    userId,
    audience,
    showRoute,
    showAchievements,
    showLevel,
    showStreak,
    client = databasePool,
}) => {
    const result = await client.query(
        `
        INSERT INTO user_privacy_preferences (
            user_id,
            audience,
            show_route,
            show_achievements,
            show_level,
            show_streak
        )
        VALUES (
            $1, $2, $3, $4, $5, $6
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
            audience = EXCLUDED.audience,
            show_route = EXCLUDED.show_route,
            show_achievements = EXCLUDED.show_achievements,
            show_level = EXCLUDED.show_level,
            show_streak = EXCLUDED.show_streak
        RETURNING
            audience,
            show_route AS "showRoute",
            show_achievements AS "showAchievements",
            show_level AS "showLevel",
            show_streak AS "showStreak"
        `,
        [
            userId,
            audience,
            showRoute,
            showAchievements,
            showLevel,
            showStreak,
        ],
    );

    return result.rows[0] ?? null;
};
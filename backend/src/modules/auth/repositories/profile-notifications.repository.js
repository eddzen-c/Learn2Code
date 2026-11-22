import { databasePool } from '../../../config/database.js';

// ============================================================
// LEARN2CODE - PREFERENCIAS DE NOTIFICACIONES
// ============================================================

const PREFERENCES_COLUMNS = `
    mentions_web AS "mentionsWeb",
    mentions_email AS "mentionsEmail",
    projects_web AS "projectsWeb",
    projects_email AS "projectsEmail",
    achievements_web AS "achievementsWeb",
    achievements_email AS "achievementsEmail",
    community_web AS "communityWeb",
    community_email AS "communityEmail",
    courses_web AS "coursesWeb",
    courses_email AS "coursesEmail",
    weekly_summary AS "weeklySummary",
    study_reminder_enabled AS "studyReminderEnabled",
    reminder_time AS "reminderTime",
    reminder_frequency AS "reminderFrequency",
    reminder_channel AS "reminderChannel"
`;

// ============================================================
// CONSULTAR PREFERENCIAS
// ============================================================

export const findUserNotificationPreferences = async ({
    userId,
    client = databasePool,
}) => {
    const result = await client.query(
        `
        SELECT ${PREFERENCES_COLUMNS}
        FROM user_notification_preferences
        WHERE user_id = $1
        `,
        [userId],
    );

    return result.rows[0] ?? null;
};

// ============================================================
// CREAR O ACTUALIZAR PREFERENCIAS
// ============================================================

export const upsertUserNotificationPreferences = async ({
    userId,
    preferences,
    client = databasePool,
}) => {
    const {
        mentionsWeb,
        mentionsEmail,
        projectsWeb,
        projectsEmail,
        achievementsWeb,
        achievementsEmail,
        communityWeb,
        communityEmail,
        coursesWeb,
        coursesEmail,
        weeklySummary,
        studyReminderEnabled,
        reminderTime,
        reminderFrequency,
        reminderChannel,
    } = preferences;

    const result = await client.query(
        `
        INSERT INTO user_notification_preferences (
            user_id,
            mentions_web,
            mentions_email,
            projects_web,
            projects_email,
            achievements_web,
            achievements_email,
            community_web,
            community_email,
            courses_web,
            courses_email,
            weekly_summary,
            study_reminder_enabled,
            reminder_time,
            reminder_frequency,
            reminder_channel
        )
        VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8,
            $9, $10, $11, $12,
            $13, $14, $15, $16
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
            mentions_web = EXCLUDED.mentions_web,
            mentions_email = EXCLUDED.mentions_email,
            projects_web = EXCLUDED.projects_web,
            projects_email = EXCLUDED.projects_email,
            achievements_web = EXCLUDED.achievements_web,
            achievements_email = EXCLUDED.achievements_email,
            community_web = EXCLUDED.community_web,
            community_email = EXCLUDED.community_email,
            courses_web = EXCLUDED.courses_web,
            courses_email = EXCLUDED.courses_email,
            weekly_summary = EXCLUDED.weekly_summary,
            study_reminder_enabled =
                EXCLUDED.study_reminder_enabled,
            reminder_time = EXCLUDED.reminder_time,
            reminder_frequency = EXCLUDED.reminder_frequency,
            reminder_channel = EXCLUDED.reminder_channel
        RETURNING ${PREFERENCES_COLUMNS}
        `,
        [
            userId,
            mentionsWeb,
            mentionsEmail,
            projectsWeb,
            projectsEmail,
            achievementsWeb,
            achievementsEmail,
            communityWeb,
            communityEmail,
            coursesWeb,
            coursesEmail,
            weeklySummary,
            studyReminderEnabled,
            reminderTime,
            reminderFrequency,
            reminderChannel,
        ],
    );

    return result.rows[0] ?? null;
};
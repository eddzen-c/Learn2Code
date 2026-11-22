export const shorthands = undefined;

export async function up(pgm) {
    pgm.sql(`
        -- ====================================================
        -- 1. PREFERENCIAS DE NOTIFICACIONES
        -- ====================================================

        CREATE TABLE user_notification_preferences (
            user_id UUID PRIMARY KEY
                REFERENCES users(id)
                ON DELETE CASCADE,

            mentions_web BOOLEAN NOT NULL DEFAULT true,
            mentions_email BOOLEAN NOT NULL DEFAULT true,

            projects_web BOOLEAN NOT NULL DEFAULT true,
            projects_email BOOLEAN NOT NULL DEFAULT false,

            achievements_web BOOLEAN NOT NULL DEFAULT true,
            achievements_email BOOLEAN NOT NULL DEFAULT false,

            community_web BOOLEAN NOT NULL DEFAULT true,
            community_email BOOLEAN NOT NULL DEFAULT false,

            courses_web BOOLEAN NOT NULL DEFAULT false,
            courses_email BOOLEAN NOT NULL DEFAULT false,

            weekly_summary BOOLEAN NOT NULL DEFAULT false,

            study_reminder_enabled BOOLEAN NOT NULL DEFAULT true,

            reminder_time VARCHAR(5) NOT NULL DEFAULT '19:00',

            reminder_frequency VARCHAR(16)
                NOT NULL DEFAULT 'weekdays',

            reminder_channel VARCHAR(16)
                NOT NULL DEFAULT 'web',

            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

            CONSTRAINT chk_user_notification_reminder_time
                CHECK (
                    reminder_time IN (
                        '07:00',
                        '08:00',
                        '09:00',
                        '12:00',
                        '18:00',
                        '19:00',
                        '20:00'
                    )
                ),

            CONSTRAINT chk_user_notification_reminder_frequency
                CHECK (
                    reminder_frequency IN (
                        'weekdays',
                        'everyday',
                        'weekends'
                    )
                ),

            CONSTRAINT chk_user_notification_reminder_channel
                CHECK (
                    reminder_channel IN ('web')
                )
        );

        CREATE TRIGGER trg_user_notification_preferences_updated_at
            BEFORE UPDATE ON user_notification_preferences
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();


        -- ====================================================
        -- 2. PREFERENCIAS DE PRIVACIDAD
        -- ====================================================

        CREATE TABLE user_privacy_preferences (
            user_id UUID PRIMARY KEY
                REFERENCES users(id)
                ON DELETE CASCADE,

            audience VARCHAR(16)
                NOT NULL DEFAULT 'members',

            show_route BOOLEAN NOT NULL DEFAULT true,
            show_achievements BOOLEAN NOT NULL DEFAULT true,
            show_level BOOLEAN NOT NULL DEFAULT false,
            show_streak BOOLEAN NOT NULL DEFAULT false,

            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

            CONSTRAINT chk_user_privacy_audience
                CHECK (
                    audience IN (
                        'members',
                        'private'
                    )
                )
        );

        CREATE TRIGGER trg_user_privacy_preferences_updated_at
            BEFORE UPDATE ON user_privacy_preferences
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
    `);
}

export async function down(pgm) {
    pgm.sql(`
        DROP TABLE IF EXISTS user_privacy_preferences;

        DROP TABLE IF EXISTS user_notification_preferences;
    `);
}
export const shorthands = undefined;

export async function up(pgm) {
    pgm.sql(`
    CREATE TABLE user_xp (
        user_id UUID PRIMARY KEY
            REFERENCES users(id)
            ON DELETE CASCADE,

        total_xp INTEGER NOT NULL DEFAULT 0
            CHECK (total_xp >= 0),

        current_level_id SMALLINT
            REFERENCES levels(id)
            ON DELETE SET NULL,

        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TRIGGER trg_user_xp_updated_at
        BEFORE UPDATE ON user_xp
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    CREATE TABLE xp_transactions (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id     UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        amount      INTEGER NOT NULL
            CHECK (amount <> 0),

        reason      VARCHAR(100) NOT NULL,
        source_type VARCHAR(40),
        source_id   UUID,
        metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_xp_transactions_user
        ON xp_transactions(user_id, created_at DESC);

    CREATE INDEX idx_xp_transactions_source
        ON xp_transactions(source_type, source_id)
        WHERE source_id IS NOT NULL;

    CREATE TABLE user_badges (
        id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id   UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        badge_id  UUID NOT NULL
            REFERENCES badges(id)
            ON DELETE RESTRICT,

        earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        metadata  JSONB NOT NULL DEFAULT '{}'::jsonb,

        CONSTRAINT uq_user_badges
            UNIQUE (user_id, badge_id)
    );

    CREATE INDEX idx_user_badges_badge
        ON user_badges(badge_id);

    CREATE TABLE streaks (
        user_id UUID PRIMARY KEY
            REFERENCES users(id)
            ON DELETE CASCADE,

        current_streak   INTEGER NOT NULL DEFAULT 0
            CHECK (current_streak >= 0),

        longest_streak   INTEGER NOT NULL DEFAULT 0
            CHECK (longest_streak >= 0),

        last_active_date DATE,

        CONSTRAINT chk_streak_longest
            CHECK (longest_streak >= current_streak)
    );

    CREATE TABLE leaderboard_entries (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id       UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        rank_position INTEGER NOT NULL
            CHECK (rank_position > 0),

        score         INTEGER NOT NULL
            CHECK (score >= 0),

        period        VARCHAR(10) NOT NULL
            CHECK (
                period IN (
                    'weekly',
                    'monthly',
                    'all_time'
                )
            ),

        period_start  DATE NOT NULL,
        period_end    DATE,
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT uq_leaderboard_user_period
            UNIQUE (user_id, period, period_start),

        CONSTRAINT uq_leaderboard_rank_period
            UNIQUE (period, period_start, rank_position),

        CONSTRAINT chk_leaderboard_period_dates
            CHECK (
                period_end IS NULL
                OR period_end >= period_start
            )
    );

    CREATE INDEX idx_leaderboard_period_rank
        ON leaderboard_entries(
            period,
            period_start DESC,
            rank_position
        );
  `);
}

export async function down(pgm) {
    pgm.sql(`
    DROP TABLE IF EXISTS leaderboard_entries;
    DROP TABLE IF EXISTS streaks;
    DROP TABLE IF EXISTS user_badges;
    DROP TABLE IF EXISTS xp_transactions;
    DROP TABLE IF EXISTS user_xp;
  `);
}
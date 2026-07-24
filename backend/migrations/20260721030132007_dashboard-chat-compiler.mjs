export const shorthands = undefined;

export async function up(pgm) {
    pgm.sql(`
    CREATE TABLE user_progress_stats (
        user_id UUID PRIMARY KEY
            REFERENCES users(id)
            ON DELETE CASCADE,

        total_exercises_attempted INTEGER NOT NULL DEFAULT 0
            CHECK (total_exercises_attempted >= 0),

        total_exercises_solved INTEGER NOT NULL DEFAULT 0
            CHECK (total_exercises_solved >= 0),

        total_code_executions INTEGER NOT NULL DEFAULT 0
            CHECK (total_code_executions >= 0),

        last_activity_at TIMESTAMPTZ,
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT chk_progress_solved_attempted
            CHECK (
                total_exercises_solved
                <= total_exercises_attempted
            )
    );

    CREATE TRIGGER trg_user_progress_updated_at
        BEFORE UPDATE ON user_progress_stats
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    CREATE TABLE conversations (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,
        title           VARCHAR(150),
        status          VARCHAR(20) NOT NULL DEFAULT 'active'
            CHECK (status IN ('active', 'archived', 'deleted')),
        started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_message_at TIMESTAMPTZ,
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_conversations_user
        ON conversations(
            user_id,
            last_message_at DESC NULLS LAST
        );

    CREATE INDEX idx_conversations_active
        ON conversations(user_id)
        WHERE status = 'active';

    CREATE TRIGGER trg_conversations_updated_at
        BEFORE UPDATE ON conversations
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    CREATE TABLE messages (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL
            REFERENCES conversations(id)
            ON DELETE CASCADE,
        sender          VARCHAR(12) NOT NULL
            CHECK (
                sender IN (
                    'user',
                    'assistant',
                    'system',
                    'tool'
                )
            ),
        content         TEXT NOT NULL,
        model_name      VARCHAR(80),
        tokens_used     INTEGER
            CHECK (
                tokens_used IS NULL
                OR tokens_used >= 0
            ),
        metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT chk_message_content_not_blank
            CHECK (length(trim(content)) > 0)
    );

    CREATE INDEX idx_messages_conversation
        ON messages(conversation_id, created_at);

    CREATE TABLE code_executions (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id           UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,
        language_id       SMALLINT NOT NULL
            REFERENCES supported_languages(id)
            ON DELETE RESTRICT,
        source_code       TEXT NOT NULL,
        status            VARCHAR(20) NOT NULL DEFAULT 'queued'
            CHECK (
                status IN (
                    'queued',
                    'running',
                    'completed',
                    'failed',
                    'timed_out'
                )
            ),
        stdout            TEXT,
        stderr            TEXT,
        exit_code         INTEGER,
        execution_time_ms INTEGER
            CHECK (
                execution_time_ms IS NULL
                OR execution_time_ms >= 0
            ),
        memory_used_kb    INTEGER
            CHECK (
                memory_used_kb IS NULL
                OR memory_used_kb >= 0
            ),
        started_at        TIMESTAMPTZ,
        completed_at      TIMESTAMPTZ,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT chk_execution_completed_time
            CHECK (
                completed_at IS NULL
                OR started_at IS NULL
                OR completed_at >= started_at
            )
    );

    CREATE INDEX idx_executions_user
        ON code_executions(user_id, created_at DESC);

    CREATE INDEX idx_executions_status
        ON code_executions(status, created_at);
  `);
}

export async function down(pgm) {
    pgm.sql(`
    DROP TABLE IF EXISTS code_executions;
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS conversations;
    DROP TABLE IF EXISTS user_progress_stats;
  `);
}
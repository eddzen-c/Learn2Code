export const shorthands = undefined;

export async function up(pgm) {
    pgm.sql(`
    CREATE TABLE learning_profiles (
        user_id UUID PRIMARY KEY
            REFERENCES users(id)
            ON DELETE CASCADE,

        current_difficulty_id SMALLINT
            REFERENCES difficulty_levels(id)
            ON DELETE SET NULL,

        learning_style JSONB NOT NULL DEFAULT '{}'::jsonb,
        goals          JSONB NOT NULL DEFAULT '[]'::jsonb,

        preferred_pace VARCHAR(20)
            CHECK (
                preferred_pace IS NULL
                OR preferred_pace IN ('slow', 'normal', 'fast')
            ),

        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TRIGGER trg_learning_profiles_updated_at
        BEFORE UPDATE ON learning_profiles
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    CREATE TABLE knowledge_states (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        topic_id SMALLINT NOT NULL
            REFERENCES topics(id)
            ON DELETE RESTRICT,

        mastery_score NUMERIC(5,2) NOT NULL DEFAULT 0
            CHECK (mastery_score BETWEEN 0 AND 100),

        confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0
            CHECK (confidence_score BETWEEN 0 AND 100),

        attempts_count INTEGER NOT NULL DEFAULT 0
            CHECK (attempts_count >= 0),

        last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT uq_knowledge_user_topic
            UNIQUE (user_id, topic_id)
    );

    CREATE INDEX idx_knowledge_topic
        ON knowledge_states(topic_id, mastery_score);

    CREATE TABLE prompt_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        module VARCHAR(30) NOT NULL
            CHECK (
                module IN (
                    'chatbot',
                    'exercise_generator',
                    'feedback_generator'
                )
            ),

        version INTEGER NOT NULL
            CHECK (version > 0),

        content    TEXT NOT NULL,
        model_name VARCHAR(80),
        parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_active  BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT uq_prompt_module_version
            UNIQUE (module, version)
    );

    CREATE UNIQUE INDEX uq_prompt_versions_active
        ON prompt_versions(module)
        WHERE is_active;

    CREATE TABLE recommendations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        recommended_topic_id SMALLINT
            REFERENCES topics(id)
            ON DELETE SET NULL,

        recommended_exercise_id UUID
            REFERENCES exercises(id)
            ON DELETE SET NULL,

        reason       TEXT,
        shown_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        followed_at  TIMESTAMPTZ,
        dismissed_at TIMESTAMPTZ,
        metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,

        CONSTRAINT chk_recommendation_resolution CHECK (
            followed_at IS NULL
            OR dismissed_at IS NULL
        )
    );

    CREATE INDEX idx_recommendations_user
        ON recommendations(user_id, shown_at DESC);

    CREATE TABLE exercise_generation_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id UUID
            REFERENCES users(id)
            ON DELETE SET NULL,

        exercise_id UUID
            REFERENCES exercises(id)
            ON DELETE SET NULL,

        prompt_version_id UUID
            REFERENCES prompt_versions(id)
            ON DELETE SET NULL,

        model_name        VARCHAR(80),
        generation_params JSONB NOT NULL DEFAULT '{}'::jsonb,

        prompt_tokens INTEGER
            CHECK (
                prompt_tokens IS NULL
                OR prompt_tokens >= 0
            ),

        completion_tokens INTEGER
            CHECK (
                completion_tokens IS NULL
                OR completion_tokens >= 0
            ),

        latency_ms INTEGER
            CHECK (
                latency_ms IS NULL
                OR latency_ms >= 0
            ),

        success       BOOLEAN NOT NULL DEFAULT true,
        error_message TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_generation_logs_user
        ON exercise_generation_logs(user_id, created_at DESC);

    CREATE INDEX idx_generation_logs_exercise
        ON exercise_generation_logs(exercise_id);

    CREATE TABLE ai_usage_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id UUID
            REFERENCES users(id)
            ON DELETE SET NULL,

        request_id UUID UNIQUE,
        endpoint   VARCHAR(80) NOT NULL,
        model_name VARCHAR(80),

        prompt_tokens INTEGER NOT NULL DEFAULT 0
            CHECK (prompt_tokens >= 0),

        completion_tokens INTEGER NOT NULL DEFAULT 0
            CHECK (completion_tokens >= 0),

        total_tokens INTEGER NOT NULL DEFAULT 0
            CHECK (total_tokens >= 0),

        cost_amount NUMERIC(12,6) NOT NULL DEFAULT 0
            CHECK (cost_amount >= 0),

        cost_currency CHAR(3) NOT NULL DEFAULT 'USD',

        latency_ms INTEGER
            CHECK (
                latency_ms IS NULL
                OR latency_ms >= 0
            ),

        status VARCHAR(20) NOT NULL DEFAULT 'success'
            CHECK (status IN ('success', 'error', 'timeout')),

        error_code VARCHAR(80),
        metadata   JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT chk_ai_total_tokens
            CHECK (
                total_tokens
                = prompt_tokens + completion_tokens
            )
    );

    CREATE INDEX idx_ai_metrics_created
        ON ai_usage_metrics(created_at DESC);

    CREATE INDEX idx_ai_metrics_user
        ON ai_usage_metrics(user_id, created_at DESC);

    CREATE INDEX idx_ai_metrics_endpoint
        ON ai_usage_metrics(endpoint, created_at DESC);
  `);
}

export async function down(pgm) {
    pgm.sql(`
    DROP TABLE IF EXISTS ai_usage_metrics;
    DROP TABLE IF EXISTS exercise_generation_logs;
    DROP TABLE IF EXISTS recommendations;
    DROP TABLE IF EXISTS prompt_versions;
    DROP TABLE IF EXISTS knowledge_states;
    DROP TABLE IF EXISTS learning_profiles;
  `);
}
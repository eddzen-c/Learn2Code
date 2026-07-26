export const shorthands = undefined;

export async function up(pgm) {
    pgm.sql(`
    ALTER TABLE prompt_versions
        DROP CONSTRAINT IF EXISTS
        prompt_versions_module_check;

    ALTER TABLE prompt_versions
        ADD CONSTRAINT prompt_versions_module_check
        CHECK (
            module IN (
                'chatbot',
                'exercise_generator',
                'feedback_generator',
                'diagnostic_generator',
                'diagnostic_evaluator'
            )
        );

    CREATE TABLE diagnostic_assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        language_id SMALLINT NOT NULL
            REFERENCES supported_languages(id)
            ON DELETE RESTRICT,

        prompt_version_id UUID
            REFERENCES prompt_versions(id)
            ON DELETE SET NULL,

        attempt_number SMALLINT NOT NULL DEFAULT 1
            CHECK (attempt_number > 0),

        status VARCHAR(20) NOT NULL DEFAULT 'pending'
            CHECK (
                status IN (
                    'pending',
                    'generating',
                    'in_progress',
                    'evaluating',
                    'completed',
                    'failed',
                    'expired'
                )
            ),

        question_count SMALLINT NOT NULL DEFAULT 0
            CHECK (
                question_count BETWEEN 0 AND 20
            ),

        answered_count SMALLINT NOT NULL DEFAULT 0
            CHECK (
                answered_count >= 0
                AND answered_count <= question_count
            ),

        overall_score NUMERIC(5,2)
            CHECK (
                overall_score IS NULL
                OR overall_score BETWEEN 0 AND 100
            ),

        resulting_difficulty_id SMALLINT
            REFERENCES difficulty_levels(id)
            ON DELETE SET NULL,

        model_name VARCHAR(80),

        generation_metadata JSONB
            NOT NULL DEFAULT '{}'::jsonb,

        started_at   TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        expires_at   TIMESTAMPTZ,

        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT uq_diagnostic_user_attempt
            UNIQUE (user_id, attempt_number),

        CONSTRAINT uq_diagnostic_assessment_user
            UNIQUE (id, user_id),

        CONSTRAINT chk_diagnostic_dates
            CHECK (
                (
                    started_at IS NULL
                    OR started_at >= created_at
                )
                AND (
                    completed_at IS NULL
                    OR started_at IS NULL
                    OR completed_at >= started_at
                )
                AND (
                    expires_at IS NULL
                    OR expires_at > created_at
                )
            ),

        CONSTRAINT chk_completed_diagnostic
            CHECK (
                status <> 'completed'
                OR (
                    question_count > 0
                    AND answered_count = question_count
                    AND completed_at IS NOT NULL
                    AND overall_score IS NOT NULL
                    AND resulting_difficulty_id IS NOT NULL
                )
            )
    );

    CREATE UNIQUE INDEX uq_active_diagnostic_user
        ON diagnostic_assessments(user_id)
        WHERE status IN (
            'pending',
            'generating',
            'in_progress',
            'evaluating'
        );

    CREATE INDEX idx_diagnostic_user_created
        ON diagnostic_assessments(
            user_id,
            created_at DESC
        );

    CREATE INDEX idx_diagnostic_status
        ON diagnostic_assessments(
            status,
            created_at
        );

    CREATE TRIGGER trg_diagnostic_updated_at
        BEFORE UPDATE ON diagnostic_assessments
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    CREATE TABLE diagnostic_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        assessment_id UUID NOT NULL,
        user_id       UUID NOT NULL,

        topic_id SMALLINT NOT NULL
            REFERENCES topics(id)
            ON DELETE RESTRICT,

        difficulty_id SMALLINT NOT NULL
            REFERENCES difficulty_levels(id)
            ON DELETE RESTRICT,

        position SMALLINT NOT NULL
            CHECK (position > 0),

        question_type VARCHAR(20) NOT NULL
            CHECK (
                question_type IN (
                    'multiple_choice',
                    'code_output',
                    'coding'
                )
            ),

        prompt TEXT NOT NULL,

        options JSONB NOT NULL DEFAULT '[]'::jsonb
            CHECK (
                jsonb_typeof(options) = 'array'
            ),

        starter_code TEXT,

        expected_answer JSONB
            NOT NULL DEFAULT '{}'::jsonb,

        evaluation_criteria JSONB
            NOT NULL DEFAULT '{}'::jsonb,

        explanation TEXT,

        content_fingerprint CHAR(64) NOT NULL
            CHECK (
                content_fingerprint
                ~ '^[0-9a-f]{64}$'
            ),

        max_score NUMERIC(5,2) NOT NULL DEFAULT 100
            CHECK (
                max_score > 0
                AND max_score <= 100
            ),

        generation_metadata JSONB
            NOT NULL DEFAULT '{}'::jsonb,

        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT fk_diagnostic_question_assessment
            FOREIGN KEY (
                assessment_id,
                user_id
            )
            REFERENCES diagnostic_assessments(
                id,
                user_id
            )
            ON DELETE CASCADE,

        CONSTRAINT uq_diagnostic_question_position
            UNIQUE (
                assessment_id,
                position
            ),

        CONSTRAINT uq_diagnostic_user_fingerprint
            UNIQUE (
                user_id,
                content_fingerprint
            ),

        CONSTRAINT uq_diagnostic_question_user
            UNIQUE (
                id,
                user_id
            ),

        CONSTRAINT chk_diagnostic_prompt_not_blank
            CHECK (
                length(trim(prompt)) > 0
            )
    );

    CREATE INDEX idx_diagnostic_questions_assessment
        ON diagnostic_questions(
            assessment_id,
            position
        );

    CREATE INDEX idx_diagnostic_questions_topic
        ON diagnostic_questions(
            topic_id,
            difficulty_id
        );

    CREATE TABLE diagnostic_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        question_id UUID NOT NULL,
        user_id     UUID NOT NULL,

        answer JSONB NOT NULL DEFAULT '{}'::jsonb,
        submitted_code TEXT,

        status VARCHAR(20) NOT NULL DEFAULT 'submitted'
            CHECK (
                status IN (
                    'submitted',
                    'evaluating',
                    'evaluated',
                    'failed'
                )
            ),

        is_correct BOOLEAN,

        score NUMERIC(5,2)
            CHECK (
                score IS NULL
                OR score BETWEEN 0 AND 100
            ),

        feedback TEXT,

        evaluation_source VARCHAR(12)
            CHECK (
                evaluation_source IS NULL
                OR evaluation_source IN (
                    'automatic',
                    'ai',
                    'manual'
                )
            ),

        evaluation_prompt_version_id UUID
            REFERENCES prompt_versions(id)
            ON DELETE SET NULL,

        evaluation_metadata JSONB
            NOT NULL DEFAULT '{}'::jsonb,

        submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        evaluated_at TIMESTAMPTZ,

        CONSTRAINT fk_diagnostic_response_question
            FOREIGN KEY (
                question_id,
                user_id
            )
            REFERENCES diagnostic_questions(
                id,
                user_id
            )
            ON DELETE CASCADE,

        CONSTRAINT uq_diagnostic_response_question
            UNIQUE (question_id),

        CONSTRAINT chk_diagnostic_evaluation_date
            CHECK (
                evaluated_at IS NULL
                OR evaluated_at >= submitted_at
            ),

        CONSTRAINT chk_evaluated_diagnostic_response
            CHECK (
                status <> 'evaluated'
                OR (
                    evaluated_at IS NOT NULL
                    AND is_correct IS NOT NULL
                    AND score IS NOT NULL
                )
            )
    );

    CREATE INDEX idx_diagnostic_responses_user
        ON diagnostic_responses(
            user_id,
            submitted_at DESC
        );

    CREATE INDEX idx_diagnostic_responses_status
        ON diagnostic_responses(
            status,
            submitted_at
        );

    ALTER TABLE learning_profiles
        ADD COLUMN diagnostic_completed_at
            TIMESTAMPTZ,

        ADD COLUMN last_diagnostic_assessment_id
            UUID
            REFERENCES diagnostic_assessments(id)
            ON DELETE SET NULL;
  `);
}

export async function down(pgm) {
    pgm.sql(`
    ALTER TABLE learning_profiles
        DROP COLUMN IF EXISTS
            last_diagnostic_assessment_id,

        DROP COLUMN IF EXISTS
            diagnostic_completed_at;

    DROP TABLE IF EXISTS diagnostic_responses;
    DROP TABLE IF EXISTS diagnostic_questions;
    DROP TABLE IF EXISTS diagnostic_assessments;

    DELETE FROM prompt_versions
    WHERE module IN (
        'diagnostic_generator',
        'diagnostic_evaluator'
    );

    ALTER TABLE prompt_versions
        DROP CONSTRAINT IF EXISTS
        prompt_versions_module_check;

    ALTER TABLE prompt_versions
        ADD CONSTRAINT prompt_versions_module_check
        CHECK (
            module IN (
                'chatbot',
                'exercise_generator',
                'feedback_generator'
            )
        );
  `);
}
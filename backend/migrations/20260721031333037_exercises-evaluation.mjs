export const shorthands = undefined;

export async function up(pgm) {
    pgm.sql(`
    CREATE TABLE exercises (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic_id           SMALLINT NOT NULL
            REFERENCES topics(id) ON DELETE RESTRICT,
        difficulty_id      SMALLINT NOT NULL
            REFERENCES difficulty_levels(id) ON DELETE RESTRICT,
        language_id        SMALLINT NOT NULL
            REFERENCES supported_languages(id) ON DELETE RESTRICT,
        created_by_user_id UUID
            REFERENCES users(id) ON DELETE SET NULL,
        title              VARCHAR(150) NOT NULL,
        statement          TEXT NOT NULL,
        instructions       TEXT,
        starter_code       TEXT,
        solution_code      TEXT,
        estimated_minutes  SMALLINT
            CHECK (
                estimated_minutes IS NULL
                OR estimated_minutes > 0
            ),
        generation_source  VARCHAR(10) NOT NULL DEFAULT 'manual'
            CHECK (generation_source IN ('manual', 'ai')),
        status             VARCHAR(20) NOT NULL DEFAULT 'draft'
            CHECK (status IN ('draft', 'published', 'archived')),
        created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT chk_exercise_title_not_blank
            CHECK (length(trim(title)) > 0),

        CONSTRAINT chk_exercise_statement_not_blank
            CHECK (length(trim(statement)) > 0)
    );

    CREATE INDEX idx_exercises_topic_diff
        ON exercises(topic_id, difficulty_id);

    CREATE INDEX idx_exercises_language_status
        ON exercises(language_id, status);

    CREATE TRIGGER trg_exercises_updated_at
        BEFORE UPDATE ON exercises
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    CREATE TABLE exercise_test_cases (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exercise_id     UUID NOT NULL
            REFERENCES exercises(id) ON DELETE CASCADE,
        position        SMALLINT NOT NULL DEFAULT 1
            CHECK (position > 0),
        input           TEXT,
        expected_output TEXT NOT NULL,
        is_hidden       BOOLEAN NOT NULL DEFAULT false,
        weight          NUMERIC(5,2) NOT NULL DEFAULT 1
            CHECK (weight > 0),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT uq_test_case_position
            UNIQUE (exercise_id, position)
    );

    CREATE INDEX idx_test_cases_exercise
        ON exercise_test_cases(exercise_id, position);

    CREATE TABLE exercise_assignments (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID NOT NULL
            REFERENCES users(id) ON DELETE CASCADE,
        exercise_id  UUID NOT NULL
            REFERENCES exercises(id) ON DELETE CASCADE,
        source       VARCHAR(20) NOT NULL DEFAULT 'adaptive_ai'
            CHECK (
                source IN (
                    'adaptive_ai',
                    'manual',
                    'recommendation'
                )
            ),
        status       VARCHAR(20) NOT NULL DEFAULT 'assigned'
            CHECK (
                status IN (
                    'assigned',
                    'started',
                    'completed',
                    'skipped',
                    'expired'
                )
            ),
        assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        started_at   TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        expires_at   TIMESTAMPTZ,
        metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,

        CONSTRAINT chk_assignment_dates CHECK (
            (started_at IS NULL OR started_at >= assigned_at)
            AND (
                completed_at IS NULL
                OR completed_at >= assigned_at
            )
            AND (
                expires_at IS NULL
                OR expires_at > assigned_at
            )
        )
    );

    CREATE UNIQUE INDEX uq_active_assignment_user_exercise
        ON exercise_assignments(user_id, exercise_id)
        WHERE status IN ('assigned', 'started');

    CREATE INDEX idx_assignments_user_status
        ON exercise_assignments(
            user_id,
            status,
            assigned_at DESC
        );

    CREATE INDEX idx_assignments_exercise
        ON exercise_assignments(exercise_id);

    CREATE TABLE exercise_attempts (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id           UUID NOT NULL
            REFERENCES users(id) ON DELETE CASCADE,
        exercise_id       UUID NOT NULL
            REFERENCES exercises(id) ON DELETE RESTRICT,
        assignment_id     UUID
            REFERENCES exercise_assignments(id) ON DELETE SET NULL,
        language_id       SMALLINT NOT NULL
            REFERENCES supported_languages(id) ON DELETE RESTRICT,
        submitted_code    TEXT NOT NULL,
        status            VARCHAR(20) NOT NULL DEFAULT 'submitted'
            CHECK (
                status IN (
                    'submitted',
                    'evaluating',
                    'completed',
                    'failed',
                    'timed_out'
                )
            ),
        passed            BOOLEAN,
        score             NUMERIC(5,2)
            CHECK (score IS NULL OR score BETWEEN 0 AND 100),
        tests_passed      INTEGER
            CHECK (tests_passed IS NULL OR tests_passed >= 0),
        tests_total       INTEGER
            CHECK (tests_total IS NULL OR tests_total >= 0),
        execution_time_ms INTEGER
            CHECK (
                execution_time_ms IS NULL
                OR execution_time_ms >= 0
            ),
        feedback          TEXT,
        attempted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        completed_at      TIMESTAMPTZ,

        CONSTRAINT chk_attempt_test_counts CHECK (
            tests_passed IS NULL
            OR tests_total IS NULL
            OR tests_passed <= tests_total
        ),

        CONSTRAINT chk_attempt_completed_at CHECK (
            completed_at IS NULL
            OR completed_at >= attempted_at
        )
    );

    CREATE INDEX idx_attempts_user_exercise
        ON exercise_attempts(
            user_id,
            exercise_id,
            attempted_at DESC
        );

    CREATE INDEX idx_attempts_assignment
        ON exercise_attempts(assignment_id)
        WHERE assignment_id IS NOT NULL;

    CREATE INDEX idx_attempts_status
        ON exercise_attempts(status, attempted_at);

    CREATE TABLE exercise_attempt_results (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        attempt_id        UUID NOT NULL
            REFERENCES exercise_attempts(id) ON DELETE CASCADE,
        test_case_id      UUID NOT NULL
            REFERENCES exercise_test_cases(id) ON DELETE RESTRICT,
        passed            BOOLEAN NOT NULL,
        actual_output     TEXT,
        error_message     TEXT,
        execution_time_ms INTEGER
            CHECK (
                execution_time_ms IS NULL
                OR execution_time_ms >= 0
            ),
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT uq_attempt_test_case
            UNIQUE (attempt_id, test_case_id)
    );

    CREATE INDEX idx_attempt_results_attempt
        ON exercise_attempt_results(attempt_id);
  `);
}

export async function down(pgm) {
    pgm.sql(`
    DROP TABLE IF EXISTS exercise_attempt_results;
    DROP TABLE IF EXISTS exercise_attempts;
    DROP TABLE IF EXISTS exercise_assignments;
    DROP TABLE IF EXISTS exercise_test_cases;
    DROP TABLE IF EXISTS exercises;
  `);
}
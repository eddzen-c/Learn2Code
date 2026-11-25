
export const shorthands = undefined;

export const up = (pgm) => {
    pgm.sql(`
        CREATE TABLE academic_competencies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(100) NOT NULL UNIQUE
                CHECK (length(btrim(code)) > 0),
            title VARCHAR(160) NOT NULL
                CHECK (length(btrim(title)) > 0),
            description TEXT NOT NULL DEFAULT '',
            status VARCHAR(20) NOT NULL DEFAULT 'draft'
                CHECK (
                    status IN (
                        'draft',
                        'published',
                        'archived'
                    )
                ),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE academic_unit_competencies (
            unit_id UUID NOT NULL
                REFERENCES academic_units(id)
                ON DELETE RESTRICT,
            competency_id UUID NOT NULL
                REFERENCES academic_competencies(id)
                ON DELETE RESTRICT,
            position SMALLINT NOT NULL
                CHECK (position > 0),
            PRIMARY KEY (unit_id, competency_id),
            CONSTRAINT uq_academic_unit_competency_position
                UNIQUE (unit_id, position)
        );

        CREATE TABLE academic_unit_topics (
            unit_id UUID NOT NULL
                REFERENCES academic_units(id)
                ON DELETE RESTRICT,
            topic_id SMALLINT NOT NULL
                REFERENCES topics(id)
                ON DELETE RESTRICT,
            PRIMARY KEY (unit_id, topic_id)
        );

        CREATE TABLE academic_unit_exercises (
            unit_id UUID NOT NULL
                REFERENCES academic_units(id)
                ON DELETE RESTRICT,
            exercise_id UUID NOT NULL
                REFERENCES exercises(id)
                ON DELETE RESTRICT,
            position SMALLINT NOT NULL
                CHECK (position > 0),
            PRIMARY KEY (unit_id, exercise_id),
            CONSTRAINT uq_academic_unit_exercise_position
                UNIQUE (unit_id, position)
        );

        ALTER TABLE exercise_assignments
            ADD COLUMN academic_unit_id UUID
                REFERENCES academic_units(id)
                ON DELETE RESTRICT;

        CREATE INDEX idx_academic_unit_competencies_competency
            ON academic_unit_competencies(competency_id);

        CREATE INDEX idx_academic_unit_topics_topic
            ON academic_unit_topics(topic_id);

        CREATE INDEX idx_academic_unit_exercises_exercise
            ON academic_unit_exercises(exercise_id);

        CREATE INDEX idx_exercise_assignments_academic_unit
            ON exercise_assignments(
                user_id,
                academic_unit_id,
                assigned_at DESC
            )
            WHERE academic_unit_id IS NOT NULL;

        CREATE TRIGGER trg_academic_competencies_updated_at
            BEFORE UPDATE ON academic_competencies
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        DROP INDEX idx_exercise_assignments_academic_unit;

        ALTER TABLE exercise_assignments
            DROP COLUMN academic_unit_id;

        DROP TABLE academic_unit_exercises;
        DROP TABLE academic_unit_topics;
        DROP TABLE academic_unit_competencies;
        DROP TABLE academic_competencies;
    `);
};

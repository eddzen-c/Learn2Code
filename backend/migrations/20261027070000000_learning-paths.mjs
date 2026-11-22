
export const shorthands = undefined;

/**
 * Rutas de aprendizaje personalizadas.
 *
 * Cada ruta pertenece a un estudiante y se vincula
 * al diagnóstico completado que la originó.
 */
export const up = (pgm) => {
    pgm.sql(`
        CREATE TABLE learning_paths (
            id UUID PRIMARY KEY
                DEFAULT gen_random_uuid(),

            user_id UUID NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            diagnostic_assessment_id UUID NOT NULL,

            language_id SMALLINT NOT NULL
                REFERENCES supported_languages(id)
                ON DELETE RESTRICT,

            difficulty_id SMALLINT NOT NULL
                REFERENCES difficulty_levels(id)
                ON DELETE RESTRICT,

            title VARCHAR(160) NOT NULL,

            description TEXT NOT NULL
                DEFAULT '',

            status VARCHAR(20) NOT NULL
                DEFAULT 'active'
                CHECK (
                    status IN (
                        'active',
                        'completed'
                    )
                ),

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT now(),

            updated_at TIMESTAMPTZ NOT NULL
                DEFAULT now(),

            CONSTRAINT fk_learning_path_diagnostic
                FOREIGN KEY (
                    diagnostic_assessment_id,
                    user_id
                )
                REFERENCES diagnostic_assessments(
                    id,
                    user_id
                )
                ON DELETE CASCADE,

            CONSTRAINT uq_learning_path_diagnostic
                UNIQUE (
                    user_id,
                    diagnostic_assessment_id
                ),

            CONSTRAINT chk_learning_path_title
                CHECK (
                    length(btrim(title)) > 0
                )
        );

        CREATE INDEX idx_learning_paths_user
            ON learning_paths(
                user_id,
                created_at DESC
            );

        CREATE TRIGGER trg_learning_paths_updated_at
            BEFORE UPDATE ON learning_paths
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();


        CREATE TABLE learning_path_steps (
            id UUID PRIMARY KEY
                DEFAULT gen_random_uuid(),

            path_id UUID NOT NULL
                REFERENCES learning_paths(id)
                ON DELETE CASCADE,

            topic_id SMALLINT NOT NULL
                REFERENCES topics(id)
                ON DELETE RESTRICT,

            position SMALLINT NOT NULL
                CHECK (position > 0),

            title VARCHAR(150) NOT NULL,

            description TEXT NOT NULL
                DEFAULT '',

            status VARCHAR(20) NOT NULL
                DEFAULT 'pending'
                CHECK (
                    status IN (
                        'pending',
                        'in_progress',
                        'completed'
                    )
                ),

            completed_at TIMESTAMPTZ,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT now(),

            updated_at TIMESTAMPTZ NOT NULL
                DEFAULT now(),

            CONSTRAINT uq_learning_path_step_position
                UNIQUE (
                    path_id,
                    position
                ),

            CONSTRAINT chk_learning_path_step_title
                CHECK (
                    length(btrim(title)) > 0
                )
        );

        CREATE INDEX idx_learning_path_steps_path
            ON learning_path_steps(
                path_id,
                position
            );

        CREATE INDEX idx_learning_path_steps_topic
            ON learning_path_steps(topic_id);

        CREATE TRIGGER trg_learning_path_steps_updated_at
            BEFORE UPDATE ON learning_path_steps
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
    `);
};

/**
 * Reversión de esta migración.
 * No ejecutar sobre datos que se quieran conservar.
 */
export const down = (pgm) => {
    pgm.sql(`
        DROP TABLE IF EXISTS learning_path_steps;
        DROP TABLE IF EXISTS learning_paths;
    `);
};

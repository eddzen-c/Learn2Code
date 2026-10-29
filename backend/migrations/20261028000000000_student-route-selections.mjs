
export const shorthands = undefined;

/**
 * Registra la especialización elegida explícitamente
 * por el estudiante.
 *
 * Es independiente de la recomendación de OpenAI.
 * No representa progreso académico ni lecciones cursadas.
 */
export const up = (pgm) => {
    pgm.sql(`
        CREATE TABLE student_route_selections (
            user_id UUID PRIMARY KEY
                REFERENCES users(id)
                ON DELETE CASCADE,

            specialization_key VARCHAR(20) NOT NULL
                CHECK (
                    specialization_key IN (
                        'frontend',
                        'backend',
                        'fullstack',
                        'devops'
                    )
                ),

            selected_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            updated_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW()
        );

        CREATE INDEX idx_student_route_selections_specialization
            ON student_route_selections (
                specialization_key
            );
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        DROP TABLE IF EXISTS student_route_selections;
    `);
};
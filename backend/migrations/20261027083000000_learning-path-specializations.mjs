
export const shorthands = undefined;

/**
 * Especialización profesional del plan recomendado.
 *
 * Valores permitidos:
 * frontend, backend, fullstack, devops.
 *
 * confirmed_at registra cuándo el estudiante
 * aceptó su plan de aprendizaje.
 */

export const up = (pgm) => {
    pgm.sql(`
        ALTER TABLE learning_paths
            ADD COLUMN specialization_key
                VARCHAR(20),

            ADD COLUMN confirmed_at
                TIMESTAMPTZ;

        ALTER TABLE learning_paths
            ADD CONSTRAINT
                chk_learning_path_specialization
            CHECK (
                specialization_key IN (
                    'frontend',
                    'backend',
                    'fullstack',
                    'devops'
                )
            );

        CREATE INDEX idx_learning_paths_specialization
            ON learning_paths(specialization_key)
            WHERE specialization_key IS NOT NULL;
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        DROP INDEX IF EXISTS
            idx_learning_paths_specialization;

        ALTER TABLE learning_paths
            DROP CONSTRAINT IF EXISTS
                chk_learning_path_specialization;

        ALTER TABLE learning_paths
            DROP COLUMN IF EXISTS confirmed_at,
            DROP COLUMN IF EXISTS specialization_key;
    `);
};

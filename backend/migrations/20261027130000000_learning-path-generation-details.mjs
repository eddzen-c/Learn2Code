
export const shorthands = undefined;

/**
 * Información adicional del plan generado por IA.
 *
 * No modifica diagnósticos ni respuestas.
 */
export const up = (pgm) => {
    pgm.sql(`
        ALTER TABLE learning_paths
            ADD COLUMN reason TEXT NOT NULL
                DEFAULT '',

            ADD COLUMN estimated_weeks SMALLINT
                CHECK (
                    estimated_weeks IS NULL
                    OR estimated_weeks BETWEEN 1 AND 52
                ),

            ADD COLUMN generation_metadata JSONB
                NOT NULL DEFAULT '{}'::jsonb;
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        ALTER TABLE learning_paths
            DROP COLUMN IF EXISTS generation_metadata,
            DROP COLUMN IF EXISTS estimated_weeks,
            DROP COLUMN IF EXISTS reason;
    `);
};

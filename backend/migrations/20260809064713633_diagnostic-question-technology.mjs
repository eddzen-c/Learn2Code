/**
 * @type {
 *     import('node-pg-migrate')
 *         .ColumnDefinitions
 *     | undefined
 * }
 */
export const shorthands = undefined;

/**
 * @param {
 *     import('node-pg-migrate')
 *         .MigrationBuilder
 * } pgm
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.sql(`
        ALTER TABLE diagnostic_questions
        ADD COLUMN technology_key VARCHAR(40);

        ALTER TABLE diagnostic_questions
        ADD CONSTRAINT
            diagnostic_questions_technology_key_check
        CHECK (
            technology_key IS NULL
            OR technology_key IN (
                'javascript',
                'python',
                'react',
                'html_css',
                'nodejs',
                'typescript',
                'java',
                'sql',
                'other'
            )
        );

        CREATE INDEX
            idx_diagnostic_questions_assessment_technology
        ON diagnostic_questions (
            assessment_id,
            technology_key
        );
    `);
};

/**
 * @param {
 *     import('node-pg-migrate')
 *         .MigrationBuilder
 * } pgm
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.sql(`
        DROP INDEX IF EXISTS
            idx_diagnostic_questions_assessment_technology;

        ALTER TABLE diagnostic_questions
        DROP CONSTRAINT IF EXISTS
            diagnostic_questions_technology_key_check;

        ALTER TABLE diagnostic_questions
        DROP COLUMN IF EXISTS technology_key;
    `);
};
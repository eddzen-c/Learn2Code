export async function up(pgm) {
    pgm.sql(`
        CREATE UNIQUE INDEX
            uq_xp_transactions_exercise_assignment
        ON xp_transactions (
            user_id,
            source_type,
            source_id
        )
        WHERE source_type = 'exercise_assignment'
            AND source_id IS NOT NULL;
    `);
}

export async function down(pgm) {
    pgm.sql(`
        DROP INDEX IF EXISTS
            uq_xp_transactions_exercise_assignment;
    `);
}
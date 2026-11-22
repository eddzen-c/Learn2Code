
export const shorthands = undefined;

export async function up(pgm) {
    pgm.sql(`
        ALTER TABLE users
            ADD COLUMN username VARCHAR(40),
            ADD COLUMN bio VARCHAR(300),
            ADD COLUMN github_url VARCHAR(500),
            ADD COLUMN portfolio_url VARCHAR(500);

        ALTER TABLE users
            ADD CONSTRAINT chk_users_username_format
            CHECK (
                username IS NULL
                OR username ~ '^[a-z0-9_]{3,40}$'
            );

        CREATE UNIQUE INDEX uq_users_username
            ON users (LOWER(username))
            WHERE username IS NOT NULL;
    `);
}

export async function down(pgm) {
    pgm.sql(`
        DROP INDEX IF EXISTS uq_users_username;

        ALTER TABLE users
            DROP CONSTRAINT IF EXISTS
                chk_users_username_format;

        ALTER TABLE users
            DROP COLUMN IF EXISTS portfolio_url,
            DROP COLUMN IF EXISTS github_url,
            DROP COLUMN IF EXISTS bio,
            DROP COLUMN IF EXISTS username;
    `);
}

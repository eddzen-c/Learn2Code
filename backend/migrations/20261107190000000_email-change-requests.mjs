export const shorthands = undefined;

export async function up(pgm) {
    pgm.sql(`
        CREATE TABLE email_change_requests (
            user_id UUID PRIMARY KEY
                REFERENCES users(id)
                ON DELETE CASCADE,

            new_email CITEXT NOT NULL,

            code_hash VARCHAR(64) NOT NULL,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            expires_at TIMESTAMPTZ NOT NULL,

            used_at TIMESTAMPTZ,

            failed_attempts SMALLINT NOT NULL
                DEFAULT 0,

            CONSTRAINT chk_email_change_address
                CHECK (
                    LENGTH(TRIM(new_email::text)) > 3
                ),

            CONSTRAINT chk_email_change_code_hash
                CHECK (
                    code_hash ~ '^[0-9a-f]{64}$'
                ),

            CONSTRAINT chk_email_change_attempts
                CHECK (
                    failed_attempts BETWEEN 0 AND 5
                ),

            CONSTRAINT chk_email_change_expiration
                CHECK (
                    expires_at > created_at
                ),

            CONSTRAINT chk_email_change_usage
                CHECK (
                    used_at IS NULL
                    OR used_at >= created_at
                )
        );

        CREATE INDEX idx_email_change_requests_expiration
            ON email_change_requests(expires_at);
    `);
}

export async function down(pgm) {
    pgm.sql(`
        DROP TABLE IF EXISTS email_change_requests;
    `);
}
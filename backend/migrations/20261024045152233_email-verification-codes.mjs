export const shorthands = undefined

export async function up(pgm) {
    pgm.sql(`
    CREATE TABLE email_verification_codes (
        user_id UUID PRIMARY KEY
        REFERENCES users(id)
        ON DELETE CASCADE,

        code_hash VARCHAR(64) NOT NULL,

        created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

        expires_at TIMESTAMPTZ NOT NULL,

        used_at TIMESTAMPTZ,

        failed_attempts SMALLINT NOT NULL
        DEFAULT 0,

        CONSTRAINT chk_email_code_hash
        CHECK (
            code_hash ~ '^[0-9a-f]{64}$'
        ),

        CONSTRAINT chk_email_code_attempts
        CHECK (
            failed_attempts BETWEEN 0 AND 5
        ),

        CONSTRAINT chk_email_code_expiration
        CHECK (
            expires_at > created_at
        ),

        CONSTRAINT chk_email_code_usage
        CHECK (
            used_at IS NULL
            OR used_at >= created_at
        )
    );

    CREATE INDEX idx_email_verification_codes_expiration
        ON email_verification_codes(expires_at);
    `)
}

export async function down(pgm) {
    pgm.sql(`
    DROP TABLE IF EXISTS email_verification_codes;
    `)
}

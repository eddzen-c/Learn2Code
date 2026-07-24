export const shorthands = undefined;

export async function up(pgm) {
    pgm.sql(`
    CREATE TABLE users (
        id                                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name                         VARCHAR(150) NOT NULL,
        email                             CITEXT UNIQUE NOT NULL,
        password_hash                     VARCHAR(255) NOT NULL,
        avatar_url                        TEXT,
        preferred_locale                  VARCHAR(10) NOT NULL DEFAULT 'es-MX',
        preferred_programming_language_id SMALLINT
            REFERENCES supported_languages(id)
            ON DELETE SET NULL,
        email_verified_at                 TIMESTAMPTZ,
        last_login_at                     TIMESTAMPTZ,
        is_active                         BOOLEAN NOT NULL DEFAULT true,
        deleted_at                        TIMESTAMPTZ,
        created_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT chk_users_email_not_blank
            CHECK (length(trim(email::text)) > 3),

        CONSTRAINT chk_users_name_not_blank
            CHECK (length(trim(full_name)) > 0)
    );

    CREATE INDEX idx_users_active
        ON users(is_active)
        WHERE deleted_at IS NULL;

    CREATE INDEX idx_users_preferred_language
        ON users(preferred_programming_language_id);

    CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    CREATE TABLE user_roles (
        user_id     UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        role_id     SMALLINT NOT NULL
            REFERENCES roles(id)
            ON DELETE RESTRICT,

        assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),

        PRIMARY KEY (user_id, role_id)
    );

    CREATE INDEX idx_user_roles_role
        ON user_roles(role_id);

    CREATE TABLE refresh_tokens (
        id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id              UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,
        token_hash           VARCHAR(255) UNIQUE NOT NULL,
        expires_at           TIMESTAMPTZ NOT NULL,
        revoked_at           TIMESTAMPTZ,
        replaced_by_token_id UUID
            REFERENCES refresh_tokens(id)
            ON DELETE SET NULL,
        created_by_ip        INET,
        revoked_by_ip        INET,
        user_agent           TEXT,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT chk_refresh_expiration
            CHECK (expires_at > created_at),

        CONSTRAINT chk_refresh_revocation
            CHECK (
                revoked_at IS NULL
                OR revoked_at >= created_at
            )
    );

    CREATE INDEX idx_refresh_tokens_user
        ON refresh_tokens(user_id, expires_at DESC);

    CREATE INDEX idx_refresh_tokens_active
        ON refresh_tokens(user_id)
        WHERE revoked_at IS NULL;

    CREATE TABLE password_reset_requests (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id          UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,
        reset_token_hash VARCHAR(255) UNIQUE NOT NULL,
        expires_at       TIMESTAMPTZ NOT NULL,
        used_at          TIMESTAMPTZ,
        requested_ip     INET,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT chk_password_reset_expiration
            CHECK (expires_at > created_at),

        CONSTRAINT chk_password_reset_used
            CHECK (
                used_at IS NULL
                OR used_at >= created_at
            )
    );

    CREATE INDEX idx_password_reset_user
        ON password_reset_requests(user_id, created_at DESC);

    CREATE INDEX idx_password_reset_active
        ON password_reset_requests(user_id)
        WHERE used_at IS NULL;

    CREATE TABLE email_verification_tokens (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,
        token_hash  VARCHAR(255) UNIQUE NOT NULL,
        expires_at  TIMESTAMPTZ NOT NULL,
        verified_at TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT chk_email_token_expiration
            CHECK (expires_at > created_at),

        CONSTRAINT chk_email_token_verified
            CHECK (
                verified_at IS NULL
                OR verified_at >= created_at
            )
    );

    CREATE INDEX idx_email_verification_user
        ON email_verification_tokens(user_id, created_at DESC);

    CREATE INDEX idx_email_verification_active
        ON email_verification_tokens(user_id)
        WHERE verified_at IS NULL;
  `);
}

export async function down(pgm) {
    pgm.sql(`
    DROP TABLE IF EXISTS email_verification_tokens;
    DROP TABLE IF EXISTS password_reset_requests;
    DROP TABLE IF EXISTS refresh_tokens;
    DROP TABLE IF EXISTS user_roles;
    DROP TABLE IF EXISTS users;
  `);
}
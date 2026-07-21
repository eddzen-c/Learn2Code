export const shorthands = undefined;

export async function up(pgm) {
    pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE EXTENSION IF NOT EXISTS citext;

    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$;

    CREATE TABLE roles (
        id          SMALLINT PRIMARY KEY,
        name        VARCHAR(30) UNIQUE NOT NULL,
        description TEXT
    );

    CREATE TABLE difficulty_levels (
        id   SMALLINT PRIMARY KEY,
        name VARCHAR(20) UNIQUE NOT NULL
            CHECK (name IN ('básico', 'intermedio', 'avanzado'))
    );

    CREATE TABLE supported_languages (
        id             SMALLINT PRIMARY KEY,
        name           VARCHAR(30) UNIQUE NOT NULL,
        file_extension VARCHAR(10) UNIQUE NOT NULL,
        sandbox_image  VARCHAR(150) NOT NULL,
        is_active      BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE topics (
        id          SMALLINT PRIMARY KEY,
        name        VARCHAR(80) UNIQUE NOT NULL,
        description TEXT,
        is_active   BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE levels (
        id     SMALLINT PRIMARY KEY,
        name   VARCHAR(50) UNIQUE NOT NULL,
        min_xp INTEGER UNIQUE NOT NULL CHECK (min_xp >= 0)
    );

    CREATE TABLE badges (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name           VARCHAR(80) UNIQUE NOT NULL,
        description    TEXT,
        icon_url       TEXT,
        criteria_type  VARCHAR(40) NOT NULL,
        criteria_value JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_active      BOOLEAN NOT NULL DEFAULT true,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE plans (
        id                         SMALLINT PRIMARY KEY,
        name                       VARCHAR(30) UNIQUE NOT NULL
            CHECK (name IN ('free', 'pro', 'institutional')),
        price_amount               NUMERIC(10,2) NOT NULL DEFAULT 0
            CHECK (price_amount >= 0),
        currency                   CHAR(3) NOT NULL DEFAULT 'MXN',
        monthly_chat_limit         INTEGER
            CHECK (
                monthly_chat_limit IS NULL
                OR monthly_chat_limit >= 0
            ),
        monthly_ai_exercise_limit  INTEGER
            CHECK (
                monthly_ai_exercise_limit IS NULL
                OR monthly_ai_exercise_limit >= 0
            ),
        is_active                  BOOLEAN NOT NULL DEFAULT true,
        created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

export async function down(pgm) {
    pgm.sql(`
    DROP TABLE IF EXISTS plans;
    DROP TABLE IF EXISTS badges;
    DROP TABLE IF EXISTS levels;
    DROP TABLE IF EXISTS topics;
    DROP TABLE IF EXISTS supported_languages;
    DROP TABLE IF EXISTS difficulty_levels;
    DROP TABLE IF EXISTS roles;

    DROP FUNCTION IF EXISTS set_updated_at();

    DROP EXTENSION IF EXISTS citext;
    DROP EXTENSION IF EXISTS pgcrypto;
  `);
}
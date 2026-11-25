
export const shorthands = undefined;

export const up = (pgm) => {
    pgm.sql(`
        CREATE TABLE academic_specializations (
            key VARCHAR(20) PRIMARY KEY
                CHECK (
                    key IN (
                        'frontend',
                        'backend',
                        'fullstack',
                        'devops'
                    )
                ),
            name VARCHAR(100) NOT NULL
                CHECK (length(btrim(name)) > 0),
            position SMALLINT NOT NULL UNIQUE
                CHECK (position > 0),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE academic_stages (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            specialization_key VARCHAR(20) NOT NULL
                REFERENCES academic_specializations(key)
                ON DELETE RESTRICT,
            position SMALLINT NOT NULL
                CHECK (position > 0),
            title VARCHAR(150) NOT NULL
                CHECK (length(btrim(title)) > 0),
            status VARCHAR(20) NOT NULL DEFAULT 'planned'
                CHECK (
                    status IN (
                        'planned',
                        'published',
                        'archived'
                    )
                ),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_academic_stage_position
                UNIQUE (specialization_key, position),
            CONSTRAINT uq_academic_stage_title
                UNIQUE (specialization_key, title)
        );

        CREATE TABLE academic_modules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            stage_id BIGINT NOT NULL
                REFERENCES academic_stages(id)
                ON DELETE RESTRICT,
            code VARCHAR(100) NOT NULL UNIQUE
                CHECK (length(btrim(code)) > 0),
            position SMALLINT NOT NULL
                CHECK (position > 0),
            title VARCHAR(160) NOT NULL
                CHECK (length(btrim(title)) > 0),
            description TEXT NOT NULL DEFAULT '',
            status VARCHAR(20) NOT NULL DEFAULT 'draft'
                CHECK (
                    status IN (
                        'draft',
                        'published',
                        'archived'
                    )
                ),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_academic_module_position
                UNIQUE (stage_id, position)
        );

        CREATE TABLE academic_units (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            module_id UUID NOT NULL
                REFERENCES academic_modules(id)
                ON DELETE RESTRICT,
            code VARCHAR(100) NOT NULL UNIQUE
                CHECK (length(btrim(code)) > 0),
            position SMALLINT NOT NULL
                CHECK (position > 0),
            title VARCHAR(160) NOT NULL
                CHECK (length(btrim(title)) > 0),
            description TEXT NOT NULL DEFAULT '',
            status VARCHAR(20) NOT NULL DEFAULT 'draft'
                CHECK (
                    status IN (
                        'draft',
                        'published',
                        'archived'
                    )
                ),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_academic_unit_position
                UNIQUE (module_id, position)
        );

        CREATE INDEX idx_academic_modules_stage_status
            ON academic_modules(stage_id, status);

        CREATE INDEX idx_academic_units_module_status
            ON academic_units(module_id, status);

        CREATE TRIGGER trg_academic_specializations_updated_at
            BEFORE UPDATE ON academic_specializations
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();

        CREATE TRIGGER trg_academic_stages_updated_at
            BEFORE UPDATE ON academic_stages
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();

        CREATE TRIGGER trg_academic_modules_updated_at
            BEFORE UPDATE ON academic_modules
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();

        CREATE TRIGGER trg_academic_units_updated_at
            BEFORE UPDATE ON academic_units
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();

        INSERT INTO academic_specializations
            (key, name, position)
        VALUES
            ('frontend', 'Desarrollo Frontend', 1),
            ('backend', 'Desarrollo Backend', 2),
            ('fullstack', 'Desarrollo Full Stack', 3),
            ('devops', 'DevOps', 4);

        INSERT INTO academic_stages
            (specialization_key, position, title)
        VALUES
            ('frontend', 1, 'Fundamentos Web'),
            ('frontend', 2, 'UI con React'),
            ('frontend', 3, 'Estado y Rutas'),
            ('frontend', 4, 'Buenas Prácticas'),
            ('frontend', 5, 'Proyecto Final'),

            ('backend', 1, 'Fundamentos Backend'),
            ('backend', 2, 'APIs con Node.js'),
            ('backend', 3, 'Bases de Datos'),
            ('backend', 4, 'Autenticación y Seguridad'),
            ('backend', 5, 'Proyecto Final'),

            ('fullstack', 1, 'Frontend Avanzado'),
            ('fullstack', 2, 'Backend con Node.js'),
            ('fullstack', 3, 'Integración Full Stack'),
            ('fullstack', 4, 'Testing y Despliegue'),
            ('fullstack', 5, 'Proyecto Final'),

            ('devops', 1, 'Fundamentos DevOps'),
            ('devops', 2, 'Contenedores con Docker'),
            ('devops', 3, 'CI/CD con GitHub Actions'),
            ('devops', 4, 'Cloud con AWS'),
            ('devops', 5, 'Proyecto Final');
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        DROP TABLE academic_units;
        DROP TABLE academic_modules;
        DROP TABLE academic_stages;
        DROP TABLE academic_specializations;
    `);
};

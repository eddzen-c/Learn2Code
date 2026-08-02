export const shorthands = undefined;

export async function up(pgm) {
    pgm.sql(`
        ALTER TABLE badges
        ADD CONSTRAINT badges_criteria_type_check
        CHECK (
            criteria_type IN (
                'exercises_completed',
                'total_xp',
                'current_level',
                'current_streak'
            )
        );

        INSERT INTO badges (
            name,
            description,
            criteria_type,
            criteria_value
        )
        VALUES
            (
                'Primer paso',
                'Completa tu primer ejercicio personalizado.',
                'exercises_completed',
                '{"threshold": 1}'::JSONB
            ),
            (
                'En práctica',
                'Completa cinco ejercicios personalizados.',
                'exercises_completed',
                '{"threshold": 5}'::JSONB
            ),
            (
                'Constancia',
                'Completa diez ejercicios personalizados.',
                'exercises_completed',
                '{"threshold": 10}'::JSONB
            ),
            (
                'Primeros 300 XP',
                'Acumula al menos 300 puntos de experiencia.',
                'total_xp',
                '{"threshold": 300}'::JSONB
            ),
            (
                'Mil puntos',
                'Acumula al menos 1000 puntos de experiencia.',
                'total_xp',
                '{"threshold": 1000}'::JSONB
            ),
            (
                'Tres días seguidos',
                'Mantén una racha de aprendizaje de tres días.',
                'current_streak',
                '{"threshold": 3}'::JSONB
            ),
            (
                'Semana constante',
                'Mantén una racha de aprendizaje de siete días.',
                'current_streak',
                '{"threshold": 7}'::JSONB
            ),
            (
                'Nivel Junior',
                'Alcanza el nivel Programador Junior.',
                'current_level',
                '{"threshold": 2}'::JSONB
            ),
            (
                'Nivel Intermedio',
                'Alcanza el nivel Programador Intermedio.',
                'current_level',
                '{"threshold": 3}'::JSONB
            ),
            (
                'Nivel Avanzado',
                'Alcanza el nivel Programador Avanzado.',
                'current_level',
                '{"threshold": 4}'::JSONB
            )

        ON CONFLICT (name)
        DO UPDATE SET
            description =
                EXCLUDED.description,
            criteria_type =
                EXCLUDED.criteria_type,
            criteria_value =
                EXCLUDED.criteria_value,
            is_active = TRUE;
    `);
}

export async function down(pgm) {
    pgm.sql(`
        DELETE FROM user_badges
        WHERE badge_id IN (
            SELECT id
            FROM badges
            WHERE name IN (
                'Primer paso',
                'En práctica',
                'Constancia',
                'Primeros 300 XP',
                'Mil puntos',
                'Tres días seguidos',
                'Semana constante',
                'Nivel Junior',
                'Nivel Intermedio',
                'Nivel Avanzado'
            )
        );

        DELETE FROM badges
        WHERE name IN (
            'Primer paso',
            'En práctica',
            'Constancia',
            'Primeros 300 XP',
            'Mil puntos',
            'Tres días seguidos',
            'Semana constante',
            'Nivel Junior',
            'Nivel Intermedio',
            'Nivel Avanzado'
        );

        ALTER TABLE badges
        DROP CONSTRAINT IF EXISTS
            badges_criteria_type_check;
    `);
}
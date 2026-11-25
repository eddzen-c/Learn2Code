import { buildAcademicSeed } from './data/academic-demo-curriculum.js'

export const shorthands = undefined

const quote = (value) => "'" + value.replaceAll("'", "''") + "'"

export const up = (pgm) => {
    const seed = buildAcademicSeed()
    if (seed.length !== 40 || new Set(seed.map((x) => x.code)).size !== 40) {
        throw new Error('Se esperaban 40 módulos académicos distintos')
    }

    const sql = `
        DO $academic_demo$
        DECLARE
            entry JSONB;
            test_case JSONB;
            selected_stage_id BIGINT;
            selected_module_id UUID;
            selected_unit_id UUID;
            selected_exercise_id UUID;
            selected_topic_id SMALLINT;
            selected_difficulty_id SMALLINT;
            js_language_id SMALLINT;
        BEGIN
            SELECT id INTO STRICT js_language_id
            FROM supported_languages
            WHERE LOWER(name) = 'javascript';

            FOR entry IN
                SELECT value
                FROM jsonb_array_elements(__SEED_JSON__::jsonb)
            LOOP
                SELECT id INTO STRICT selected_stage_id
                FROM academic_stages
                WHERE specialization_key = entry->>'key'
                  AND position = (entry->>'stagePosition')::SMALLINT;

                SELECT id INTO STRICT selected_topic_id
                FROM topics
                WHERE name = entry->>'topic';

                SELECT id INTO STRICT selected_difficulty_id
                FROM difficulty_levels
                WHERE id = (entry->>'difficulty')::SMALLINT;

                INSERT INTO academic_modules (
                    stage_id, code, position, title, description, status
                ) VALUES (
                    selected_stage_id, entry->>'code',
                    (entry->>'modulePosition')::SMALLINT,
                    entry->>'moduleTitle',
                    entry->>'moduleDescription',
                    'published'
                )
                ON CONFLICT (code) DO NOTHING;

                SELECT id INTO STRICT selected_module_id
                FROM academic_modules
                WHERE code = entry->>'code'
                  AND stage_id = selected_stage_id;

                INSERT INTO academic_units (
                    module_id, code, position, title, description, status
                ) VALUES (
                    selected_module_id,
                    entry->>'unitCode', 1,
                    entry->>'unitTitle',
                    entry->>'unitDescription',
                    'published'
                )
                ON CONFLICT (code) DO NOTHING;

                SELECT id INTO STRICT selected_unit_id
                FROM academic_units
                WHERE code = entry->>'unitCode'
                  AND module_id = selected_module_id;

                INSERT INTO academic_unit_topics (unit_id, topic_id)
                VALUES (selected_unit_id, selected_topic_id)
                ON CONFLICT DO NOTHING;

                IF NOT EXISTS (
                    SELECT 1 FROM academic_unit_exercises
                    WHERE unit_id = selected_unit_id
                ) THEN
                    INSERT INTO exercises (
                        topic_id, difficulty_id, language_id,
                        created_by_user_id, title, statement, instructions,
                        starter_code, solution_code, estimated_minutes,
                        generation_source, status
                    ) VALUES (
                        selected_topic_id, selected_difficulty_id, js_language_id,
                        NULL, entry->>'exerciseTitle',
                        entry->>'statement', entry->>'instructions',
                        entry->>'starterCode', entry->>'solutionCode',
                        CASE WHEN selected_difficulty_id = 1 THEN 12 ELSE 20 END,
                        'manual', 'published'
                    )
                    RETURNING id INTO selected_exercise_id;

                    INSERT INTO academic_unit_exercises (
                        unit_id, exercise_id, position
                    ) VALUES (selected_unit_id, selected_exercise_id, 1);

                    FOR test_case IN
                        SELECT value
                        FROM jsonb_array_elements(entry->'cases')
                    LOOP
                        INSERT INTO exercise_test_cases (
                            exercise_id, position, input,
                            expected_output, is_hidden, weight
                        ) VALUES (
                            selected_exercise_id,
                            (test_case->>'position')::SMALLINT,
                            test_case->>'input',
                            test_case->>'expectedOutput',
                            (test_case->>'isHidden')::BOOLEAN,
                            1
                        );
                    END LOOP;
                END IF;
            END LOOP;

            UPDATE academic_stages AS st
            SET status = 'published'
            WHERE EXISTS (
                SELECT 1
                FROM academic_modules AS m
                JOIN academic_units AS u ON u.module_id = m.id
                JOIN academic_unit_exercises AS aue ON aue.unit_id = u.id
                JOIN exercises AS e ON e.id = aue.exercise_id
                WHERE m.stage_id = st.id
                  AND m.status = 'published'
                  AND u.status = 'published'
                  AND e.status = 'published'
            );
        END
        $academic_demo$;
    `
    pgm.sql(sql.replace('__SEED_JSON__', quote(JSON.stringify(seed))))
}

export const down = (pgm) => {
    pgm.sql(`
        DO $academic_demo_rollback$
        DECLARE
            created_exercises UUID[];
        BEGIN
            SELECT ARRAY_AGG(aue.exercise_id)
            INTO created_exercises
            FROM academic_unit_exercises AS aue
            JOIN academic_units AS u ON u.id = aue.unit_id
            WHERE u.code LIKE 'demo26-%';

            IF EXISTS (
                SELECT 1 FROM exercise_assignments
                WHERE exercise_id = ANY(
                    COALESCE(created_exercises, ARRAY[]::UUID[])
                )
            ) OR EXISTS (
                SELECT 1 FROM exercise_attempts
                WHERE exercise_id = ANY(
                    COALESCE(created_exercises, ARRAY[]::UUID[])
                )
            ) THEN
                RAISE EXCEPTION
                    'Reversión bloqueada: hay asignaciones o intentos de usuarios';
            END IF;

            DELETE FROM exercise_test_cases
            WHERE exercise_id = ANY(
                COALESCE(created_exercises, ARRAY[]::UUID[])
            );
            DELETE FROM academic_unit_exercises
            WHERE unit_id IN (
                SELECT id FROM academic_units WHERE code LIKE 'demo26-%'
            );
            DELETE FROM academic_unit_topics
            WHERE unit_id IN (
                SELECT id FROM academic_units WHERE code LIKE 'demo26-%'
            );
            DELETE FROM exercises
            WHERE id = ANY(
                COALESCE(created_exercises, ARRAY[]::UUID[])
            );
            DELETE FROM academic_units WHERE code LIKE 'demo26-%';
            DELETE FROM academic_modules WHERE code LIKE 'demo26-%';

            UPDATE academic_stages AS st
            SET status = 'planned'
            WHERE NOT EXISTS (
                SELECT 1 FROM academic_modules AS m
                WHERE m.stage_id = st.id
                  AND m.status = 'published'
            );
        END
        $academic_demo_rollback$;
    `)
}

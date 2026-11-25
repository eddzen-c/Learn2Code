
export const shorthands = undefined;

export const up = (pgm) => {
    pgm.sql(`
        DO $fullstack_seed$
        DECLARE
            target_stage_id BIGINT;
            module_id UUID;
            unit_id UUID;
            language_id SMALLINT;
            structures_topic_id SMALLINT;
            functions_topic_id SMALLINT;
            difficulty_id SMALLINT;
            first_exercise_id UUID;
            second_exercise_id UUID;
        BEGIN
            -- Localizar las referencias reales del catálogo.
            SELECT id INTO STRICT target_stage_id
            FROM academic_stages
            WHERE specialization_key = 'fullstack'
              AND position = 1;

            SELECT id INTO STRICT language_id
            FROM supported_languages
            WHERE LOWER(name) = 'javascript';

            SELECT id INTO STRICT structures_topic_id
            FROM topics
            WHERE name = 'estructuras_de_datos';

            SELECT id INTO STRICT functions_topic_id
            FROM topics
            WHERE name = 'funciones';

            SELECT id INTO STRICT difficulty_id
            FROM difficulty_levels
            WHERE LOWER(name) = 'intermedio';

            -- No reemplazar contenido académico existente.
            IF EXISTS (
                SELECT 1
                FROM academic_modules
WHERE academic_modules.stage_id = target_stage_id
  AND position = 1
            ) THEN
                RAISE EXCEPTION
                    'La primera etapa ya tiene un módulo en posición 1';
            END IF;

            -- Módulo inicial.
            INSERT INTO academic_modules (
                stage_id,
                code,
                position,
                title,
                description,
                status
            )
            VALUES (
                target_stage_id,
                'fullstack-frontend-data-processing',
                1,
                'Procesamiento de datos para interfaces',
                'Transformación de listas y cálculo de valores para aplicaciones web.',
                'published'
            )
            RETURNING id INTO module_id;

            -- Primera unidad.
            INSERT INTO academic_units (
                module_id,
                code,
                position,
                title,
                description,
                status
            )
            VALUES (
                module_id,
                'fullstack-frontend-data-unit-1',
                1,
                'Listas y cálculos en JavaScript',
                'Resuelve problemas de procesamiento de datos usando JavaScript.',
                'published'
            )
            RETURNING id INTO unit_id;

            INSERT INTO academic_unit_topics (
                unit_id,
                topic_id
            )
            VALUES
                (unit_id, structures_topic_id),
                (unit_id, functions_topic_id);

            -- Ejercicio 1: filtrar productos disponibles.
            INSERT INTO exercises (
                topic_id,
                difficulty_id,
                language_id,
                created_by_user_id,
                title,
                statement,
                instructions,
                starter_code,
                solution_code,
                estimated_minutes,
                generation_source,
                status
            )
            VALUES (
                structures_topic_id,
                difficulty_id,
                language_id,
                NULL,
                'Filtrar productos disponibles',
                'Recibe un arreglo JSON de productos. Cada producto tiene nombre y stock. Devuelve un arreglo JSON con los nombres de los productos cuyo stock sea mayor que cero, conservando el orden.',
                'Lee un arreglo JSON desde la entrada estándar. Imprime únicamente el arreglo JSON resultante.',
                $starter_one$
const fs = require('node:fs');

const productos = JSON.parse(
    fs.readFileSync(0, 'utf8')
);

// Filtra los productos disponibles.
// Muestra sus nombres como un arreglo JSON.
$starter_one$,
                $solution_one$
const fs = require('node:fs');

const productos = JSON.parse(
    fs.readFileSync(0, 'utf8')
);

const disponibles = productos
    .filter((producto) => producto.stock > 0)
    .map((producto) => producto.nombre);

console.log(JSON.stringify(disponibles));
$solution_one$,
                15,
                'manual',
                'published'
            )
            RETURNING id INTO first_exercise_id;

            INSERT INTO academic_unit_exercises (
                unit_id,
                exercise_id,
                position
            )
            VALUES (
                unit_id,
                first_exercise_id,
                1
            );

            INSERT INTO exercise_test_cases (
                exercise_id,
                position,
                input,
                expected_output,
                is_hidden,
                weight
            )
            VALUES
                (
                    first_exercise_id,
                    1,
                    '[{"nombre":"Teclado","stock":3},{"nombre":"Mouse","stock":0},{"nombre":"Monitor","stock":2}]',
                    '["Teclado","Monitor"]',
                    FALSE,
                    1
                ),
                (
                    first_exercise_id,
                    2,
                    '[]',
                    '[]',
                    FALSE,
                    1
                ),
                (
                    first_exercise_id,
                    3,
                    '[{"nombre":"A","stock":-1},{"nombre":"B","stock":1}]',
                    '["B"]',
                    TRUE,
                    1
                );

            -- Ejercicio 2: calcular el total de un carrito.
            INSERT INTO exercises (
                topic_id,
                difficulty_id,
                language_id,
                created_by_user_id,
                title,
                statement,
                instructions,
                starter_code,
                solution_code,
                estimated_minutes,
                generation_source,
                status
            )
            VALUES (
                functions_topic_id,
                difficulty_id,
                language_id,
                NULL,
                'Calcular el total de un carrito',
                'Recibe un arreglo JSON de artículos. Cada artículo tiene precio y cantidad. Calcula e imprime la suma de precio multiplicado por cantidad de todos los artículos.',
                'Lee el arreglo JSON desde la entrada estándar. Imprime solamente el total numérico. Si el carrito está vacío, imprime cero.',
                $starter_two$
const fs = require('node:fs');

const articulos = JSON.parse(
    fs.readFileSync(0, 'utf8')
);

// Calcula el total del carrito.
// Imprime solamente el resultado.
$starter_two$,
                $solution_two$
const fs = require('node:fs');

const articulos = JSON.parse(
    fs.readFileSync(0, 'utf8')
);

const total = articulos.reduce(
    (suma, articulo) =>
        suma + articulo.precio * articulo.cantidad,
    0
);

console.log(total);
$solution_two$,
                20,
                'manual',
                'published'
            )
            RETURNING id INTO second_exercise_id;

            INSERT INTO academic_unit_exercises (
                unit_id,
                exercise_id,
                position
            )
            VALUES (
                unit_id,
                second_exercise_id,
                2
            );

            INSERT INTO exercise_test_cases (
                exercise_id,
                position,
                input,
                expected_output,
                is_hidden,
                weight
            )
            VALUES
                (
                    second_exercise_id,
                    1,
                    '[{"precio":50,"cantidad":2},{"precio":25,"cantidad":1}]',
                    '125',
                    FALSE,
                    1
                ),
                (
                    second_exercise_id,
                    2,
                    '[]',
                    '0',
                    FALSE,
                    1
                ),
                (
                    second_exercise_id,
                    3,
                    '[{"precio":12,"cantidad":3},{"precio":4,"cantidad":2}]',
                    '44',
                    TRUE,
                    1
                );

            -- Publicar la etapa inicial.
            UPDATE academic_stages
            SET status = 'published'
            WHERE id = target_stage_id;
        END
        $fullstack_seed$;
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        DO $fullstack_rollback$
        DECLARE
            target_unit UUID;
            target_module UUID;
            exercise_ids UUID[];
        BEGIN
            SELECT id INTO target_unit
            FROM academic_units
            WHERE code = 'fullstack-frontend-data-unit-1';

            SELECT id INTO target_module
            FROM academic_modules
            WHERE code = 'fullstack-frontend-data-processing';

            IF target_unit IS NOT NULL THEN
                -- No borrar contenido que ya tenga intentos reales.
                IF EXISTS (
                    SELECT 1
                    FROM exercise_attempts ea
                    JOIN academic_unit_exercises aue
                        ON aue.exercise_id = ea.exercise_id
                    WHERE aue.unit_id = target_unit
                ) THEN
                    RAISE EXCEPTION
                        'No es seguro revertir contenido con intentos registrados';
                END IF;

                SELECT ARRAY_AGG(exercise_id)
                INTO exercise_ids
                FROM academic_unit_exercises
                WHERE unit_id = target_unit;

                DELETE FROM academic_unit_exercises
                WHERE unit_id = target_unit;

                DELETE FROM academic_unit_topics
                WHERE unit_id = target_unit;

                DELETE FROM exercise_test_cases
                WHERE exercise_id = ANY(
                    COALESCE(exercise_ids, ARRAY[]::UUID[])
                );

                DELETE FROM exercises
                WHERE id = ANY(
                    COALESCE(exercise_ids, ARRAY[]::UUID[])
                );

                DELETE FROM academic_units
                WHERE id = target_unit;
            END IF;

            IF target_module IS NOT NULL THEN
                DELETE FROM academic_modules
                WHERE id = target_module;
            END IF;

            UPDATE academic_stages
            SET status = 'planned'
            WHERE specialization_key = 'fullstack'
              AND position = 1
              AND NOT EXISTS (
                  SELECT 1
                  FROM academic_modules
                  WHERE stage_id = academic_stages.id
              );
        END
        $fullstack_rollback$;
    `);
};

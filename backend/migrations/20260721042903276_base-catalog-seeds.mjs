export const shorthands = undefined;

export async function up(pgm) {
    pgm.sql(`
    INSERT INTO roles (id, name, description)
    VALUES
        (1, 'student', 'Estudiante de la plataforma'),
        (2, 'admin', 'Administrador del sistema');

    INSERT INTO difficulty_levels (id, name)
    VALUES
        (1, 'básico'),
        (2, 'intermedio'),
        (3, 'avanzado');

    INSERT INTO supported_languages (
        id,
        name,
        file_extension,
        sandbox_image,
        is_active
    )
    VALUES
        (
            1,
            'JavaScript',
            '.js',
            'learn2code-sandbox-node:20',
            true
        ),
        (
            2,
            'Python',
            '.py',
            'learn2code-sandbox-python:3.12',
            true
        );

    INSERT INTO topics (id, name, description)
    VALUES
        (
            1,
            'variables',
            'Declaración, asignación y tipos de datos'
        ),
        (
            2,
            'condicionales',
            'Estructuras de decisión'
        ),
        (
            3,
            'ciclos',
            'Estructuras de repetición'
        ),
        (
            4,
            'funciones',
            'Definición, parámetros y retorno'
        ),
        (
            5,
            'estructuras_de_datos',
            'Arreglos, listas, objetos y diccionarios'
        );

    INSERT INTO levels (id, name, min_xp)
    VALUES
        (1, 'Principiante', 0),
        (2, 'Programador Junior', 300),
        (3, 'Programador Intermedio', 1000),
        (4, 'Programador Avanzado', 2500);

    INSERT INTO plans (
        id,
        name,
        price_amount,
        currency,
        monthly_chat_limit,
        monthly_ai_exercise_limit
    )
    VALUES
        (1, 'free', 0, 'MXN', 50, 10),
        (2, 'pro', 199.00, 'MXN', 500, 100),
        (3, 'institutional', 0, 'MXN', NULL, NULL);
  `);
}

export async function down(pgm) {
    pgm.sql(`
    DELETE FROM plans
    WHERE id IN (1, 2, 3);

    DELETE FROM levels
    WHERE id IN (1, 2, 3, 4);

    DELETE FROM topics
    WHERE id IN (1, 2, 3, 4, 5);

    DELETE FROM supported_languages
    WHERE id IN (1, 2);

    DELETE FROM difficulty_levels
    WHERE id IN (1, 2, 3);

    DELETE FROM roles
    WHERE id IN (1, 2);
  `);
}
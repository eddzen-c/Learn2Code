
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import request from 'supertest';

import app from '../../src/app.js';

import {
    closeDatabaseConnection,
    databasePool,
} from '../../src/config/database.js';

import {
    connectRedis,
    closeRedisConnection,
} from '../../src/config/redis.js';

import {
    verifyIntegrationStudent,
} from '../helpers/verified-student.js';

import {
    createExerciseTestCaseRecords,
} from '../../src/modules/exercises/repositories/exercise.repository.js';

test(
    'academic unit exercises endpoint validates access and queries PostgreSQL',
    async () => {
        const suffix = randomUUID();

        const correctCode = [
            "const fs = require('node:fs');",
            "const input = Number(fs.readFileSync(0, 'utf8').trim());",
            'console.log(input * 2);',
        ].join('\n');

        const email =
            `academic-unit-${suffix}@example.test`;

        const password =
            'Learn2Code-Academic-2026!';

        const basePath =
            '/api/v1/exercises/catalog/units';

        const missingUnitId =
            '00000000-0000-4000-8000-000000000000';

        const missingPath =
            `${basePath}/${missingUnitId}/exercises`;

        const assignmentPath =
            `${basePath}/${missingUnitId}/exercises/${missingUnitId}/assignments`;

        let stageId = null;
        let moduleId = null;
        let unitId = null;
        let exerciseId = null;
        let integrationUserId = null;

        try {
            await connectRedis();

            const anonymousResponse = await request(app)
                .get(missingPath);

            assert.equal(
                anonymousResponse.status,
                401,
            );

            assert.equal(
                anonymousResponse.body.code,
                'AUTHENTICATION_REQUIRED',
            );

            const anonymousAssignmentResponse =
                await request(app)
                    .post(assignmentPath);

            assert.equal(
                anonymousAssignmentResponse.status,
                401,
            );

            assert.equal(
                anonymousAssignmentResponse.body.code,
                'AUTHENTICATION_REQUIRED',
            );

            const registrationResponse = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    fullName:
                        'Academic Unit Integration Student',
                    email,
                    password,
                });

            assert.equal(
                registrationResponse.status,
                201,
                JSON.stringify(registrationResponse.body),
            );

            const {
                user,
                accessToken,
            } = registrationResponse.body.data;

            integrationUserId = user.id;

            const authorization =
                `Bearer ${accessToken}`;

            const unverifiedResponse = await request(app)
                .get(missingPath)
                .set(
                    'Authorization',
                    authorization,
                );

            assert.equal(
                unverifiedResponse.status,
                403,
            );

            assert.equal(
                unverifiedResponse.body.code,
                'EMAIL_NOT_VERIFIED',
            );

            const unverifiedAssignmentResponse =
                await request(app)
                    .post(assignmentPath)
                    .set(
                        'Authorization',
                        authorization,
                    );

            assert.equal(
                unverifiedAssignmentResponse.status,
                403,
            );

            assert.equal(
                unverifiedAssignmentResponse.body.code,
                'EMAIL_NOT_VERIFIED',
            );

            await verifyIntegrationStudent({
                userId: user.id,
            });

            const invalidResponse = await request(app)
                .get(
                    `${basePath}/identificador-invalido/exercises`,
                )
                .set(
                    'Authorization',
                    authorization,
                );

            assert.equal(
                invalidResponse.status,
                400,
            );

            assert.equal(
                invalidResponse.body.code,
                'INVALID_ACADEMIC_UNIT_ID',
            );

            const invalidUnitAssignmentResponse =
                await request(app)
                    .post(
                        `${basePath}/identificador-invalido/exercises/${missingUnitId}/assignments`,
                    )
                    .set(
                        'Authorization',
                        authorization,
                    );

            assert.equal(
                invalidUnitAssignmentResponse.status,
                400,
            );

            assert.equal(
                invalidUnitAssignmentResponse.body.code,
                'INVALID_ACADEMIC_UNIT_ID',
            );

            const invalidExerciseAssignmentResponse =
                await request(app)
                    .post(
                        `${basePath}/${missingUnitId}/exercises/identificador-invalido/assignments`,
                    )
                    .set(
                        'Authorization',
                        authorization,
                    );

            assert.equal(
                invalidExerciseAssignmentResponse.status,
                400,
            );

            assert.equal(
                invalidExerciseAssignmentResponse.body.code,
                'INVALID_ACADEMIC_EXERCISE_ID',
            );

            const missingResponse = await request(app)
                .get(missingPath)
                .set(
                    'Authorization',
                    authorization,
                );

            assert.equal(
                missingResponse.status,
                404,
            );

            assert.equal(
                missingResponse.body.code,
                'ACADEMIC_UNIT_NOT_FOUND',
            );

            const missingAssignmentResponse =
                await request(app)
                    .post(assignmentPath)
                    .set(
                        'Authorization',
                        authorization,
                    );

            assert.equal(
                missingAssignmentResponse.status,
                404,
                JSON.stringify(
                    missingAssignmentResponse.body,
                ),
            );

            assert.equal(
                missingAssignmentResponse.body.code,
                'ACADEMIC_EXERCISE_NOT_FOUND',
            );

            const stageResult = await databasePool.query({
                text: `
                    INSERT INTO academic_stages (
                        specialization_key,
                        position,
                        title,
                        status
                    )
                    SELECT
                        'frontend',
                        COALESCE(MAX(position), 0) + 1,
                        $1,
                        'published'
                    FROM academic_stages
                    WHERE specialization_key = 'frontend'
                    RETURNING id
                `,
                values: [
                    `Etapa temporal ${suffix}`,
                ],
            });

            stageId = stageResult.rows[0].id;

            const moduleResult = await databasePool.query({
                text: `
                    INSERT INTO academic_modules (
                        stage_id,
                        code,
                        position,
                        title,
                        description,
                        status
                    )
                    VALUES (
                        $1,
                        $2,
                        1,
                        'Módulo de integración',
                        'Contenido temporal de prueba',
                        'published'
                    )
                    RETURNING id
                `,
                values: [
                    stageId,
                    `integration-module-${suffix}`,
                ],
            });

            moduleId = moduleResult.rows[0].id;

            const unitResult = await databasePool.query({
                text: `
                    INSERT INTO academic_units (
                        module_id,
                        code,
                        position,
                        title,
                        description,
                        status
                    )
                    VALUES (
                        $1,
                        $2,
                        1,
                        'Unidad de integración',
                        'Contenido académico temporal',
                        'published'
                    )
                    RETURNING id
                `,
                values: [
                    moduleId,
                    `integration-unit-${suffix}`,
                ],
            });

            unitId = unitResult.rows[0].id;

            const publishedResponse = await request(app)
                .get(
                    `${basePath}/${unitId}/exercises`,
                )
                .set(
                    'Authorization',
                    authorization,
                );

            assert.equal(
                publishedResponse.status,
                200,
                JSON.stringify(publishedResponse.body),
            );

            assert.equal(
                publishedResponse.body.status,
                'success',
            );

            assert.equal(
                publishedResponse.body.data.unit.id,
                unitId,
            );

            assert.equal(
                publishedResponse.body.data.unit.title,
                'Unidad de integración',
            );

            assert.equal(
                publishedResponse.body.data.unit.specializationKey,
                'frontend',
            );

            assert.deepEqual(
                publishedResponse.body.data.exercises,
                [],
            );

            // Seleccionar referencias reales de PostgreSQL.
            const topicResult = await databasePool.query(
                'SELECT id FROM topics ORDER BY id LIMIT 1',
            );

            const difficultyResult = await databasePool.query(
                'SELECT id FROM difficulty_levels ORDER BY id LIMIT 1',
            );

            const languageResult = await databasePool.query(
                "SELECT id FROM supported_languages WHERE LOWER(name) = 'javascript' LIMIT 1",
            );

            assert.equal(
                languageResult.rows[0].id,
                1,
                'El evaluador Docker requiere JavaScript con ID 1',
            );

            assert.ok(
                topicResult.rows.length > 0,
                'Debe existir al menos un tema',
            );

            assert.ok(
                difficultyResult.rows.length > 0,
                'Debe existir al menos una dificultad',
            );

            assert.ok(
                languageResult.rows.length > 0,
                'Debe existir al menos un lenguaje',
            );

            // Crear un ejercicio temporal publicado.
            const exerciseResult = await databasePool.query({
                text: `
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
                        $1, $2, $3, NULL,
                        $4, $5, $6, $7,
                        $8, $9, 'manual', 'published'
                    )
                    RETURNING id
                `,
                values: [
                    topicResult.rows[0].id,
                    difficultyResult.rows[0].id,
                    languageResult.rows[0].id,
                    `Ejercicio temporal ${suffix}`,
                    'Lee un número entero e imprime su doble.',
                    'Lee la entrada estándar y escribe el resultado.',
                    [
                        "const fs = require('node:fs');",
                        "const input = Number(fs.readFileSync(0, 'utf8').trim());",
                        '// Escribe tu solución aquí.',
                    ].join('\n'),
                    correctCode,
                    10,
                ],
            });

            exerciseId = exerciseResult.rows[0].id;

            await createExerciseTestCaseRecords({
                exerciseId,
                testCases: [
                    {
                        position: 1,
                        input: '2',
                        expectedOutput: '4',
                        isHidden: false,
                        weight: 1,
                    },
                    {
                        position: 2,
                        input: '0',
                        expectedOutput: '0',
                        isHidden: false,
                        weight: 1,
                    },
                    {
                        position: 3,
                        input: '-3',
                        expectedOutput: '-6',
                        isHidden: true,
                        weight: 1,
                    },
                ],
            });

            // Asociar el ejercicio a la unidad publicada.
            await databasePool.query({
                text: `
                    INSERT INTO academic_unit_exercises (
                        unit_id,
                        exercise_id,
                        position
                    )
                    VALUES ($1, $2, 1)
                `,
                values: [unitId, exerciseId],
            });

            const exerciseListResponse = await request(app)
                .get(`${basePath}/${unitId}/exercises`)
                .set('Authorization', authorization);

            assert.equal(
                exerciseListResponse.status,
                200,
            );

            assert.equal(
                exerciseListResponse.body.data.exercises.length,
                1,
            );

            assert.equal(
                exerciseListResponse.body.data.exercises[0].id,
                exerciseId,
            );

            // Primera solicitud: crear la asignación.
            const realAssignmentPath =
                `${basePath}/${unitId}/exercises/${exerciseId}/assignments`;

            const createdResponse = await request(app)
                .post(realAssignmentPath)
                .set('Authorization', authorization);

            assert.equal(
                createdResponse.status,
                201,
                JSON.stringify(createdResponse.body),
            );

            assert.equal(
                createdResponse.body.data.created,
                true,
            );

            const createdAssignment =
                createdResponse.body.data.assignment;

            assert.ok(createdAssignment.id);

            assert.equal(
                createdAssignment.exerciseId,
                exerciseId,
            );

            assert.equal(
                createdAssignment.academicUnitId,
                unitId,
            );

            // Verificar el registro almacenado realmente.
            const storedResult = await databasePool.query({
                text: `
                    SELECT
                        id,
                        user_id,
                        exercise_id,
                        academic_unit_id,
                        source,
                        status
                    FROM exercise_assignments
                    WHERE id = $1
                      AND user_id = $2
                `,
                values: [
                    createdAssignment.id,
                    user.id,
                ],
            });

            assert.equal(storedResult.rows.length, 1);

            assert.equal(
                storedResult.rows[0].exercise_id,
                exerciseId,
            );

            assert.equal(
                storedResult.rows[0].academic_unit_id,
                unitId,
            );

            assert.equal(
                storedResult.rows[0].source,
                'manual',
            );

            assert.equal(
                storedResult.rows[0].status,
                'assigned',
            );

            // Recuperar el ejercicio asignado desde HTTP.
            const detailPath =
                `/api/v1/exercises/assignments/${createdAssignment.id}`;

            const detailResponse = await request(app)
                .get(detailPath)
                .set('Authorization', authorization);

            assert.equal(
                detailResponse.status,
                200,
                JSON.stringify(detailResponse.body),
            );

            assert.equal(
                detailResponse.body.data.assignment.id,
                createdAssignment.id,
            );

            assert.equal(
                detailResponse.body.data.assignment.academicUnitId,
                unitId,
            );

            assert.equal(
                detailResponse.body.data.exercise.id,
                exerciseId,
            );

            assert.equal(
                detailResponse.body.data.exercise.title,
                `Ejercicio temporal ${suffix}`,
            );

            assert.equal(
                detailResponse.body.data.state,
                'assigned',
            );

            // La consulta no debe revelar soluciones privadas.
            const detailText =
                JSON.stringify(detailResponse.body);

            assert.doesNotMatch(
                detailText,
                /solutionCode|solution_code|passwordHash/,
            );

            // Una petición anónima no puede consultar el ejercicio.
            const anonymousDetailResponse =
                await request(app)
                    .get(detailPath);

            assert.equal(
                anonymousDetailResponse.status,
                401,
            );

            // Validar identificadores de asignación.
            const invalidDetailResponse =
                await request(app)
                    .get(
                        '/api/v1/exercises/assignments/identificador-invalido',
                    )
                    .set('Authorization', authorization);

            assert.equal(
                invalidDetailResponse.status,
                400,
            );

            assert.equal(
                invalidDetailResponse.body.code,
                'INVALID_EXERCISE_ASSIGNMENT_ID',
            );

            // Una asignación inexistente no debe mostrarse.
            const missingDetailResponse =
                await request(app)
                    .get(
                        '/api/v1/exercises/assignments/00000000-0000-4000-8000-000000000000',
                    )
                    .set('Authorization', authorization);

            assert.equal(
                missingDetailResponse.status,
                404,
            );

            assert.equal(
                missingDetailResponse.body.code,
                'ACADEMIC_ASSIGNMENT_NOT_FOUND',
            );

            // Segunda solicitud: reutilizar la asignación.
            const reusedResponse = await request(app)
                .post(realAssignmentPath)
                .set('Authorization', authorization);

            assert.equal(
                reusedResponse.status,
                200,
                JSON.stringify(reusedResponse.body),
            );

            assert.equal(
                reusedResponse.body.data.created,
                false,
            );

            assert.equal(
                reusedResponse.body.data.assignment.id,
                createdAssignment.id,
            );

            // Preparar una nueva asignación para probar
            // dos solicitudes al mismo tiempo.
            await databasePool.query({
                text: `
                    DELETE FROM exercise_assignments
                    WHERE id = $1
                      AND user_id = $2
                `,
                values: [
                    createdAssignment.id,
                    user.id,
                ],
            });

            const concurrentResponses = await Promise.all([
                request(app)
                    .post(realAssignmentPath)
                    .set('Authorization', authorization),

                request(app)
                    .post(realAssignmentPath)
                    .set('Authorization', authorization),
            ]);

            assert.deepEqual(
                concurrentResponses
                    .map((response) => response.status)
                    .sort(),
                [200, 201],
                JSON.stringify(
                    concurrentResponses.map(
                        (response) => response.body,
                    ),
                ),
            );

            const concurrentIds =
                concurrentResponses.map(
                    (response) =>
                        response.body.data.assignment.id,
                );

            assert.equal(
                concurrentIds[0],
                concurrentIds[1],
            );

            // Comprobar que solo existe una asignación.
            const assignmentCount =
                await databasePool.query({
                    text: `
                        SELECT COUNT(*)::integer AS total
                        FROM exercise_assignments
                        WHERE user_id = $1
                          AND exercise_id = $2
                          AND academic_unit_id = $3
                          AND status IN ('assigned', 'started')
                    `,
                    values: [
                        user.id,
                        exerciseId,
                        unitId,
                    ],
                });

            assert.equal(
                assignmentCount.rows[0].total,
                1,
            );

            // Evaluar la asignación académica creada.
            const academicAssignmentId = concurrentIds[0];

            const attemptPath =
                `/api/v1/exercises/assignments/${academicAssignmentId}/attempts`;

            // Primer intento: solución incorrecta.
            const failedAttemptResponse = await request(app)
                .post(attemptPath)
                .set('Authorization', authorization)
                .send({
                    submittedCode: 'console.log(999);',
                });

            assert.equal(
                failedAttemptResponse.status,
                201,
                JSON.stringify(failedAttemptResponse.body),
            );

            const failedData = failedAttemptResponse.body.data;

            assert.equal(failedData.evaluator.provider, 'docker');
            assert.equal(failedData.attempt.passed, false);
            assert.equal(failedData.attempt.score, 0);
            assert.equal(failedData.attempt.testsPassed, 0);
            assert.equal(failedData.attempt.testsTotal, 3);
            assert.equal(failedData.assignment.status, 'started');

            // Solo se muestran los dos casos públicos.
            assert.equal(failedData.results.length, 2);

            // Segundo intento: solución correcta.
            const passingAttemptResponse = await request(app)
                .post(attemptPath)
                .set('Authorization', authorization)
                .send({
                    submittedCode: correctCode,
                });

            assert.equal(
                passingAttemptResponse.status,
                201,
                JSON.stringify(passingAttemptResponse.body),
            );

            const passingData = passingAttemptResponse.body.data;

            assert.equal(passingData.evaluator.provider, 'docker');
            assert.equal(passingData.attempt.passed, true);
            assert.equal(passingData.attempt.score, 100);
            assert.equal(passingData.attempt.testsPassed, 3);
            assert.equal(passingData.attempt.testsTotal, 3);
            assert.equal(passingData.assignment.status, 'completed');
            assert.equal(passingData.results.length, 2);

            // El catálogo refleja el resultado persistido solo para este usuario.
            const completedCatalogResponse = await request(app)
                .get(`${basePath}/${unitId}/exercises`)
                .set('Authorization', authorization);
            assert.equal(completedCatalogResponse.status, 200);
            const completedExercise = completedCatalogResponse.body.data.exercises[0];
            assert.equal(completedExercise.id, exerciseId);
            assert.equal(completedExercise.completed, true);
            assert.equal(completedExercise.inProgress, false);
            assert.ok(completedExercise.completedAt);

            // Verificar los intentos almacenados en PostgreSQL.
            const storedAttempts = await databasePool.query({
                text: `
                    SELECT
                        id,
                        status,
                        passed,
                        score,
                        tests_passed,
                        tests_total
                    FROM exercise_attempts
                    WHERE user_id = $1
                      AND assignment_id = $2
                `,
                values: [
                    user.id,
                    academicAssignmentId,
                ],
            });

            assert.equal(storedAttempts.rows.length, 2);

            const storedFailedAttempt =
                storedAttempts.rows.find(
                    (row) => row.passed === false,
                );

            const storedPassingAttempt =
                storedAttempts.rows.find(
                    (row) => row.passed === true,
                );

            assert.ok(storedFailedAttempt);
            assert.ok(storedPassingAttempt);

            assert.equal(
                Number(storedFailedAttempt.score),
                0,
            );

            assert.equal(
                Number(storedPassingAttempt.score),
                100,
            );

            assert.equal(
                storedFailedAttempt.tests_total,
                3,
            );

            assert.equal(
                storedPassingAttempt.tests_passed,
                3,
            );

            // Verificar que PostgreSQL guardó todos los resultados.
            const storedResults = await databasePool.query({
                text: `
                    SELECT COUNT(*)::integer AS total
                    FROM exercise_attempt_results
                    WHERE attempt_id IN (
                        SELECT id
                        FROM exercise_attempts
                        WHERE assignment_id = $1
                    )
                `,
                values: [academicAssignmentId],
            });

            assert.equal(storedResults.rows[0].total, 6);

            // Confirmar que la asignación completada sigue
            // siendo consultable mediante su identificador real.
            const completedDetailResponse = await request(app)
                .get(
                    `/api/v1/exercises/assignments/${academicAssignmentId}`,
                )
                .set('Authorization', authorization);

            assert.equal(
                completedDetailResponse.status,
                200,
                JSON.stringify(completedDetailResponse.body),
            );

            assert.equal(
                completedDetailResponse.body.data.assignment.id,
                academicAssignmentId,
            );

            assert.equal(
                completedDetailResponse.body.data.assignment.status,
                'completed',
            );

            // Una asignación completada no admite más intentos.
            const repeatedAttemptResponse = await request(app)
                .post(attemptPath)
                .set('Authorization', authorization)
                .send({
                    submittedCode: correctCode,
                });

            assert.equal(repeatedAttemptResponse.status, 409);

            assert.equal(
                repeatedAttemptResponse.body.code,
                'EXERCISE_ASSIGNMENT_UNAVAILABLE',
            );

            const responseText =
                JSON.stringify(publishedResponse.body);

            assert.doesNotMatch(
                responseText,
                /solutionCode|submittedCode|expectedOutput|passwordHash/,
            );
        } finally {
            try {
                // Eliminar primero el usuario temporal.
                // Sus intentos y asignaciones dependen de él.
                if (integrationUserId) {
                    await databasePool.query({
                        text: `
                            DELETE FROM users
                            WHERE id = $1
                        `,
                        values: [integrationUserId],
                    });
                }

                if (integrationUserId && unitId) {
                    await databasePool.query({
                        text: `
                            DELETE FROM exercise_assignments
                            WHERE user_id = $1
                              AND academic_unit_id = $2
                        `,
                        values: [
                            integrationUserId,
                            unitId,
                        ],
                    });
                }

                if (unitId && exerciseId) {
                    await databasePool.query({
                        text: `
                            DELETE FROM academic_unit_exercises
                            WHERE unit_id = $1
                              AND exercise_id = $2
                        `,
                        values: [
                            unitId,
                            exerciseId,
                        ],
                    });
                }

                if (exerciseId) {
                    await databasePool.query({
                        text: `
                            DELETE FROM exercise_test_cases
                            WHERE exercise_id = $1
                        `,
                        values: [exerciseId],
                    });

                    await databasePool.query({
                        text: `
                            DELETE FROM exercises
                            WHERE id = $1
                        `,
                        values: [exerciseId],
                    });
                }

                if (unitId) {
                    await databasePool.query({
                        text: `
                            DELETE FROM academic_units
                            WHERE id = $1
                        `,
                        values: [unitId],
                    });
                }

                if (moduleId) {
                    await databasePool.query({
                        text: `
                            DELETE FROM academic_modules
                            WHERE id = $1
                        `,
                        values: [moduleId],
                    });
                }

                if (stageId) {
                    await databasePool.query({
                        text: `
                            DELETE FROM academic_stages
                            WHERE id = $1
                        `,
                        values: [stageId],
                    });
                }

                await databasePool.query({
                    text: `
                        DELETE FROM users
                        WHERE email = $1
                    `,
                    values: [email],
                });
            } finally {
                try {
                    await closeDatabaseConnection();
                } finally {
                    await closeRedisConnection();
                }
            }
        }
    },
);

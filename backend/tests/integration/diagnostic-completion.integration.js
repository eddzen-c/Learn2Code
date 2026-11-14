import assert from 'node:assert/strict';
import {
    randomUUID,
} from 'node:crypto';
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
    getLearningPlanContext,
} from '../../src/modules/learning-paths/services/learning-plan-context.service.js';

import {
    saveGeneratedLearningPath,
} from '../../src/modules/learning-paths/repositories/learning-path.repository.js';

test(
    'completing a diagnostic updates the learning profile',
    async () => {
        const email =
            `diagnostic-completion-${randomUUID()}@example.test`;

        const password =
            'Learn2Code-Completion-2026!';

        try {
            await connectRedis();
            const registrationResponse =
                await request(app)
                    .post('/api/v1/auth/register')
                    .send({
                        fullName:
                            'Diagnostic Completion Student',
                        email,
                        password,
                    });

            assert.equal(
                registrationResponse.status,
                201,
            );

            const user =
                registrationResponse
                    .body
                    .data
                    .user;

            await verifyIntegrationStudent({
                userId: user.id,
            });

            const accessToken =
                registrationResponse
                    .body
                    .data
                    .accessToken;

            const onboardingResponse =
                await request(app)
                    .put('/api/v1/onboarding')
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        languageId: 1,

                        selfAssessedDifficultyId:
                            2,

                        learningGoal:
                            'career_preparation',

                        weeklyTimeCommitment:
                            'five_to_ten',

                        learningStyle:
                            'practical',

                        technologyInterestKeys: [
                            'javascript',
                            'react',
                            'nodejs',
                        ],

                        projectIdea:
                            'Crear una aplicación web',
                    });

            assert.equal(
                onboardingResponse.status,
                200,
                JSON.stringify(
                    onboardingResponse.body,
                    null,
                    2,
                ),
            );

            const diagnosticResponse =
                await request(app)
                    .post('/api/v1/diagnostics')
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    )
                    .send({});

            assert.equal(
                diagnosticResponse.status,
                201,
            );

            const diagnostic =
                diagnosticResponse.body.data;

            const assessmentId =
                diagnostic.assessment.id;

            const storedQuestions =
                await databasePool.query({
                    text: `
                    SELECT
                        id,
                        technology_key,
                        expected_answer,
                        position
                        FROM diagnostic_questions
                        WHERE assessment_id = $1
                            AND user_id = $2
                        ORDER BY position
                    `,
                    values: [
                        assessmentId,
                        user.id,
                    ],
                });

            assert.equal(
                storedQuestions.rows.length,
                12,
            );

            assert.equal(
                diagnostic.questions.length,
                storedQuestions.rows.length,
            );

            storedQuestions.rows.forEach(
                (question, index) => {
                    assert.equal(
                        diagnostic
                            .questions[index]
                            .technologyKey,
                        question.technology_key,
                    );
                },
            );

            let finalResponse;

            for (
                let index = 0;
                index < storedQuestions.rows.length;
                index += 1
            ) {
                const question =
                    storedQuestions.rows[index];

                const shouldBeCorrect =
                    index < 9;

                const answer = shouldBeCorrect
                    ? question.expected_answer
                    : '__incorrect_answer__';

                const response =
                    await request(app)
                        .post(
                            `/api/v1/diagnostics/${assessmentId}/responses`,
                        )
                        .set(
                            'Authorization',
                            `Bearer ${accessToken}`,
                        )
                        .send({
                            questionId:
                                question.id,
                            answer,
                        });

                assert.equal(
                    response.status,
                    201,
                );

                assert.equal(
                    response
                        .body
                        .data
                        .response
                        .isCorrect,
                    shouldBeCorrect,
                );

                assert.equal(
                    response
                        .body
                        .data
                        .progress
                        .answeredCount,
                    index + 1,
                );

                finalResponse = response;
            }

            const completion =
                finalResponse
                    .body
                    .data
                    .completion;

            assert.ok(completion);

            assert.equal(
                completion.status,
                'completed',
            );

            assert.equal(
                completion.overallScore,
                75,
            );

            assert.equal(
                completion
                    .resultingDifficulty
                    .id,
                2,
            );

            assert.equal(
                completion
                    .resultingDifficulty
                    .name,
                'intermedio',
            );

            const assessmentResult =
                await databasePool.query({
                    text: `
                        SELECT
                            status,
                            question_count,
                            answered_count,
                            overall_score,
                            resulting_difficulty_id,
                            completed_at
                        FROM diagnostic_assessments
                        WHERE id = $1
                    `,
                    values: [assessmentId],
                });

            const assessment =
                assessmentResult.rows[0];

            assert.equal(
                assessment.status,
                'completed',
            );

            assert.equal(
                assessment.question_count,
                12,
            );

            assert.equal(
                assessment.answered_count,
                12,
            );

            assert.equal(
                Number(
                    assessment.overall_score,
                ),
                75,
            );

            assert.equal(
                assessment
                    .resulting_difficulty_id,
                2,
            );

            assert.ok(assessment.completed_at);

            const profileResult =
                await databasePool.query({
                    text: `
                        SELECT
                            current_difficulty_id,
                            diagnostic_completed_at,
                            last_diagnostic_assessment_id
                        FROM learning_profiles
                        WHERE user_id = $1
                    `,
                    values: [user.id],
                });

            assert.equal(
                profileResult.rows.length,
                1,
            );

            assert.equal(
                profileResult
                    .rows[0]
                    .current_difficulty_id,
                2,
            );

            assert.equal(
                profileResult
                    .rows[0]
                    .last_diagnostic_assessment_id,
                assessmentId,
            );

            assert.ok(
                profileResult
                    .rows[0]
                    .diagnostic_completed_at,
            );

            const knowledgeResult =
                await databasePool.query({
                    text: `
                        SELECT
                            COUNT(*) AS topic_count,
                            SUM(
                                attempts_count
                            ) AS total_attempts,
                            MIN(
                                mastery_score
                            ) AS minimum_mastery,
                            MAX(
                                mastery_score
                            ) AS maximum_mastery
                        FROM knowledge_states
                        WHERE user_id = $1
                    `,
                    values: [user.id],
                });

            assert.equal(
                Number(
                    knowledgeResult
                        .rows[0]
                        .topic_count,
                ),
                5,
            );

            assert.equal(
                Number(
                    knowledgeResult
                        .rows[0]
                        .total_attempts,
                ),
                12,
            );

            assert.ok(
                Number(
                    knowledgeResult
                        .rows[0]
                        .minimum_mastery,
                ) >= 0,
            );

            assert.ok(
                Number(
                    knowledgeResult
                        .rows[0]
                        .maximum_mastery,
                ) <= 100,
            );

            const finishedResponse =
                await request(app)
                    .post(
                        `/api/v1/diagnostics/${assessmentId}/responses`,
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        questionId:
                            storedQuestions
                                .rows[0]
                                .id,
                        answer:
                            storedQuestions
                                .rows[0]
                                .expected_answer,
                    });

            assert.equal(
                finishedResponse.status,
                409,
            );

            assert.equal(
                finishedResponse.body.code,
                'DIAGNOSTIC_NOT_IN_PROGRESS',
            );

            // =========================================
            // Recorrido inicial de cinco pantallas
            // =========================================

            // Recuperar el contexto de un estudiante
            // que ya completó su diagnóstico.

            const planContext =
                await getLearningPlanContext({
                    userId: user.id,
                });

            assert.equal(
                planContext.state,
                'ready',
            );

            assert.ok(
                planContext.topics.length >= 3,
            );

            // Preparar un plan recomendado de prueba.
            // No se realiza ninguna llamada a OpenAI.

            const generatedPlan =
                await saveGeneratedLearningPath({
                    userId: user.id,
                    context: planContext,

                    generation: {
                        provider: 'openai',
                        model: 'integration-fixture',

                        plan: {
                            specializationKey:
                                'frontend',

                            title:
                                'Plan recomendado de integración',

                            description:
                                'Plan de prueba para validar el recorrido inicial.',

                            reason:
                                'Basado en el diagnóstico completado.',

                            estimatedWeeks: 6,

                            steps:
                                planContext.topics
                                    .slice(0, 3)
                                    .map((topic, index) => ({
                                        topicId: topic.id,

                                        title:
                                            `Etapa ${index + 1}: ${topic.name}`,

                                        description:
                                            'Contenido de prueba del recorrido.',
                                    })),
                        },
                    },
                });

            assert.ok(generatedPlan.id);

            assert.equal(
                generatedPlan.confirmedAt,
                null,
            );

            // El plan existe, pero no está confirmado.

            const currentPlanResponse =
                await request(app)
                    .get(
                        '/api/v1/learning-paths/current',
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    );

            assert.equal(
                currentPlanResponse.status,
                200,
            );

            assert.equal(
                currentPlanResponse.body.data.state,
                'recommended',
            );

            // =========================================
            // Primera finalización: HTTP 200
            // =========================================

            const firstFlowResponse =
                await request(app)
                    .put(
                        '/api/v1/onboarding/learning-flow/complete',
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    );

            assert.equal(
                firstFlowResponse.status,
                200,
                JSON.stringify(firstFlowResponse.body),
            );

            assert.equal(
                firstFlowResponse.body.data.state,
                'completed',
            );

            const firstCompletedAt =
                firstFlowResponse.body.data.completedAt;

            assert.ok(firstCompletedAt);

            // =========================================
            // Segunda finalización: misma fecha
            // =========================================

            const secondFlowResponse =
                await request(app)
                    .put(
                        '/api/v1/onboarding/learning-flow/complete',
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    );

            assert.equal(
                secondFlowResponse.status,
                200,
            );

            assert.equal(
                secondFlowResponse.body.data.state,
                'completed',
            );

            assert.equal(
                secondFlowResponse.body.data.completedAt,
                firstCompletedAt,
            );

            // =========================================
            // Verificar persistencia real
            // =========================================

            const storedFlow =
                await databasePool.query({
                    text: `
                        SELECT
                            completed_at,
                            learning_flow_completed_at
                        FROM student_onboarding_profiles
                        WHERE user_id = $1
                    `,
                    values: [user.id],
                });

            assert.equal(
                storedFlow.rows.length,
                1,
            );

            assert.ok(
                storedFlow.rows[0].completed_at,
            );

            assert.equal(
                storedFlow.rows[0]
                    .learning_flow_completed_at
                    .toISOString(),
                firstCompletedAt,
            );

            // =========================================
            // No confirmar el plan recomendado
            // =========================================

            const storedPlan =
                await databasePool.query({
                    text: `
                        SELECT confirmed_at
                        FROM learning_paths
                        WHERE id = $1
                    `,
                    values: [generatedPlan.id],
                });

            assert.equal(
                storedPlan.rows.length,
                1,
            );

            assert.equal(
                storedPlan.rows[0].confirmed_at,
                null,
            );

            // =========================================
            // No seleccionar una especialización
            // =========================================

            const selectedRoute =
                await databasePool.query({
                    text: `
                        SELECT COUNT(*)::integer AS total
                        FROM student_route_selections
                        WHERE user_id = $1
                    `,
                    values: [user.id],
                });

            assert.equal(
                selectedRoute.rows[0].total,
                0,
            );

        } finally {
            try {
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
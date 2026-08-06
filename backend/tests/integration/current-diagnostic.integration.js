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

test(
    'GET /api/v1/diagnostics/current returns the diagnostic state',
    async () => {
        const email =
            `current-diagnostic-${randomUUID()}@example.test`;

        const password =
            'Learn2Code-Current-Diagnostic-2026!';

        try {
            const registrationResponse =
                await request(app)
                    .post('/api/v1/auth/register')
                    .send({
                        fullName:
                            'Current Diagnostic Student',
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

            const accessToken =
                registrationResponse
                    .body
                    .data
                    .accessToken;

            const initialResponse =
                await request(app)
                    .get(
                        '/api/v1/diagnostics/current',
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    );

            assert.equal(
                initialResponse.status,
                200,
            );

            assert.equal(
                initialResponse.body.data.state,
                'not_started',
            );

            assert.equal(
                initialResponse
                    .body
                    .data
                    .assessment,
                null,
            );

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
                            'programming_fundamentals',

                        studyPace:
                            'student',

                        interestKeys: [
                            'video_games',
                            'music',
                        ],

                        topicIds: [
                            1,
                            2,
                            3,
                            4,
                            5,
                        ],
                    });

            assert.equal(
                onboardingResponse.status,
                200,
            );

            const startResponse =
                await request(app)
                    .post('/api/v1/diagnostics')
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    )
                    .send({});

            assert.equal(
                startResponse.status,
                201,
            );

            const assessmentId =
                startResponse
                    .body
                    .data
                    .assessment
                    .id;

            const storedQuestions =
                await databasePool.query({
                    text: `
                        SELECT
                            id,
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

            const firstQuestion =
                storedQuestions.rows[0];

            const firstAnswerResponse =
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
                            firstQuestion.id,
                        answer:
                            firstQuestion
                                .expected_answer,
                    });

            assert.equal(
                firstAnswerResponse.status,
                201,
            );

            const activeResponse =
                await request(app)
                    .get(
                        '/api/v1/diagnostics/current',
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    );

            assert.equal(
                activeResponse.status,
                200,
            );

            assert.equal(
                activeResponse.body.data.state,
                'in_progress',
            );

            assert.equal(
                activeResponse
                    .body
                    .data
                    .assessment
                    .answeredCount,
                1,
            );

            assert.equal(
                activeResponse
                    .body
                    .data
                    .questions[0]
                    .response
                    .isCorrect,
                true,
            );

            assert.equal(
                'expectedAnswer'
                in activeResponse
                    .body
                    .data
                    .questions[0],
                false,
            );

            for (
                let index = 1;
                index < storedQuestions.rows.length;
                index += 1
            ) {
                const question =
                    storedQuestions.rows[index];

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
                            answer:
                                question
                                    .expected_answer,
                        });

                assert.equal(
                    response.status,
                    201,
                );
            }

            const completedResponse =
                await request(app)
                    .get(
                        '/api/v1/diagnostics/current',
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    );

            assert.equal(
                completedResponse.status,
                200,
            );

            assert.equal(
                completedResponse
                    .body
                    .data
                    .state,
                'completed',
            );

            assert.equal(
                completedResponse
                    .body
                    .data
                    .result
                    .overallScore,
                100,
            );

            assert.equal(
                completedResponse
                    .body
                    .data
                    .result
                    .resultingDifficulty
                    .name,
                'avanzado',
            );

            assert.equal(
                completedResponse
                    .body
                    .data
                    .assessment
                    .answeredCount,
                8,
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
                await closeDatabaseConnection();
            }
        }
    },
);
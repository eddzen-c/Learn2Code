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
    'diagnostic responses are evaluated and stored',
    async () => {
        const email =
            `diagnostic-response-${randomUUID()}@example.test`;

        const password =
            'Learn2Code-Responses-2026!';

        try {
            const registrationResponse =
                await request(app)
                    .post('/api/v1/auth/register')
                    .send({
                        fullName:
                            'Diagnostic Response Student',
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

            const firstQuestion =
                diagnostic.questions[0];

            const secondQuestion =
                diagnostic.questions[1];

            const expectedAnswers =
                await databasePool.query({
                    text: `
                        SELECT
                            id,
                            expected_answer
                        FROM diagnostic_questions
                        WHERE id = ANY($1::UUID[])
                        ORDER BY position
                    `,
                    values: [[
                        firstQuestion.id,
                        secondQuestion.id,
                    ]],
                });

            assert.equal(
                expectedAnswers.rows.length,
                2,
            );

            const correctAnswer =
                expectedAnswers
                    .rows[0]
                    .expected_answer;

            const correctResponse =
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
                            correctAnswer,
                    });

            assert.equal(
                correctResponse.status,
                201,
            );

            assert.equal(
                correctResponse
                    .body
                    .data
                    .response
                    .isCorrect,
                true,
            );

            assert.equal(
                correctResponse
                    .body
                    .data
                    .response
                    .score,
                100,
            );

            assert.equal(
                correctResponse
                    .body
                    .data
                    .progress
                    .answeredCount,
                1,
            );

            const incorrectResponse =
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
                            secondQuestion.id,
                        answer:
                            '__incorrect_answer__',
                    });

            assert.equal(
                incorrectResponse.status,
                201,
            );

            assert.equal(
                incorrectResponse
                    .body
                    .data
                    .response
                    .isCorrect,
                false,
            );

            assert.equal(
                incorrectResponse
                    .body
                    .data
                    .response
                    .score,
                0,
            );

            assert.equal(
                incorrectResponse
                    .body
                    .data
                    .progress
                    .answeredCount,
                2,
            );

            const duplicateResponse =
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
                            correctAnswer,
                    });

            assert.equal(
                duplicateResponse.status,
                409,
            );

            assert.equal(
                duplicateResponse.body.code,
                'DIAGNOSTIC_QUESTION_ALREADY_ANSWERED',
            );

            const storedResponses =
                await databasePool.query({
                    text: `
                        SELECT
                            COUNT(*) AS response_count,
                            COUNT(*) FILTER (
                                WHERE status = 'evaluated'
                            ) AS evaluated_count
                        FROM diagnostic_responses
                        WHERE user_id = $1
                    `,
                    values: [user.id],
                });

            assert.equal(
                Number(
                    storedResponses
                        .rows[0]
                        .response_count,
                ),
                2,
            );

            assert.equal(
                Number(
                    storedResponses
                        .rows[0]
                        .evaluated_count,
                ),
                2,
            );

            const storedAssessment =
                await databasePool.query({
                    text: `
                        SELECT
                            answered_count,
                            question_count,
                            status
                        FROM diagnostic_assessments
                        WHERE id = $1
                    `,
                    values: [assessmentId],
                });

            assert.equal(
                storedAssessment
                    .rows[0]
                    .answered_count,
                2,
            );

            assert.equal(
                storedAssessment
                    .rows[0]
                    .question_count,
                8,
            );

            assert.equal(
                storedAssessment
                    .rows[0]
                    .status,
                'in_progress',
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
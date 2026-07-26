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
    'POST /api/v1/diagnostics creates a personalized diagnostic',
    async () => {
        const email =
            `diagnostic-${randomUUID()}@example.test`;

        const password =
            'Learn2Code-Diagnostic-2026!';

        try {
            const registrationResponse =
                await request(app)
                    .post('/api/v1/auth/register')
                    .send({
                        fullName:
                            'Diagnostic Student',
                        email,
                        password,
                    });

            assert.equal(
                registrationResponse.status,
                201,
            );

            const accessToken =
                registrationResponse
                    .body
                    .data
                    .accessToken;

            const userId =
                registrationResponse
                    .body
                    .data
                    .user
                    .id;

            const diagnosticResponse =
                await request(app)
                    .post('/api/v1/diagnostics')
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        languageId: 1,
                    });

            assert.equal(
                diagnosticResponse.status,
                201,
            );

            assert.equal(
                diagnosticResponse.body.status,
                'success',
            );

            const diagnostic =
                diagnosticResponse.body.data;

            assert.equal(
                diagnostic.assessment.status,
                'in_progress',
            );

            assert.equal(
                diagnostic.assessment.questionCount,
                8,
            );

            assert.equal(
                diagnostic.assessment.answeredCount,
                0,
            );

            assert.equal(
                diagnostic.language.name,
                'JavaScript',
            );

            assert.equal(
                diagnostic.questions.length,
                8,
            );

            assert.equal(
                diagnostic.generation.provider,
                'mock',
            );

            assert.equal(
                diagnostic.generation.simulated,
                true,
            );

            diagnostic.questions.forEach(
                (question, index) => {
                    assert.equal(
                        question.position,
                        index + 1,
                    );

                    assert.equal(
                        'expectedAnswer'
                        in question,
                        false,
                    );

                    assert.equal(
                        'evaluationCriteria'
                        in question,
                        false,
                    );

                    assert.equal(
                        'explanation'
                        in question,
                        false,
                    );

                    assert.ok(
                        question.options.length
                        >= 2,
                    );
                },
            );

            const assessmentResult =
                await databasePool.query({
                    text: `
                        SELECT
                            id,
                            status,
                            question_count,
                            answered_count,
                            model_name,
                            generation_metadata
                        FROM diagnostic_assessments
                        WHERE user_id = $1
                    `,
                    values: [userId],
                });

            assert.equal(
                assessmentResult.rows.length,
                1,
            );

            const assessment =
                assessmentResult.rows[0];

            assert.equal(
                assessment.status,
                'in_progress',
            );

            assert.equal(
                assessment.question_count,
                8,
            );

            assert.equal(
                assessment.answered_count,
                0,
            );

            assert.equal(
                assessment.model_name,
                'learn2code-mock-diagnostic-v1',
            );

            assert.equal(
                assessment
                    .generation_metadata
                    .provider,
                'mock',
            );

            const questionResult =
                await databasePool.query({
                    text: `
                        SELECT
                            COUNT(*) AS question_count,
                            COUNT(
                                DISTINCT
                                content_fingerprint
                            ) AS unique_questions
                        FROM diagnostic_questions
                        WHERE assessment_id = $1
                          AND user_id = $2
                    `,
                    values: [
                        assessment.id,
                        userId,
                    ],
                });

            assert.equal(
                Number(
                    questionResult
                        .rows[0]
                        .question_count,
                ),
                8,
            );

            assert.equal(
                Number(
                    questionResult
                        .rows[0]
                        .unique_questions,
                ),
                8,
            );

            const duplicateResponse =
                await request(app)
                    .post('/api/v1/diagnostics')
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        languageId: 1,
                    });

            assert.equal(
                duplicateResponse.status,
                409,
            );

            assert.equal(
                duplicateResponse.body.code,
                'ACTIVE_DIAGNOSTIC_ASSESSMENT',
            );

            const unauthorizedResponse =
                await request(app)
                    .post('/api/v1/diagnostics')
                    .send({
                        languageId: 1,
                    });

            assert.equal(
                unauthorizedResponse.status,
                401,
            );

            assert.equal(
                unauthorizedResponse.body.code,
                'AUTHENTICATION_REQUIRED',
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
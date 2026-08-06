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
    'completing a diagnostic updates the learning profile',
    async () => {
        const email =
            `diagnostic-completion-${randomUUID()}@example.test`;

        const password =
            'Learn2Code-Completion-2026!';

        try {
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
                8,
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
                    index < 6;

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
                8,
            );

            assert.equal(
                assessment.answered_count,
                8,
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
                8,
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
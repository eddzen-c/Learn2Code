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
    'student onboarding stores the preferences used by the diagnostic',
    async () => {
        const email =
            `onboarding-${randomUUID()}@example.test`;

        const password =
            'Learn2Code-Onboarding-2026!';

        try {
            const registrationResponse =
                await request(app)
                    .post(
                        '/api/v1/auth/register',
                    )
                    .send({
                        fullName:
                            'Onboarding Student',
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

            const authorization =
                `Bearer ${accessToken}`;

            const optionsResponse =
                await request(app)
                    .get(
                        '/api/v1/onboarding/options',
                    )
                    .set(
                        'Authorization',
                        authorization,
                    );

            assert.equal(
                optionsResponse.status,
                200,
            );

            assert.equal(
                optionsResponse.body.status,
                'success',
            );

            assert.equal(
                optionsResponse
                    .body
                    .data
                    .languages
                    .length,
                2,
            );

            assert.equal(
                optionsResponse
                    .body
                    .data
                    .difficulties
                    .length,
                3,
            );

            assert.equal(
                optionsResponse
                    .body
                    .data
                    .topics
                    .length,
                5,
            );

            assert.ok(
                optionsResponse
                    .body
                    .data
                    .learningGoals
                    .includes(
                        'web_development',
                    ),
            );

            assert.ok(
                optionsResponse
                    .body
                    .data
                    .interests
                    .includes(
                        'video_games',
                    ),
            );

            assert.deepEqual(
                optionsResponse
                    .body
                    .data
                    .studyPaces,
                [
                    'casual',
                    'student',
                    'intensive',
                ],
            );

            const pendingResponse =
                await request(app)
                    .get(
                        '/api/v1/onboarding/current',
                    )
                    .set(
                        'Authorization',
                        authorization,
                    );

            assert.equal(
                pendingResponse.status,
                200,
            );

            assert.equal(
                pendingResponse
                    .body
                    .data
                    .state,
                'pending',
            );

            assert.equal(
                pendingResponse
                    .body
                    .data
                    .onboarding,
                null,
            );

            const completionResponse =
                await request(app)
                    .put(
                        '/api/v1/onboarding',
                    )
                    .set(
                        'Authorization',
                        authorization,
                    )
                    .send({
                        languageId: 1,

                        selfAssessedDifficultyId:
                            2,

                        learningGoal:
                            'web_development',

                        studyPace:
                            'student',

                        interestKeys: [
                            'video_games',
                            'music',
                        ],

                        topicIds: [
                            1,
                            4,
                        ],
                    });

            assert.equal(
                completionResponse.status,
                200,
            );

            assert.equal(
                completionResponse
                    .body
                    .data
                    .state,
                'completed',
            );

            const completedOnboarding =
                completionResponse
                    .body
                    .data
                    .onboarding;

            assert.equal(
                completedOnboarding
                    .language
                    .name,
                'JavaScript',
            );

            assert.equal(
                completedOnboarding
                    .selfAssessedDifficulty
                    .name,
                'intermedio',
            );

            assert.equal(
                completedOnboarding
                    .learningGoal,
                'web_development',
            );

            assert.equal(
                completedOnboarding
                    .studyPace,
                'student',
            );

            assert.deepEqual(
                completedOnboarding
                    .interestKeys,
                [
                    'music',
                    'video_games',
                ],
            );

            assert.deepEqual(
                completedOnboarding
                    .topics
                    .map(
                        (topic) => topic.id,
                    ),
                [
                    1,
                    4,
                ],
            );

            const storedResult =
                await databasePool.query({
                    text: `
                        SELECT
                            student
                                .preferred_programming_language_id,
                            onboarding
                                .self_assessed_difficulty_id,
                            onboarding
                                .learning_goal,
                            COUNT(
                                onboarding_topic.topic_id
                            ) AS topic_count
                        FROM users
                            AS student

                        INNER JOIN
                            student_onboarding_profiles
                            AS onboarding
                            ON onboarding.user_id
                                = student.id

                        LEFT JOIN
                            student_onboarding_topics
                            AS onboarding_topic
                            ON onboarding_topic.user_id
                                = onboarding.user_id

                        WHERE student.id = $1

                        GROUP BY
                            student
                                .preferred_programming_language_id,
                            onboarding
                                .self_assessed_difficulty_id,
                            onboarding
                                .learning_goal
                    `,
                    values: [userId],
                });

            assert.equal(
                storedResult.rows.length,
                1,
            );

            assert.equal(
                storedResult
                    .rows[0]
                    .preferred_programming_language_id,
                1,
            );

            assert.equal(
                storedResult
                    .rows[0]
                    .self_assessed_difficulty_id,
                2,
            );

            assert.equal(
                storedResult
                    .rows[0]
                    .learning_goal,
                'web_development',
            );

            assert.equal(
                Number(
                    storedResult
                        .rows[0]
                        .topic_count,
                ),
                2,
            );

            const currentResponse =
                await request(app)
                    .get(
                        '/api/v1/onboarding/current',
                    )
                    .set(
                        'Authorization',
                        authorization,
                    );

            assert.equal(
                currentResponse.status,
                200,
            );

            assert.equal(
                currentResponse
                    .body
                    .data
                    .state,
                'completed',
            );

            const invalidResponse =
                await request(app)
                    .put(
                        '/api/v1/onboarding',
                    )
                    .set(
                        'Authorization',
                        authorization,
                    )
                    .send({
                        languageId: 1,

                        selfAssessedDifficultyId:
                            1,

                        learningGoal:
                            'web_development',

                        studyPace:
                            'student',

                        interestKeys: [
                            'video_games',
                            'music',
                        ],

                        topicIds: [
                            999,
                        ],
                    });

            assert.equal(
                invalidResponse.status,
                400,
            );

            assert.equal(
                invalidResponse.body.code,
                'UNSUPPORTED_ONBOARDING_TOPIC',
            );

            const unauthorizedResponse =
                await request(app)
                    .get(
                        '/api/v1/onboarding/current',
                    );

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
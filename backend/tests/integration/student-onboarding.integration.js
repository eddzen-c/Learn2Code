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
                        'career_preparation',
                    ),
            );

            assert.ok(
                optionsResponse
                    .body
                    .data
                    .technologyInterests
                    .includes(
                        'react',
                    ),
            );

            assert.deepEqual(
                optionsResponse
                    .body
                    .data
                    .weeklyTimeCommitments,
                [
                    'less_than_5',
                    'five_to_ten',
                    'ten_to_twenty',
                    'more_than_twenty',
                ],
            );

            assert.deepEqual(
                optionsResponse
                    .body
                    .data
                    .learningStyles,
                [
                    'practical',
                    'visual',
                    'reading',
                    'guided',
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
                'career_preparation',
            );

            assert.equal(
                completedOnboarding
                    .studyPace,
                'student',
            );

            assert.equal(
                completedOnboarding
                    .weeklyTimeCommitment,
                'five_to_ten',
            );

            assert.equal(
                completedOnboarding
                    .learningStyle,
                'practical',
            );

            assert.equal(
                completedOnboarding
                    .projectIdea,
                'Crear una aplicación web',
            );

            assert.deepEqual(
                completedOnboarding
                    .technologyInterestKeys,
                [
                    'javascript',
                    'nodejs',
                    'react',
                ],
            );

            assert.deepEqual(
                completedOnboarding
                    .interestKeys,
                [],
            );

            assert.deepEqual(
                completedOnboarding
                    .topics
                    .map(
                        (topic) => topic.id,
                    ),
                [
                    1,
                    2,
                    3,
                    4,
                    5,
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

                            onboarding.learning_goal,
                            onboarding.study_pace,

                            onboarding
                                .weekly_time_commitment,

                            onboarding.learning_style,
                            onboarding.project_idea,

                            (
                                SELECT COUNT(*)
                                FROM
                                    student_onboarding_topics
                                        AS stored_topic
                                WHERE stored_topic.user_id
                                    = onboarding.user_id
                            ) AS topic_count,

                            (
                                SELECT COUNT(*)
                                FROM
                                    student_onboarding_technology_interests
                                        AS stored_technology
                                WHERE stored_technology.user_id
                                    = onboarding.user_id
                            ) AS technology_count

                        FROM users AS student

                        INNER JOIN
                            student_onboarding_profiles
                                AS onboarding
                            ON onboarding.user_id
                                = student.id

                        WHERE student.id = $1
                    `,
                    values: [userId],
                });

            assert.equal(
                storedResult.rows.length,
                1,
            );

            const storedOnboarding =
                storedResult.rows[0];

            assert.equal(
                storedOnboarding
                    .preferred_programming_language_id,
                1,
            );

            assert.equal(
                storedOnboarding
                    .self_assessed_difficulty_id,
                2,
            );

            assert.equal(
                storedOnboarding.learning_goal,
                'career_preparation',
            );

            assert.equal(
                storedOnboarding.study_pace,
                'student',
            );

            assert.equal(
                storedOnboarding
                    .weekly_time_commitment,
                'five_to_ten',
            );

            assert.equal(
                storedOnboarding.learning_style,
                'practical',
            );

            assert.equal(
                storedOnboarding.project_idea,
                'Crear una aplicación web',
            );

            assert.equal(
                Number(
                    storedOnboarding.topic_count,
                ),
                5,
            );

            assert.equal(
                Number(
                    storedOnboarding
                        .technology_count,
                ),
                3,
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
                            'career_preparation',

                        weeklyTimeCommitment:
                            'five_to_ten',

                        learningStyle:
                            'practical',

                        technologyInterestKeys: [
                            'javascript',
                            'python',
                            'react',
                            'nodejs',
                        ],

                        projectIdea: null,
                    });

            assert.equal(
                invalidResponse.status,
                400,
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
import {
    databasePool,
} from '../../../config/database.js';

const mapTopic = (topic) => (
    Object.freeze({
        id: topic.id,
        name: topic.name,
        description:
            topic.description,
    })
);

const mapStudentOnboarding = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        userId: row.user_id,

        language: Object.freeze({
            id: row.language_id,
            name: row.language_name,
            fileExtension:
                row.language_file_extension,
        }),

        selfAssessedDifficulty:
            Object.freeze({
                id: row.difficulty_id,
                name: row.difficulty_name,
            }),

        learningGoal:
            row.learning_goal,

        studyPace:
            row.study_pace,

        interestKeys: Object.freeze([
            ...row.interest_keys,
        ]),

        topics: Object.freeze(
            row.topics.map(mapTopic),
        ),

        completedAt:
            row.completed_at,

        createdAt:
            row.created_at,

        updatedAt:
            row.updated_at,
    });
};

export const findStudentOnboardingByUserId =
    async ({
        userId,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                SELECT
                    onboarding.user_id,
                    onboarding.learning_goal,
                    onboarding.study_pace,
                    onboarding.completed_at,
                    onboarding.created_at,
                    onboarding.updated_at,

                    language.id
                        AS language_id,
                    language.name
                        AS language_name,
                    language.file_extension
                        AS language_file_extension,

                    difficulty.id
                        AS difficulty_id,
                    difficulty.name
                        AS difficulty_name,

                    COALESCE(
                        (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                    topic.id,
                                    'name',
                                    topic.name,
                                    'description',
                                    topic.description
                                )
                                ORDER BY topic.id
                            )
                            FROM student_onboarding_topics
                                AS onboarding_topic
                            INNER JOIN topics
                                AS topic
                                ON topic.id
                                    = onboarding_topic
                                        .topic_id
                            WHERE onboarding_topic
                                .user_id
                                = onboarding.user_id
                        ),
                        '[]'::jsonb
                    ) AS topics,

                    COALESCE(
                        (
                            SELECT jsonb_agg(
                                onboarding_interest
                                    .interest_key
                                ORDER BY
                                    onboarding_interest
                                        .interest_key
                            )
                            FROM student_onboarding_interests
                                AS onboarding_interest
                            WHERE onboarding_interest
                                .user_id
                                = onboarding.user_id
                        ),
                        '[]'::jsonb
                    ) AS interest_keys

                FROM student_onboarding_profiles
                    AS onboarding

                INNER JOIN users
                    AS student
                    ON student.id
                        = onboarding.user_id

                INNER JOIN supported_languages
                    AS language
                    ON language.id
                        = student
                            .preferred_programming_language_id

                INNER JOIN difficulty_levels
                    AS difficulty
                    ON difficulty.id
                        = onboarding
                            .self_assessed_difficulty_id

                WHERE onboarding.user_id = $1
            `,
            values: [userId],
        });

        return mapStudentOnboarding(
            result.rows[0],
        );
    };

export const updateUserPreferredProgrammingLanguage =
    async ({
        userId,
        languageId,
        updatedAt,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                UPDATE users
                SET
                    preferred_programming_language_id
                        = $2,
                    updated_at = $3
                WHERE id = $1
                  AND is_active = TRUE
                  AND deleted_at IS NULL
                RETURNING id
            `,
            values: [
                userId,
                languageId,
                updatedAt,
            ],
        });

        return result.rows[0] ?? null;
    };

export const upsertStudentOnboardingProfile =
    async ({
        userId,
        selfAssessedDifficultyId,
        learningGoal,
        studyPace,
        completedAt,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                INSERT INTO
                    student_onboarding_profiles (
                        user_id,
                        self_assessed_difficulty_id,
                        learning_goal,
                        study_pace,
                        completed_at,
                        created_at,
                        updated_at
                    )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $5,
                    $5
                )

                ON CONFLICT (user_id)
                DO UPDATE SET
                    self_assessed_difficulty_id
                        = EXCLUDED
                            .self_assessed_difficulty_id,
                    learning_goal
                        = EXCLUDED.learning_goal,
                    study_pace
                        = EXCLUDED.study_pace,
                    completed_at
                        = EXCLUDED.completed_at,
                    updated_at
                        = EXCLUDED.updated_at

                RETURNING user_id
            `,
            values: [
                userId,
                selfAssessedDifficultyId,
                learningGoal,
                studyPace,
                completedAt,
            ],
        });

        return result.rows[0] ?? null;
    };

export const replaceStudentOnboardingTopics =
    async ({
        userId,
        topicIds,
        client = databasePool,
    }) => {
        await client.query({
            text: `
                DELETE FROM
                    student_onboarding_topics
                WHERE user_id = $1
            `,
            values: [userId],
        });

        const result = await client.query({
            text: `
                INSERT INTO
                    student_onboarding_topics (
                        user_id,
                        topic_id
                    )
                SELECT
                    $1,
                    selected.topic_id
                FROM unnest(
                    $2::smallint[]
                ) AS selected(topic_id)
                RETURNING topic_id
            `,
            values: [
                userId,
                topicIds,
            ],
        });

        return Object.freeze(
            result.rows.map(
                (row) => row.topic_id,
            ),
        );
    };

export const replaceStudentOnboardingInterests =
    async ({
        userId,
        interestKeys,
        client = databasePool,
    }) => {
        await client.query({
            text: `
                DELETE FROM
                    student_onboarding_interests
                WHERE user_id = $1
            `,
            values: [userId],
        });

        const result = await client.query({
            text: `
                INSERT INTO
                    student_onboarding_interests (
                        user_id,
                        interest_key
                    )
                SELECT
                    $1,
                    selected.interest_key
                FROM unnest(
                    $2::varchar[]
                ) AS selected(interest_key)
                RETURNING interest_key
            `,
            values: [
                userId,
                interestKeys,
            ],
        });

        return Object.freeze(
            result.rows.map(
                (row) => (
                    row.interest_key
                ),
            ),
        );
    };
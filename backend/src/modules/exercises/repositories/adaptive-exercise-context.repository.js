import {
    databasePool,
} from '../../../config/database.js';

const mapAdaptiveContextRow = (row) => {
    if (!row) {
        return null;
    }

    const difficulty =
        row.difficulty_id === null
            ? null
            : Object.freeze({
                id: row.difficulty_id,
                name: row.difficulty_name,
            });

    const language =
        row.language_id === null
            ? null
            : Object.freeze({
                id: row.language_id,
                name: row.language_name,
                fileExtension:
                    row.language_file_extension,
            });

    const weakestTopic =
        row.topic_id === null
            ? null
            : Object.freeze({
                id: row.topic_id,
                name: row.topic_name,
                description:
                    row.topic_description,
                masteryScore: Number(
                    row.mastery_score,
                ),
                confidenceScore: Number(
                    row.confidence_score,
                ),
                attemptsCount:
                    row.attempts_count,
            });

    return Object.freeze({
        userId: row.user_id,
        diagnosticAssessmentId:
            row.diagnostic_assessment_id,
        diagnosticCompletedAt:
            row.diagnostic_completed_at,
        difficulty,
        language,
        weakestTopic,
        generationSequence: Number(
            row.generation_sequence,
        ),
    });
};

export const findAdaptiveExerciseContextByUserId =
    async ({
        userId,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                SELECT
                    users.id AS user_id,

                    learning_profiles
                        .last_diagnostic_assessment_id
                        AS diagnostic_assessment_id,

                    learning_profiles
                        .diagnostic_completed_at,

                    difficulty_levels.id
                        AS difficulty_id,

                    difficulty_levels.name
                        AS difficulty_name,

                    supported_languages.id
                        AS language_id,

                    supported_languages.name
                        AS language_name,

                    supported_languages.file_extension
                        AS language_file_extension,

                    weakest_topic.topic_id,

                    weakest_topic.topic_name,

                    weakest_topic.topic_description,

                    weakest_topic.mastery_score,

                    weakest_topic.confidence_score,

                    weakest_topic.attempts_count,

                    (
                        SELECT COUNT(*)
                        FROM exercise_assignments
                        WHERE exercise_assignments.user_id =
                            users.id
                    ) AS generation_sequence

                FROM users

                LEFT JOIN learning_profiles
                    ON learning_profiles.user_id =
                        users.id

                LEFT JOIN diagnostic_assessments
                    ON diagnostic_assessments.id =
                        learning_profiles
                            .last_diagnostic_assessment_id
                   AND diagnostic_assessments.user_id =
                        users.id
                   AND diagnostic_assessments.status =
                        'completed'

                LEFT JOIN difficulty_levels
                    ON difficulty_levels.id =
                        learning_profiles
                            .current_difficulty_id

                LEFT JOIN supported_languages
                    ON supported_languages.id =
                        COALESCE(
                            users
                                .preferred_programming_language_id,
                            diagnostic_assessments.language_id
                        )
                   AND supported_languages.is_active =
                        TRUE

                LEFT JOIN LATERAL (
                    SELECT
                        knowledge_states.topic_id,

                        topics.name
                            AS topic_name,

                        topics.description
                            AS topic_description,

                        knowledge_states.mastery_score,

                        knowledge_states.confidence_score,

                        knowledge_states.attempts_count

                    FROM knowledge_states

                    JOIN topics
                        ON topics.id =
                            knowledge_states.topic_id
                       AND topics.is_active = TRUE

                    WHERE knowledge_states.user_id =
                        users.id

                    ORDER BY
                        knowledge_states.mastery_score,
                        knowledge_states.confidence_score,
                        knowledge_states.attempts_count,
                        knowledge_states.topic_id

                    LIMIT 1
                ) AS weakest_topic
                    ON TRUE

                WHERE users.id = $1
                  AND users.is_active = TRUE
                  AND users.deleted_at IS NULL
            `,
            values: [userId],
        });

        return mapAdaptiveContextRow(
            result.rows[0],
        );
    };
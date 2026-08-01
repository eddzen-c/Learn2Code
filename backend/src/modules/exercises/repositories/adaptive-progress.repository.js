import {
    databasePool,
} from '../../../config/database.js';

const mapExerciseProgressContextRow = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        exerciseId: row.exercise_id,

        topic: Object.freeze({
            id: row.topic_id,
            name: row.topic_name,
        }),

        difficulty: Object.freeze({
            id: row.difficulty_id,
            name: row.difficulty_name,
        }),
    });
};

export const findExerciseProgressContext =
    async ({
        exerciseId,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                SELECT
                    exercises.id AS exercise_id,

                    topics.id AS topic_id,
                    topics.name AS topic_name,

                    difficulty_levels.id
                        AS difficulty_id,

                    difficulty_levels.name
                        AS difficulty_name

                FROM exercises

                JOIN topics
                    ON topics.id =
                        exercises.topic_id

                JOIN difficulty_levels
                    ON difficulty_levels.id =
                        exercises.difficulty_id

                WHERE exercises.id = $1
                    AND exercises.status =
                        'published'
                    AND topics.is_active = TRUE
            `,
            values: [exerciseId],
        });

        return mapExerciseProgressContextRow(
            result.rows[0],
        );
    };

const mapKnowledgeStateRow = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        id: row.id,
        userId: row.user_id,
        topicId: row.topic_id,

        masteryScore: Number(
            row.mastery_score,
        ),

        confidenceScore: Number(
            row.confidence_score,
        ),

        attemptsCount:
            row.attempts_count,

        lastEvaluatedAt:
            row.last_evaluated_at,
    });
};

export const updateKnowledgeStateFromExerciseAttempt =
    async ({
        userId,
        topicId,
        score,
        evaluatedAt = new Date(),
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                INSERT INTO knowledge_states (
                    user_id,
                    topic_id,
                    mastery_score,
                    confidence_score,
                    attempts_count,
                    last_evaluated_at
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    20,
                    1,
                    $4
                )

                ON CONFLICT (
                    user_id,
                    topic_id
                )
                DO UPDATE SET
                    mastery_score =
                        ROUND(
                            LEAST(
                                100,
                                GREATEST(
                                    0,
                                    (
                                        knowledge_states
                                            .mastery_score
                                        * 0.75
                                    )
                                    + (
                                        EXCLUDED
                                            .mastery_score
                                        * 0.25
                                    )
                                )
                            ),
                            2
                        ),

                    confidence_score =
                        LEAST(
                            100,
                            knowledge_states
                                .confidence_score
                            + 5
                        ),

                    attempts_count =
                        knowledge_states
                            .attempts_count
                        + 1,

                    last_evaluated_at =
                        EXCLUDED
                            .last_evaluated_at

                RETURNING
                    id,
                    user_id,
                    topic_id,
                    mastery_score,
                    confidence_score,
                    attempts_count,
                    last_evaluated_at
            `,
            values: [
                userId,
                topicId,
                score,
                evaluatedAt,
            ],
        });

        return mapKnowledgeStateRow(
            result.rows[0],
        );
    };

const mapXpTransactionRow = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        id: row.id,
        userId: row.user_id,
        amount: row.amount,
        reason: row.reason,
        sourceType: row.source_type,
        sourceId: row.source_id,

        metadata: Object.freeze({
            ...(row.metadata ?? {}),
        }),

        createdAt: row.created_at,
    });
};

const mapUserXpRow = (row) => {
    if (!row) {
        return null
    }

    return Object.freeze({
        userId: row.user_id,
        totalXp: row.total_xp,
        currentLevelId:
            row.current_level_id,
        updatedAt: row.updated_at,
    })
}

const mapStreakRow = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        userId: row.user_id,
        currentStreak: row.current_streak,
        longestStreak: row.longest_streak,
        lastActiveDate: row.last_active_date,
    });
};

export const createExerciseCompletionXpTransaction =
    async ({
        userId,
        assignmentId,
        exerciseId,
        difficultyName,
        amount,
        awardedAt = new Date(),
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                INSERT INTO xp_transactions (
                    user_id,
                    amount,
                    reason,
                    source_type,
                    source_id,
                    metadata,
                    created_at
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    'exercise_assignment',
                    $4,
                    $5,
                    $6
                )

                ON CONFLICT (
                    user_id,
                    source_type,
                    source_id
                )
                WHERE source_type =
                    'exercise_assignment'
                    AND source_id IS NOT NULL
                DO NOTHING

                RETURNING
                    id,
                    user_id,
                    amount,
                    reason,
                    source_type,
                    source_id,
                    metadata,
                    created_at
            `,
            values: [
                userId,
                amount,
                'Ejercicio personalizado completado',
                assignmentId,
                {
                    exerciseId,
                    difficulty:
                        difficultyName,
                },
                awardedAt,
            ],
        });

        return mapXpTransactionRow(
            result.rows[0],
        );
    };

export const updateUserXpFromExerciseCompletion =
    async ({
        userId,
        amount,
        updatedAt = new Date(),
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                INSERT INTO user_xp (
                    user_id,
                    total_xp,
                    current_level_id,
                    updated_at
                )
                VALUES (
                    $1,
                    $2,
                    (
                        SELECT levels.id
                        FROM levels
                        WHERE levels.min_xp <= $2
                        ORDER BY levels.min_xp DESC
                        LIMIT 1
                    ),
                    $3
                )

                ON CONFLICT (user_id)
                DO UPDATE SET
                    total_xp =
                        user_xp.total_xp
                        + EXCLUDED.total_xp,

                    current_level_id = (
                        SELECT levels.id
                        FROM levels
                        WHERE levels.min_xp <=
                            (
                                user_xp.total_xp
                                + EXCLUDED.total_xp
                            )
                        ORDER BY levels.min_xp DESC
                        LIMIT 1
                    ),

                    updated_at =
                        EXCLUDED.updated_at

                RETURNING
                    user_id,
                    total_xp,
                    current_level_id,
                    updated_at
            `,
            values: [
                userId,
                amount,
                updatedAt,
            ],
        })

        return mapUserXpRow(
            result.rows[0],
        )
    }

export const updateUserStreakFromExerciseCompletion =
    async ({
        userId,
        activeDate,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                INSERT INTO streaks (
                    user_id,
                    current_streak,
                    longest_streak,
                    last_active_date
                )
                VALUES ($1, 1, 1, $2)

                ON CONFLICT (user_id)
                DO UPDATE SET
                    current_streak = CASE
                        WHEN streaks.last_active_date IS NULL
                            THEN 1

                        WHEN EXCLUDED.last_active_date
                            <= streaks.last_active_date
                            THEN streaks.current_streak

                        WHEN EXCLUDED.last_active_date
                            = streaks.last_active_date + 1
                            THEN streaks.current_streak + 1

                        ELSE 1
                    END,

                    longest_streak = GREATEST(
                        streaks.longest_streak,

                        CASE
                            WHEN streaks.last_active_date IS NULL
                                THEN 1

                            WHEN EXCLUDED.last_active_date
                                <= streaks.last_active_date
                                THEN streaks.current_streak

                            WHEN EXCLUDED.last_active_date
                                = streaks.last_active_date + 1
                                THEN streaks.current_streak + 1

                            ELSE 1
                        END
                    ),

                    last_active_date = CASE
                        WHEN streaks.last_active_date IS NULL
                            OR EXCLUDED.last_active_date
                                > streaks.last_active_date
                            THEN EXCLUDED.last_active_date

                        ELSE streaks.last_active_date
                    END

                RETURNING
                    user_id,
                    current_streak,
                    longest_streak,
                    last_active_date
            `,
            values: [
                userId,
                activeDate,
            ],
        });

        return mapStreakRow(
            result.rows[0],
        );
    };
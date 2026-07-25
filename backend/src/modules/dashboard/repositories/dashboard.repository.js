import {
    databasePool,
} from '../../../config/database.js';

const mapLevel = ({
    id,
    name,
    minimumXp,
}) => {
    if (id === null) {
        return null;
    }

    return Object.freeze({
        id,
        name,
        minimumXp,
    });
};

const mapDashboardSummaryRow = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        userId: row.user_id,

        progress: Object.freeze({
            exercisesAttempted:
                row.total_exercises_attempted,
            exercisesSolved:
                row.total_exercises_solved,
            codeExecutions:
                row.total_code_executions,
            lastActivityAt:
                row.last_activity_at,
        }),

        gamification: Object.freeze({
            totalXp: row.total_xp,

            currentLevel: mapLevel({
                id: row.current_level_id,
                name: row.current_level_name,
                minimumXp:
                    row.current_level_min_xp,
            }),

            nextLevel: mapLevel({
                id: row.next_level_id,
                name: row.next_level_name,
                minimumXp:
                    row.next_level_min_xp,
            }),

            currentStreak:
                row.current_streak,
            longestStreak:
                row.longest_streak,
            lastActiveDate:
                row.last_active_date,
            badgesEarned:
                row.badges_earned,
        }),
    });
};

const mapXpTransactionRow = (row) => (
    Object.freeze({
        id: row.id,
        amount: row.amount,
        reason: row.reason,
        sourceType: row.source_type,
        sourceId: row.source_id,
        createdAt: row.created_at,
    })
);

export const findDashboardSummaryByUserId =
    async ({
        userId,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                SELECT
                    users.id AS user_id,

                    COALESCE(
                        progress.total_exercises_attempted,
                        0
                    )::INTEGER
                        AS total_exercises_attempted,

                    COALESCE(
                        progress.total_exercises_solved,
                        0
                    )::INTEGER
                        AS total_exercises_solved,

                    COALESCE(
                        progress.total_code_executions,
                        0
                    )::INTEGER
                        AS total_code_executions,

                    progress.last_activity_at,

                    COALESCE(
                        user_xp.total_xp,
                        0
                    )::INTEGER AS total_xp,

                    current_level.id
                        AS current_level_id,
                    current_level.name
                        AS current_level_name,
                    current_level.min_xp
                        AS current_level_min_xp,

                    next_level.id
                        AS next_level_id,
                    next_level.name
                        AS next_level_name,
                    next_level.min_xp
                        AS next_level_min_xp,

                    COALESCE(
                        streaks.current_streak,
                        0
                    )::INTEGER AS current_streak,

                    COALESCE(
                        streaks.longest_streak,
                        0
                    )::INTEGER AS longest_streak,

                    streaks.last_active_date,

                    (
                        SELECT COUNT(*)::INTEGER
                        FROM user_badges
                        WHERE user_badges.user_id =
                            users.id
                    ) AS badges_earned

                FROM users

                LEFT JOIN user_progress_stats
                    AS progress
                    ON progress.user_id = users.id

                LEFT JOIN user_xp
                    ON user_xp.user_id = users.id

                LEFT JOIN streaks
                    ON streaks.user_id = users.id

                LEFT JOIN LATERAL (
                    SELECT
                        levels.id,
                        levels.name,
                        levels.min_xp
                    FROM levels
                    WHERE levels.min_xp <=
                        COALESCE(
                            user_xp.total_xp,
                            0
                        )
                    ORDER BY levels.min_xp DESC
                    LIMIT 1
                ) AS current_level
                    ON true

                LEFT JOIN LATERAL (
                    SELECT
                        levels.id,
                        levels.name,
                        levels.min_xp
                    FROM levels
                    WHERE levels.min_xp >
                        COALESCE(
                            user_xp.total_xp,
                            0
                        )
                    ORDER BY levels.min_xp
                    LIMIT 1
                ) AS next_level
                    ON true

                WHERE users.id = $1
                  AND users.is_active = true
                  AND users.deleted_at IS NULL
            `,
            values: [userId],
        });

        return mapDashboardSummaryRow(
            result.rows[0],
        );
    };

export const findRecentXpTransactionsByUserId =
    async ({
        userId,
        limit = 5,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                SELECT
                    id,
                    amount,
                    reason,
                    source_type,
                    source_id,
                    created_at
                FROM xp_transactions
                WHERE user_id = $1
                ORDER BY created_at DESC, id DESC
                LIMIT $2
            `,
            values: [
                userId,
                limit,
            ],
        });

        return Object.freeze(
            result.rows.map(
                mapXpTransactionRow,
            ),
        );
    };
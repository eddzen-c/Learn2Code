import {
    databasePool,
} from '../../../config/database.js';

const mapAwardedBadgeRow = (row) => (
    Object.freeze({
        id: row.user_badge_id,
        userId: row.user_id,
        earnedAt: row.earned_at,

        metadata: Object.freeze({
            ...(row.metadata ?? {}),
        }),

        badge: Object.freeze({
            id: row.badge_id,
            name: row.badge_name,
            description:
                row.badge_description,
            iconUrl:
                row.badge_icon_url,
            criteriaType:
                row.criteria_type,

            criteriaValue:
                Object.freeze({
                    ...(
                        row.criteria_value
                        ?? {}
                    ),
                }),
        }),
    })
);

export const awardEligibleBadgesForUser =
    async ({
        userId,
        earnedAt = new Date(),
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                WITH progress_metrics AS (
                    SELECT
                        (
                            SELECT COUNT(*)::INTEGER
                            FROM exercise_assignments
                            WHERE user_id = $1
                              AND status = 'completed'
                        ) AS exercises_completed,

                        COALESCE(
                            (
                                SELECT total_xp
                                FROM user_xp
                                WHERE user_id = $1
                            ),
                            0
                        )::INTEGER AS total_xp,

                        COALESCE(
                            (
                                SELECT current_level_id
                                FROM user_xp
                                WHERE user_id = $1
                            ),
                            0
                        )::INTEGER AS current_level,

                        COALESCE(
                            (
                                SELECT current_streak
                                FROM streaks
                                WHERE user_id = $1
                            ),
                            0
                        )::INTEGER AS current_streak
                ),

                candidate_badges AS (
                    SELECT
                        badges.id,
                        badges.criteria_type,

                        (
                            badges.criteria_value
                            ->> 'threshold'
                        )::INTEGER AS threshold,

                        CASE badges.criteria_type
                            WHEN 'exercises_completed'
                                THEN progress_metrics
                                    .exercises_completed

                            WHEN 'total_xp'
                                THEN progress_metrics
                                    .total_xp

                            WHEN 'current_level'
                                THEN progress_metrics
                                    .current_level

                            WHEN 'current_streak'
                                THEN progress_metrics
                                    .current_streak

                            ELSE 0
                        END AS current_value

                    FROM badges

                    CROSS JOIN progress_metrics

                    WHERE badges.is_active = TRUE
                      AND JSONB_TYPEOF(
                            badges.criteria_value
                            -> 'threshold'
                      ) = 'number'
                ),

                eligible_badges AS (
                    SELECT
                        id,
                        criteria_type,
                        threshold,
                        current_value

                    FROM candidate_badges

                    WHERE current_value >= threshold
                ),

                awarded_badges AS (
                    INSERT INTO user_badges (
                        user_id,
                        badge_id,
                        earned_at,
                        metadata
                    )

                    SELECT
                        $1,
                        eligible_badges.id,
                        $2,

                        JSONB_BUILD_OBJECT(
                            'criteriaType',
                            eligible_badges
                                .criteria_type,

                            'threshold',
                            eligible_badges
                                .threshold,

                            'value',
                            eligible_badges
                                .current_value
                        )

                    FROM eligible_badges

                    ON CONFLICT (
                        user_id,
                        badge_id
                    )
                    DO NOTHING

                    RETURNING
                        id,
                        user_id,
                        badge_id,
                        earned_at,
                        metadata
                )

                SELECT
                    awarded_badges.id
                        AS user_badge_id,

                    awarded_badges.user_id,
                    awarded_badges.earned_at,
                    awarded_badges.metadata,

                    badges.id AS badge_id,
                    badges.name AS badge_name,

                    badges.description
                        AS badge_description,

                    badges.icon_url
                        AS badge_icon_url,

                    badges.criteria_type,
                    badges.criteria_value

                FROM awarded_badges

                JOIN badges
                    ON badges.id =
                        awarded_badges.badge_id

                ORDER BY
                    badges.criteria_type,

                    (
                        badges.criteria_value
                        ->> 'threshold'
                    )::INTEGER,

                    badges.name
            `,
            values: [
                userId,
                earnedAt,
            ],
        });

        return Object.freeze(
            result.rows.map(
                mapAwardedBadgeRow,
            ),
        );
    };

const mapUserBadgeCatalogRow = (row) => (
    Object.freeze({
        id: row.badge_id,
        name: row.badge_name,
        description:
            row.badge_description,
        iconUrl:
            row.badge_icon_url,
        criteriaType:
            row.criteria_type,

        criteriaValue:
            Object.freeze({
                ...(
                    row.criteria_value
                    ?? {}
                ),
            }),

        threshold:
            Number(row.threshold),

        currentValue:
            Number(row.current_value),

        progressPercentage:
            Number(
                row.progress_percentage,
            ),

        earned:
            row.user_badge_id !== null,

        earnedAt:
            row.earned_at,
    })
);

export const findBadgeCatalogForUser =
    async ({
        userId,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                WITH progress_metrics AS (
                    SELECT
                        (
                            SELECT COUNT(*)::INTEGER
                            FROM exercise_assignments
                            WHERE user_id = $1
                              AND status = 'completed'
                        ) AS exercises_completed,

                        COALESCE(
                            (
                                SELECT total_xp
                                FROM user_xp
                                WHERE user_id = $1
                            ),
                            0
                        )::INTEGER AS total_xp,

                        COALESCE(
                            (
                                SELECT current_level_id
                                FROM user_xp
                                WHERE user_id = $1
                            ),
                            0
                        )::INTEGER AS current_level,

                        COALESCE(
                            (
                                SELECT current_streak
                                FROM streaks
                                WHERE user_id = $1
                            ),
                            0
                        )::INTEGER AS current_streak
                ),

                catalog_badges AS (
                    SELECT
                        badges.id,
                        badges.name,
                        badges.description,
                        badges.icon_url,
                        badges.criteria_type,
                        badges.criteria_value,

                        (
                            badges.criteria_value
                            ->> 'threshold'
                        )::INTEGER AS threshold,

                        CASE badges.criteria_type
                            WHEN 'exercises_completed'
                                THEN progress_metrics
                                    .exercises_completed

                            WHEN 'total_xp'
                                THEN progress_metrics
                                    .total_xp

                            WHEN 'current_level'
                                THEN progress_metrics
                                    .current_level

                            WHEN 'current_streak'
                                THEN progress_metrics
                                    .current_streak

                            ELSE 0
                        END AS current_value

                    FROM badges

                    CROSS JOIN progress_metrics

                    WHERE badges.is_active = TRUE
                      AND JSONB_TYPEOF(
                            badges.criteria_value
                            -> 'threshold'
                      ) = 'number'
                )

                SELECT
                    catalog_badges.id
                        AS badge_id,

                    catalog_badges.name
                        AS badge_name,

                    catalog_badges.description
                        AS badge_description,

                    catalog_badges.icon_url
                        AS badge_icon_url,

                    catalog_badges.criteria_type,
                    catalog_badges.criteria_value,
                    catalog_badges.threshold,
                    catalog_badges.current_value,

                    LEAST(
                        100,
                        ROUND(
                            (
                                catalog_badges.current_value
                                * 100.0
                            )
                            / NULLIF(
                                catalog_badges.threshold,
                                0
                            ),
                            2
                        )
                    ) AS progress_percentage,

                    user_badges.id
                        AS user_badge_id,

                    user_badges.earned_at

                FROM catalog_badges

                LEFT JOIN user_badges
                    ON user_badges.badge_id =
                        catalog_badges.id
                    AND user_badges.user_id = $1

                ORDER BY
                    user_badges.earned_at
                        DESC NULLS LAST,

                    catalog_badges.criteria_type,
                    catalog_badges.threshold,
                    catalog_badges.name
            `,
            values: [userId],
        });

        return Object.freeze(
            result.rows.map(
                mapUserBadgeCatalogRow,
            ),
        );
    };
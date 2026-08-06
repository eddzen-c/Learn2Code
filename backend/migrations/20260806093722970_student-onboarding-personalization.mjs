/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

const PROFILE_TABLE =
    'student_onboarding_profiles';

const INTEREST_TABLE =
    'student_onboarding_interests';

const LEARNING_GOAL_CONSTRAINT =
    'student_onboarding_learning_goal_check';

const STUDY_PACE_CONSTRAINT =
    'student_onboarding_study_pace_check';

const INTEREST_KEY_CONSTRAINT =
    'student_onboarding_interest_key_check';

export const up = (pgm) => {
    pgm.addColumns(
        PROFILE_TABLE,
        {
            study_pace: {
                type: 'varchar(20)',
                notNull: true,
                default: 'student',
            },
        },
    );

    pgm.addConstraint(
        PROFILE_TABLE,
        STUDY_PACE_CONSTRAINT,
        {
            check: `
                study_pace IN (
                    'casual',
                    'student',
                    'intensive'
                )
            `,
        },
    );

    pgm.dropConstraint(
        PROFILE_TABLE,
        LEARNING_GOAL_CONSTRAINT,
    );

    pgm.addConstraint(
        PROFILE_TABLE,
        LEARNING_GOAL_CONSTRAINT,
        {
            check: `
                learning_goal IN (
                    'programming_fundamentals',
                    'web_development',
                    'automation',
                    'academic_support',
                    'career_preparation',
                    'build_product',
                    'other'
                )
            `,
        },
    );

    pgm.createTable(
        INTEREST_TABLE,
        {
            user_id: {
                type: 'uuid',
                notNull: true,
                references: PROFILE_TABLE,
                onDelete: 'CASCADE',
            },

            interest_key: {
                type: 'varchar(40)',
                notNull: true,
            },

            created_at: {
                type: 'timestamptz',
                notNull: true,
                default: pgm.func('now()'),
            },
        },
        {
            constraints: {
                primaryKey: [
                    'user_id',
                    'interest_key',
                ],
            },
        },
    );

    pgm.addConstraint(
        INTEREST_TABLE,
        INTEREST_KEY_CONSTRAINT,
        {
            check: `
                interest_key IN (
                    'video_games',
                    'music',
                    'sports_fitness',
                    'cooking_gastronomy',
                    'movies_series_anime',
                    'finance_crypto'
                )
            `,
        },
    );

    pgm.createIndex(
        INTEREST_TABLE,
        'interest_key',
    );
};

export const down = (pgm) => {
    pgm.dropTable(INTEREST_TABLE);

    pgm.dropConstraint(
        PROFILE_TABLE,
        LEARNING_GOAL_CONSTRAINT,
    );

    pgm.sql(`
        UPDATE student_onboarding_profiles
        SET learning_goal = 'other'
        WHERE learning_goal = 'build_product'
    `);

    pgm.addConstraint(
        PROFILE_TABLE,
        LEARNING_GOAL_CONSTRAINT,
        {
            check: `
                learning_goal IN (
                    'programming_fundamentals',
                    'web_development',
                    'automation',
                    'academic_support',
                    'career_preparation',
                    'other'
                )
            `,
        },
    );

    pgm.dropConstraint(
        PROFILE_TABLE,
        STUDY_PACE_CONSTRAINT,
    );

    pgm.dropColumns(
        PROFILE_TABLE,
        ['study_pace'],
    );
};
/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

const LEARNING_GOALS = [
    'programming_fundamentals',
    'web_development',
    'automation',
    'academic_support',
    'career_preparation',
    'build_product',
    'professional_growth',
    'personal_interest',
    'other',
];

const WEEKLY_TIME_COMMITMENTS = [
    'less_than_5',
    'five_to_ten',
    'ten_to_twenty',
    'more_than_twenty',
];

const LEARNING_STYLES = [
    'practical',
    'visual',
    'reading',
    'guided',
];

const TECHNOLOGY_INTERESTS = [
    'javascript',
    'python',
    'react',
    'html_css',
    'nodejs',
    'typescript',
    'java',
    'sql',
    'other',
];

const createAllowedValuesCheck = (
    columnName,
    values,
) => (
    `${columnName} IN (${values
        .map((value) => `'${value}'`)
        .join(', ')})`
);

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
    pgm.addColumns(
        'student_onboarding_profiles',
        {
            weekly_time_commitment: {
                type: 'varchar(30)',
                notNull: true,
                default: 'five_to_ten',
            },

            learning_style: {
                type: 'varchar(20)',
                notNull: true,
                default: 'practical',
            },

            project_idea: {
                type: 'varchar(100)',
                notNull: false,
            },
        },
    );

    pgm.sql(`
        UPDATE student_onboarding_profiles
        SET weekly_time_commitment =
            CASE study_pace
                WHEN 'casual'
                    THEN 'less_than_5'
                WHEN 'student'
                    THEN 'five_to_ten'
                WHEN 'intensive'
                    THEN 'ten_to_twenty'
                ELSE 'five_to_ten'
            END
    `);

    pgm.dropConstraint(
        'student_onboarding_profiles',
        'student_onboarding_learning_goal_check',
    );

    pgm.addConstraint(
        'student_onboarding_profiles',
        'student_onboarding_learning_goal_check',
        {
            check:
                createAllowedValuesCheck(
                    'learning_goal',
                    LEARNING_GOALS,
                ),
        },
    );

    pgm.addConstraint(
        'student_onboarding_profiles',
        'student_onboarding_weekly_time_check',
        {
            check:
                createAllowedValuesCheck(
                    'weekly_time_commitment',
                    WEEKLY_TIME_COMMITMENTS,
                ),
        },
    );

    pgm.addConstraint(
        'student_onboarding_profiles',
        'student_onboarding_learning_style_check',
        {
            check:
                createAllowedValuesCheck(
                    'learning_style',
                    LEARNING_STYLES,
                ),
        },
    );

    pgm.addConstraint(
        'student_onboarding_profiles',
        'student_onboarding_project_idea_check',
        {
            check: `
                project_idea IS NULL
                OR (
                    char_length(
                        btrim(project_idea)
                    ) BETWEEN 1 AND 100
                )
            `,
        },
    );

    pgm.createTable(
        'student_onboarding_technology_interests',
        {
            user_id: {
                type: 'uuid',
                notNull: true,
                references:
                    'student_onboarding_profiles',
                onDelete: 'CASCADE',
            },

            technology_key: {
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
                    'technology_key',
                ],
            },
        },
    );

    pgm.addConstraint(
        'student_onboarding_technology_interests',
        'student_onboarding_technology_key_check',
        {
            check:
                createAllowedValuesCheck(
                    'technology_key',
                    TECHNOLOGY_INTERESTS,
                ),
        },
    );

    pgm.createIndex(
        'student_onboarding_technology_interests',
        'technology_key',
        {
            name:
                'student_onboarding_technology_key_index',
        },
    );
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
    pgm.dropTable(
        'student_onboarding_technology_interests',
    );

    pgm.dropConstraint(
        'student_onboarding_profiles',
        'student_onboarding_project_idea_check',
    );

    pgm.dropConstraint(
        'student_onboarding_profiles',
        'student_onboarding_learning_style_check',
    );

    pgm.dropConstraint(
        'student_onboarding_profiles',
        'student_onboarding_weekly_time_check',
    );

    pgm.dropColumns(
        'student_onboarding_profiles',
        [
            'weekly_time_commitment',
            'learning_style',
            'project_idea',
        ],
    );

    pgm.sql(`
        UPDATE student_onboarding_profiles
        SET learning_goal =
            CASE learning_goal
                WHEN 'professional_growth'
                    THEN 'career_preparation'
                WHEN 'personal_interest'
                    THEN 'other'
                ELSE learning_goal
            END
        WHERE learning_goal IN (
            'professional_growth',
            'personal_interest'
        )
    `);

    pgm.dropConstraint(
        'student_onboarding_profiles',
        'student_onboarding_learning_goal_check',
    );

    pgm.addConstraint(
        'student_onboarding_profiles',
        'student_onboarding_learning_goal_check',
        {
            check:
                createAllowedValuesCheck(
                    'learning_goal',
                    [
                        'programming_fundamentals',
                        'web_development',
                        'automation',
                        'academic_support',
                        'career_preparation',
                        'build_product',
                        'other',
                    ],
                ),
        },
    );
};
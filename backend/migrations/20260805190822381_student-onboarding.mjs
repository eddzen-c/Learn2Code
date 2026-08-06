export const shorthands = undefined;

const LEARNING_GOALS = [
    'programming_fundamentals',
    'web_development',
    'automation',
    'academic_support',
    'career_preparation',
    'other',
];

export async function up(pgm) {
    pgm.createTable(
        'student_onboarding_profiles',
        {
            user_id: {
                type: 'uuid',
                primaryKey: true,
                references: 'users',
                onDelete: 'CASCADE',
            },

            self_assessed_difficulty_id: {
                type: 'smallint',
                notNull: true,
                references: 'difficulty_levels',
                onDelete: 'RESTRICT',
            },

            learning_goal: {
                type: 'varchar(40)',
                notNull: true,
            },

            completed_at: {
                type: 'timestamptz',
                notNull: true,
                default: pgm.func('now()'),
            },

            created_at: {
                type: 'timestamptz',
                notNull: true,
                default: pgm.func('now()'),
            },

            updated_at: {
                type: 'timestamptz',
                notNull: true,
                default: pgm.func('now()'),
            },
        },
    );

    pgm.addConstraint(
        'student_onboarding_profiles',
        'student_onboarding_learning_goal_check',
        {
            check: `
                learning_goal IN (
                    ${LEARNING_GOALS
                    .map((goal) => `'${goal}'`)
                    .join(', ')}
                )
            `,
        },
    );

    pgm.createTable(
        'student_onboarding_topics',
        {
            user_id: {
                type: 'uuid',
                notNull: true,
                references:
                    'student_onboarding_profiles',
                onDelete: 'CASCADE',
            },

            topic_id: {
                type: 'smallint',
                notNull: true,
                references: 'topics',
                onDelete: 'RESTRICT',
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
                    'topic_id',
                ],
            },
        },
    );

    pgm.createIndex(
        'student_onboarding_topics',
        'topic_id',
    );
}

export async function down(pgm) {
    pgm.dropTable(
        'student_onboarding_topics',
    );

    pgm.dropTable(
        'student_onboarding_profiles',
    );
}
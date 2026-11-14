export const up = (pgm) => {
    pgm.addColumns(
        'student_onboarding_profiles',
        {
            learning_flow_completed_at: {
                type: 'timestamptz',
                notNull: false,
            },
        },
    );
};

export const down = (pgm) => {
    pgm.dropColumns(
        'student_onboarding_profiles',
        [
            'learning_flow_completed_at',
        ],
    );
};
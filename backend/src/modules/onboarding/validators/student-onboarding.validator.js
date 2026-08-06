import {
    z,
} from 'zod';

import {
    LEARNING_GOALS,
    MAX_ONBOARDING_INTERESTS,
    MAX_ONBOARDING_TOPICS,
    ONBOARDING_INTERESTS,
    STUDY_PACES,
} from '../constants/onboarding.constants.js';

const positiveIdentifierSchema = z
    .number()
    .int()
    .positive();

const uniqueArray = (
    message,
) => (
    (values) => (
        new Set(values).size
        === values.length
    )
);

export const studentOnboardingBodySchema =
    z
        .object({
            languageId:
                positiveIdentifierSchema,

            selfAssessedDifficultyId:
                positiveIdentifierSchema,

            learningGoal:
                z.enum(LEARNING_GOALS),

            studyPace:
                z.enum(STUDY_PACES),

            interestKeys: z
                .array(
                    z.enum(
                        ONBOARDING_INTERESTS,
                    ),
                )
                .min(1)
                .max(
                    MAX_ONBOARDING_INTERESTS,
                )
                .refine(
                    uniqueArray(),
                    {
                        message:
                            'Interest keys must be unique',
                    },
                ),

            topicIds: z
                .array(
                    positiveIdentifierSchema,
                )
                .min(1)
                .max(
                    MAX_ONBOARDING_TOPICS,
                )
                .refine(
                    uniqueArray(),
                    {
                        message:
                            'Topic IDs must be unique',
                    },
                ),
        })
        .strict();

export const parseStudentOnboardingBody = (
    body,
) => (
    studentOnboardingBodySchema.parse(body)
);
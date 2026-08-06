import {
    z,
} from 'zod';

import {
    LEARNING_GOALS,
    MAX_ONBOARDING_TOPICS,
} from '../constants/onboarding.constants.js';

const positiveIdentifierSchema = z
    .number()
    .int()
    .positive();

export const studentOnboardingBodySchema =
    z
        .object({
            languageId:
                positiveIdentifierSchema,

            selfAssessedDifficultyId:
                positiveIdentifierSchema,

            learningGoal:
                z.enum(LEARNING_GOALS),

            topicIds: z
                .array(
                    positiveIdentifierSchema,
                )
                .min(1)
                .max(
                    MAX_ONBOARDING_TOPICS,
                )
                .refine(
                    (topicIds) => (
                        new Set(topicIds).size
                        === topicIds.length
                    ),
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
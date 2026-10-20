import {
    z,
} from 'zod';

import {
    LEARNING_STYLES,
    MAX_PROJECT_IDEA_LENGTH,
    MAX_TECHNOLOGY_INTERESTS,
    PRIMARY_LEARNING_GOALS,
    TECHNOLOGY_INTERESTS,
    WEEKLY_TIME_COMMITMENTS,
} from '../constants/onboarding.constants.js';

const positiveIdentifierSchema = z
    .number()
    .int()
    .positive();

const valuesAreUnique = (
    values,
) => (
    new Set(values).size
    === values.length
);

const projectIdeaSchema = z.union([
    z
        .string()
        .trim()
        .min(1)
        .max(
            MAX_PROJECT_IDEA_LENGTH,
        ),

    z.null(),
]);

export const studentOnboardingBodySchema =
    z
        .object({
            languageId:
                positiveIdentifierSchema,

            selfAssessedDifficultyId:
                positiveIdentifierSchema,

            learningGoal:
                z.enum(
                    PRIMARY_LEARNING_GOALS,
                ),

            weeklyTimeCommitment:
                z.enum(
                    WEEKLY_TIME_COMMITMENTS,
                ),

            learningStyle:
                z.enum(
                    LEARNING_STYLES,
                ),

            technologyInterestKeys: z
                .array(
                    z.enum(
                        TECHNOLOGY_INTERESTS,
                    ),
                )
                .min(1)
                .max(
                    MAX_TECHNOLOGY_INTERESTS,
                )
                .refine(
                    valuesAreUnique,
                    {
                        message:
                            'Technology interest keys must be unique',
                    },
                ),

            projectIdea:
                projectIdeaSchema,
        })
        .strict();

export const parseStudentOnboardingBody = (
    body,
) => (
    studentOnboardingBodySchema.parse(body)
);
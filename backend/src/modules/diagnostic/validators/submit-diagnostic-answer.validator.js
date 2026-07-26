import {
    z,
} from 'zod';

export const diagnosticAssessmentParamsSchema =
    z
        .object({
            assessmentId: z
                .string()
                .uuid(),
        })
        .strict();

export const submitDiagnosticAnswerBodySchema =
    z
        .object({
            questionId: z
                .string()
                .uuid(),

            answer: z.union([
                z
                    .string()
                    .trim()
                    .min(1)
                    .max(10000),

                z
                    .number()
                    .finite(),

                z.boolean(),
            ]),

            submittedCode: z
                .string()
                .max(50000)
                .nullable()
                .optional(),
        })
        .strict();

export const parseDiagnosticAssessmentParams = (
    params,
) => (
    diagnosticAssessmentParamsSchema.parse(
        params,
    )
);

export const parseSubmitDiagnosticAnswerBody = (
    body,
) => (
    submitDiagnosticAnswerBodySchema.parse(
        body,
    )
);
import {
    z,
} from 'zod';

export const startDiagnosticBodySchema =
    z
        .object({
            languageId: z
                .number()
                .int()
                .positive(),
        })
        .strict();

export const parseStartDiagnosticBody = (
    body,
) => (
    startDiagnosticBodySchema.parse(body)
);
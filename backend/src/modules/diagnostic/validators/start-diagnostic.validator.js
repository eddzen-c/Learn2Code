import {
    z,
} from 'zod';

export const startDiagnosticBodySchema =
    z
        .object({})
        .strict();

export const parseStartDiagnosticBody = (
    body,
) => (
    startDiagnosticBodySchema.parse(
        body ?? {},
    )
);
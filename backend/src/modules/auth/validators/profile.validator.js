import { z } from 'zod';

const localePattern =
    /^[a-z]{2}(?:-[A-Z]{2})?$/;

export const updateProfileBodySchema = z
    .object({
        fullName: z
            .string()
            .trim()
            .min(2)
            .max(150)
            .optional(),

        preferredLocale: z
            .string()
            .trim()
            .min(2)
            .max(10)
            .regex(
                localePattern,
                {
                    message:
                        'Locale must use a format such as es-MX',
                },
            )
            .optional(),

        preferredProgrammingLanguageId: z
            .number()
            .int()
            .positive()
            .max(32767)
            .nullable()
            .optional(),
    })
    .strict()
    .refine(
        (value) => Object.keys(value).length > 0,
        {
            message:
                'At least one profile field is required',
        },
    );

export const parseUpdateProfileBody = (body) => (
    updateProfileBodySchema.parse(body)
);
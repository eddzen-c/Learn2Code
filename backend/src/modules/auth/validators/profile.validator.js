import { z } from 'zod';

const localePattern =
    /^[a-z]{2}(?:-[A-Z]{2})?$/;

const usernamePattern =
    /^[a-z0-9_]{3,40}$/;

const githubUrlSchema = z
    .string()
    .trim()
    .max(500)
    .url()
    .refine(
        (value) => {
            const url = new URL(value);

            return (
                url.protocol === 'https:'
                && [
                    'github.com',
                    'www.github.com',
                ].includes(url.hostname.toLowerCase())
            );
        },
        {
            message: 'A valid GitHub HTTPS URL is required',
        },
    );

const portfolioUrlSchema = z
    .string()
    .trim()
    .max(500)
    .url()
    .refine(
        (value) =>
            new URL(value).protocol === 'https:',
        {
            message: 'Portfolio URL must use HTTPS',
        },
    );

export const updateProfileBodySchema = z
    .object({
        // Datos que ya soporta Learn2Code.
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
            .regex(localePattern)
            .optional(),

        preferredProgrammingLanguageId: z
            .number()
            .int()
            .positive()
            .max(32767)
            .nullable()
            .optional(),

        // Nuevos datos del mockup de Perfil.
        username: z
            .string()
            .trim()
            .toLowerCase()
            .regex(usernamePattern, {
                message:
                    'Username must contain 3 to 40 lowercase letters, numbers or underscores',
            })
            .nullable()
            .optional(),

        bio: z
            .string()
            .trim()
            .max(300)
            .nullable()
            .optional(),

        githubUrl: githubUrlSchema
            .nullable()
            .optional(),

        portfolioUrl: portfolioUrlSchema
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

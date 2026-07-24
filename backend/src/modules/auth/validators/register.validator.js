import { z } from 'zod';

import {
    PASSWORD_MAX_BYTES,
    PASSWORD_MIN_CHARACTERS,
} from '../services/password.service.js';

export const registerBodySchema = z
    .object({
        fullName: z
            .string()
            .trim()
            .min(2)
            .max(150),

        email: z
            .string()
            .trim()
            .email()
            .max(254)
            .transform(
                (value) => value.toLowerCase(),
            ),

        password: z
            .string()
            .min(PASSWORD_MIN_CHARACTERS)
            .refine(
                (value) => (
                    Buffer.byteLength(value, 'utf8')
                    <= PASSWORD_MAX_BYTES
                ),
                {
                    message:
                        `Password cannot exceed ${PASSWORD_MAX_BYTES
                        } UTF-8 bytes`,
                },
            ),
    })
    .strict();

export const parseRegisterBody = (body) => (
    registerBodySchema.parse(body)
);
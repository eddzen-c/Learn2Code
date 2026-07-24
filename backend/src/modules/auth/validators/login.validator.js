import { z } from 'zod';

import {
    PASSWORD_MAX_BYTES,
} from '../services/password.service.js';

export const loginBodySchema = z
    .object({
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
            .min(1)
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

export const parseLoginBody = (body) => (
    loginBodySchema.parse(body)
);
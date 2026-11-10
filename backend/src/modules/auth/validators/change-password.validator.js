
import { z } from 'zod';

import {
    PASSWORD_MAX_BYTES,
    PASSWORD_MIN_CHARACTERS,
    meetsPasswordComplexityRequirements,
} from '../services/password.service.js';

const fitsPasswordByteLimit = (value) => (
    Buffer.byteLength(value, 'utf8')
    <= PASSWORD_MAX_BYTES
);

export const changePasswordBodySchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, 'La contraseña actual es obligatoria.')
            .refine(fitsPasswordByteLimit, {
                message: 'La contraseña actual supera el límite permitido.',
            }),

        newPassword: z
            .string()
            .refine(
                (value) => value.trim().length > 0,
                {
                    message: 'La nueva contraseña no puede estar vacía.',
                },
            )
            .refine(
                (value) => (
                    [...value].length >= PASSWORD_MIN_CHARACTERS
                ),
                {
                    message:
                        `La nueva contraseña debe tener al menos ${PASSWORD_MIN_CHARACTERS} caracteres.`,
                },
            )
            .refine(
                meetsPasswordComplexityRequirements,
                {
                    message:
                        'La nueva contraseña debe incluir una mayúscula, un número y un carácter especial.',
                },
            )
            .refine(fitsPasswordByteLimit, {
                message: 'La nueva contraseña supera el límite permitido.',
            }),

        confirmPassword: z.string(),
    })
    .strict()
    .superRefine((data, context) => {
        if (data.newPassword !== data.confirmPassword) {
            context.addIssue({
                code: 'custom',
                path: ['confirmPassword'],
                message: 'Las contraseñas no coinciden.',
            });
        }

        if (data.currentPassword === data.newPassword) {
            context.addIssue({
                code: 'custom',
                path: ['newPassword'],
                message:
                    'La nueva contraseña debe ser diferente de la actual.',
            });
        }
    });

export const parseChangePasswordBody = (body) => (
    changePasswordBodySchema.parse(body)
);

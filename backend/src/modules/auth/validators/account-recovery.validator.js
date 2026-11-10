import {
    z,
} from 'zod';

import {
    PASSWORD_MAX_BYTES,
    PASSWORD_MIN_CHARACTERS,
    meetsPasswordComplexityRequirements,
} from '../services/password.service.js';

const accountEmailSchema =
    z.string()
        .trim()
        .email()
        .max(320)
        .transform(
            (value) => value.toLowerCase(),
        );

const oneTimeTokenSchema =
    z.string()
        .min(1)
        .max(128)
        .regex(
            /^[A-Za-z0-9_-]+$/,
            {
                message:
                    'Token has an invalid format',
            },
        );

const newPasswordSchema =
    z.string()
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
            (value) => (
                value.trim().length > 0
            ),
            {
                message:
                    'New password cannot be blank',
            },
        )
        .refine(
            meetsPasswordComplexityRequirements,
            {
                message:
                    'La nueva contraseña debe incluir una mayúscula, un número y un carácter especial.',
            },
        )
        .refine(
            (value) => (
                Buffer.byteLength(
                    value,
                    'utf8',
                )
                <= PASSWORD_MAX_BYTES
            ),
            {
                message:
                    `New password cannot exceed ${PASSWORD_MAX_BYTES} UTF-8 bytes`,
            },
        );

export const requestPasswordResetBodySchema =
    z.object({
        email:
            accountEmailSchema,
    }).strict();

export const confirmEmailVerificationBodySchema =
    z.object({
        token:
            oneTimeTokenSchema,
    }).strict();

export const resetPasswordBodySchema =
    z.object({
        token:
            oneTimeTokenSchema,

        newPassword:
            newPasswordSchema,
    }).strict();

export const parseRequestPasswordResetBody =
    (body) => (
        requestPasswordResetBodySchema
            .parse(body)
    );

export const parseConfirmEmailVerificationBody =
    (body) => (
        confirmEmailVerificationBodySchema
            .parse(body)
    );

export const parseResetPasswordBody =
    (body) => (
        resetPasswordBodySchema
            .parse(body)
    );

export const confirmEmailVerificationCodeBodySchema =
    z.object({
        code: z.string()
            .regex(/^\d{6}$/, {
                message:
                    'Verification code must contain exactly six digits',
            }),
    }).strict();

export const parseConfirmEmailVerificationCodeBody =
    (body) => (
        confirmEmailVerificationCodeBodySchema.parse(body)
    );

// ============================================================
// SOLICITUD DE CAMBIO DE CORREO AUTENTICADO
// ============================================================

export const requestEmailChangeBodySchema = z
    .object({
        newEmail: accountEmailSchema
            .refine(
                (value) => value.length <= 254,
                {
                    message:
                        'El correo electrónico no puede superar los 254 caracteres.',
                },
            ),

        currentPassword: z
            .string()
            .min(
                1,
                'La contraseña actual es obligatoria.',
            )
            .refine(
                (value) => (
                    Buffer.byteLength(value, 'utf8')
                    <= PASSWORD_MAX_BYTES
                ),
                {
                    message:
                        'La contraseña actual supera el límite permitido.',
                },
            ),
    })
    .strict();

export const parseRequestEmailChangeBody = (body) => (
    requestEmailChangeBodySchema.parse(body)
);

// ============================================================
// CONFIRMACION DEL CAMBIO DE CORREO
// ============================================================

// Reutilizamos la validacion de seis digitos existente.
export const confirmEmailChangeBodySchema =
    confirmEmailVerificationCodeBodySchema;

export const parseConfirmEmailChangeBody = (body) => (
    confirmEmailChangeBodySchema.parse(body)
);
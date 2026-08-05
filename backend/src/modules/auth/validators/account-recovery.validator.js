import {
    z,
} from 'zod';

import {
    PASSWORD_MAX_BYTES,
    PASSWORD_MIN_CHARACTERS,
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
        .min(PASSWORD_MIN_CHARACTERS)
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
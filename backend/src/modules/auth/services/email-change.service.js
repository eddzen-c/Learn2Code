import { createHmac } from 'node:crypto';
import { z } from 'zod';

import {
    AuthenticationRequiredError,
} from '../errors/access-token.errors.js';

import {
    InvalidCurrentPasswordError,
} from '../errors/password-change.errors.js';

import {
    AuthEmailDeliveryFailedError,
} from '../errors/account-recovery.errors.js';

import {
    findUserById,
    findUserByEmail,
} from '../repositories/user.repository.js';

import {
    saveEmailChangeRequest,
    markEmailChangeDeliveryFailed,
    confirmEmailChangeRequest,
} from '../repositories/email-change.repository.js';

import {
    verifyPassword,
} from './password.service.js';

import {
    createEmailVerificationCode,
} from './email-verification-code.service.js';

import {
    getEmailVerificationCodeSecret,
} from './email-verification-code-secret.service.js';

import {
    sendEmailVerificationCodeMessage,
} from './email-verification-code-email.service.js';

// ============================================================
// ERRORES ESPECIFICOS DEL CAMBIO DE CORREO
// ============================================================

export class EmailChangeRequestError extends Error {
    constructor(message, code, statusCode) {
        super(message);

        this.name = new.target.name;
        this.code = code;
        this.statusCode = statusCode;
    }
}

// ============================================================
// VALIDACION DE LA DIRECCION NUEVA
// ============================================================

const newEmailSchema = z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase());

const normalizeNewEmail = (value) => {
    const result = newEmailSchema.safeParse(value);

    if (!result.success) {
        throw new EmailChangeRequestError(
            'La nueva dirección de correo no es válida.',
            'INVALID_NEW_EMAIL',
            400,
        );
    }

    return result.data;
};

// ============================================================
// CODIGO VINCULADO AL USUARIO Y AL CORREO NUEVO
// ============================================================

export const hashEmailChangeCode = ({
    userId,
    newEmail,
    code,
    secret,
}) => {
    if (
        typeof userId !== 'string'
        || !userId.trim()
        || typeof newEmail !== 'string'
        || !newEmail.trim()
        || typeof code !== 'string'
        || !/^\d{6}$/.test(code)
        || typeof secret !== 'string'
        || Buffer.byteLength(secret, 'utf8') < 32
    ) {
        throw new TypeError(
            'Invalid email change code parameters',
        );
    }

    return createHmac('sha256', secret)
        .update(
            `email-change-code:${userId}:${newEmail}:${code}`,
        )
        .digest('hex');
};

// ============================================================
// SOLICITAR CAMBIO DE CORREO
// ============================================================

export const requestCurrentUserEmailChange = async ({
    userId,
    newEmail,
    currentPassword,
    now = new Date(),

    findUser = findUserById,
    findEmailOwner = findUserByEmail,
    verifyCurrentPassword = verifyPassword,
    getSecret = getEmailVerificationCodeSecret,
    createCode = createEmailVerificationCode,
    saveRequest = saveEmailChangeRequest,
    sendMessage = sendEmailVerificationCodeMessage,
    markDeliveryFailed = markEmailChangeDeliveryFailed,
}) => {
    const normalizedEmail = normalizeNewEmail(newEmail);

    // Comprobar que la cuenta exista y este activa.
    const user = await findUser({ userId });

    if (
        !user
        || user.isActive !== true
        || user.deletedAt != null
    ) {
        throw new AuthenticationRequiredError();
    }

    // Las cuentas sin verificar utilizan el flujo inicial.
    if (user.emailVerifiedAt == null) {
        throw new EmailChangeRequestError(
            'Primero debes verificar tu correo actual.',
            'EMAIL_CHANGE_UNAVAILABLE',
            403,
        );
    }

    // Confirmar identidad antes de consultar disponibilidad.
    const passwordMatches = await verifyCurrentPassword(
        currentPassword,
        user.passwordHash,
    );

    if (!passwordMatches) {
        throw new InvalidCurrentPasswordError();
    }

    if (
        normalizedEmail === user.email.toLowerCase()
    ) {
        throw new EmailChangeRequestError(
            'La dirección nueva es igual a la actual.',
            'EMAIL_CHANGE_SAME_ADDRESS',
            400,
        );
    }

    const existingUser = await findEmailOwner({
        email: normalizedEmail,
    });

    if (existingUser) {
        throw new EmailChangeRequestError(
            'Esta dirección de correo ya está registrada.',
            'EMAIL_ALREADY_IN_USE',
            409,
        );
    }

    // Reutilizar el generador y la duración existentes.
    const secret = getSecret();

    const details = createCode({
        userId,
        secret,
        now,
    });

    // Separar criptográficamente este flujo de la
    // verificación utilizada durante el registro.
    const codeHash = hashEmailChangeCode({
        userId,
        newEmail: normalizedEmail,
        code: details.code,
        secret,
    });

    // Guardar la solicitud sin modificar users.email.
    const saved = await saveRequest({
        userId,
        newEmail: normalizedEmail,
        codeHash,
        createdAt: now,
        expiresAt: details.expiresAt,
    });

    if (!saved) {
        throw new EmailChangeRequestError(
            'Espera antes de solicitar otro código.',
            'EMAIL_CHANGE_COOLDOWN',
            429,
        );
    }

    let delivery;

    try {
        delivery = await sendMessage({
            recipientEmail: normalizedEmail,
            code: details.code,
            expiresAt: details.expiresAt,
        });

        if (delivery?.accepted !== true) {
            throw new AuthEmailDeliveryFailedError();
        }
    } catch (error) {
        // Invalidar exclusivamente el codigo que fallo.
        try {
            await markDeliveryFailed({
                userId,
                codeHash,
                createdAt: now,
                failedAt: new Date(),
            });
        } catch (cleanupError) {
            console.error(
                'Unable to invalidate failed email change request:',
                cleanupError,
            );
        }

        throw error;
    }

    return Object.freeze({
        requested: true,
        newEmail: normalizedEmail,
        expiresAt: details.expiresAt,
        delivery: Object.freeze({
            provider: delivery.provider,
            accepted: delivery.accepted,
            simulated: delivery.simulated,
        }),
    });
};

// ============================================================
// CONFIRMAR CAMBIO DE CORREO
// ============================================================

export const confirmCurrentUserEmailChange = async ({
    userId,
    code,
    now = new Date(),

    getSecret = getEmailVerificationCodeSecret,
    hashCode = hashEmailChangeCode,
    confirmRequest = confirmEmailChangeRequest,
}) => {
    // --------------------------------------------------------
    // VALIDAR CODIGO
    // --------------------------------------------------------

    if (
        typeof code !== 'string'
        || !/^\d{6}$/.test(code)
    ) {
        throw new EmailChangeRequestError(
            'El código debe contener seis dígitos.',
            'INVALID_EMAIL_CHANGE_CODE',
            400,
        );
    }

    // --------------------------------------------------------
    // PREPARAR VERIFICACION SEGURA
    // --------------------------------------------------------

    const secret = getSecret();

    let result;

    try {
        result = await confirmRequest({
            userId,
            code,
            confirmedAt: now,

            hashCode: ({
                userId: requestUserId,
                newEmail,
                code: submittedCode,
            }) => hashCode({
                userId: requestUserId,
                newEmail,
                code: submittedCode,
                secret,
            }),
        });
    } catch (error) {
        // El correo pudo haber sido registrado por otra
        // cuenta mientras el código estaba pendiente.
        if (
            error.code === '23505'
            && (
                !error.constraint
                || error.constraint === 'users_email_key'
            )
        ) {
            throw new EmailChangeRequestError(
                'Esta dirección de correo ya está registrada.',
                'EMAIL_ALREADY_IN_USE',
                409,
            );
        }

        throw error;
    }

    // --------------------------------------------------------
    // VALIDAR RESULTADO
    // --------------------------------------------------------

    if (!result || result.changed !== true) {
        throw new EmailChangeRequestError(
            'El código es incorrecto, ha vencido o ya fue utilizado.',
            'INVALID_EMAIL_CHANGE_CODE',
            400,
        );
    }

    // --------------------------------------------------------
    // CONFIRMAR CAMBIO
    // --------------------------------------------------------

    return Object.freeze({
        changed: true,

        user: Object.freeze({
            id: result.user.id,
            email: result.user.email,
            emailVerifiedAt:
                result.user.emailVerifiedAt,
        }),
    });
};
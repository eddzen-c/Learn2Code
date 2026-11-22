
import {
    EmailVerificationUnavailableError,
    EmailVerificationCodeCooldownError,
    InvalidEmailVerificationCodeError,
} from '../errors/account-recovery.errors.js';

import {
    findUserById,
} from '../repositories/user.repository.js';

import {
    saveEmailVerificationCode,
    confirmEmailVerificationCodeRecord,
    markEmailVerificationCodeDeliveryFailed,
} from '../repositories/email-verification-code.repository.js';

import {
    createEmailVerificationCode,
    hashEmailVerificationCode,
} from './email-verification-code.service.js';

import {
    getEmailVerificationCodeSecret,
} from './email-verification-code-secret.service.js';

import {
    sendEmailVerificationCodeMessage,
} from './email-verification-code-email.service.js';

export const requestEmailVerificationCode =
    async ({
        userId,
        now = new Date(),
        findUser = findUserById,
        getSecret = getEmailVerificationCodeSecret,
        createCode = createEmailVerificationCode,
        saveCode = saveEmailVerificationCode,
        sendMessage = sendEmailVerificationCodeMessage,
        markDeliveryFailed =
        markEmailVerificationCodeDeliveryFailed,
    }) => {
        const user = await findUser({
            userId,
        });

        if (
            !user
            || user.isActive !== true
            || user.deletedAt != null
        ) {
            throw new EmailVerificationUnavailableError();
        }

        if (user.emailVerifiedAt != null) {
            return Object.freeze({
                requested: false,
                alreadyVerified: true,
                expiresAt: null,
                delivery: null,
            });
        }

        const details = createCode({
            userId,
            secret: getSecret(),
            now,
        });

        const saved = await saveCode({
            userId,
            codeHash: details.codeHash,
            createdAt: now,
            expiresAt: details.expiresAt,
        });

        if (!saved) {
            throw new EmailVerificationCodeCooldownError();
        }


        let delivery;

        try {
            delivery = await sendMessage({
                recipientEmail: user.email,
                code: details.code,
                expiresAt: details.expiresAt,
            });
        } catch (error) {
            // El proveedor rechazó el envío.
            // Invalidamos exclusivamente este código.
            try {
                await markDeliveryFailed({
                    userId,
                    codeHash: details.codeHash,
                    createdAt: now,
                    failedAt: new Date(),
                });
            } catch (cleanupError) {
                // No ocultamos el fallo original de entrega.
                console.error(
                    'Unable to invalidate failed verification code:',
                    cleanupError,
                );
            }

            throw error;
        }

        return Object.freeze({
            requested: true,
            alreadyVerified: false,
            expiresAt: details.expiresAt,

            delivery: Object.freeze({
                provider: delivery.provider,
                accepted: delivery.accepted,
                simulated: delivery.simulated,
            }),
        });
    };

export const confirmEmailVerificationCode =
    async ({
        userId,
        code,
        now = new Date(),
        getSecret = getEmailVerificationCodeSecret,
        hashCode = hashEmailVerificationCode,
        verifyCode = confirmEmailVerificationCodeRecord,
    }) => {
        const secret = getSecret();

        let codeHash;

        try {
            codeHash = hashCode({
                userId,
                code,
                secret,
            });
        } catch (error) {
            if (!(error instanceof TypeError)) {
                throw error;
            }

            throw new InvalidEmailVerificationCodeError();
        }

        const result = await verifyCode({
            userId,
            codeHash,
            verifiedAt: now,
        });

        if (!result) {
            throw new InvalidEmailVerificationCodeError();
        }

        return result;
    };
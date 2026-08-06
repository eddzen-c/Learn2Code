import {
    env,
} from '../../../config/env.js';

import {
    AuthEmailDeliveryFailedError,
    AuthEmailProviderUnavailableError,
} from '../errors/account-recovery.errors.js';

import {
    deliverMockAuthEmail,
} from '../providers/mock-auth-email.provider.js';

import {
    deliverResendAuthEmail,
} from '../providers/resend-auth-email.provider.js';

const authEmailProviders =
    new Map([
        [
            'mock',
            deliverMockAuthEmail,
        ],
        [
            'resend',
            deliverResendAuthEmail,
        ],
    ]);

export const deliverAuthEmail =
    async ({
        messageType,
        recipientEmail,
        token,
        expiresAt,
        providerName =
        env.authEmail.provider,
    }) => {
        const provider =
            authEmailProviders.get(
                providerName,
            );

        if (!provider) {
            throw new AuthEmailProviderUnavailableError(
                providerName,
            );
        }

        try {
            return await provider({
                messageType,
                recipientEmail,
                token,
                expiresAt,
            });
        } catch {
            throw new AuthEmailDeliveryFailedError();
        }
    };

export const sendEmailVerificationMessage =
    (parameters) => (
        deliverAuthEmail({
            ...parameters,
            messageType:
                'email_verification',
        })
    );

export const sendPasswordResetMessage =
    (parameters) => (
        deliverAuthEmail({
            ...parameters,
            messageType:
                'password_reset',
        })
    );
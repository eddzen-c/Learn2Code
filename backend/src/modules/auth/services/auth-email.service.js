import {
    AuthEmailDeliveryFailedError,
    AuthEmailProviderUnavailableError,
} from '../errors/account-recovery.errors.js';

import {
    deliverMockAuthEmail,
} from '../providers/mock-auth-email.provider.js';

const authEmailProviders =
    new Map([
        [
            'mock',
            deliverMockAuthEmail,
        ],
    ]);

export const deliverAuthEmail =
    async ({
        messageType,
        recipientEmail,
        token,
        expiresAt,
        providerName = 'mock',
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
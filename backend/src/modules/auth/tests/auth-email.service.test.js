import assert from 'node:assert/strict';
import test from 'node:test';

import {
    AuthEmailDeliveryFailedError,
    AuthEmailProviderUnavailableError,
} from '../errors/account-recovery.errors.js';

import {
    deliverAuthEmail,
    sendEmailVerificationMessage,
    sendPasswordResetMessage,
} from '../services/auth-email.service.js';

const expiresAt =
    new Date(
        '2026-08-05T12:00:00.000Z',
    );

test(
    'sendEmailVerificationMessage delivers a verification message',
    async () => {
        const result =
            await sendEmailVerificationMessage({
                recipientEmail:
                    'student@example.com',
                token:
                    'verification-token',
                expiresAt,
            });

        assert.deepEqual(
            result,
            {
                provider: 'mock',
                accepted: true,
                messageType:
                    'email_verification',
            },
        );

        assert.equal(
            Object.isFrozen(result),
            true,
        );
    },
);

test(
    'sendPasswordResetMessage delivers a reset message',
    async () => {
        const result =
            await sendPasswordResetMessage({
                recipientEmail:
                    'student@example.com',
                token:
                    'reset-token',
                expiresAt,
            });

        assert.equal(
            result.accepted,
            true,
        );

        assert.equal(
            result.messageType,
            'password_reset',
        );
    },
);

test(
    'deliverAuthEmail rejects an unavailable provider',
    async () => {
        await assert.rejects(
            deliverAuthEmail({
                messageType:
                    'email_verification',
                recipientEmail:
                    'student@example.com',
                token:
                    'verification-token',
                expiresAt,
                providerName:
                    'unavailable',
            }),
            AuthEmailProviderUnavailableError,
        );
    },
);

test(
    'deliverAuthEmail wraps delivery failures',
    async () => {
        await assert.rejects(
            deliverAuthEmail({
                messageType:
                    'email_verification',
                recipientEmail:
                    'invalid-email',
                token:
                    'verification-token',
                expiresAt,
            }),
            AuthEmailDeliveryFailedError,
        );
    },
);
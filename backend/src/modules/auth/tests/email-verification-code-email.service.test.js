
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    sendEmailVerificationCodeMessage,
} from '../services/email-verification-code-email.service.js';

const expiresAt =
    new Date('2026-10-24T12:10:00.000Z');

const baseMessage = {
    recipientEmail: 'student@example.com',
    code: '000042',
    expiresAt,
};

test('simulates delivery with the mock provider', async () => {
    const result =
        await sendEmailVerificationCodeMessage({
            ...baseMessage,
            providerName: 'mock',
        });

    assert.deepEqual(result, {
        provider: 'mock',
        accepted: true,
        simulated: true,
    });

    assert.equal('code' in result, false);
});

test('sends a six-digit code through Resend', async () => {
    let sentMessage;

    const emailClient = {
        emails: {
            send: async (message) => {
                sentMessage = message;

                return {
                    data: {
                        id: 'email-test-1',
                    },
                    error: null,
                };
            },
        },
    };

    const result =
        await sendEmailVerificationCodeMessage({
            ...baseMessage,
            providerName: 'resend',
            emailClient,
        });

    assert.equal(result.provider, 'resend');
    assert.equal(result.accepted, true);
    assert.equal(result.simulated, false);

    assert.match(
        sentMessage.subject,
        /código de verificación/,
    );

    assert.match(
        sentMessage.text,
        /000042/,
    );

    assert.match(
        sentMessage.html,
        /000042/,
    );

    assert.equal('code' in result, false);
});

test('rejects invalid verification codes', async () => {
    await assert.rejects(
        sendEmailVerificationCodeMessage({
            ...baseMessage,
            code: '12345',
            providerName: 'mock',
        }),
        TypeError,
    );
});

test('handles email delivery failures', async () => {
    const emailClient = {
        emails: {
            send: async () => ({
                data: null,
                error: {
                    message: 'Delivery rejected',
                },
            }),
        },
    };

    await assert.rejects(
        sendEmailVerificationCodeMessage({
            ...baseMessage,
            providerName: 'resend',
            emailClient,
        }),
        {
            code: 'AUTH_EMAIL_DELIVERY_FAILED',
        },
    );
});

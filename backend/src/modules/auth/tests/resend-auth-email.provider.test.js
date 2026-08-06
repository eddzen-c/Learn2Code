import assert from 'node:assert/strict';
import test from 'node:test';

import {
    deliverResendAuthEmail,
} from '../providers/resend-auth-email.provider.js';

const expiresAt =
    new Date(
        '2026-08-06T20:00:00.000Z',
    );

const createClient = ({
    data = {
        id: 'email-message-1',
    },
    error = null,
} = {}) => {
    const calls = [];

    return {
        calls,

        client: {
            emails: {
                send:
                    async (message) => {
                        calls.push(message);

                        return {
                            data,
                            error,
                        };
                    },
            },
        },
    };
};

test(
    'deliverResendAuthEmail sends an email verification message',
    async () => {
        const {
            client,
            calls,
        } = createClient();

        const result =
            await deliverResendAuthEmail({
                messageType:
                    'email_verification',

                recipientEmail:
                    'student@example.com',

                token:
                    'verification-token',

                expiresAt,

                from:
                    'Learn2Code <onboarding@resend.dev>',

                frontendUrl:
                    'http://localhost:5173',

                client,
            });

        assert.deepEqual(
            result,
            {
                provider: 'resend',
                accepted: true,
                messageType:
                    'email_verification',
                messageId:
                    'email-message-1',
            },
        );

        assert.equal(
            Object.isFrozen(result),
            true,
        );

        assert.equal(
            calls.length,
            1,
        );

        assert.equal(
            calls[0].from,
            'Learn2Code <onboarding@resend.dev>',
        );

        assert.deepEqual(
            calls[0].to,
            [
                'student@example.com',
            ],
        );

        assert.match(
            calls[0].subject,
            /Verifica tu correo/,
        );

        assert.match(
            calls[0].text,
            /verify-email\?token=verification-token/,
        );

        assert.match(
            calls[0].html,
            /verify-email\?token=verification-token/,
        );
    },
);

test(
    'deliverResendAuthEmail sends a password reset message',
    async () => {
        const {
            client,
            calls,
        } = createClient({
            data: {
                id: 'reset-message-1',
            },
        });

        const result =
            await deliverResendAuthEmail({
                messageType:
                    'password_reset',

                recipientEmail:
                    'student@example.com',

                token:
                    'reset-token',

                expiresAt,

                from:
                    'Learn2Code <onboarding@resend.dev>',

                frontendUrl:
                    'http://localhost:5173',

                client,
            });

        assert.equal(
            result.messageId,
            'reset-message-1',
        );

        assert.match(
            calls[0].subject,
            /Restablece tu contraseña/,
        );

        assert.match(
            calls[0].text,
            /reset-password\?token=reset-token/,
        );
    },
);

test(
    'deliverResendAuthEmail encodes the token in the action URL',
    async () => {
        const {
            client,
            calls,
        } = createClient();

        await deliverResendAuthEmail({
            messageType:
                'email_verification',

            recipientEmail:
                'student@example.com',

            token:
                'token with special&characters',

            expiresAt,

            from:
                'Learn2Code <onboarding@resend.dev>',

            frontendUrl:
                'http://localhost:5173',

            client,
        });

        assert.match(
            calls[0].text,
            /token=token\+with\+special%26characters/,
        );

        assert.match(
            calls[0].html,
            /token=token\+with\+special%26characters/,
        );
    },
);

test(
    'deliverResendAuthEmail rejects provider errors',
    async () => {
        const {
            client,
        } = createClient({
            data: null,
            error: {
                message:
                    'Resend rejected the email',
            },
        });

        await assert.rejects(
            deliverResendAuthEmail({
                messageType:
                    'email_verification',

                recipientEmail:
                    'student@example.com',

                token:
                    'verification-token',

                expiresAt,

                from:
                    'Learn2Code <onboarding@resend.dev>',

                frontendUrl:
                    'http://localhost:5173',

                client,
            }),
            /Resend rejected the email/,
        );
    },
);

test(
    'deliverResendAuthEmail rejects invalid messages',
    async () => {
        const {
            client,
        } = createClient();

        await assert.rejects(
            deliverResendAuthEmail({
                messageType:
                    'unsupported',

                recipientEmail:
                    'student@example.com',

                token:
                    'verification-token',

                expiresAt,

                from:
                    'Learn2Code <onboarding@resend.dev>',

                frontendUrl:
                    'http://localhost:5173',

                client,
            }),
            TypeError,
        );
    },
);
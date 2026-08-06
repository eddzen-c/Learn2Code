import {
    Resend,
} from 'resend';

import {
    env,
} from '../../../config/env.js';

const MESSAGE_CONFIGURATION =
    Object.freeze({
        email_verification:
            Object.freeze({
                subject:
                    'Verifica tu correo en Learn2Code',

                title:
                    'Verifica tu correo electrónico',

                description:
                    'Confirma tu dirección de correo para continuar con tu experiencia de aprendizaje.',

                actionLabel:
                    'Verificar mi correo',

                path:
                    '/verify-email',
            }),

        password_reset:
            Object.freeze({
                subject:
                    'Restablece tu contraseña de Learn2Code',

                title:
                    'Restablece tu contraseña',

                description:
                    'Recibimos una solicitud para crear una nueva contraseña para tu cuenta.',

                actionLabel:
                    'Crear nueva contraseña',

                path:
                    '/reset-password',
            }),
    });

const escapeHtml = (value) => (
    value
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
);

const validateMessage = ({
    messageType,
    recipientEmail,
    token,
    expiresAt,
}) => {
    if (
        !Object.hasOwn(
            MESSAGE_CONFIGURATION,
            messageType,
        )
    ) {
        throw new TypeError(
            'Authentication email message type is invalid',
        );
    }

    if (
        typeof recipientEmail !== 'string'
        || !recipientEmail.includes('@')
    ) {
        throw new TypeError(
            'Recipient email is invalid',
        );
    }

    if (
        typeof token !== 'string'
        || token.trim().length === 0
    ) {
        throw new TypeError(
            'Authentication email token is invalid',
        );
    }

    if (
        !(expiresAt instanceof Date)
        || Number.isNaN(
            expiresAt.getTime(),
        )
    ) {
        throw new TypeError(
            'Authentication email expiration is invalid',
        );
    }
};

const createActionUrl = ({
    frontendUrl,
    path,
    token,
}) => {
    const actionUrl =
        new URL(path, frontendUrl);

    actionUrl.searchParams.set(
        'token',
        token,
    );

    return actionUrl.toString();
};

const createTextContent = ({
    configuration,
    actionUrl,
    expiresAt,
}) => (
    [
        configuration.title,
        '',
        configuration.description,
        '',
        `${configuration.actionLabel}: ${actionUrl}`,
        '',
        `Este enlace vence el ${expiresAt.toISOString()}.`,
        '',
        'Si no solicitaste esta acción, puedes ignorar este correo.',
    ].join('\n')
);

const createHtmlContent = ({
    configuration,
    actionUrl,
    expiresAt,
}) => {
    const safeActionUrl =
        escapeHtml(actionUrl);

    return `
        <!doctype html>
        <html lang="es">
            <body style="font-family: Arial, sans-serif; color: #111827;">
                <main style="max-width: 560px; margin: 0 auto; padding: 32px;">
                    <h1 style="color: #111827;">
                        ${configuration.title}
                    </h1>

                    <p>
                        ${configuration.description}
                    </p>

                    <p style="margin: 32px 0;">
                        <a
                            href="${safeActionUrl}"
                            style="
                                background: #2563eb;
                                border-radius: 8px;
                                color: #ffffff;
                                display: inline-block;
                                padding: 12px 20px;
                                text-decoration: none;
                            "
                        >
                            ${configuration.actionLabel}
                        </a>
                    </p>

                    <p>
                        Este enlace vence el
                        ${escapeHtml(expiresAt.toISOString())}.
                    </p>

                    <p style="color: #64748b;">
                        Si no solicitaste esta acción,
                        puedes ignorar este correo.
                    </p>
                </main>
            </body>
        </html>
    `.trim();
};

export const deliverResendAuthEmail =
    async ({
        messageType,
        recipientEmail,
        token,
        expiresAt,
        apiKey =
        env.authEmail.resendApiKey,
        from =
        env.authEmail.from,
        frontendUrl =
        env.authEmail.frontendUrl,
        client = null,
    }) => {
        validateMessage({
            messageType,
            recipientEmail,
            token,
            expiresAt,
        });

        if (
            !client
            && (
                typeof apiKey !== 'string'
                || apiKey.trim().length === 0
            )
        ) {
            throw new TypeError(
                'Resend API key is unavailable',
            );
        }

        const emailClient =
            client
            ?? new Resend(apiKey);

        if (
            !emailClient.emails
            || typeof emailClient.emails.send
            !== 'function'
        ) {
            throw new TypeError(
                'Resend client is invalid',
            );
        }

        const configuration =
            MESSAGE_CONFIGURATION[
            messageType
            ];

        const actionUrl =
            createActionUrl({
                frontendUrl,
                path:
                    configuration.path,
                token,
            });

        const {
            data,
            error,
        } = await emailClient.emails.send({
            from,
            to: [recipientEmail],
            subject:
                configuration.subject,

            text:
                createTextContent({
                    configuration,
                    actionUrl,
                    expiresAt,
                }),

            html:
                createHtmlContent({
                    configuration,
                    actionUrl,
                    expiresAt,
                }),
        });

        if (error) {
            throw new Error(
                error.message
                ?? 'Resend rejected the authentication email',
            );
        }

        if (
            !data
            || typeof data.id !== 'string'
            || data.id.length === 0
        ) {
            throw new Error(
                'Resend returned an invalid response',
            );
        }

        return Object.freeze({
            provider: 'resend',
            accepted: true,
            messageType,
            messageId: data.id,
        });
    };
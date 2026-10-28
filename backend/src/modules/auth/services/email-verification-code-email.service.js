
import {
    Resend,
} from 'resend';

import {
    env,
} from '../../../config/env.js';

import {
    AuthEmailDeliveryFailedError,
    AuthEmailProviderUnavailableError,
} from '../errors/account-recovery.errors.js';

export const sendEmailVerificationCodeMessage =
    async ({
        recipientEmail,
        code,
        expiresAt,
        providerName = env.authEmail.provider,
        emailClient = null,
    }) => {
        if (
            typeof recipientEmail !== 'string'
            || !recipientEmail.includes('@')
        ) {
            throw new TypeError(
                'Recipient email is invalid',
            );
        }

        if (
            typeof code !== 'string'
            || !/^\d{6}$/.test(code)
        ) {
            throw new TypeError(
                'Verification code must have six digits',
            );
        }

        if (
            !(expiresAt instanceof Date)
            || Number.isNaN(expiresAt.getTime())
        ) {
            throw new TypeError(
                'Verification expiration is invalid',
            );
        }

        if (providerName === 'mock') {
            return Object.freeze({
                provider: 'mock',
                accepted: true,
                simulated: true,
            });
        }

        if (providerName !== 'resend') {
            throw new AuthEmailProviderUnavailableError(
                providerName,
            );
        }

        try {
            const client =
                emailClient
                ?? new Resend(env.authEmail.resendApiKey);

            const expiration =
                expiresAt.toISOString();

            const response = await client.emails.send({
                from: env.authEmail.from,
                to: [recipientEmail],

                subject:
                    'Tu código de verificación de Learn2Code',

                text: [
                    'Verifica tu correo en Learn2Code.',
                    '',
                    `Tu código es: ${code}`,
                    '',
                    'El código es válido durante 10 minutos.',
                    `Vence el: ${expiration}`,
                    '',
                    'Si no solicitaste este código,',
                    'puedes ignorar este mensaje.',
                ].join('\n'),

                html: `
                    <!doctype html>
                    <html lang="es">
                        <body style="
                            margin: 0;
                            padding: 32px;
                            background: #f5f6fa;
                            font-family: Arial, sans-serif;
                        ">
                            <main style="
                                max-width: 480px;
                                margin: auto;
                                padding: 32px;
                                border-radius: 16px;
                                background: #ffffff;
                                color: #171a22;
                            ">
                                <h1 style="
                                    font-size: 26px;
                                    margin-bottom: 16px;
                                ">
                                    Verifica tu correo
                                </h1>

                                <p>
                                    Introduce este código en
                                    Learn2Code para continuar:
                                </p>

                                <p style="
                                    padding: 20px;
                                    border-radius: 12px;
                                    background: #fff0f1;
                                    color: #d71932;
                                    font-size: 34px;
                                    font-weight: 700;
                                    letter-spacing: 9px;
                                    text-align: center;
                                ">
                                    ${code}
                                </p>

                                <p>
                                    Este código es válido durante
                                    10 minutos.
                                </p>

                                <p style="
                                    color: #6b7280;
                                    font-size: 13px;
                                ">
                                    Si no solicitaste este código,
                                    puedes ignorar el mensaje.
                                </p>
                            </main>
                        </body>
                    </html>
                `.trim(),
            });

            if (
                response.error
                || !response.data
                || typeof response.data.id !== 'string'
                || !response.data.id
            ) {
                throw new Error(
                    'Email provider rejected the message',
                );
            }

            return Object.freeze({
                provider: 'resend',
                accepted: true,
                simulated: false,
            });
        } catch {
            throw new AuthEmailDeliveryFailedError();
        }
    };

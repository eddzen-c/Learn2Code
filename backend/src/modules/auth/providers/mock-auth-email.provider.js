const MESSAGE_TYPES =
    new Set([
        'email_verification',
        'password_reset',
    ]);

const assertMessage = ({
    messageType,
    recipientEmail,
    token,
    expiresAt,
}) => {
    if (!MESSAGE_TYPES.has(messageType)) {
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

export const deliverMockAuthEmail =
    async ({
        messageType,
        recipientEmail,
        token,
        expiresAt,
    }) => {
        assertMessage({
            messageType,
            recipientEmail,
            token,
            expiresAt,
        });

        return Object.freeze({
            provider: 'mock',
            accepted: true,
            messageType,
        });
    };
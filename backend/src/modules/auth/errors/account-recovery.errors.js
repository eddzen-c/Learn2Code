class AccountRecoveryError extends Error {
    constructor(
        message,
        code,
        statusCode,
    ) {
        super(message);

        this.name = new.target.name;
        this.code = code;
        this.statusCode = statusCode;
    }
}

export class AuthEmailProviderUnavailableError
    extends AccountRecoveryError {
    constructor(providerName) {
        super(
            `Authentication email provider "${providerName}" is unavailable`,
            'AUTH_EMAIL_PROVIDER_UNAVAILABLE',
            503,
        );
    }
}

export class AuthEmailDeliveryFailedError
    extends AccountRecoveryError {
    constructor() {
        super(
            'The authentication email could not be delivered',
            'AUTH_EMAIL_DELIVERY_FAILED',
            502,
        );
    }
}

export class InvalidEmailVerificationTokenError
    extends AccountRecoveryError {
    constructor() {
        super(
            'The email verification token is invalid or expired',
            'INVALID_EMAIL_VERIFICATION_TOKEN',
            400,
        );
    }
}

export class InvalidPasswordResetTokenError
    extends AccountRecoveryError {
    constructor() {
        super(
            'The password reset token is invalid or expired',
            'INVALID_PASSWORD_RESET_TOKEN',
            400,
        );
    }
}

export class EmailVerificationUnavailableError
    extends AccountRecoveryError {
    constructor() {
        super(
            'Email verification is unavailable',
            'EMAIL_VERIFICATION_UNAVAILABLE',
            404,
        );
    }
}
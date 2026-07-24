class RefreshTokenError extends Error {
    constructor(message, code) {
        super(message);

        this.name = new.target.name;
        this.code = code;
        this.statusCode = 401;
    }
}

export class InvalidRefreshTokenError
    extends RefreshTokenError {
    constructor() {
        super(
            'Refresh token is invalid',
            'INVALID_REFRESH_TOKEN',
        );
    }
}

export class ExpiredRefreshTokenError
    extends RefreshTokenError {
    constructor() {
        super(
            'Refresh token has expired',
            'EXPIRED_REFRESH_TOKEN',
        );
    }
}

export class RefreshTokenReuseDetectedError
    extends RefreshTokenError {
    constructor() {
        super(
            'Refresh token reuse was detected',
            'REFRESH_TOKEN_REUSE_DETECTED',
        );
    }
}

export class InvalidCurrentPasswordError extends Error {
    constructor() {
        super('The current password is incorrect');

        this.name = new.target.name;
        this.code = 'INVALID_CURRENT_PASSWORD';
        this.statusCode = 400;
    }
}

export class PasswordReuseNotAllowedError extends Error {
    constructor() {
        super('The new password must be different');

        this.name = new.target.name;
        this.code = 'PASSWORD_REUSE_NOT_ALLOWED';
        this.statusCode = 400;
    }
}

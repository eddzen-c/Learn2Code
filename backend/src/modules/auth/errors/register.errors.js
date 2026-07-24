export class EmailAlreadyRegisteredError extends Error {
    constructor() {
        super('An account with this email already exists');

        this.name = 'EmailAlreadyRegisteredError';
        this.code = 'EMAIL_ALREADY_REGISTERED';
        this.statusCode = 409;
    }
}

export class StudentRoleNotFoundError extends Error {
    constructor() {
        super('The student role is not configured');

        this.name = 'StudentRoleNotFoundError';
        this.code = 'STUDENT_ROLE_NOT_CONFIGURED';
        this.statusCode = 500;
    }
}
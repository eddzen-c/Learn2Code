export class AuthenticationRequiredError
    extends Error {
    constructor() {
        super('Authentication is required');

        this.name = new.target.name;
        this.code = 'AUTHENTICATION_REQUIRED';
        this.statusCode = 401;
    }
}
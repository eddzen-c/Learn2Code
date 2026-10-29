export class UnsupportedProgrammingLanguageError
    extends Error {
    constructor() {
        super(
            'The selected programming language is not supported',
        );

        this.name = new.target.name;
        this.code =
            'UNSUPPORTED_PROGRAMMING_LANGUAGE';
        this.statusCode = 400;
    }
}

export class UsernameAlreadyTakenError extends Error {
    constructor() {
        super('El nombre de usuario ya está en uso.');

        this.name = new.target.name;
        this.code = 'USERNAME_ALREADY_TAKEN';
        this.statusCode = 409;
    }
}
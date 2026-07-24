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
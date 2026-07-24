    export class InsufficientPermissionsError
    extends Error {
    constructor() {
        super(
            'You do not have permission to access this resource',
        );

        this.name = new.target.name;
        this.code = 'INSUFFICIENT_PERMISSIONS';
        this.statusCode = 403;
    }
}
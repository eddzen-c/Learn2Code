class DiagnosticError extends Error {
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

export class ActiveDiagnosticAssessmentError
    extends DiagnosticError {
    constructor() {
        super(
            'The user already has an active diagnostic assessment',
            'ACTIVE_DIAGNOSTIC_ASSESSMENT',
            409,
        );
    }
}

export class UnsupportedDiagnosticLanguageError
    extends DiagnosticError {
    constructor() {
        super(
            'The selected programming language is not available',
            'UNSUPPORTED_DIAGNOSTIC_LANGUAGE',
            400,
        );
    }
}

export class DiagnosticCatalogUnavailableError
    extends DiagnosticError {
    constructor() {
        super(
            'The diagnostic catalog is not available',
            'DIAGNOSTIC_CATALOG_UNAVAILABLE',
            503,
        );
    }
}

export class DiagnosticProviderUnavailableError
    extends DiagnosticError {
    constructor(providerName) {
        super(
            `Diagnostic provider "${providerName}" is not available`,
            'DIAGNOSTIC_PROVIDER_UNAVAILABLE',
            503,
        );

        this.providerName = providerName;
    }
}

export class DiagnosticGenerationFailedError
    extends DiagnosticError {
    constructor() {
        super(
            'The diagnostic assessment could not be generated',
            'DIAGNOSTIC_GENERATION_FAILED',
            502,
        );
    }
}

export class DiagnosticQuestionNotFoundError
    extends DiagnosticError {
    constructor() {
        super(
            'The diagnostic question was not found',
            'DIAGNOSTIC_QUESTION_NOT_FOUND',
            404,
        );
    }
}

export class DiagnosticNotInProgressError
    extends DiagnosticError {
    constructor() {
        super(
            'The diagnostic assessment is not in progress',
            'DIAGNOSTIC_NOT_IN_PROGRESS',
            409,
        );
    }
}

export class DiagnosticExpiredError
    extends DiagnosticError {
    constructor() {
        super(
            'The diagnostic assessment has expired',
            'DIAGNOSTIC_EXPIRED',
            410,
        );
    }
}

export class DiagnosticQuestionAlreadyAnsweredError
    extends DiagnosticError {
    constructor() {
        super(
            'The diagnostic question has already been answered',
            'DIAGNOSTIC_QUESTION_ALREADY_ANSWERED',
            409,
        );
    }
}
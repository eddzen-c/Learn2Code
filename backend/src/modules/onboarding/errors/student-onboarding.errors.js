class StudentOnboardingError
    extends Error {
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

export class UnsupportedOnboardingLanguageError
    extends StudentOnboardingError {
    constructor() {
        super(
            'The selected programming language is unavailable',
            'UNSUPPORTED_ONBOARDING_LANGUAGE',
            400,
        );
    }
}

export class UnsupportedOnboardingDifficultyError
    extends StudentOnboardingError {
    constructor() {
        super(
            'The selected experience level is unavailable',
            'UNSUPPORTED_ONBOARDING_DIFFICULTY',
            400,
        );
    }
}

export class UnsupportedOnboardingTopicError
    extends StudentOnboardingError {
    constructor() {
        super(
            'One or more selected topics are unavailable',
            'UNSUPPORTED_ONBOARDING_TOPIC',
            400,
        );
    }
}

export class StudentOnboardingUnavailableError
    extends StudentOnboardingError {
    constructor() {
        super(
            'Student onboarding is unavailable',
            'STUDENT_ONBOARDING_UNAVAILABLE',
            404,
        );
    }
}

export class OnboardingCatalogUnavailableError
    extends StudentOnboardingError {
    constructor() {
        super(
            'Student onboarding catalog is unavailable',
            'ONBOARDING_CATALOG_UNAVAILABLE',
            503,
        );
    }
}

export class StudentOnboardingRequiredError
    extends StudentOnboardingError {
    constructor() {
        super(
            'Student onboarding must be completed before starting the diagnostic',
            'STUDENT_ONBOARDING_REQUIRED',
            409,
        );
    }
}
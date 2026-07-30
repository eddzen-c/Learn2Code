class ExerciseError extends Error {
    constructor(
        message,
        code,
        statusCode,
    ) {
        super(message)

        this.name = new.target.name
        this.code = code
        this.statusCode = statusCode
    }
}

export class DiagnosticRequiredForExerciseError
    extends ExerciseError {
    constructor() {
        super(
            'A completed diagnostic assessment is required',
            'DIAGNOSTIC_REQUIRED_FOR_EXERCISE',
            409,
        )
    }
}

export class AdaptiveExerciseContextUnavailableError
    extends ExerciseError {
    constructor() {
        super(
            'The adaptive exercise context is unavailable',
            'ADAPTIVE_EXERCISE_CONTEXT_UNAVAILABLE',
            409,
        )
    }
}

export class ExerciseProviderUnavailableError
    extends ExerciseError {
    constructor(providerName) {
        super(
            `Exercise provider "${providerName}" is unavailable`,
            'EXERCISE_PROVIDER_UNAVAILABLE',
            503,
        )
    }
}

export class ExerciseGenerationFailedError
    extends ExerciseError {
    constructor() {
        super(
            'The personalized exercise could not be generated',
            'EXERCISE_GENERATION_FAILED',
            502,
        )
    }
}
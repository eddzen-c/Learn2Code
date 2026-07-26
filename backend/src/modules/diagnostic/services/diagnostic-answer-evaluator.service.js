const normalizeAnswer = (
    value,
    {
        caseSensitive,
    },
) => {
    if (
        value === null
        || value === undefined
    ) {
        throw new TypeError(
            'Diagnostic answer is required',
        );
    }

    if (
        typeof value === 'object'
    ) {
        return JSON.stringify(value);
    }

    const normalized =
        String(value).trim();

    return caseSensitive
        ? normalized
        : normalized.toLowerCase();
};

export const evaluateDiagnosticAnswer = ({
    answer,
    expectedAnswer,
    maxScore = 100,
    evaluationCriteria = {},
    explanation = null,
}) => {
    if (
        typeof maxScore !== 'number'
        || !Number.isFinite(maxScore)
        || maxScore <= 0
        || maxScore > 100
    ) {
        throw new TypeError(
            'Maximum score must be between 1 and 100',
        );
    }

    const mode =
        evaluationCriteria.mode
        ?? 'exact_match';

    if (mode !== 'exact_match') {
        throw new TypeError(
            `Evaluation mode "${mode}" is not supported`,
        );
    }

    const caseSensitive =
        evaluationCriteria.caseSensitive
        ?? false;

    const normalizedAnswer =
        normalizeAnswer(
            answer,
            {
                caseSensitive,
            },
        );

    const normalizedExpectedAnswer =
        normalizeAnswer(
            expectedAnswer,
            {
                caseSensitive,
            },
        );

    const isCorrect =
        normalizedAnswer
        === normalizedExpectedAnswer;

    const score = isCorrect
        ? maxScore
        : 0;

    const feedback = isCorrect
        ? 'Respuesta correcta.'
        : (
            explanation
            ?? 'La respuesta no coincide con el resultado esperado.'
        );

    return Object.freeze({
        isCorrect,
        score,
        feedback,

        evaluationSource: 'automatic',

        evaluationMetadata: Object.freeze({
            mode,
            caseSensitive,
            evaluator:
                'learn2code-exact-match-v1',
        }),
    });
};
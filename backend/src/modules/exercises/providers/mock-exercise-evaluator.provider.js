const normalizeSourceCode = (value) => (
    value
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(
            (line) => line.trimEnd(),
        )
        .filter(
            (line) => (
                line.trim().length > 0
            ),
        )
        .join('\n')
        .trim()
);

export const evaluateMockExerciseSubmission =
    ({
        submittedCode,
        solutionCode,
        testCases,
    }) => {
        if (
            typeof submittedCode !== 'string'
            || submittedCode.trim()
                .length === 0
        ) {
            throw new TypeError(
                'Submitted code must be a non-empty string',
            );
        }

        if (
            typeof solutionCode !== 'string'
            || solutionCode.trim()
                .length === 0
        ) {
            throw new TypeError(
                'Solution code must be a non-empty string',
            );
        }

        if (
            !Array.isArray(testCases)
            || testCases.length === 0
        ) {
            throw new TypeError(
                'At least one test case is required',
            );
        }

        const accepted =
            normalizeSourceCode(
                submittedCode,
            )
            === normalizeSourceCode(
                solutionCode,
            );

        const results = testCases.map(
            (testCase) => (
                Object.freeze({
                    testCaseId:
                        testCase.id,
                    passed: accepted,
                    actualOutput:
                        accepted
                            ? testCase
                                .expectedOutput
                            : null,
                    errorMessage:
                        accepted
                            ? null
                            : 'Simulated evaluator could not verify the submitted solution',
                    executionTimeMs: 0,
                    weight: Number(
                        testCase.weight,
                    ),
                })
            ),
        );

        const totalWeight = results.reduce(
            (
                total,
                result,
            ) => (
                total + result.weight
            ),
            0,
        );

        const passedWeight = results.reduce(
            (
                total,
                result,
            ) => (
                result.passed
                    ? total + result.weight
                    : total
            ),
            0,
        );

        const score =
            totalWeight > 0
                ? Number(
                    (
                        passedWeight
                        / totalWeight
                        * 100
                    ).toFixed(2),
                )
                : 0;

        const testsPassed =
            results.filter(
                (result) => result.passed,
            ).length;

        return Object.freeze({
            provider: 'mock',
            evaluator:
                'learn2code-mock-evaluator-v1',
            passed:
                testsPassed
                === results.length,
            score,
            testsPassed,
            testsTotal: results.length,
            executionTimeMs: 0,

            feedback:
                accepted
                    ? 'La solución coincide con la respuesta esperada del evaluador simulado.'
                    : 'El evaluador simulado no pudo validar esta solución. Revisa el algoritmo e inténtalo nuevamente.',

            results: Object.freeze(
                results,
            ),
        });
    };
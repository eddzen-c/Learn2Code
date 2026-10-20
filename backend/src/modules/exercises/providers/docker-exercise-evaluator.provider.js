import {
    runJavaScriptInDocker,
} from '../services/docker-code-runner.service.js';

const toText = (value) => {
    if (
        typeof value === 'string'
        || typeof value === 'boolean'
        || (
            typeof value === 'number'
            && Number.isFinite(value)
        )
    ) {
        return String(value);
    }

    throw new TypeError(
        'Test case values must be text, finite numbers or booleans',
    );
};

const normalizeOutput = (value) => (
    value
        .replace(/\r\n/g, '\n')
        .replace(/\n$/, '')
);

const errorMessages = {
    completed:
        'La salida no coincide con el resultado esperado.',

    runtime_error:
        'El programa terminó con un error.',

    time_limit_exceeded:
        'El programa superó el tiempo permitido.',

    output_limit_exceeded:
        'El programa generó demasiada salida.',
};

export const evaluateDockerExerciseSubmission =
    async ({
        submittedCode,
        languageId,
        testCases,
        runCase = runJavaScriptInDocker,
    }) => {
        if (languageId !== 1) {
            throw new TypeError(
                'Docker evaluator currently supports JavaScript only',
            );
        }

        if (
            typeof submittedCode !== 'string'
            || submittedCode.trim().length === 0
            || Buffer.byteLength(
                submittedCode,
                'utf8',
            ) > 64 * 1024
        ) {
            throw new TypeError(
                'Submitted code is invalid',
            );
        }

        if (
            !Array.isArray(testCases)
            || testCases.length < 1
            || testCases.length > 6
        ) {
            throw new TypeError(
                'Between one and six test cases are required',
            );
        }

        const ids = new Set();

        const preparedCases = testCases.map(
            (testCase) => {
                if (
                    !testCase
                    || typeof testCase.id !== 'string'
                    || testCase.id.length === 0
                    || ids.has(testCase.id)
                ) {
                    throw new TypeError(
                        'Test case identifiers must be unique',
                    );
                }

                ids.add(testCase.id);

                const weight =
                    Number(testCase.weight);

                const input =
                    toText(testCase.input ?? '');

                const expectedOutput =
                    toText(testCase.expectedOutput);

                if (
                    !Number.isFinite(weight)
                    || weight <= 0
                ) {
                    throw new TypeError(
                        'Test case weight must be positive',
                    );
                }

                if (
                    Buffer.byteLength(
                        input,
                        'utf8',
                    ) > 16 * 1024
                ) {
                    throw new TypeError(
                        'Test case input is too large',
                    );
                }

                return {
                    id: testCase.id,
                    weight,
                    input,
                    expectedOutput,
                };
            },
        );

        const results = [];

        let executionTimeMs = 0;

        for (
            const testCase
            of preparedCases
        ) {
            const execution = await runCase({
                code: submittedCode,
                input: testCase.input,
            });

            if (
                !execution
                || !Object.hasOwn(
                    errorMessages,
                    execution.status,
                )
                || typeof execution.stdout !== 'string'
                || !Number.isInteger(
                    execution.executionTimeMs,
                )
                || execution.executionTimeMs < 0
            ) {
                throw new Error(
                    'Invalid execution result',
                );
            }

            const passed =
                execution.status === 'completed'
                && execution.exitCode === 0
                && normalizeOutput(
                    execution.stdout,
                ) === normalizeOutput(
                    testCase.expectedOutput,
                );

            executionTimeMs +=
                execution.executionTimeMs;

            results.push(
                Object.freeze({
                    testCaseId:
                        testCase.id,
                    passed,
                    actualOutput:
                        execution.stdout,
                    errorMessage:
                        passed
                            ? null
                            : errorMessages[
                                execution.status
                            ],
                    executionTimeMs:
                        execution.executionTimeMs,
                    weight:
                        testCase.weight,
                }),
            );
        }

        const totalWeight = results.reduce(
            (sum, result) => (
                sum + result.weight
            ),
            0,
        );

        const passedWeight = results.reduce(
            (sum, result) => (
                sum + (
                    result.passed
                        ? result.weight
                        : 0
                )
            ),
            0,
        );

        const testsPassed = results.filter(
            (result) => result.passed,
        ).length;

        const passed =
            testsPassed === results.length;

        return Object.freeze({
            provider: 'docker',

            evaluator:
                'learn2code-docker-javascript-v1',

            passed,

            score: Number(
                (
                    passedWeight
                    / totalWeight
                    * 100
                ).toFixed(2),
            ),

            testsPassed,
            testsTotal:
                results.length,

            executionTimeMs,

            feedback:
                passed
                    ? 'Tu solución superó todos los casos de prueba.'
                    : 'Revisa los resultados disponibles y vuelve a intentarlo.',

            results:
                Object.freeze(results),
        });
    };
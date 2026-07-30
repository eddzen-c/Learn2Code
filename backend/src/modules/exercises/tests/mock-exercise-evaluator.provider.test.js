import assert from 'node:assert/strict';
import {
    randomUUID,
} from 'node:crypto';
import test from 'node:test';

import {
    evaluateMockExerciseSubmission,
} from '../providers/mock-exercise-evaluator.provider.js';

const testCases = [
    {
        id: randomUUID(),
        expectedOutput: '10',
        weight: 1,
    },
    {
        id: randomUUID(),
        expectedOutput: '21',
        weight: 2,
    },
];

test(
    'mock evaluator accepts matching source code',
    () => {
        const solutionCode =
            'const value = 10;\nconsole.log(value);';

        const result =
            evaluateMockExerciseSubmission({
                submittedCode:
                    `${solutionCode}   \n\n`,
                solutionCode,
                testCases,
            });

        assert.equal(
            result.provider,
            'mock',
        );

        assert.equal(result.passed, true);
        assert.equal(result.score, 100);
        assert.equal(
            result.testsPassed,
            2,
        );
        assert.equal(
            result.testsTotal,
            2,
        );

        assert.equal(
            result.results[0]
                .actualOutput,
            '10',
        );

        assert.equal(
            result.results[1]
                .actualOutput,
            '21',
        );
    },
);

test(
    'mock evaluator rejects different source code',
    () => {
        const result =
            evaluateMockExerciseSubmission({
                submittedCode:
                    'console.log("incorrecto");',

                solutionCode:
                    'console.log("correcto");',

                testCases,
            });

        assert.equal(result.passed, false);
        assert.equal(result.score, 0);
        assert.equal(
            result.testsPassed,
            0,
        );

        assert.equal(
            result.results.every(
                (item) => (
                    item.passed === false
                ),
            ),
            true,
        );

        assert.match(
            result.feedback,
            /no pudo validar/,
        );
    },
);

test(
    'mock evaluator preserves test case information',
    () => {
        const solutionCode =
            'print("correcto")';

        const result =
            evaluateMockExerciseSubmission({
                submittedCode:
                    solutionCode,
                solutionCode,
                testCases,
            });

        assert.equal(
            result.results[0]
                .testCaseId,
            testCases[0].id,
        );

        assert.equal(
            result.results[1].weight,
            2,
        );

        assert.equal(
            result.results[0]
                .executionTimeMs,
            0,
        );
    },
);

test(
    'mock evaluator validates required values',
    () => {
        assert.throws(
            () => (
                evaluateMockExerciseSubmission({
                    submittedCode: '',
                    solutionCode:
                        'print(1)',
                    testCases,
                })
            ),
            /Submitted code must be a non-empty string/,
        );

        assert.throws(
            () => (
                evaluateMockExerciseSubmission({
                    submittedCode:
                        'print(1)',
                    solutionCode: '',
                    testCases,
                })
            ),
            /Solution code must be a non-empty string/,
        );

        assert.throws(
            () => (
                evaluateMockExerciseSubmission({
                    submittedCode:
                        'print(1)',
                    solutionCode:
                        'print(1)',
                    testCases: [],
                })
            ),
            /At least one test case is required/,
        );
    },
);
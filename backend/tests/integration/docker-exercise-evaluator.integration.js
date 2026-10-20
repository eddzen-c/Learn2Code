import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import {
    evaluateExerciseSubmission,
} from '../../src/modules/exercises/services/exercise-evaluator.service.js';

const createCase = ({
    input,
    expectedOutput,
    weight = 1,
}) => ({
    id: randomUUID(),
    input,
    expectedOutput,
    weight,
});

test(
    'Docker evaluates a JavaScript solution against different inputs',
    { timeout: 60_000 },
    async () => {
        const testCases = [
            createCase({
                input: '4 7',
                expectedOutput: '11',
            }),
            createCase({
                input: '-2 5',
                expectedOutput: '3',
            }),
        ];

        const result = await evaluateExerciseSubmission({
            evaluatorName: 'docker',
            languageId: 1,
            submittedCode: `
        const fs = require('node:fs');
        const numbers = fs.readFileSync(0, 'utf8')
          .trim()
          .split(/\\s+/)
          .map(Number);

        console.log(
          numbers.reduce((total, number) => total + number, 0)
        );
      `,
            solutionCode: '// Otra implementación de referencia.',
            testCases,
        });

        assert.equal(result.provider, 'docker');
        assert.equal(result.evaluator, 'learn2code-docker-javascript-v1');
        assert.equal(result.passed, true);
        assert.equal(result.score, 100);
        assert.equal(result.testsPassed, 2);
        assert.equal(result.testsTotal, 2);

        assert.deepEqual(
            result.results.map(({ testCaseId, passed }) => ({
                testCaseId,
                passed,
            })),
            testCases.map(({ id }) => ({
                testCaseId: id,
                passed: true,
            })),
        );

        assert.deepEqual(
            result.results.map(({ actualOutput }) => actualOutput.trim()),
            ['11', '3'],
        );
    },
);

test(
    'Docker awards weighted partial credit for an incorrect solution',
    { timeout: 60_000 },
    async () => {
        const result = await evaluateExerciseSubmission({
            evaluatorName: 'docker',
            languageId: 1,
            submittedCode: 'console.log(11);',
            solutionCode: '// La referencia no determina la calificación.',
            testCases: [
                createCase({
                    input: '4 7',
                    expectedOutput: '11',
                    weight: 3,
                }),
                createCase({
                    input: '5 7',
                    expectedOutput: '12',
                    weight: 1,
                }),
            ],
        });

        assert.equal(result.passed, false);
        assert.equal(result.score, 75);
        assert.equal(result.testsPassed, 1);
        assert.equal(result.testsTotal, 2);
        assert.equal(result.results[0].passed, true);
        assert.equal(result.results[0].errorMessage, null);
        assert.equal(result.results[1].passed, false);
        assert.equal(typeof result.results[1].errorMessage, 'string');
    },
);
import assert from 'node:assert/strict';

import test from 'node:test';

import {
    evaluateDockerExerciseSubmission,
} from '../providers/docker-exercise-evaluator.provider.js';

const makeCase = (overrides = {}) => ({
    id: 'case-1',
    input: '4 7',
    expectedOutput: '11',
    weight: 1,
    ...overrides,
});

const execution = (
    stdout,
    status = 'completed',
) => ({
    status,
    stdout,
    stderr: '',
    exitCode:
        status === 'completed'
            ? 0
            : 1,
    signal: null,
    executionTimeMs: 10,
});

const evaluate = (options = {}) => (
    evaluateDockerExerciseSubmission({
        languageId: 1,
        submittedCode: 'console.log(11);',
        testCases: [makeCase()],

        runCase: async () => (
            execution('11\n')
        ),

        ...options,
    })
);

test(
    'evaluates output without sending the solution or expected answer to Docker',
    async () => {
        let received;

        const result = await evaluate({
            solutionCode:
                'different reference implementation',

            runCase: async (parameters) => {
                received = parameters;

                return execution('11\n');
            },
        });

        assert.deepEqual(
            received,
            {
                code: 'console.log(11);',
                input: '4 7',
            },
        );

        assert.equal(result.passed, true);
        assert.equal(result.score, 100);
    },
);

test(
    'calculates weighted partial credit',
    async () => {
        const result = await evaluate({
            testCases: [
                makeCase({
                    weight: 3,
                }),
                makeCase({
                    id: 'case-2',
                    expectedOutput: '12',
                }),
            ],
        });

        assert.equal(result.score, 75);
        assert.equal(result.testsPassed, 1);
        assert.equal(result.testsTotal, 2);
        assert.equal(result.executionTimeMs, 20);
        assert.equal(result.passed, false);
    },
);

test(
    'normalizes CRLF and one final newline while preserving spaces and extra lines',
    async () => {
        const outputs = [
            '11\r\n',
            ' 11\n',
            '11 \n',
            '11\n\n',
        ];

        const result = await evaluate({
            testCases: outputs.map(
                (input, index) => (
                    makeCase({
                        id: `case-${index}`,
                        input,
                    })
                ),
            ),

            runCase: async ({ input }) => (
                execution(input)
            ),
        });

        assert.equal(result.testsPassed, 1);
        assert.equal(result.score, 25);
    },
);

test(
    'does not pass matching output when execution fails',
    async () => {
        const statuses = [
            'runtime_error',
            'time_limit_exceeded',
            'output_limit_exceeded',
        ];

        for (const status of statuses) {
            const result = await evaluate({
                runCase: async () => (
                    execution('11\n', status)
                ),
            });

            assert.equal(result.passed, false);
            assert.equal(result.score, 0);

            assert.ok(
                result.results[0].errorMessage,
            );
        }
    },
);

test(
    'validates all cases before executing code',
    async () => {
        let calls = 0;

        await assert.rejects(
            () => evaluate({
                testCases: [
                    makeCase(),
                    makeCase({
                        id: 'case-2',
                        weight: 0,
                    }),
                ],

                runCase: async () => {
                    calls += 1;

                    return execution('11\n');
                },
            }),
            /weight must be positive/,
        );

        assert.equal(calls, 0);

        await assert.rejects(
            () => evaluate({
                languageId: 2,
            }),
            /JavaScript only/,
        );
    },
);

test(
    'propagates infrastructure errors instead of awarding a zero score',
    async () => {
        const failure =
            new Error('Docker unavailable');

        await assert.rejects(
            () => evaluate({
                runCase: async () => {
                    throw failure;
                },
            }),
            (error) => error === failure,
        );
    },
);
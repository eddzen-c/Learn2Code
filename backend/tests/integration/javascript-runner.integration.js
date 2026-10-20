import assert from 'node:assert/strict';

import test from 'node:test';

import {
    runJavaScriptInDocker,
} from '../../src/modules/exercises/services/docker-code-runner.service.js';

test(
    'runner executes different solutions for the same input',
    async () => {
        const solutions = [
            [
                'const fs = require("node:fs");',
                'const [a, b] = fs.readFileSync(0, "utf8")',
                '  .trim().split(/\\s+/).map(Number);',
                'console.log(a + b);',
            ].join('\n'),

            [
                'const fs = require("node:fs");',
                'const values = fs.readFileSync(0, "utf8")',
                '  .trim().split(/\\s+/).map(Number);',
                'console.log(values.reduce(',
                '  (sum, value) => sum + value, 0',
                '));',
            ].join('\n'),
        ];

        for (const code of solutions) {
            const result =
                await runJavaScriptInDocker({
                    code,
                    input: '4 7',
                });

            assert.equal(
                result.status,
                'completed',
            );

            assert.equal(
                result.stdout.trim(),
                '11',
            );

            assert.equal(
                result.exitCode,
                0,
            );
        }
    },
);

test(
    'runner reports a JavaScript syntax error',
    async () => {
        const result =
            await runJavaScriptInDocker({
                code: 'const = ;',
            });

        assert.equal(
            result.status,
            'runtime_error',
        );

        assert.notEqual(
            result.exitCode,
            0,
        );

        assert.ok(
            result.stderr.length > 0,
        );
    },
);

test(
    'runner applies the internal execution timeout',
    async () => {
        const result =
            await runJavaScriptInDocker({
                code: 'while (true) {}',
            });

        assert.equal(
            result.status,
            'time_limit_exceeded',
        );
    },
);

test(
    'runner applies the external timeout',
    async () => {
        await assert.rejects(
            () => runJavaScriptInDocker({
                code: 'while (true) {}',
                externalTimeoutMs: 1_000,
            }),
            (error) => (
                error.code
                === 'CODE_RUNNER_TIMEOUT'
            ),
        );
    },
);
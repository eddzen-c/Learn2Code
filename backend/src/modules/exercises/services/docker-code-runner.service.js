import {
    execFile,
} from 'node:child_process';

import {
    randomUUID,
} from 'node:crypto';

const IMAGE =
    'learn2code-code-runner:dev';

const MAX_CONCURRENT_RUNS = 2;

let activeRuns = 0;

const executeDocker = (
    args,
    {
        input = '',
        timeout = 10_000,
    } = {},
) => new Promise((resolve, reject) => {
    let inputError;

    const child = execFile(
        'docker',
        args,
        {
            encoding: 'utf8',
            timeout,
            killSignal: 'SIGKILL',
            maxBuffer: 256 * 1024,
            windowsHide: true,
            shell: false,
        },
        (error, stdout, stderr) => {
            if (error) {
                error.stderr = stderr;

                reject(error);
                return;
            }

            if (inputError) {
                reject(inputError);
                return;
            }

            resolve({
                stdout,
                stderr,
            });
        },
    );

    child.stdin.on(
        'error',
        (error) => {
            inputError = error;
        },
    );

    child.stdin.end(input);
});

const removeContainer = async (name) => {
    try {
        await executeDocker(
            [
                'rm',
                '--force',
                name,
            ],
            {
                timeout: 5_000,
            },
        );
    } catch (error) {
        if (
            error.code === 'ENOENT'
            || error.stderr?.includes(
                'No such container:',
            )
        ) {
            return;
        }

        const cleanupError = new Error(
            `Could not remove runner container ${name}`,
            {
                cause: error,
            },
        );

        cleanupError.code =
            'CODE_RUNNER_CLEANUP_FAILED';

        throw cleanupError;
    }
};

const parseRunnerResult = (text) => {
    const result = JSON.parse(text);

    const statuses = new Set([
        'completed',
        'runtime_error',
        'time_limit_exceeded',
        'output_limit_exceeded',
    ]);

    if (
        !result
        || !statuses.has(result.status)
        || typeof result.stdout !== 'string'
        || typeof result.stderr !== 'string'
        || !Number.isInteger(
            result.executionTimeMs,
        )
        || result.executionTimeMs < 0
        || !(
            result.exitCode === null
            || Number.isInteger(
                result.exitCode,
            )
        )
        || !(
            result.signal === null
            || typeof result.signal === 'string'
        )
        || (
            result.status === 'completed'
            && result.exitCode !== 0
        )
    ) {
        throw new Error(
            'Invalid response from the code runner',
        );
    }

    return Object.freeze(result);
};

export const runJavaScriptInDocker =
    async ({
        code,
        input = '',
        externalTimeoutMs = 10_000,
    }) => {
        if (
            typeof code !== 'string'
            || code.trim().length === 0
            || Buffer.byteLength(
                code,
                'utf8',
            ) > 64 * 1024
        ) {
            throw new TypeError(
                'Submitted code is invalid',
            );
        }

        if (
            typeof input !== 'string'
            || Buffer.byteLength(
                input,
                'utf8',
            ) > 16 * 1024
        ) {
            throw new TypeError(
                'Standard input is invalid',
            );
        }

        if (
            !Number.isInteger(
                externalTimeoutMs,
            )
            || externalTimeoutMs < 100
            || externalTimeoutMs > 10_000
        ) {
            throw new TypeError(
                'External timeout is invalid',
            );
        }

        const payload = JSON.stringify({
            code,
            input,
        });

        if (
            Buffer.byteLength(
                payload,
                'utf8',
            ) > 96 * 1024
        ) {
            throw new TypeError(
                'Execution payload is too large',
            );
        }

        if (
            activeRuns >= MAX_CONCURRENT_RUNS
        ) {
            const busyError = new Error(
                'The code runner is busy',
            );

            busyError.code =
                'CODE_RUNNER_BUSY';

            throw busyError;
        }

        activeRuns += 1;

        const containerName =
            `learn2code-run-${randomUUID()}`;

        try {
            await executeDocker([
                'create',
                '--name',
                containerName,
                '--label',
                'learn2code.code-runner=true',
                '--interactive',
                '--pull',
                'never',
                '--network',
                'none',
                '--read-only',
                '--memory',
                '128m',
                '--memory-swap',
                '128m',
                '--cpus',
                '0.5',
                '--pids-limit',
                '64',
                '--cap-drop',
                'ALL',
                '--security-opt',
                'no-new-privileges=true',
                '--tmpfs',
                '/tmp:rw,noexec,nosuid,size=32m,mode=1777',
                IMAGE,
            ]);

            const {
                stdout,
            } = await executeDocker(
                [
                    'start',
                    '--attach',
                    '--interactive',
                    containerName,
                ],
                {
                    input: payload,
                    timeout:
                        externalTimeoutMs,
                },
            );

            return parseRunnerResult(
                stdout,
            );
        } catch (error) {
            if (
                error.code
                === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'
            ) {
                const outputError = new Error(
                    'The runner response exceeded its size limit',
                    {
                        cause: error,
                    },
                );

                outputError.code =
                    'CODE_RUNNER_RESPONSE_TOO_LARGE';

                throw outputError;
            }

            if (error.killed) {
                const timeoutError = new Error(
                    'The external runner time limit was exceeded',
                    {
                        cause: error,
                    },
                );

                timeoutError.code =
                    'CODE_RUNNER_TIMEOUT';

                throw timeoutError;
            }

            throw error;
        } finally {
            try {
                await removeContainer(
                    containerName,
                );
            } finally {
                activeRuns -= 1;
            }
        }
    };
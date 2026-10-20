const {
    spawnSync,
} = require('node:child_process');

const {
    mkdtempSync,
    rmSync,
    writeFileSync,
} = require('node:fs');

const {
    tmpdir,
} = require('node:os');

const {
    join,
} = require('node:path');

const {
    performance,
} = require('node:perf_hooks');

const MAX_PAYLOAD_BYTES = 96 * 1024;
const MAX_CODE_BYTES = 64 * 1024;
const MAX_INPUT_BYTES = 16 * 1024;
const MAX_OUTPUT_BYTES = 16 * 1024;
const EXECUTION_TIMEOUT_MS = 2_000;

const writeResult = (result) => {
    process.stdout.write(
        `${JSON.stringify(result)}\n`,
    );
};

const readPayload = async () => {
    const chunks = [];
    let totalBytes = 0;

    for await (
        const chunk
        of process.stdin
    ) {
        totalBytes += chunk.length;

        if (
            totalBytes > MAX_PAYLOAD_BYTES
        ) {
            throw new Error(
                'Execution payload is too large',
            );
        }

        chunks.push(chunk);
    }

    const text = Buffer
        .concat(chunks)
        .toString('utf8')
        .replace(/^\uFEFF/, '');

    return JSON.parse(text);
};

const validatePayload = (payload) => {
    if (
        !payload
        || typeof payload !== 'object'
        || Array.isArray(payload)
    ) {
        throw new Error(
            'Execution payload must be an object',
        );
    }

    if (
        typeof payload.code !== 'string'
        || payload.code.trim().length === 0
        || Buffer.byteLength(
            payload.code,
            'utf8',
        ) > MAX_CODE_BYTES
    ) {
        throw new Error(
            'Submitted code is invalid',
        );
    }

    if (
        typeof payload.input !== 'string'
        || Buffer.byteLength(
            payload.input,
            'utf8',
        ) > MAX_INPUT_BYTES
    ) {
        throw new Error(
            'Standard input is invalid',
        );
    }
};

const executeJavaScript = ({
    code,
    input,
}) => {
    const directory = mkdtempSync(
        join(
            tmpdir(),
            'learn2code-run-',
        ),
    );

    try {
        const sourcePath = join(
            directory,
            'submission.cjs',
        );

        writeFileSync(
            sourcePath,
            code,
            {
                encoding: 'utf8',
                mode: 0o600,
            },
        );

        const startedAt =
            performance.now();

        const result = spawnSync(
            process.execPath,
            [
                '--max-old-space-size=64',
                sourcePath,
            ],
            {
                cwd: directory,
                input,
                encoding: 'utf8',
                timeout:
                    EXECUTION_TIMEOUT_MS,
                killSignal: 'SIGKILL',
                maxBuffer:
                    MAX_OUTPUT_BYTES,
                shell: false,

                env: {
                    PATH:
                        '/usr/local/bin:/usr/bin:/bin',
                    LANG: 'C.UTF-8',
                    NODE_ENV: 'production',
                },
            },
        );

        const executionTimeMs =
            Math.round(
                performance.now()
                - startedAt,
            );

        let status = 'completed';

        if (
            result.error?.code
            === 'ETIMEDOUT'
        ) {
            status =
                'time_limit_exceeded';
        } else if (
            result.error?.code
            === 'ENOBUFS'
        ) {
            status =
                'output_limit_exceeded';
        } else if (
            result.error
            || result.status !== 0
        ) {
            status = 'runtime_error';
        }

        return {
            status,
            stdout:
                result.stdout ?? '',
            stderr:
                result.stderr ?? '',
            exitCode:
                result.status,
            signal:
                result.signal ?? null,
            executionTimeMs,
        };
    } finally {
        rmSync(
            directory,
            {
                recursive: true,
                force: true,
            },
        );
    }
};

const main = async () => {
    let payload;

    try {
        payload = await readPayload();

        validatePayload(payload);
    } catch {
        writeResult({
            status: 'invalid_request',
            stdout: '',
            stderr:
                'Invalid execution payload',
            exitCode: null,
            signal: null,
            executionTimeMs: 0,
        });

        process.exitCode = 1;
        return;
    }

    try {
        writeResult(
            executeJavaScript(payload),
        );
    } catch {
        writeResult({
            status: 'runner_error',
            stdout: '',
            stderr:
                'The runner could not execute the submission',
            exitCode: null,
            signal: null,
            executionTimeMs: 0,
        });

        process.exitCode = 1;
    }
};

main().catch(() => {
    process.exitCode = 1;
});
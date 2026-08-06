import 'dotenv/config';

const getRequiredValue = (name) => {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} is required`);
    }

    return value;
};

const getRequiredSecret = (name, minimumBytes = 32) => {
    const value = getRequiredValue(name);

    if (Buffer.byteLength(value, 'utf8') < minimumBytes) {
        throw new Error(
            `${name} must contain at least ${minimumBytes} UTF-8 bytes`,
        );
    }

    return value;
};

const parsePort = (value, name) => {
    const port = Number.parseInt(value, 10);

    if (Number.isNaN(port)) {
        throw new Error(`${name} must be a valid number`);
    }

    return port;
};

const parsePositiveInteger = (value, name) => {
    const number = Number(value);

    if (!Number.isInteger(number) || number <= 0) {
        throw new Error(
            `${name} must be a positive integer`,
        );
    }

    return number;
};

const supportedAiProviders = new Set([
    'mock',
    'openai',
]);

const supportedOpenAiReasoningEfforts =
    new Set([
        'none',
        'low',
        'medium',
        'high',
        'xhigh',
        'max',
    ]);

const openAiReasoningEffort =
    process.env.OPENAI_REASONING_EFFORT
    ?? 'medium';

if (
    !supportedOpenAiReasoningEfforts.has(
        openAiReasoningEffort,
    )
) {
    throw new Error(
        'OPENAI_REASONING_EFFORT is invalid',
    );
}

const aiProvider =
    process.env.AI_PROVIDER ?? 'mock';

const supportedAuthEmailProviders =
    new Set([
        'mock',
        'resend',
    ]);

const authEmailProvider =
    process.env.AUTH_EMAIL_PROVIDER
    ?? 'mock';

if (
    !supportedAuthEmailProviders.has(
        authEmailProvider,
    )
) {
    throw new Error(
        'AUTH_EMAIL_PROVIDER must be mock or resend',
    );
}

if (!supportedAiProviders.has(aiProvider)) {
    throw new Error(
        'AI_PROVIDER must be mock or openai',
    );
}

const database = Object.freeze({
    host: getRequiredValue('DB_HOST'),
    port: parsePort(getRequiredValue('DB_PORT'), 'DB_PORT'),
    name: getRequiredValue('DB_NAME'),
    user: getRequiredValue('DB_USER'),
    password: getRequiredValue('DB_PASSWORD'),
    ssl: (process.env.DB_SSL ?? 'false') === 'true',
});

const auth = Object.freeze({
    accessTokenSecret: getRequiredSecret('JWT_ACCESS_SECRET'),
    accessTokenExpiresIn:
        process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    issuer: process.env.JWT_ISSUER ?? 'learn2code-api',
    audience: process.env.JWT_AUDIENCE ?? 'learn2code-web',
    refreshTokenTtlDays: parsePositiveInteger(
        process.env.REFRESH_TOKEN_TTL_DAYS ?? '30',
        'REFRESH_TOKEN_TTL_DAYS',
    ),
});

const authEmail = Object.freeze({
    provider: authEmailProvider,

    resendApiKey:
        authEmailProvider === 'resend'
            ? getRequiredValue(
                'RESEND_API_KEY',
            )
            : null,

    from:
        process.env.AUTH_EMAIL_FROM
        ?? 'Learn2Code <onboarding@resend.dev>',

    frontendUrl:
        process.env.FRONTEND_URL
        ?? 'http://localhost:5173',
});

const ai = Object.freeze({
    provider: aiProvider,

    diagnosticQuestionCount: parsePositiveInteger(
        process.env.AI_DIAGNOSTIC_QUESTION_COUNT ?? '8',
        'AI_DIAGNOSTIC_QUESTION_COUNT',
    ),

    requestTimeoutMs: parsePositiveInteger(
        process.env.OPENAI_REQUEST_TIMEOUT_MS
        ?? '30000',
        'OPENAI_REQUEST_TIMEOUT_MS',
    ),

    openAiApiKey:
        aiProvider === 'openai'
            ? getRequiredValue('OPENAI_API_KEY')
            : null,

    openAiModel:
        process.env.OPENAI_MODEL
        ?? 'gpt-5.6-terra',

    openAiReasoningEffort,
});

export const env = Object.freeze({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parsePort(process.env.PORT ?? '3000', 'PORT'),
    corsOrigin:
        process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    database,
    redisUrl: getRequiredValue('REDIS_URL'),
    auth,
    authEmail,
    ai,
});
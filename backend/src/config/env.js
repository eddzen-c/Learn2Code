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
});

export const env = Object.freeze({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parsePort(process.env.PORT ?? '3000', 'PORT'),
    corsOrigin:
        process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    database,
    redisUrl: getRequiredValue('REDIS_URL'),
    auth,
});
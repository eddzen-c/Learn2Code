import 'dotenv/config';

const getRequiredValue = (name) => {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} is required`);
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

export const env = Object.freeze({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parsePort(process.env.PORT ?? '3000', 'PORT'),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    database,
    redisUrl: getRequiredValue('REDIS_URL'),
});
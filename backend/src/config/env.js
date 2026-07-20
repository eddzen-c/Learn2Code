import 'dotenv/config';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);

if (Number.isNaN(port)) {
    throw new Error('PORT must be a valid number');
}

export const env = Object.freeze({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port,
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
});
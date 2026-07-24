import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { ZodError } from 'zod';
import cookieParser from 'cookie-parser';

import authRouter from './modules/auth/routes/auth.routes.js';

import { databasePool } from './config/database.js';
import { env } from './config/env.js';
import { redisClient } from './config/redis.js';

const app = express();

app.disable('x-powered-by');

app.use(helmet());

app.use(
    cors({
        origin: env.corsOrigin,
        credentials: true,
    }),
);

app.use(cookieParser());

app.use(express.json({ limit: '1mb' }));

app.use('/api/v1/auth', authRouter);

app.get('/api/v1/health', async (_req, res) => {
    try {
        await Promise.all([
            databasePool.query('SELECT 1'),
            redisClient.ping(),
        ]);

        res.status(200).json({
            status: 'success',
            message: 'Learn2Code API is running',
            services: {
                api: 'up',
                database: 'up',
                redis: 'up',
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Health check failed:', error.message);

        res.status(503).json({
            status: 'error',
            message: 'One or more services are unavailable',
            services: {
                api: 'up',
                database: 'unknown',
                redis: 'unknown',
            },
            timestamp: new Date().toISOString(),
        });
    }
});

app.use((_req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
    });
});

app.use((error, _req, res, _next) => {
    if (error instanceof ZodError) {
        return res.status(400).json({
            status: 'error',
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            errors: error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            })),
        });
    }

    if (
        error instanceof SyntaxError
        && error.status === 400
        && 'body' in error
    ) {
        return res.status(400).json({
            status: 'error',
            code: 'INVALID_JSON',
            message: 'Request body contains invalid JSON',
        });
    }

    const statusCode = Number.isInteger(
        error.statusCode,
    )
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
        console.error(error);
    }

    return res.status(statusCode).json({
        status: 'error',
        code: error.code ?? 'INTERNAL_SERVER_ERROR',
        message: statusCode >= 500
            ? 'Internal server error'
            : error.message,
    });
});

export default app;
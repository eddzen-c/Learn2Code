import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

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

app.use(express.json({ limit: '1mb' }));

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
    console.error(error);

    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
    });
});

export default app;
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';

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

app.get('/api/v1/health', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Learn2Code API is running',
        data: {
            timestamp: new Date().toISOString(),
        },
    });
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
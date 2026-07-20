import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
    console.log(`Learn2Code API running at http://localhost:${env.port}`);
});

const shutdown = (signal) => {
    console.log(`\n${signal} received. Closing HTTP server...`);

    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

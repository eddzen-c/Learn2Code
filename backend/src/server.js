import app from './app.js';
import {
    checkDatabaseConnection,
    closeDatabaseConnection,
} from './config/database.js';
import { env } from './config/env.js';
import {
    closeRedisConnection,
    connectRedis,
} from './config/redis.js';

let server;
let shuttingDown = false;

const startServer = async () => {
    try {
        const database = await checkDatabaseConnection();
        const redisStatus = await connectRedis();

        console.log(
            `PostgreSQL connected: database=${database.database}, user=${database.user}`,
        );
        console.log(`Redis connected: ${redisStatus}`);

        server = app.listen(env.port, () => {
            console.log(`Learn2Code API running at http://localhost:${env.port}`);
        });
    } catch (error) {
        console.error('Unable to start Learn2Code API:', error.message);

        await Promise.allSettled([
            closeDatabaseConnection(),
            closeRedisConnection(),
        ]);

        process.exit(1);
    }
};

const shutdown = async (signal) => {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    console.log(`\n${signal} received. Closing services...`);

    if (server) {
        await new Promise((resolve) => {
            server.close(resolve);
        });
    }

    await Promise.allSettled([
        closeDatabaseConnection(),
        closeRedisConnection(),
    ]);

    console.log('Learn2Code API stopped correctly');
    process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

await startServer();
import { createClient } from 'redis';

import { env } from './env.js';

export const redisClient = createClient({
    url: env.redisUrl,
});

redisClient.on('error', (error) => {
    console.error('Redis client error:', error.message);
});

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }

    return redisClient.ping();
};

export const closeRedisConnection = async () => {
    if (redisClient.isOpen) {
        await redisClient.quit();
    }
};
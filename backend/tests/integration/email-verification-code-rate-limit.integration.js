
import assert from 'node:assert/strict';
import {
    createHash,
    randomUUID,
} from 'node:crypto';
import test from 'node:test';

import {
    closeRedisConnection,
    connectRedis,
    redisClient,
} from '../../src/config/redis.js';

import {
    consumeEmailVerificationCodeQuota,
} from '../../src/modules/auth/services/email-verification-code-rate-limit.service.js';

const accountKey = (userId) =>
    `learn2code:verify-code:account:${userId}`;

const ipKey = (ip) => {
    const hash = createHash('sha256')
        .update(ip)
        .digest('hex');

    return `learn2code:verify-code:ip:${hash}`;
};

test(
    'Redis enforces account and IP verification limits atomically',
    async () => {
        const firstUserId = randomUUID();
        const secondUserId = randomUUID();

        const firstIp =
            `2001:db8::${randomUUID().slice(0, 4)}`;

        const secondIp =
            `2001:db8:1::${randomUUID().slice(0, 4)}`;

        const keys = [
            accountKey(firstUserId),
            accountKey(secondUserId),
            ipKey(firstIp),
            ipKey(secondIp),
        ];

        await connectRedis();

        try {
            // Limpiar exclusivamente las claves de esta prueba.
            await redisClient.del(keys);

            // 16 solicitudes simultáneas para la misma cuenta.
            // Solamente deben aceptarse 12.
            const attempts = await Promise.allSettled(
                Array.from(
                    { length: 16 },
                    () => consumeEmailVerificationCodeQuota({
                        userId: firstUserId,
                        requestIp: firstIp,
                    }),
                ),
            );

            const accepted = attempts.filter(
                (result) => result.status === 'fulfilled',
            );

            const rejected = attempts.filter(
                (result) => result.status === 'rejected',
            );

            assert.equal(accepted.length, 12);
            assert.equal(rejected.length, 4);

            for (const result of rejected) {
                assert.equal(
                    result.reason.code,
                    'EMAIL_VERIFICATION_RATE_LIMITED',
                );

                assert.equal(
                    result.reason.scope,
                    'account',
                );
            }

            // Una solicitud bloqueada no debe
            // incrementar los contadores.
            assert.equal(
                Number(
                    await redisClient.get(
                        accountKey(firstUserId),
                    ),
                ),
                12,
            );

            assert.equal(
                Number(
                    await redisClient.get(
                        ipKey(firstIp),
                    ),
                ),
                12,
            );

            // Comprobar el bloqueo independiente por IP.
            await redisClient.set(
                ipKey(secondIp),
                '120',
                { EX: 300 },
            );

            await assert.rejects(
                () => consumeEmailVerificationCodeQuota({
                    userId: secondUserId,
                    requestIp: secondIp,
                }),
                (error) => {
                    assert.equal(error.statusCode, 429);
                    assert.equal(error.scope, 'ip');
                    return true;
                },
            );

            // Si se bloquea por IP, tampoco debe
            // consumirse la cuota de la cuenta.
            assert.equal(
                await redisClient.get(
                    accountKey(secondUserId),
                ),
                null,
            );

            // Las claves admitidas tienen expiración.
            const ttl = await redisClient.ttl(
                accountKey(firstUserId),
            );

            assert.ok(ttl > 0);
            assert.ok(ttl <= 86400);
        } finally {
            // Eliminar solo los datos de esta prueba.
            try {
                if (redisClient.isOpen) {
                    await redisClient.del(keys);
                }
            } finally {
                await closeRedisConnection();
            }
        }
    },
);

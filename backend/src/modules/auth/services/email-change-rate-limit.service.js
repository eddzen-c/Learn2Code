import { createHash } from 'node:crypto';

import {
    redisClient,
} from '../../../config/redis.js';

// ============================================================
// LIMITES INDEPENDIENTES PARA CAMBIO DE CORREO
// ============================================================

const WINDOW_SECONDS = 60 * 60;

const QUOTAS = Object.freeze({
    request: Object.freeze({
        account: 6,
        ip: 60,
    }),

    confirm: Object.freeze({
        account: 30,
        ip: 300,
    }),
});

// ============================================================
// OPERACION ATOMICA DE REDIS
// ============================================================

const CONSUME_QUOTA_SCRIPT = `
    local accountCount = tonumber(
        redis.call('GET', KEYS[1]) or '0'
    )

    local ipCount = tonumber(
        redis.call('GET', KEYS[2]) or '0'
    )

    if accountCount >= tonumber(ARGV[1]) then
        local ttl = redis.call('TTL', KEYS[1])

        return { -1, math.max(ttl, 1) }
    end

    if ipCount >= tonumber(ARGV[2]) then
        local ttl = redis.call('TTL', KEYS[2])

        return { -2, math.max(ttl, 1) }
    end

    local newAccountCount = redis.call(
        'INCR', KEYS[1]
    )

    if newAccountCount == 1 then
        redis.call(
            'EXPIRE',
            KEYS[1],
            ARGV[3]
        )
    end

    local newIpCount = redis.call(
        'INCR', KEYS[2]
    )

    if newIpCount == 1 then
        redis.call(
            'EXPIRE',
            KEYS[2],
            ARGV[3]
        )
    end

    return { 1, 0 }
`;

// ============================================================
// ERROR DE LIMITE DE SOLICITUDES
// ============================================================

export class EmailChangeRateLimitError extends Error {
    constructor({
        operation,
        scope,
        retryAfterSeconds,
    }) {
        super(
            'Se alcanzó el límite de solicitudes de cambio de correo. Inténtalo más tarde.',
        );

        this.name = 'EmailChangeRateLimitError';

        this.code = 'EMAIL_CHANGE_RATE_LIMITED';

        this.statusCode = 429;

        this.operation = operation;

        this.scope = scope;

        this.retryAfterSeconds = retryAfterSeconds;
    }
}

// ============================================================
// CONSUMIR CUOTA DE SOLICITUDES
// ============================================================

export const consumeEmailChangeQuota = async ({
    userId,
    requestIp,
    operation,
    client = redisClient,
}) => {
    if (
        typeof userId !== 'string'
        || !userId.trim()
        || typeof requestIp !== 'string'
        || !requestIp.trim()
        || !Object.hasOwn(QUOTAS, operation)
    ) {
        throw new TypeError(
            'A valid user ID, request IP and operation are required',
        );
    }

    const limits = QUOTAS[operation];

    // No guardar la IP en texto plano
    // dentro de las claves de Redis.
    const ipHash = createHash('sha256')
        .update(requestIp)
        .digest('hex');

    // Las claves son independientes de la
    // verificación inicial de correo.
    const accountKey =
        `learn2code:email-change:${operation}:account:${userId}`;

    const ipKey =
        `learn2code:email-change:${operation}:ip:${ipHash}`;

    const result = await client.eval(
        CONSUME_QUOTA_SCRIPT,
        {
            keys: [
                accountKey,
                ipKey,
            ],

            arguments: [
                String(limits.account),
                String(limits.ip),
                String(WINDOW_SECONDS),
            ],
        },
    );

    if (
        !Array.isArray(result)
        || result.length !== 2
    ) {
        throw new Error(
            'Invalid Redis email change rate-limit response',
        );
    }

    const [
        decision,
        retryAfterSeconds,
    ] = result.map(Number);

    if (
        decision === -1
        || decision === -2
    ) {
        throw new EmailChangeRateLimitError({
            operation,

            scope:
                decision === -1
                    ? 'account'
                    : 'ip',

            retryAfterSeconds:
                Math.max(1, retryAfterSeconds),
        });
    }

    if (decision !== 1) {
        throw new Error(
            'Unexpected Redis email change rate-limit decision',
        );
    }

    return Object.freeze({
        allowed: true,
    });
};

import { createHash } from 'node:crypto';

import {
    redisClient,
} from '../../../config/redis.js';

const WINDOW_SECONDS = 24 * 60 * 60;
const ACCOUNT_LIMIT = 12;
const IP_LIMIT = 120;

// Una operación atómica: comprueba ambos límites
// antes de aumentar cualquiera de los contadores.
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
        redis.call('EXPIRE', KEYS[1], ARGV[3])
    end

    local newIpCount = redis.call(
        'INCR', KEYS[2]
    )

    if newIpCount == 1 then
        redis.call('EXPIRE', KEYS[2], ARGV[3])
    end

    return { 1, 0 }
`;

export class EmailVerificationCodeRateLimitError
    extends Error {
    constructor({ scope, retryAfterSeconds }) {
        super(
            'Se alcanzó el límite de solicitudes de verificación. Inténtalo más tarde.',
        );

        this.name =
            'EmailVerificationCodeRateLimitError';

        this.code =
            'EMAIL_VERIFICATION_RATE_LIMITED';

        this.statusCode = 429;
        this.scope = scope;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

export const consumeEmailVerificationCodeQuota =
    async ({
        userId,
        requestIp,
        client = redisClient,
    }) => {
        if (
            typeof userId !== 'string'
            || !userId.trim()
            || typeof requestIp !== 'string'
            || !requestIp.trim()
        ) {
            throw new TypeError(
                'A valid user ID and request IP are required',
            );
        }

        // No almacenamos la dirección IP en texto
        // plano dentro de la clave de Redis.
        const ipHash = createHash('sha256')
            .update(requestIp)
            .digest('hex');

        const accountKey =
            `learn2code:verify-code:account:${userId}`;

        const ipKey =
            `learn2code:verify-code:ip:${ipHash}`;

        const result = await client.eval(
            CONSUME_QUOTA_SCRIPT,
            {
                keys: [
                    accountKey,
                    ipKey,
                ],
                arguments: [
                    String(ACCOUNT_LIMIT),
                    String(IP_LIMIT),
                    String(WINDOW_SECONDS),
                ],
            },
        );

        if (
            !Array.isArray(result)
            || result.length !== 2
        ) {
            throw new Error(
                'Invalid Redis rate-limit response',
            );
        }

        const [decision, retryAfterSeconds] =
            result.map(Number);

        if (decision === -1 || decision === -2) {
            throw new EmailVerificationCodeRateLimitError({
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
                'Unexpected Redis rate-limit decision',
            );
        }

        return Object.freeze({
            allowed: true,
        });
    };

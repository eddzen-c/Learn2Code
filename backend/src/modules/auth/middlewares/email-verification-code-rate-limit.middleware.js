
import {
    AuthenticationRequiredError,
} from '../errors/access-token.errors.js';

import {
    consumeEmailVerificationCodeQuota,
} from '../services/email-verification-code-rate-limit.service.js';

export const createEmailVerificationCodeQuotaMiddleware =
    ({
        consumeQuota =
            consumeEmailVerificationCodeQuota,
    } = {}) => {
        return async (req, res, next) => {
            try {
                // Debe ejecutarse después de
                // requireAuthentication.
                if (!req.auth?.userId) {
                    throw new AuthenticationRequiredError();
                }

                // La dirección IP procede de Express.
                // No confiamos en una IP enviada
                // arbitrariamente en el cuerpo.
                await consumeQuota({
                    userId: req.auth.userId,
                    requestIp: req.ip,
                });

                return next();
            } catch (error) {
                // Informar cuánto debe esperar el cliente
                // si agotó su cuota de solicitudes.
                if (
                    error.code ===
                        'EMAIL_VERIFICATION_RATE_LIMITED'
                    && Number.isInteger(
                        error.retryAfterSeconds,
                    )
                    && error.retryAfterSeconds > 0
                ) {
                    res.set(
                        'Retry-After',
                        String(error.retryAfterSeconds),
                    );
                }

                // Express enviará el estado HTTP
                // definido por el error.
                return next(error);
            }
        };
    };

export const requireEmailVerificationCodeQuota =
    createEmailVerificationCodeQuotaMiddleware();

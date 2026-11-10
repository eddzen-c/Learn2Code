import {
    AuthenticationRequiredError,
} from '../errors/access-token.errors.js';

import {
    consumeEmailChangeQuota,
} from '../services/email-change-rate-limit.service.js';

// ============================================================
// CREAR MIDDLEWARE DE LIMITE DE SOLICITUDES
// ============================================================

export const createEmailChangeQuotaMiddleware = ({
    operation,
    consumeQuota = consumeEmailChangeQuota,
} = {}) => {
    // Solo permitimos las operaciones configuradas.
    if (
        operation !== 'request'
        && operation !== 'confirm'
    ) {
        throw new TypeError(
            'Email change operation must be request or confirm',
        );
    }

    return async (req, res, next) => {
        try {
            // ------------------------------------------------
            // 1. EXIGIR AUTENTICACION
            // ------------------------------------------------

            // Este middleware debe ejecutarse despues
            // de requireAuthentication.
            if (!req.auth?.userId) {
                throw new AuthenticationRequiredError();
            }

            // ------------------------------------------------
            // 2. CONSUMIR CUOTA EN REDIS
            // ------------------------------------------------

            // req.ip es proporcionado por Express.
            // Nunca utilizamos una IP enviada en el body.
            await consumeQuota({
                userId: req.auth.userId,
                requestIp: req.ip,
                operation,
            });

            // ------------------------------------------------
            // 3. PERMITIR CONTINUAR
            // ------------------------------------------------

            return next();
        } catch (error) {
            // ------------------------------------------------
            // 4. INFORMAR TIEMPO DE ESPERA
            // ------------------------------------------------

            if (
                error.code === 'EMAIL_CHANGE_RATE_LIMITED'
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

            // El manejador central de errores
            // construira la respuesta HTTP.
            return next(error);
        }
    };
};

// ============================================================
// SOLICITAR CAMBIO DE CORREO
// ============================================================

export const requireEmailChangeRequestQuota =
    createEmailChangeQuotaMiddleware({
        operation: 'request',
    });

// ============================================================
// CONFIRMAR CAMBIO DE CORREO
// ============================================================

export const requireEmailChangeConfirmationQuota =
    createEmailChangeQuotaMiddleware({
        operation: 'confirm',
    });
import {
    registerUser,
} from '../services/register.service.js';

import {
    requestEmailVerificationCode,
} from '../services/email-verification-code-flow.service.js';

import {
    setRefreshTokenCookie,
} from '../utils/refresh-token-cookie.js';

import {
    parseRegisterBody,
} from '../validators/register.validator.js';

import {
    consumeEmailVerificationCodeQuota,
} from '../services/email-verification-code-rate-limit.service.js';

export const registerController = async (
    req,
    res,
    next,
) => {
    try {
        const input = parseRegisterBody(req.body);

        const result = await registerUser({
            ...input,
            requestIp: req.ip,
            userAgent: req.get('user-agent') ?? null,
        });

        let emailVerification;

        try {
            // El primer código también debe consumir
            // cuota por cuenta y dirección IP.
            await consumeEmailVerificationCodeQuota({
                userId: result.user.id,
                requestIp: req.ip,
            });

            emailVerification =
                await requestEmailVerificationCode({
                    userId: result.user.id,
                });

        } catch (error) {
            console.error(
                'Initial email verification delivery failed:',
                error,
            );

            emailVerification =
                Object.freeze({
                    requested: false,
                    alreadyVerified: false,
                    expiresAt: null,
                    delivery: null,
                });
        }

        setRefreshTokenCookie(res, {
            refreshToken: result.refreshToken,
            expiresAt: result.refreshTokenExpiresAt,
        });

        res.status(201).json({
            status: 'success',
            data: {
                user: result.user,
                accessToken: result.accessToken,
                emailVerification,
            },
        });
    } catch (error) {
        next(error);
    }
};
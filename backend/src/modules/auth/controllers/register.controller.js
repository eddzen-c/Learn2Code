import { env } from '../../../config/env.js';
import {
    registerUser,
} from '../services/register.service.js';
import {
    parseRegisterBody,
} from '../validators/register.validator.js';

const REFRESH_TOKEN_COOKIE_NAME =
    'learn2code_refresh_token';

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

        res.cookie(
            REFRESH_TOKEN_COOKIE_NAME,
            result.refreshToken,
            {
                httpOnly: true,
                secure: env.nodeEnv === 'production',
                sameSite: 'lax',
                path: '/api/v1/auth',
                expires: result.refreshTokenExpiresAt,
            },
        );

        res.status(201).json({
            status: 'success',
            data: {
                user: result.user,
                accessToken: result.accessToken,
            },
        });
    } catch (error) {
        next(error);
    }
};
import {
    registerUser,
} from '../services/register.service.js';

import {
    setRefreshTokenCookie,
} from '../utils/refresh-token-cookie.js';

import {
    parseRegisterBody,
} from '../validators/register.validator.js';

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

        setRefreshTokenCookie(res, {
            refreshToken: result.refreshToken,
            expiresAt: result.refreshTokenExpiresAt,
        });

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
import {
    InvalidRefreshTokenError,
} from '../errors/refresh-token.errors.js';

import {
    refreshAccessSession,
} from '../services/refresh-access.service.js';

import {
    clearRefreshTokenCookie,
    getRefreshTokenCookie,
    setRefreshTokenCookie,
} from '../utils/refresh-token-cookie.js';

export const refreshController = async (
    req,
    res,
    next,
) => {
    try {
        const refreshToken =
            getRefreshTokenCookie(req);

        if (!refreshToken) {
            throw new InvalidRefreshTokenError();
        }

        const result = await refreshAccessSession({
            refreshToken,
            requestIp: req.ip,
            userAgent: req.get('user-agent') ?? null,
        });

        setRefreshTokenCookie(res, {
            refreshToken: result.refreshToken,
            expiresAt: result.refreshTokenExpiresAt,
        });

        res.status(200).json({
            status: 'success',
            data: {
                user: result.user,
                accessToken: result.accessToken,
            },
        });
    } catch (error) {
        if (error?.statusCode === 401) {
            clearRefreshTokenCookie(res);
        }

        next(error);
    }
};
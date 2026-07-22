import {
    loginUser,
} from '../services/login.service.js';

import {
    setRefreshTokenCookie,
} from '../utils/refresh-token-cookie.js';

import {
    parseLoginBody,
} from '../validators/login.validator.js';

export const loginController = async (
    req,
    res,
    next,
) => {
    try {
        const input = parseLoginBody(req.body);

        const result = await loginUser({
            ...input,
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
        next(error);
    }
};
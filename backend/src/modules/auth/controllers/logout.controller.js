import {
    revokeRefreshSession,
} from '../services/refresh-session.service.js';

import {
    clearRefreshTokenCookie,
    getRefreshTokenCookie,
} from '../utils/refresh-token-cookie.js';

export const logoutController = async (
    req,
    res,
    next,
) => {
    try {
        const refreshToken =
            getRefreshTokenCookie(req);

        if (refreshToken) {
            await revokeRefreshSession({
                refreshToken,
                requestIp: req.ip,
            });
        }

        clearRefreshTokenCookie(res);

        res.status(204).send();
    } catch (error) {
        clearRefreshTokenCookie(res);
        next(error);
    }
};
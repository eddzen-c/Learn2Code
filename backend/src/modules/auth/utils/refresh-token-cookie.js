import { env } from '../../../config/env.js';

export const REFRESH_TOKEN_COOKIE_NAME =
    'learn2code_refresh_token';

export const setRefreshTokenCookie = (
    res,
    {
        refreshToken,
        expiresAt,
    },
) => {
    res.cookie(
        REFRESH_TOKEN_COOKIE_NAME,
        refreshToken,
        {
            httpOnly: true,
            secure: env.nodeEnv === 'production',
            sameSite: 'lax',
            path: '/api/v1/auth',
            expires: expiresAt,
        },
    );
};
import { env } from '../../../config/env.js';

export const REFRESH_TOKEN_COOKIE_NAME =
    'learn2code_refresh_token';

const getBaseCookieOptions = () => ({
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
});

export const getRefreshTokenCookie = (req) => {
    const refreshToken =
        req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (
        typeof refreshToken !== 'string'
        || refreshToken.length === 0
    ) {
        return null;
    }

    return refreshToken;
};

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
            ...getBaseCookieOptions(),
            expires: expiresAt,
        },
    );
};

export const clearRefreshTokenCookie = (res) => {
    res.clearCookie(
        REFRESH_TOKEN_COOKIE_NAME,
        getBaseCookieOptions(),
    );
};
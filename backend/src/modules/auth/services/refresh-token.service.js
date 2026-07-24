import {
    createHash,
    randomBytes,
} from 'node:crypto';

import { env } from '../../../config/env.js';

const REFRESH_TOKEN_BYTES = 64;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const assertValidToken = (token) => {
    if (
        typeof token !== 'string'
        || token.trim().length === 0
    ) {
        throw new TypeError(
            'Refresh token must be a non-empty string',
        );
    }
};

export const hashRefreshToken = (token) => {
    assertValidToken(token);

    return createHash('sha256')
        .update(token, 'utf8')
        .digest('hex');
};

export const issueRefreshToken = ({
    now = new Date(),
} = {}) => {
    if (
        !(now instanceof Date)
        || Number.isNaN(now.getTime())
    ) {
        throw new TypeError('Now must be a valid Date');
    }

    const token = randomBytes(REFRESH_TOKEN_BYTES)
        .toString('base64url');

    const expiresAt = new Date(
        now.getTime()
        + (
            env.auth.refreshTokenTtlDays
            * MILLISECONDS_PER_DAY
        ),
    );

    return Object.freeze({
        token,
        tokenHash: hashRefreshToken(token),
        expiresAt,
    });
};
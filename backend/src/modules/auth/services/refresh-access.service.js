import { databasePool } from '../../../config/database.js';

import {
    InvalidRefreshTokenError,
} from '../errors/refresh-token.errors.js';

import {
    findUserById,
} from '../repositories/user.repository.js';

import {
    createAccessToken,
} from './access-token.service.js';

import {
    revokeRefreshSession,
    rotateRefreshSession,
} from './refresh-session.service.js';

export const refreshAccessSession = async ({
    refreshToken,
    requestIp = null,
    userAgent = null,
    now = new Date(),
    pool = databasePool,
}) => {
    const rotatedSession = await rotateRefreshSession({
        refreshToken,
        requestIp,
        userAgent,
        now,
        pool,
    });

    const user = await findUserById({
        userId: rotatedSession.userId,
        client: pool,
    });

    if (
        !user
        || !user.isActive
        || user.deletedAt !== null
        || user.roles.length === 0
    ) {
        await revokeRefreshSession({
            refreshToken: rotatedSession.refreshToken,
            requestIp,
            now,
            pool,
        });

        throw new InvalidRefreshTokenError();
    }

    const accessToken = await createAccessToken({
        userId: user.id,
        roles: user.roles,
    });

    return Object.freeze({
        user: Object.freeze({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            roles: Object.freeze([...user.roles]),
            emailVerified:
                user.emailVerifiedAt !== null,
        }),
        accessToken,
        refreshToken: rotatedSession.refreshToken,
        refreshTokenExpiresAt:
            rotatedSession.expiresAt,
    });
};
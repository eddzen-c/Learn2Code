import { randomUUID } from 'node:crypto';

import { SignJWT, jwtVerify } from 'jose';

import { env } from '../../../config/env.js';

const ACCESS_TOKEN_ALGORITHM = 'HS256';

const accessTokenKey = new TextEncoder().encode(
    env.auth.accessTokenSecret,
);

const normalizeRoles = (roles) => {
    if (!Array.isArray(roles)) {
        throw new TypeError('Roles must be an array');
    }

    if (
        roles.some(
            (role) => typeof role !== 'string'
                || role.trim().length === 0,
        )
    ) {
        throw new TypeError('Every role must be a non-empty string');
    }

    return [...new Set(roles)];
};

export const createAccessToken = async ({
    userId,
    roles = [],
}) => {
    if (
        typeof userId !== 'string'
        || userId.trim().length === 0
    ) {
        throw new TypeError('User ID must be a non-empty string');
    }

    const normalizedRoles = normalizeRoles(roles);

    return new SignJWT({
        roles: normalizedRoles,
    })
        .setProtectedHeader({
            alg: ACCESS_TOKEN_ALGORITHM,
            typ: 'JWT',
        })
        .setSubject(userId)
        .setIssuer(env.auth.issuer)
        .setAudience(env.auth.audience)
        .setJti(randomUUID())
        .setIssuedAt()
        .setExpirationTime(env.auth.accessTokenExpiresIn)
        .sign(accessTokenKey);
};

export const verifyAccessToken = async (token) => {
    if (
        typeof token !== 'string'
        || token.trim().length === 0
    ) {
        throw new TypeError(
            'Access token must be a non-empty string',
        );
    }

    const { payload } = await jwtVerify(
        token,
        accessTokenKey,
        {
            algorithms: [ACCESS_TOKEN_ALGORITHM],
            issuer: env.auth.issuer,
            audience: env.auth.audience,
            typ: 'JWT',
        },
    );

    if (
        typeof payload.sub !== 'string'
        || typeof payload.jti !== 'string'
        || typeof payload.iat !== 'number'
        || typeof payload.exp !== 'number'
        || !Array.isArray(payload.roles)
    ) {
        throw new Error(
            'Access token is missing required claims',
        );
    }

    const roles = payload.roles;

    if (
        roles.some(
            (role) => typeof role !== 'string'
                || role.trim().length === 0,
        )
    ) {
        throw new Error('Access token contains invalid roles');
    }

    return Object.freeze({
        userId: payload.sub,
        roles: Object.freeze([...roles]),
        tokenId: payload.jti,
        issuedAt: payload.iat,
        expiresAt: payload.exp,
    });
};
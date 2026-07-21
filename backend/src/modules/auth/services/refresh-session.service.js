import { databasePool } from '../../../config/database.js';

import {
    ExpiredRefreshTokenError,
    InvalidRefreshTokenError,
    RefreshTokenReuseDetectedError,
} from '../errors/refresh-token.errors.js';

import {
    createRefreshTokenRecord,
    findRefreshTokenByHash,
    revokeAllUserRefreshTokens,
    revokeRefreshTokenRecord,
} from '../repositories/refresh-token.repository.js';

import {
    hashRefreshToken,
    issueRefreshToken,
} from './refresh-token.service.js';

export const createRefreshSession = async ({
    userId,
    createdByIp = null,
    userAgent = null,
    now = new Date(),
    client = databasePool,
}) => {
    const issuedToken = issueRefreshToken({ now });

    const record = await createRefreshTokenRecord({
        userId,
        tokenHash: issuedToken.tokenHash,
        expiresAt: issuedToken.expiresAt,
        createdByIp,
        userAgent,
        client,
    });

    return Object.freeze({
        refreshToken: issuedToken.token,
        refreshTokenId: record.id,
        userId: record.userId,
        expiresAt: record.expiresAt,
    });
};

export const rotateRefreshSession = async ({
    refreshToken,
    requestIp = null,
    userAgent = null,
    now = new Date(),
    pool = databasePool,
}) => {
    const tokenHash = hashRefreshToken(refreshToken);
    const client = await pool.connect();

    let transactionCompleted = false;

    try {
        await client.query('BEGIN');

        const currentToken = await findRefreshTokenByHash({
            tokenHash,
            forUpdate: true,
            client,
        });

        if (!currentToken) {
            throw new InvalidRefreshTokenError();
        }

        if (currentToken.revokedAt !== null) {
            await revokeAllUserRefreshTokens({
                userId: currentToken.userId,
                revokedAt: now,
                revokedByIp: requestIp,
                client,
            });

            await client.query('COMMIT');
            transactionCompleted = true;

            throw new RefreshTokenReuseDetectedError();
        }

        if (
            currentToken.expiresAt.getTime()
            <= now.getTime()
        ) {
            await revokeRefreshTokenRecord({
                id: currentToken.id,
                revokedAt: now,
                revokedByIp: requestIp,
                client,
            });

            await client.query('COMMIT');
            transactionCompleted = true;

            throw new ExpiredRefreshTokenError();
        }

        const replacementToken = issueRefreshToken({
            now,
        });

        const replacementRecord =
            await createRefreshTokenRecord({
                userId: currentToken.userId,
                tokenHash: replacementToken.tokenHash,
                expiresAt: replacementToken.expiresAt,
                createdByIp: requestIp,
                userAgent,
                client,
            });

        const revokedToken =
            await revokeRefreshTokenRecord({
                id: currentToken.id,
                revokedAt: now,
                revokedByIp: requestIp,
                replacedByTokenId: replacementRecord.id,
                client,
            });

        if (!revokedToken) {
            throw new RefreshTokenReuseDetectedError();
        }

        await client.query('COMMIT');
        transactionCompleted = true;

        return Object.freeze({
            refreshToken: replacementToken.token,
            refreshTokenId: replacementRecord.id,
            previousRefreshTokenId: currentToken.id,
            userId: currentToken.userId,
            expiresAt: replacementRecord.expiresAt,
        });
    } catch (error) {
        if (!transactionCompleted) {
            try {
                await client.query('ROLLBACK');
            } catch {
                // The original transaction error remains the priority.
            }
        }

        throw error;
    } finally {
        client.release();
    }
};

export const revokeRefreshSession = async ({
    refreshToken,
    requestIp = null,
    now = new Date(),
    pool = databasePool,
}) => {
    const tokenHash = hashRefreshToken(refreshToken);
    const client = await pool.connect();

    let transactionCompleted = false;

    try {
        await client.query('BEGIN');

        const currentToken = await findRefreshTokenByHash({
            tokenHash,
            forUpdate: true,
            client,
        });

        if (
            !currentToken
            || currentToken.revokedAt !== null
        ) {
            await client.query('COMMIT');
            transactionCompleted = true;

            return false;
        }

        const revokedToken =
            await revokeRefreshTokenRecord({
                id: currentToken.id,
                revokedAt: now,
                revokedByIp: requestIp,
                client,
            });

        await client.query('COMMIT');
        transactionCompleted = true;

        return revokedToken !== null;
    } catch (error) {
        if (!transactionCompleted) {
            try {
                await client.query('ROLLBACK');
            } catch {
                // The original transaction error remains the priority.
            }
        }

        throw error;
    } finally {
        client.release();
    }
};
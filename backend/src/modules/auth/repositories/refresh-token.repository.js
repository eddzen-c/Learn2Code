import { databasePool } from '../../../config/database.js';

const mapRefreshTokenRow = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        id: row.id,
        userId: row.user_id,
        tokenHash: row.token_hash,
        expiresAt: row.expires_at,
        revokedAt: row.revoked_at,
        replacedByTokenId: row.replaced_by_token_id,
        createdByIp: row.created_by_ip,
        revokedByIp: row.revoked_by_ip,
        userAgent: row.user_agent,
        createdAt: row.created_at,
    });
};

export const createRefreshTokenRecord = async ({
    userId,
    tokenHash,
    expiresAt,
    createdByIp = null,
    userAgent = null,
    client = databasePool,
}) => {
    const result = await client.query({
        text: `
            INSERT INTO refresh_tokens (
                user_id,
                token_hash,
                expires_at,
                created_by_ip,
                user_agent
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                user_id,
                token_hash,
                expires_at,
                revoked_at,
                replaced_by_token_id,
                created_by_ip,
                revoked_by_ip,
                user_agent,
                created_at
        `,
        values: [
            userId,
            tokenHash,
            expiresAt,
            createdByIp,
            userAgent,
        ],
    });

    return mapRefreshTokenRow(result.rows[0]);
};

export const findRefreshTokenByHash = async ({
    tokenHash,
    forUpdate = false,
    client = databasePool,
}) => {
    const lockClause = forUpdate
        ? 'FOR UPDATE'
        : '';

    const result = await client.query({
        text: `
            SELECT
                id,
                user_id,
                token_hash,
                expires_at,
                revoked_at,
                replaced_by_token_id,
                created_by_ip,
                revoked_by_ip,
                user_agent,
                created_at
            FROM refresh_tokens
            WHERE token_hash = $1
            ${lockClause}
        `,
        values: [tokenHash],
    });

    return mapRefreshTokenRow(result.rows[0]);
};

export const revokeRefreshTokenRecord = async ({
    id,
    revokedAt = new Date(),
    revokedByIp = null,
    replacedByTokenId = null,
    client = databasePool,
}) => {
    const result = await client.query({
        text: `
            UPDATE refresh_tokens
            SET
                revoked_at = $2,
                revoked_by_ip = $3,
                replaced_by_token_id = $4
            WHERE id = $1
                AND revoked_at IS NULL
            RETURNING
                id,
                user_id,
                token_hash,
                expires_at,
                revoked_at,
                replaced_by_token_id,
                created_by_ip,
                revoked_by_ip,
                user_agent,
                created_at
        `,
        values: [
            id,
            revokedAt,
            revokedByIp,
            replacedByTokenId,
        ],
    });

    return mapRefreshTokenRow(result.rows[0]);
};

export const revokeAllUserRefreshTokens = async ({
    userId,
    revokedAt = new Date(),
    revokedByIp = null,
    client = databasePool,
}) => {
    const result = await client.query({
        text: `
            UPDATE refresh_tokens
            SET
                revoked_at = $2,
                revoked_by_ip = $3
            WHERE user_id = $1
                AND revoked_at IS NULL
            RETURNING id
        `,
        values: [
            userId,
            revokedAt,
            revokedByIp,
        ],
    });

    return result.rowCount ?? result.rows.length;
};
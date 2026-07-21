import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import {
    createRefreshTokenRecord,
    findRefreshTokenByHash,
    revokeAllUserRefreshTokens,
    revokeRefreshTokenRecord,
} from '../repositories/refresh-token.repository.js';

const createDatabaseRow = (overrides = {}) => ({
    id: randomUUID(),
    user_id: randomUUID(),
    token_hash: 'a'.repeat(64),
    expires_at: new Date('2026-08-20T12:00:00.000Z'),
    revoked_at: null,
    replaced_by_token_id: null,
    created_by_ip: '127.0.0.1',
    revoked_by_ip: null,
    user_agent: 'Learn2Code test client',
    created_at: new Date('2026-07-21T12:00:00.000Z'),
    ...overrides,
});

const createFakeClient = ({
    rows = [],
    rowCount = rows.length,
} = {}) => {
    const queries = [];

    return {
        queries,

        query: async (queryConfig) => {
            queries.push(queryConfig);

            return {
                rows,
                rowCount,
            };
        },
    };
};

test('createRefreshTokenRecord inserts and maps a token', async () => {
    const row = createDatabaseRow();
    const client = createFakeClient({
        rows: [row],
        rowCount: 1,
    });

    const record = await createRefreshTokenRecord({
        userId: row.user_id,
        tokenHash: row.token_hash,
        expiresAt: row.expires_at,
        createdByIp: row.created_by_ip,
        userAgent: row.user_agent,
        client,
    });

    assert.equal(client.queries.length, 1);
    assert.match(
        client.queries[0].text,
        /INSERT INTO refresh_tokens/,
    );

    assert.deepEqual(
        client.queries[0].values,
        [
            row.user_id,
            row.token_hash,
            row.expires_at,
            row.created_by_ip,
            row.user_agent,
        ],
    );

    assert.equal(record.id, row.id);
    assert.equal(record.userId, row.user_id);
    assert.equal(record.tokenHash, row.token_hash);
    assert.equal(record.createdByIp, row.created_by_ip);
});

test('findRefreshTokenByHash can lock the record', async () => {
    const row = createDatabaseRow();
    const client = createFakeClient({
        rows: [row],
        rowCount: 1,
    });

    const record = await findRefreshTokenByHash({
        tokenHash: row.token_hash,
        forUpdate: true,
        client,
    });

    assert.match(
        client.queries[0].text,
        /FOR UPDATE/,
    );

    assert.deepEqual(
        client.queries[0].values,
        [row.token_hash],
    );

    assert.equal(record.id, row.id);
});

test('findRefreshTokenByHash returns null when missing', async () => {
    const client = createFakeClient();

    const record = await findRefreshTokenByHash({
        tokenHash: 'b'.repeat(64),
        client,
    });

    assert.equal(record, null);
});

test('revokeRefreshTokenRecord revokes an active token', async () => {
    const replacedByTokenId = randomUUID();
    const revokedAt = new Date('2026-07-22T12:00:00.000Z');

    const row = createDatabaseRow({
        revoked_at: revokedAt,
        revoked_by_ip: '127.0.0.2',
        replaced_by_token_id: replacedByTokenId,
    });

    const client = createFakeClient({
        rows: [row],
        rowCount: 1,
    });

    const record = await revokeRefreshTokenRecord({
        id: row.id,
        revokedAt,
        revokedByIp: row.revoked_by_ip,
        replacedByTokenId,
        client,
    });

    assert.match(
        client.queries[0].text,
        /UPDATE refresh_tokens/,
    );

    assert.deepEqual(
        client.queries[0].values,
        [
            row.id,
            revokedAt,
            row.revoked_by_ip,
            replacedByTokenId,
        ],
    );

    assert.equal(record.revokedAt, revokedAt);
    assert.equal(
        record.replacedByTokenId,
        replacedByTokenId,
    );
});

test('revokeAllUserRefreshTokens returns affected count', async () => {
    const userId = randomUUID();
    const revokedAt = new Date('2026-07-22T12:00:00.000Z');

    const client = createFakeClient({
        rows: [
            { id: randomUUID() },
            { id: randomUUID() },
        ],
        rowCount: 2,
    });

    const affectedCount = await revokeAllUserRefreshTokens({
        userId,
        revokedAt,
        revokedByIp: '127.0.0.3',
        client,
    });

    assert.equal(affectedCount, 2);

    assert.deepEqual(
        client.queries[0].values,
        [
            userId,
            revokedAt,
            '127.0.0.3',
        ],
    );
});
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import {
    createRefreshSession,
    revokeRefreshSession,
    rotateRefreshSession,
} from '../services/refresh-session.service.js';

import {
    hashRefreshToken,
} from '../services/refresh-token.service.js';

const createRefreshTokenRow = (overrides = {}) => ({
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
    currentRow = null,
    replacementId = randomUUID(),
    revokeAllCount = 1,
} = {}) => {
    const queries = [];
    let released = false;

    return {
        queries,

        get released() {
            return released;
        },

        release() {
            released = true;
        },

        async query(queryConfig) {
            const text = typeof queryConfig === 'string'
                ? queryConfig
                : queryConfig.text;

            const values = typeof queryConfig === 'string'
                ? []
                : queryConfig.values;

            const normalizedText = text
                .replace(/\s+/g, ' ')
                .trim();

            queries.push({
                text: normalizedText,
                values,
            });

            if (
                normalizedText === 'BEGIN'
                || normalizedText === 'COMMIT'
                || normalizedText === 'ROLLBACK'
            ) {
                return {
                    rows: [],
                    rowCount: 0,
                };
            }

            if (
                normalizedText.startsWith('SELECT')
                && normalizedText.includes(
                    'FROM refresh_tokens',
                )
            ) {
                return {
                    rows: currentRow
                        ? [currentRow]
                        : [],
                    rowCount: currentRow ? 1 : 0,
                };
            }

            if (
                normalizedText.startsWith(
                    'INSERT INTO refresh_tokens',
                )
            ) {
                const row = createRefreshTokenRow({
                    id: replacementId,
                    user_id: values[0],
                    token_hash: values[1],
                    expires_at: values[2],
                    created_by_ip: values[3],
                    user_agent: values[4],
                });

                return {
                    rows: [row],
                    rowCount: 1,
                };
            }

            if (
                normalizedText.startsWith(
                    'UPDATE refresh_tokens',
                )
                && normalizedText.includes(
                    'WHERE id = $1',
                )
            ) {
                if (!currentRow) {
                    return {
                        rows: [],
                        rowCount: 0,
                    };
                }

                const row = {
                    ...currentRow,
                    revoked_at: values[1],
                    revoked_by_ip: values[2],
                    replaced_by_token_id: values[3],
                };

                return {
                    rows: [row],
                    rowCount: 1,
                };
            }

            if (
                normalizedText.startsWith(
                    'UPDATE refresh_tokens',
                )
                && normalizedText.includes(
                    'WHERE user_id = $1',
                )
            ) {
                return {
                    rows: Array.from(
                        { length: revokeAllCount },
                        () => ({ id: randomUUID() }),
                    ),
                    rowCount: revokeAllCount,
                };
            }

            throw new Error(
                `Unexpected query: ${normalizedText}`,
            );
        },
    };
};

const getQueryOperations = (client) => (
    client.queries.map(
        ({ text }) => text.split(' ')[0],
    )
);

test('createRefreshSession stores only the token hash', async () => {
    const userId = randomUUID();
    const client = createFakeClient();

    const session = await createRefreshSession({
        userId,
        createdByIp: '127.0.0.1',
        userAgent: 'Test browser',
        now: new Date('2026-07-21T12:00:00.000Z'),
        client,
    });

    const insertQuery = client.queries[0];

    assert.equal(session.userId, userId);
    assert.ok(session.refreshToken.length >= 80);

    assert.equal(
        insertQuery.values[1],
        hashRefreshToken(session.refreshToken),
    );

    assert.notEqual(
        insertQuery.values[1],
        session.refreshToken,
    );
});

test('rotateRefreshSession rotates an active token', async () => {
    const originalToken = 'original-refresh-token';
    const now = new Date('2026-07-21T12:00:00.000Z');

    const currentRow = createRefreshTokenRow({
        token_hash: hashRefreshToken(originalToken),
        expires_at: new Date('2026-08-20T12:00:00.000Z'),
    });

    const client = createFakeClient({
        currentRow,
    });

    const pool = {
        connect: async () => client,
    };

    const session = await rotateRefreshSession({
        refreshToken: originalToken,
        requestIp: '127.0.0.2',
        userAgent: 'Updated browser',
        now,
        pool,
    });

    assert.equal(session.userId, currentRow.user_id);
    assert.notEqual(session.refreshToken, originalToken);
    assert.equal(
        session.previousRefreshTokenId,
        currentRow.id,
    );

    assert.deepEqual(
        getQueryOperations(client),
        [
            'BEGIN',
            'SELECT',
            'INSERT',
            'UPDATE',
            'COMMIT',
        ],
    );

    assert.equal(client.released, true);
});

test('rotateRefreshSession rejects an expired token', async () => {
    const originalToken = 'expired-refresh-token';
    const now = new Date('2026-07-21T12:00:00.000Z');

    const currentRow = createRefreshTokenRow({
        token_hash: hashRefreshToken(originalToken),
        expires_at: new Date('2026-07-20T12:00:00.000Z'),
    });

    const client = createFakeClient({
        currentRow,
    });

    const pool = {
        connect: async () => client,
    };

    await assert.rejects(
        () => rotateRefreshSession({
            refreshToken: originalToken,
            now,
            pool,
        }),
        (error) => {
            assert.equal(
                error.code,
                'EXPIRED_REFRESH_TOKEN',
            );

            return true;
        },
    );

    assert.deepEqual(
        getQueryOperations(client),
        [
            'BEGIN',
            'SELECT',
            'UPDATE',
            'COMMIT',
        ],
    );

    assert.equal(client.released, true);
});

test('rotateRefreshSession detects token reuse', async () => {
    const reusedToken = 'reused-refresh-token';

    const currentRow = createRefreshTokenRow({
        token_hash: hashRefreshToken(reusedToken),
        revoked_at: new Date('2026-07-20T12:00:00.000Z'),
    });

    const client = createFakeClient({
        currentRow,
        revokeAllCount: 2,
    });

    const pool = {
        connect: async () => client,
    };

    await assert.rejects(
        () => rotateRefreshSession({
            refreshToken: reusedToken,
            now: new Date('2026-07-21T12:00:00.000Z'),
            pool,
        }),
        (error) => {
            assert.equal(
                error.code,
                'REFRESH_TOKEN_REUSE_DETECTED',
            );

            return true;
        },
    );

    assert.deepEqual(
        getQueryOperations(client),
        [
            'BEGIN',
            'SELECT',
            'UPDATE',
            'COMMIT',
        ],
    );

    assert.equal(client.released, true);
});

test('rotateRefreshSession rejects an unknown token', async () => {
    const client = createFakeClient();

    const pool = {
        connect: async () => client,
    };

    await assert.rejects(
        () => rotateRefreshSession({
            refreshToken: 'unknown-refresh-token',
            pool,
        }),
        (error) => {
            assert.equal(
                error.code,
                'INVALID_REFRESH_TOKEN',
            );

            return true;
        },
    );

    assert.deepEqual(
        getQueryOperations(client),
        [
            'BEGIN',
            'SELECT',
            'ROLLBACK',
        ],
    );

    assert.equal(client.released, true);
});

test('revokeRefreshSession revokes an active token', async () => {
    const rawToken = 'active-refresh-token';

    const currentRow = createRefreshTokenRow({
        token_hash: hashRefreshToken(rawToken),
    });

    const client = createFakeClient({
        currentRow,
    });

    const pool = {
        connect: async () => client,
    };

    const wasRevoked = await revokeRefreshSession({
        refreshToken: rawToken,
        requestIp: '127.0.0.4',
        now: new Date('2026-07-21T12:00:00.000Z'),
        pool,
    });

    assert.equal(wasRevoked, true);

    assert.deepEqual(
        getQueryOperations(client),
        [
            'BEGIN',
            'SELECT',
            'UPDATE',
            'COMMIT',
        ],
    );

    assert.equal(client.released, true);
});

test('revokeRefreshSession is idempotent', async () => {
    const client = createFakeClient();

    const pool = {
        connect: async () => client,
    };

    const wasRevoked = await revokeRefreshSession({
        refreshToken: 'unknown-refresh-token',
        pool,
    });

    assert.equal(wasRevoked, false);

    assert.deepEqual(
        getQueryOperations(client),
        [
            'BEGIN',
            'SELECT',
            'COMMIT',
        ],
    );

    assert.equal(client.released, true);
});
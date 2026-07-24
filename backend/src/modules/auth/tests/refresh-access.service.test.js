import assert from 'node:assert/strict';
import test from 'node:test';

import {
    refreshAccessSession,
} from '../services/refresh-access.service.js';

import {
    hashRefreshToken,
    issueRefreshToken,
} from '../services/refresh-token.service.js';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const CURRENT_TOKEN_ID =
    '22222222-2222-4222-8222-222222222222';
const REPLACEMENT_TOKEN_ID =
    '33333333-3333-4333-8333-333333333333';

const NOW = new Date('2026-07-22T12:00:00.000Z');
const CURRENT_EXPIRATION =
    new Date('2026-08-22T12:00:00.000Z');

const CURRENT_REFRESH_TOKEN = issueRefreshToken({
    now: NOW,
}).token;

const createUserRow = (overrides = {}) => ({
    id: USER_ID,
    full_name: 'Refresh Student',
    email: 'refresh.student@example.com',
    password_hash: 'unused-password-hash',
    avatar_url: null,
    preferred_locale: 'es-MX',
    preferred_programming_language_id: null,
    email_verified_at: null,
    last_login_at: NOW,
    is_active: true,
    deleted_at: null,
    created_at: NOW,
    updated_at: NOW,
    roles: ['student'],
    ...overrides,
});

const createFakePool = ({
    userRow = createUserRow(),
} = {}) => {
    const operations = [];
    let connectCount = 0;
    let releaseCount = 0;

    const refreshTokens = new Map([
        [
            CURRENT_TOKEN_ID,
            {
                id: CURRENT_TOKEN_ID,
                user_id: USER_ID,
                token_hash:
                    hashRefreshToken(
                        CURRENT_REFRESH_TOKEN,
                    ),
                expires_at: CURRENT_EXPIRATION,
                revoked_at: null,
                replaced_by_token_id: null,
                created_by_ip: '127.0.0.1',
                revoked_by_ip: null,
                user_agent: 'Original test session',
                created_at: NOW,
            },
        ],
    ]);

    const executeQuery = async (
        query,
        queryValues = [],
    ) => {
        const text = typeof query === 'string'
            ? query
            : query.text;

        const values = typeof query === 'string'
            ? queryValues
            : (query.values ?? []);

        const normalizedQuery = text
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();

        if (normalizedQuery === 'BEGIN') {
            operations.push('BEGIN');
            return { rows: [], rowCount: null };
        }

        if (normalizedQuery === 'COMMIT') {
            operations.push('COMMIT');
            return { rows: [], rowCount: null };
        }

        if (normalizedQuery === 'ROLLBACK') {
            operations.push('ROLLBACK');
            return { rows: [], rowCount: null };
        }

        if (
            normalizedQuery.startsWith('SELECT')
            && /\bFROM\s+REFRESH_TOKENS\b/.test(
                normalizedQuery,
            )
        ) {
            operations.push('SELECT_REFRESH_TOKEN');

            const token = [...refreshTokens.values()]
                .find(
                    (record) => (
                        record.token_hash === values[0]
                    ),
                );

            return {
                rows: token ? [{ ...token }] : [],
                rowCount: token ? 1 : 0,
            };
        }

        if (
            normalizedQuery.startsWith(
                'INSERT INTO REFRESH_TOKENS',
            )
        ) {
            operations.push('INSERT_REFRESH_TOKEN');

            const row = {
                id: REPLACEMENT_TOKEN_ID,
                user_id: values[0],
                token_hash: values[1],
                expires_at: values[2],
                revoked_at: null,
                replaced_by_token_id: null,
                created_by_ip: values[3],
                revoked_by_ip: null,
                user_agent: values[4],
                created_at: NOW,
            };

            refreshTokens.set(row.id, row);

            return {
                rows: [{ ...row }],
                rowCount: 1,
            };
        }

        if (
            normalizedQuery.startsWith(
                'UPDATE REFRESH_TOKENS',
            )
        ) {
            operations.push('REVOKE_REFRESH_TOKEN');

            const row = refreshTokens.get(values[0]);

            if (!row || row.revoked_at !== null) {
                return {
                    rows: [],
                    rowCount: 0,
                };
            }

            row.revoked_at = values[1];
            row.revoked_by_ip = values[2];
            row.replaced_by_token_id =
                values[3] ?? null;

            return {
                rows: [{ ...row }],
                rowCount: 1,
            };
        }

        if (
            normalizedQuery.startsWith('SELECT')
            && /\bFROM\s+USERS\b/.test(
                normalizedQuery,
            )
        ) {
            operations.push('SELECT_USER');

            return {
                rows: userRow ? [{ ...userRow }] : [],
                rowCount: userRow ? 1 : 0,
            };
        }

        throw new Error(`Unexpected query: ${text}`);
    };

    const client = {
        query: executeQuery,
        release() {
            releaseCount += 1;
        },
    };

    const pool = {
        query: executeQuery,
        async connect() {
            connectCount += 1;
            return client;
        },
    };

    return {
        pool,
        operations,
        refreshTokens,
        get connectCount() {
            return connectCount;
        },
        get releaseCount() {
            return releaseCount;
        },
    };
};

const assertInvalidRefreshToken = (error) => {
    assert.equal(error.statusCode, 401);
    assert.equal(
        error.code,
        'INVALID_REFRESH_TOKEN',
    );

    return true;
};

test('refreshAccessSession rotates the session', async () => {
    const database = createFakePool();

    const result = await refreshAccessSession({
        refreshToken: CURRENT_REFRESH_TOKEN,
        requestIp: '127.0.0.2',
        userAgent: 'Rotated test session',
        now: NOW,
        pool: database.pool,
    });

    assert.deepEqual(result.user, {
        id: USER_ID,
        fullName: 'Refresh Student',
        email: 'refresh.student@example.com',
        roles: ['student'],
        emailVerified: false,
    });

    assert.equal(
        result.accessToken.split('.').length,
        3,
    );

    assert.notEqual(
        result.refreshToken,
        CURRENT_REFRESH_TOKEN,
    );

    const currentRecord =
        database.refreshTokens.get(CURRENT_TOKEN_ID);

    const replacementRecord =
        database.refreshTokens.get(
            REPLACEMENT_TOKEN_ID,
        );

    assert.ok(currentRecord.revoked_at instanceof Date);

    assert.equal(
        currentRecord.replaced_by_token_id,
        REPLACEMENT_TOKEN_ID,
    );

    assert.equal(
        replacementRecord.token_hash,
        hashRefreshToken(result.refreshToken),
    );

    assert.equal(replacementRecord.revoked_at, null);
    assert.equal(database.connectCount, 1);
    assert.equal(database.releaseCount, 1);

    assert.deepEqual(database.operations, [
        'BEGIN',
        'SELECT_REFRESH_TOKEN',
        'INSERT_REFRESH_TOKEN',
        'REVOKE_REFRESH_TOKEN',
        'COMMIT',
        'SELECT_USER',
    ]);
});

test('refreshAccessSession rejects an unknown token', async () => {
    const database = createFakePool();

    await assert.rejects(
        refreshAccessSession({
            refreshToken:
                'unknown-refresh-token-for-testing',
            now: NOW,
            pool: database.pool,
        }),
        assertInvalidRefreshToken,
    );

    assert.deepEqual(database.operations, [
        'BEGIN',
        'SELECT_REFRESH_TOKEN',
        'ROLLBACK',
    ]);

    assert.equal(database.connectCount, 1);
    assert.equal(database.releaseCount, 1);
});

test('refreshAccessSession rejects an inactive user', async () => {
    const database = createFakePool({
        userRow: createUserRow({
            is_active: false,
        }),
    });

    await assert.rejects(
        refreshAccessSession({
            refreshToken: CURRENT_REFRESH_TOKEN,
            now: NOW,
            pool: database.pool,
        }),
        assertInvalidRefreshToken,
    );

    const replacementRecord =
        database.refreshTokens.get(
            REPLACEMENT_TOKEN_ID,
        );

    assert.ok(replacementRecord.revoked_at instanceof Date);
    assert.equal(database.connectCount, 2);
    assert.equal(database.releaseCount, 2);
});
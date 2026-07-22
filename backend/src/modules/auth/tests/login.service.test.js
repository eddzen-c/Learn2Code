import assert from 'node:assert/strict';
import test from 'node:test';

import {
    loginUser,
} from '../services/login.service.js';

import {
    hashPassword,
} from '../services/password.service.js';

import {
    hashRefreshToken,
} from '../services/refresh-token.service.js';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const REFRESH_TOKEN_ID =
    '22222222-2222-4222-8222-222222222222';

const VALID_PASSWORD = 'Learn2Code-Login-2026!';
const PASSWORD_HASH = await hashPassword(VALID_PASSWORD);

const NOW = new Date('2026-07-21T12:00:00.000Z');

const createUserRow = (overrides = {}) => ({
    id: USER_ID,
    full_name: 'Login Test',
    email: 'login.test@example.com',
    password_hash: PASSWORD_HASH,
    avatar_url: null,
    preferred_locale: 'es-MX',
    preferred_programming_language_id: null,
    email_verified_at: null,
    last_login_at: null,
    is_active: true,
    deleted_at: null,
    created_at: NOW,
    updated_at: NOW,
    roles: ['student'],
    ...overrides,
});

const createFakePool = ({ userRow = createUserRow() } = {}) => {
    const operations = [];
    let released = false;
    let connectCount = 0;
    let storedRefreshTokenHash = null;

    const executeQuery = async (query, queryValues = []) => {
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

        if (
            /\bFROM\s+USERS\b/.test(normalizedQuery)
            && normalizedQuery.includes('EMAIL')
        ) {
            operations.push('SELECT_USER');

            return {
                rows: userRow ? [userRow] : [],
                rowCount: userRow ? 1 : 0,
            };
        }

        if (normalizedQuery === 'BEGIN') {
            operations.push('BEGIN');

            return { rows: [], rowCount: null };
        }

        if (normalizedQuery.startsWith('UPDATE USERS')) {
            operations.push('UPDATE_USER');

            return {
                rows: [{
                    id: values[0],
                    last_login_at: values[1],
                }],
                rowCount: 1,
            };
        }

        if (
            normalizedQuery.startsWith(
                'INSERT INTO REFRESH_TOKENS',
            )
        ) {
            operations.push('INSERT_REFRESH_TOKEN');
            storedRefreshTokenHash = values[1];

            return {
                rows: [{
                    id: REFRESH_TOKEN_ID,
                    user_id: values[0],
                    token_hash: values[1],
                    expires_at: values[2],
                    revoked_at: null,
                    replaced_by_token_id: null,
                    created_by_ip: values[3],
                    revoked_by_ip: null,
                    user_agent: values[4],
                    created_at: NOW,
                }],
                rowCount: 1,
            };
        }

        if (normalizedQuery === 'COMMIT') {
            operations.push('COMMIT');

            return { rows: [], rowCount: null };
        }

        if (normalizedQuery === 'ROLLBACK') {
            operations.push('ROLLBACK');

            return { rows: [], rowCount: null };
        }

        throw new Error(`Unexpected query: ${text}`);
    };

    const client = {
        query: executeQuery,
        release() {
            released = true;
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
        get connectCount() {
            return connectCount;
        },
        get released() {
            return released;
        },
        get storedRefreshTokenHash() {
            return storedRefreshTokenHash;
        },
    };
};

const assertInvalidCredentials = (error) => {
    assert.equal(error.statusCode, 401);
    assert.equal(error.code, 'INVALID_CREDENTIALS');
    assert.equal(
        error.message,
        'Invalid email or password',
    );

    return true;
};

test('loginUser creates an authenticated session', async () => {
    const database = createFakePool();

    const result = await loginUser({
        email: 'login.test@example.com',
        password: VALID_PASSWORD,
        requestIp: '127.0.0.1',
        userAgent: 'Learn2Code test',
        now: NOW,
        pool: database.pool,
    });

    assert.deepEqual(result.user, {
        id: USER_ID,
        fullName: 'Login Test',
        email: 'login.test@example.com',
        roles: ['student'],
        emailVerified: false,
    });

    assert.equal(
        result.accessToken.split('.').length,
        3,
    );

    assert.equal(
        database.storedRefreshTokenHash,
        hashRefreshToken(result.refreshToken),
    );

    assert.deepEqual(database.operations, [
        'SELECT_USER',
        'BEGIN',
        'UPDATE_USER',
        'INSERT_REFRESH_TOKEN',
        'COMMIT',
    ]);

    assert.equal(database.connectCount, 1);
    assert.equal(database.released, true);
    assert.equal('password' in result, false);
});

test('loginUser rejects an incorrect password', async () => {
    const database = createFakePool();

    await assert.rejects(
        loginUser({
            email: 'login.test@example.com',
            password: 'Incorrect-Password-2026!',
            pool: database.pool,
        }),
        assertInvalidCredentials,
    );

    assert.equal(database.connectCount, 0);
    assert.deepEqual(database.operations, [
        'SELECT_USER',
    ]);
});

test('loginUser rejects an unknown email', async () => {
    const database = createFakePool({
        userRow: null,
    });

    await assert.rejects(
        loginUser({
            email: 'unknown@example.com',
            password: VALID_PASSWORD,
            pool: database.pool,
        }),
        assertInvalidCredentials,
    );

    assert.equal(database.connectCount, 0);
    assert.deepEqual(database.operations, [
        'SELECT_USER',
    ]);
});

test('loginUser rejects an inactive account', async () => {
    const database = createFakePool({
        userRow: createUserRow({
            is_active: false,
        }),
    });

    await assert.rejects(
        loginUser({
            email: 'login.test@example.com',
            password: VALID_PASSWORD,
            pool: database.pool,
        }),
        assertInvalidCredentials,
    );

    assert.equal(database.connectCount, 0);
    assert.deepEqual(database.operations, [
        'SELECT_USER',
    ]);
});
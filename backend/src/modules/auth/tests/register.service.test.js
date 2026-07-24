import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import {
    registerUser,
} from '../services/register.service.js';
import {
    hashRefreshToken,
} from '../services/refresh-token.service.js';

const createFakeClient = ({
    duplicateEmail = false,
    roleExists = true,
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
                normalizedText.startsWith(
                    'INSERT INTO users',
                )
            ) {
                if (duplicateEmail) {
                    const error =
                        new Error('Duplicate email');

                    error.code = '23505';
                    error.constraint = 'users_email_key';

                    throw error;
                }

                return {
                    rows: [{
                        id: randomUUID(),
                        full_name: values[0],
                        email: values[1],
                        password_hash: values[2],
                        avatar_url: null,
                        preferred_locale: 'es-MX',
                        preferred_programming_language_id: null,
                        email_verified_at: null,
                        last_login_at: null,
                        is_active: true,
                        deleted_at: null,
                        created_at: new Date(),
                        updated_at: new Date(),
                    }],
                    rowCount: 1,
                };
            }

            if (
                normalizedText.startsWith(
                    'INSERT INTO user_roles',
                )
            ) {
                if (!roleExists) {
                    return {
                        rows: [],
                        rowCount: 0,
                    };
                }

                return {
                    rows: [{
                        user_id: values[0],
                        role_id: 1,
                        assigned_at: new Date(),
                    }],
                    rowCount: 1,
                };
            }

            if (
                normalizedText.startsWith(
                    'INSERT INTO refresh_tokens',
                )
            ) {
                return {
                    rows: [{
                        id: randomUUID(),
                        user_id: values[0],
                        token_hash: values[1],
                        expires_at: values[2],
                        revoked_at: null,
                        replaced_by_token_id: null,
                        created_by_ip: values[3],
                        revoked_by_ip: null,
                        user_agent: values[4],
                        created_at: new Date(),
                    }],
                    rowCount: 1,
                };
            }

            throw new Error(
                `Unexpected query: ${normalizedText}`,
            );
        },
    };
};

const getOperations = (client) => (
    client.queries.map(({ text }) => {
        if (
            text === 'BEGIN'
            || text === 'COMMIT'
            || text === 'ROLLBACK'
        ) {
            return text;
        }

        if (text.includes('INSERT INTO users')) {
            return 'INSERT_USER';
        }

        if (text.includes('INSERT INTO user_roles')) {
            return 'INSERT_ROLE';
        }

        if (text.includes('INSERT INTO refresh_tokens')) {
            return 'INSERT_REFRESH_TOKEN';
        }

        return 'UNKNOWN';
    })
);

const registrationInput = Object.freeze({
    fullName: 'Learn2Code Student',
    email: 'student@example.test',
    password: 'Learn2Code-2026!',
});

test('registerUser creates a complete student session', async () => {
    const client = createFakeClient();

    const pool = {
        connect: async () => client,
    };

    const result = await registerUser({
        ...registrationInput,
        requestIp: '127.0.0.1',
        userAgent: 'Registration test',
        now: new Date('2026-07-21T12:00:00.000Z'),
        pool,
    });

    assert.equal(
        result.user.fullName,
        registrationInput.fullName,
    );

    assert.equal(
        result.user.email,
        registrationInput.email,
    );

    assert.deepEqual(
        result.user.roles,
        ['student'],
    );

    assert.equal(result.user.emailVerified, false);
    assert.equal(result.accessToken.split('.').length, 3);
    assert.ok(result.refreshToken.length >= 80);

    const userInsert = client.queries.find(
        ({ text }) => text.includes(
            'INSERT INTO users',
        ),
    );

    assert.notEqual(
        userInsert.values[2],
        registrationInput.password,
    );

    const refreshInsert = client.queries.find(
        ({ text }) => text.includes(
            'INSERT INTO refresh_tokens',
        ),
    );

    assert.equal(
        refreshInsert.values[1],
        hashRefreshToken(result.refreshToken),
    );

    assert.deepEqual(
        getOperations(client),
        [
            'BEGIN',
            'INSERT_USER',
            'INSERT_ROLE',
            'INSERT_REFRESH_TOKEN',
            'COMMIT',
        ],
    );

    assert.equal(client.released, true);
});

test('registerUser maps duplicated email errors', async () => {
    const client = createFakeClient({
        duplicateEmail: true,
    });

    const pool = {
        connect: async () => client,
    };

    await assert.rejects(
        () => registerUser({
            ...registrationInput,
            pool,
        }),
        (error) => {
            assert.equal(
                error.code,
                'EMAIL_ALREADY_REGISTERED',
            );

            assert.equal(error.statusCode, 409);

            return true;
        },
    );

    assert.deepEqual(
        getOperations(client),
        [
            'BEGIN',
            'INSERT_USER',
            'ROLLBACK',
        ],
    );

    assert.equal(client.released, true);
});

test('registerUser rolls back when student role is missing', async () => {
    const client = createFakeClient({
        roleExists: false,
    });

    const pool = {
        connect: async () => client,
    };

    await assert.rejects(
        () => registerUser({
            ...registrationInput,
            pool,
        }),
        (error) => {
            assert.equal(
                error.code,
                'STUDENT_ROLE_NOT_CONFIGURED',
            );

            return true;
        },
    );

    assert.deepEqual(
        getOperations(client),
        [
            'BEGIN',
            'INSERT_USER',
            'INSERT_ROLE',
            'ROLLBACK',
        ],
    );

    assert.equal(client.released, true);
});
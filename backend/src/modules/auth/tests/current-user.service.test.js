import assert from 'node:assert/strict';
import test from 'node:test';

import {
    AuthenticationRequiredError,
} from '../errors/access-token.errors.js';

import {
    getCurrentUser,
} from '../services/current-user.service.js';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const LAST_LOGIN_AT =
    new Date('2026-07-22T15:00:00.000Z');

const createUserRow = (overrides = {}) => ({
    id: USER_ID,
    full_name: 'Authenticated Student',
    email: 'authenticated@example.com',
    password_hash: 'unused-password-hash',
    avatar_url: null,
    preferred_locale: 'es-MX',
    preferred_programming_language_id: null,
    email_verified_at: null,
    last_login_at: LAST_LOGIN_AT,
    is_active: true,
    deleted_at: null,
    created_at: LAST_LOGIN_AT,
    updated_at: LAST_LOGIN_AT,
    roles: ['student'],
    ...overrides,
});

const createClient = (userRow) => ({
    async query(query) {
        assert.match(
            query.text,
            /WHERE users\.id = \$1/,
        );

        assert.deepEqual(
            query.values,
            [USER_ID],
        );

        return {
            rows: userRow ? [userRow] : [],
            rowCount: userRow ? 1 : 0,
        };
    },
});

const assertAuthenticationRequired = (error) => {
    assert.ok(
        error instanceof AuthenticationRequiredError,
    );

    assert.equal(error.statusCode, 401);

    assert.equal(
        error.code,
        'AUTHENTICATION_REQUIRED',
    );

    return true;
};

test('getCurrentUser returns the active user', async () => {
    const result = await getCurrentUser({
        userId: USER_ID,
        client: createClient(createUserRow()),
    });

    assert.deepEqual(result, {
        id: USER_ID,
        fullName: 'Authenticated Student',
        email: 'authenticated@example.com',
        avatarUrl: null,
        preferredLocale: 'es-MX',
        preferredProgrammingLanguageId: null,
        roles: ['student'],
        emailVerified: false,
        lastLoginAt: LAST_LOGIN_AT,
    });
});

test('getCurrentUser rejects a missing user', async () => {
    await assert.rejects(
        getCurrentUser({
            userId: USER_ID,
            client: createClient(null),
        }),
        assertAuthenticationRequired,
    );
});

test('getCurrentUser rejects an inactive user', async () => {
    await assert.rejects(
        getCurrentUser({
            userId: USER_ID,
            client: createClient(
                createUserRow({
                    is_active: false,
                }),
            ),
        }),
        assertAuthenticationRequired,
    );
});

test('getCurrentUser rejects a user without roles', async () => {
    await assert.rejects(
        getCurrentUser({
            userId: USER_ID,
            client: createClient(
                createUserRow({
                    roles: [],
                }),
            ),
        }),
        assertAuthenticationRequired,
    );
});
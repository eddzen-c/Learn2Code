import assert from 'node:assert/strict';
import test from 'node:test';

import {
    AuthenticationRequiredError,
} from '../errors/access-token.errors.js';

import {
    UnsupportedProgrammingLanguageError,
} from '../errors/profile.errors.js';

import {
    updateCurrentUserProfile,
} from '../services/profile.service.js';

const USER_ID =
    '11111111-1111-4111-8111-111111111111';

const NOW =
    new Date('2026-07-24T12:00:00.000Z');

const createUserRow = (overrides = {}) => ({
    id: USER_ID,
    full_name: 'Ada Lovelace',
    email: 'ada@example.com',
    password_hash: 'unused-password-hash',
    avatar_url: null,
    preferred_locale: 'en-US',
    preferred_programming_language_id: 2,
    email_verified_at: null,
    last_login_at: NOW,
    is_active: true,
    deleted_at: null,
    created_at: NOW,
    updated_at: NOW,
    roles: ['student'],
    ...overrides,
});

const createClient = ({
    languageFound = true,
    updateFound = true,
    userRow = createUserRow(),
} = {}) => {
    const operations = [];

    return {
        operations,

        async query(query) {
            const normalizedQuery = query.text
                .replace(/\s+/g, ' ')
                .trim()
                .toUpperCase();

            if (
                normalizedQuery.includes(
                    'FROM SUPPORTED_LANGUAGES',
                )
            ) {
                operations.push('SELECT_LANGUAGE');

                return {
                    rows: languageFound
                        ? [{
                            id: 2,
                            name: 'Python',
                            file_extension: '.py',
                            sandbox_image:
                                'learn2code-sandbox-python:3.12',
                        }]
                        : [],
                };
            }

            if (
                normalizedQuery.startsWith(
                    'UPDATE USERS',
                )
            ) {
                operations.push('UPDATE_USER');

                return {
                    rows: updateFound
                        ? [{
                            id: USER_ID,
                            updated_at: NOW,
                        }]
                        : [],
                };
            }

            if (
                normalizedQuery.startsWith('SELECT')
                && normalizedQuery.includes(
                    'FROM USERS',
                )
            ) {
                operations.push('SELECT_USER');

                return {
                    rows: userRow
                        ? [userRow]
                        : [],
                };
            }

            throw new Error(
                `Unexpected query: ${query.text}`,
            );
        },
    };
};

test('updateCurrentUserProfile returns the updated user', async () => {
    const client = createClient();

    const result =
        await updateCurrentUserProfile({
            userId: USER_ID,
            fullName: 'Ada Lovelace',
            preferredLocale: 'en-US',
            preferredProgrammingLanguageId: 2,
            client,
        });

    assert.deepEqual(result, {
        id: USER_ID,
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        avatarUrl: null,
        preferredLocale: 'en-US',
        preferredProgrammingLanguageId: 2,
        roles: ['student'],
        emailVerified: false,
        lastLoginAt: NOW,
    });

    assert.deepEqual(client.operations, [
        'SELECT_LANGUAGE',
        'UPDATE_USER',
        'SELECT_USER',
    ]);
});

test('updateCurrentUserProfile can clear the language', async () => {
    const client = createClient({
        userRow: createUserRow({
            preferred_programming_language_id:
                null,
        }),
    });

    const result =
        await updateCurrentUserProfile({
            userId: USER_ID,
            preferredProgrammingLanguageId: null,
            client,
        });

    assert.equal(
        result.preferredProgrammingLanguageId,
        null,
    );

    assert.deepEqual(client.operations, [
        'UPDATE_USER',
        'SELECT_USER',
    ]);
});

test('updateCurrentUserProfile rejects an unsupported language', async () => {
    const client = createClient({
        languageFound: false,
    });

    await assert.rejects(
        updateCurrentUserProfile({
            userId: USER_ID,
            preferredProgrammingLanguageId: 999,
            client,
        }),
        UnsupportedProgrammingLanguageError,
    );

    assert.deepEqual(client.operations, [
        'SELECT_LANGUAGE',
    ]);
});

test('updateCurrentUserProfile rejects a missing user', async () => {
    const client = createClient({
        updateFound: false,
    });

    await assert.rejects(
        updateCurrentUserProfile({
            userId: USER_ID,
            fullName: 'Ada Lovelace',
            client,
        }),
        AuthenticationRequiredError,
    );

    assert.deepEqual(client.operations, [
        'UPDATE_USER',
    ]);
});
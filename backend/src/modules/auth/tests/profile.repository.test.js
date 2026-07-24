import assert from 'node:assert/strict';
import test from 'node:test';

import {
    updateUserProfileRecord,
} from '../repositories/user.repository.js';

const USER_ID =
    '11111111-1111-4111-8111-111111111111';

const UPDATED_AT =
    new Date('2026-07-24T12:00:00.000Z');

test('updateUserProfileRecord updates all fields', async () => {
    const client = {
        async query(query) {
            assert.match(
                query.text,
                /UPDATE users/,
            );

            assert.deepEqual(
                query.values,
                [
                    USER_ID,
                    true,
                    'Ada Lovelace',
                    true,
                    'en-US',
                    true,
                    2,
                ],
            );

            return {
                rows: [{
                    id: USER_ID,
                    updated_at: UPDATED_AT,
                }],
            };
        },
    };

    const result =
        await updateUserProfileRecord({
            userId: USER_ID,
            fullName: 'Ada Lovelace',
            preferredLocale: 'en-US',
            preferredProgrammingLanguageId: 2,
            client,
        });

    assert.deepEqual(result, {
        userId: USER_ID,
        updatedAt: UPDATED_AT,
    });
});

test('updateUserProfileRecord preserves omitted fields', async () => {
    const client = {
        async query(query) {
            assert.deepEqual(
                query.values,
                [
                    USER_ID,
                    true,
                    'Grace Hopper',
                    false,
                    null,
                    false,
                    null,
                ],
            );

            return {
                rows: [{
                    id: USER_ID,
                    updated_at: UPDATED_AT,
                }],
            };
        },
    };

    await updateUserProfileRecord({
        userId: USER_ID,
        fullName: 'Grace Hopper',
        client,
    });
});

test('updateUserProfileRecord returns null when missing', async () => {
    const client = {
        async query() {
            return {
                rows: [],
            };
        },
    };

    const result =
        await updateUserProfileRecord({
            userId: USER_ID,
            preferredLocale: 'es-MX',
            client,
        });

    assert.equal(result, null);
});
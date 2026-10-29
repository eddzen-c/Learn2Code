
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    findPasswordForUpdate,
    updatePasswordHash,
} from '../repositories/password-change.repository.js';

const createClient = (rows = []) => {
    const queries = [];

    return {
        queries,

        async query(config) {
            queries.push(config);

            return {
                rows,
                rowCount: rows.length,
            };
        },
    };
};

test('locks the active user when reading the password hash', async () => {
    const client = createClient([{
        id: 'user-1',
        password_hash: 'existing-hash',
    }]);

    const result = await findPasswordForUpdate({
        userId: 'user-1',
        client,
    });

    assert.deepEqual(result, {
        userId: 'user-1',
        passwordHash: 'existing-hash',
    });

    assert.match(
        client.queries[0].text,
        /FOR UPDATE/,
    );

    assert.match(
        client.queries[0].text,
        /is_active = TRUE/,
    );

    assert.deepEqual(
        client.queries[0].values,
        ['user-1'],
    );
});

test('does not return a password for a missing user', async () => {
    const client = createClient();

    const result = await findPasswordForUpdate({
        userId: 'missing-user',
        client,
    });

    assert.equal(result, null);
});

test('updates only the authenticated user password hash', async () => {
    const client = createClient([{
        id: 'user-1',
    }]);

    const updatedAt =
        new Date('2026-10-29T18:00:00.000Z');

    const result = await updatePasswordHash({
        userId: 'user-1',
        passwordHash: 'new-secure-hash',
        updatedAt,
        client,
    });

    assert.deepEqual(result, {
        userId: 'user-1',
    });

    assert.match(
        client.queries[0].text,
        /UPDATE users/,
    );

    assert.match(
        client.queries[0].text,
        /password_hash = \$2/,
    );

    assert.deepEqual(
        client.queries[0].values,
        [
            'user-1',
            'new-secure-hash',
            updatedAt,
        ],
    );
});

test('does not report success when the user is unavailable', async () => {
    const client = createClient();

    const result = await updatePasswordHash({
        userId: 'missing-user',
        passwordHash: 'new-secure-hash',
        client,
    });

    assert.equal(result, null);
});

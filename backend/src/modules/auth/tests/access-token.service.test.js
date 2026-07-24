import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import {
    createAccessToken,
    verifyAccessToken,
} from '../services/access-token.service.js';

test('createAccessToken creates a verifiable JWT', async () => {
    const userId = randomUUID();

    const token = await createAccessToken({
        userId,
        roles: ['student'],
    });

    assert.equal(token.split('.').length, 3);

    const claims = await verifyAccessToken(token);

    assert.equal(claims.userId, userId);
    assert.deepEqual(claims.roles, ['student']);
    assert.ok(claims.tokenId);
    assert.ok(claims.expiresAt > claims.issuedAt);
});

test('createAccessToken removes duplicated roles', async () => {
    const token = await createAccessToken({
        userId: randomUUID(),
        roles: ['student', 'student', 'admin'],
    });

    const claims = await verifyAccessToken(token);

    assert.deepEqual(
        claims.roles,
        ['student', 'admin'],
    );
});

test('verifyAccessToken rejects a modified token', async () => {
    const token = await createAccessToken({
        userId: randomUUID(),
        roles: ['student'],
    });

    const parts = token.split('.');
    const payload = parts[1];

    parts[1] = `${payload.slice(0, -1)
        }${payload.endsWith('a') ? 'b' : 'a'}`;

    const modifiedToken = parts.join('.');

    await assert.rejects(
        () => verifyAccessToken(modifiedToken),
    );
});

test('verifyAccessToken rejects malformed tokens', async () => {
    await assert.rejects(
        () => verifyAccessToken('not-a-valid-token'),
    );

    await assert.rejects(
        () => verifyAccessToken(''),
        /must be a non-empty string/,
    );
});

test('createAccessToken validates its input', async () => {
    await assert.rejects(
        () => createAccessToken({
            userId: '',
            roles: ['student'],
        }),
        /User ID must be a non-empty string/,
    );

    await assert.rejects(
        () => createAccessToken({
            userId: randomUUID(),
            roles: 'student',
        }),
        /Roles must be an array/,
    );

    await assert.rejects(
        () => createAccessToken({
            userId: randomUUID(),
            roles: [''],
        }),
        /Every role must be a non-empty string/,
    );
});
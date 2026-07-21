import assert from 'node:assert/strict';
import test from 'node:test';

import {
    hashPassword,
    verifyPassword,
} from '../services/password.service.js';

test('hashPassword creates a secure hash', async () => {
    const password = 'Learn2Code-2026!';
    const passwordHash = await hashPassword(password);

    assert.notEqual(passwordHash, password);
    assert.ok(passwordHash.length > 50);
    assert.equal(
        await verifyPassword(password, passwordHash),
        true,
    );
});

test('verifyPassword rejects an incorrect password', async () => {
    const passwordHash = await hashPassword('Learn2Code-2026!');

    assert.equal(
        await verifyPassword('Incorrect-Password!', passwordHash),
        false,
    );
});

test('hashPassword generates a different salt each time', async () => {
    const password = 'Learn2Code-2026!';

    const firstHash = await hashPassword(password);
    const secondHash = await hashPassword(password);

    assert.notEqual(firstHash, secondHash);
});

test('hashPassword rejects short passwords', async () => {
    await assert.rejects(
        () => hashPassword('short'),
        /at least 8 characters/,
    );
});

test('hashPassword rejects passwords over 72 UTF-8 bytes', async () => {
    await assert.rejects(
        () => hashPassword('a'.repeat(73)),
        /cannot exceed 72 UTF-8 bytes/,
    );
});

test('verifyPassword safely rejects invalid values', async () => {
    assert.equal(
        await verifyPassword(null, 'invalid-hash'),
        false,
    );

    assert.equal(
        await verifyPassword('Learn2Code-2026!', 'invalid-hash'),
        false,
    );
});
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    loginBodySchema,
    parseLoginBody,
} from '../validators/login.validator.js';

const validBody = Object.freeze({
    email: 'student@example.test',
    password: 'Learn2Code-2026!',
});

test('parseLoginBody validates and normalizes input', () => {
    const result = parseLoginBody({
        email: '  STUDENT@EXAMPLE.TEST  ',
        password: validBody.password,
    });

    assert.deepEqual(result, validBody);
});

test('login validation rejects invalid email', () => {
    const result = loginBodySchema.safeParse({
        ...validBody,
        email: 'invalid-email',
    });

    assert.equal(result.success, false);
});

test('login validation rejects empty password', () => {
    const result = loginBodySchema.safeParse({
        ...validBody,
        password: '',
    });

    assert.equal(result.success, false);
});

test('login validation rejects password over 72 bytes', () => {
    const result = loginBodySchema.safeParse({
        ...validBody,
        password: 'á'.repeat(40),
    });

    assert.equal(result.success, false);
});

test('login validation rejects unknown fields', () => {
    const result = loginBodySchema.safeParse({
        ...validBody,
        role: 'admin',
    });

    assert.equal(result.success, false);
});
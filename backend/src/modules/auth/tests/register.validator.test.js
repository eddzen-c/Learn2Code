import assert from 'node:assert/strict';
import test from 'node:test';

import {
    parseRegisterBody,
    registerBodySchema,
} from '../validators/register.validator.js';

const validBody = Object.freeze({
    fullName: 'Learn2Code Student',
    email: 'student@example.test',
    password: 'Learn2Code-2026!',
});

test('parseRegisterBody validates and normalizes input', () => {
    const result = parseRegisterBody({
        fullName: '  Learn2Code Student  ',
        email: '  STUDENT@EXAMPLE.TEST  ',
        password: validBody.password,
    });

    assert.deepEqual(result, validBody);
});

test('register validation rejects invalid names', () => {
    const result = registerBodySchema.safeParse({
        ...validBody,
        fullName: ' ',
    });

    assert.equal(result.success, false);

    assert.ok(
        result.error.issues.some(
            ({ path }) => path[0] === 'fullName',
        ),
    );
});

test('register validation rejects invalid emails', () => {
    const result = registerBodySchema.safeParse({
        ...validBody,
        email: 'invalid-email',
    });

    assert.equal(result.success, false);

    assert.ok(
        result.error.issues.some(
            ({ path }) => path[0] === 'email',
        ),
    );
});

test('register validation rejects short passwords', () => {
    const result = registerBodySchema.safeParse({
        ...validBody,
        password: 'short',
    });

    assert.equal(result.success, false);

    assert.ok(
        result.error.issues.some(
            ({ path }) => path[0] === 'password',
        ),
    );
});

test('register validation accepts a secure password of exactly 8 characters', () => {
    const body = {
        ...validBody,
        password: 'Abc123!x',
    };

    const result = parseRegisterBody(body);

    assert.deepEqual(result, body);
});

const invalidRegistrationPasswords = [
    {
        reason: 'without an uppercase letter',
        password: 'abc123!x',
    },
    {
        reason: 'without a number',
        password: 'Abcdef!x',
    },
    {
        reason: 'without a special character',
        password: 'Abc123xy',
    },
    {
        reason: 'when whitespace replaces the special character',
        password: 'Abc123 x',
    },
];

for (const { reason, password } of invalidRegistrationPasswords) {
    test(`register validation rejects a password ${reason}`, () => {
        const result = registerBodySchema.safeParse({
            ...validBody,
            password,
        });

        assert.equal(result.success, false);

        assert.ok(
            result.error.issues.some(
                ({ path, message }) => (
                    path[0] === 'password'
                    && message.includes(
                        'una mayúscula, un número y un carácter especial',
                    )
                ),
            ),
        );
    });
}

test('register validation rejects passwords over 72 bytes', () => {
    const result = registerBodySchema.safeParse({
        ...validBody,
        password: 'á'.repeat(40),
    });

    assert.equal(result.success, false);

    assert.ok(
        result.error.issues.some(
            ({ path }) => path[0] === 'password',
        ),
    );
});

test('register validation rejects unknown fields', () => {
    const result = registerBodySchema.safeParse({
        ...validBody,
        role: 'admin',
    });

    assert.equal(result.success, false);
});
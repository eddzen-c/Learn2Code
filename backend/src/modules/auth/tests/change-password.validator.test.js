
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    parseChangePasswordBody,
} from '../validators/change-password.validator.js';

const validBody = {
    currentPassword: 'PasswordAnterior123!',
    newPassword: 'PasswordNueva456!',
    confirmPassword: 'PasswordNueva456!',
};

test('accepts a valid password change', () => {
    const result = parseChangePasswordBody(validBody);

    assert.deepEqual(result, validBody);
});

test('rejects an empty current password', () => {
    assert.throws(() => {
        parseChangePasswordBody({
            ...validBody,
            currentPassword: '',
        });
    });
});

test('accepts a new password of exactly 8 characters', () => {
    const body = {
        ...validBody,
        newPassword: 'Abc123!x',
        confirmPassword: 'Abc123!x',
    };

    const result = parseChangePasswordBody(body);

    assert.deepEqual(result, body);
});

test('rejects a new password shorter than 8 characters', () => {
    assert.throws(() => {
        parseChangePasswordBody({
            ...validBody,
            newPassword: 'Ab12!xy',
            confirmPassword: 'Ab12!xy',
        });
    });
});

const invalidPasswordCases = [
    {
        reason: 'without an uppercase letter',
        newPassword: 'abc123!x',
    },
    {
        reason: 'without a number',
        newPassword: 'Abcdef!x',
    },
    {
        reason: 'without a special character',
        newPassword: 'Abc123xy',
    },
    {
        reason: 'when whitespace is used as a special character',
        newPassword: 'Abc123 x',
    },
];

for (const { reason, newPassword } of invalidPasswordCases) {
    test(`rejects a new password ${reason}`, () => {
        assert.throws(
            () => {
                parseChangePasswordBody({
                    ...validBody,
                    newPassword,
                    confirmPassword: newPassword,
                });
            },
            /una mayúscula, un número y un carácter especial/,
        );
    });
}

test('rejects mismatched password confirmation', () => {
    assert.throws(() => {
        parseChangePasswordBody({
            ...validBody,
            confirmPassword: 'OtraPassword456!',
        });
    });
});

test('rejects reusing the current password', () => {
    assert.throws(() => {
        parseChangePasswordBody({
            ...validBody,
            newPassword: validBody.currentPassword,
            confirmPassword: validBody.currentPassword,
        });
    });
});

test('rejects passwords exceeding bcrypt byte limit', () => {
    assert.throws(() => {
        parseChangePasswordBody({
            ...validBody,
            newPassword: 'ñ'.repeat(40),
            confirmPassword: 'ñ'.repeat(40),
        });
    });
});

test('rejects unexpected request fields', () => {
    assert.throws(() => {
        parseChangePasswordBody({
            ...validBody,
            userId: 'another-user',
        });
    });
});
test('rejects a password containing only spaces', () => {
    assert.throws(() => {
        parseChangePasswordBody({
            ...validBody,
            newPassword: ' '.repeat(12),
            confirmPassword: ' '.repeat(12),
        });
    });
});
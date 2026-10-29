
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

test('rejects a new password shorter than 12 characters', () => {
    assert.throws(() => {
        parseChangePasswordBody({
            ...validBody,
            newPassword: 'Short123!',
            confirmPassword: 'Short123!',
        });
    });
});

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
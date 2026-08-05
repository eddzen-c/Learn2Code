import assert from 'node:assert/strict';
import test from 'node:test';

import {
    parseConfirmEmailVerificationBody,
    parseRequestPasswordResetBody,
    parseResetPasswordBody,
} from '../validators/account-recovery.validator.js';

test(
    'parseRequestPasswordResetBody normalizes a valid email',
    () => {
        const result =
            parseRequestPasswordResetBody({
                email:
                    '  STUDENT@EXAMPLE.COM  ',
            });

        assert.deepEqual(
            result,
            {
                email:
                    'student@example.com',
            },
        );
    },
);

test(
    'parseRequestPasswordResetBody rejects an invalid email',
    () => {
        assert.throws(
            () => (
                parseRequestPasswordResetBody({
                    email:
                        'invalid-email',
                })
            ),
            {
                name: 'ZodError',
            },
        );
    },
);

test(
    'parseRequestPasswordResetBody rejects unknown fields',
    () => {
        assert.throws(
            () => (
                parseRequestPasswordResetBody({
                    email:
                        'student@example.com',
                    unexpected:
                        true,
                })
            ),
            {
                name: 'ZodError',
            },
        );
    },
);

test(
    'parseConfirmEmailVerificationBody accepts a valid token',
    () => {
        const result =
            parseConfirmEmailVerificationBody({
                token:
                    'valid_email_token-123',
            });

        assert.deepEqual(
            result,
            {
                token:
                    'valid_email_token-123',
            },
        );
    },
);

test(
    'parseConfirmEmailVerificationBody rejects an invalid token',
    () => {
        assert.throws(
            () => (
                parseConfirmEmailVerificationBody({
                    token:
                        'invalid token!',
                })
            ),
            {
                name: 'ZodError',
            },
        );
    },
);

test(
    'parseResetPasswordBody accepts valid reset data',
    () => {
        const result =
            parseResetPasswordBody({
                token:
                    'valid_reset_token-123',
                newPassword:
                    'NewPassword123!',
            });

        assert.deepEqual(
            result,
            {
                token:
                    'valid_reset_token-123',
                newPassword:
                    'NewPassword123!',
            },
        );
    },
);

test(
    'parseResetPasswordBody rejects a short password',
    () => {
        assert.throws(
            () => (
                parseResetPasswordBody({
                    token:
                        'valid_reset_token-123',
                    newPassword:
                        'short',
                })
            ),
            {
                name: 'ZodError',
            },
        );
    },
);

test(
    'parseResetPasswordBody rejects a password over 72 UTF-8 bytes',
    () => {
        assert.throws(
            () => (
                parseResetPasswordBody({
                    token:
                        'valid_reset_token-123',
                    newPassword:
                        'a'.repeat(73),
                })
            ),
            {
                name: 'ZodError',
            },
        );
    },
);
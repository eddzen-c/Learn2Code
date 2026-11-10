import assert from 'node:assert/strict';
import test from 'node:test';

import {
    parseConfirmEmailVerificationBody,
    parseRequestPasswordResetBody,
    parseResetPasswordBody,
    parseConfirmEmailVerificationCodeBody,
    parseRequestEmailChangeBody,
    parseConfirmEmailChangeBody,
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
    'parseResetPasswordBody accepts a secure password of exactly 8 characters',
    () => {
        const body = {
            token: 'valid_reset_token-123',
            newPassword: 'Abc123!x',
        };

        const result = parseResetPasswordBody(body);

        assert.deepEqual(result, body);
    },
);

test(
    'parseResetPasswordBody rejects a password shorter than 8 characters',
    () => {
        assert.throws(
            () => {
                parseResetPasswordBody({
                    token: 'valid_reset_token-123',
                    newPassword: 'Ab12!xy',
                });
            },
            /al menos 8 caracteres/,
        );
    },
);

const invalidResetPasswords = [
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

for (const { reason, password } of invalidResetPasswords) {
    test(
        `parseResetPasswordBody rejects a password ${reason}`,
        () => {
            assert.throws(
                () => {
                    parseResetPasswordBody({
                        token: 'valid_reset_token-123',
                        newPassword: password,
                    });
                },
                /una mayúscula, un número y un carácter especial/,
            );
        },
    );
}

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


test('accepts a valid six-digit email verification code', () => {
    const result =
        parseConfirmEmailVerificationCodeBody({
            code: '000042',
        });

    assert.deepEqual(result, {
        code: '000042',
    });
});

test('rejects an email verification code with invalid length', () => {
    assert.throws(
        () => (
            parseConfirmEmailVerificationCodeBody({
                code: '12345',
            })
        ),
        {
            name: 'ZodError',
        },
    );
});

test('rejects unexpected fields in email verification', () => {
    assert.throws(
        () => (
            parseConfirmEmailVerificationCodeBody({
                code: '123456',
                userId: 'another-user',
            })
        ),
        {
            name: 'ZodError',
        },
    );
});

// ============================================================
// VALIDADORES DE CAMBIO DE CORREO
// ============================================================

test('accepts and normalizes an email change request', () => {
    const result = parseRequestEmailChangeBody({
        newEmail: '  NUEVO@EXAMPLE.COM  ',
        currentPassword: 'Actual123!',
    });

    assert.deepEqual(result, {
        newEmail: 'nuevo@example.com',
        currentPassword: 'Actual123!',
    });
});

test('preserves the current password without trimming it', () => {
    const result = parseRequestEmailChangeBody({
        newEmail: 'nuevo@example.com',
        currentPassword: ' Actual123! ',
    });

    assert.equal(
        result.currentPassword,
        ' Actual123! ',
    );
});

test('rejects an invalid new email', () => {
    assert.throws(
        () => parseRequestEmailChangeBody({
            newEmail: 'correo-invalido',
            currentPassword: 'Actual123!',
        }),
        {
            name: 'ZodError',
        },
    );
});

test('rejects a new email longer than 254 characters', () => {
    assert.throws(
        () => parseRequestEmailChangeBody({
            newEmail: `${'a'.repeat(245)}@example.com`,
            currentPassword: 'Actual123!',
        }),
        {
            name: 'ZodError',
        },
    );
});

test('requires the current password for email changes', () => {
    const invalidRequests = [
        {
            newEmail: 'nuevo@example.com',
        },
        {
            newEmail: 'nuevo@example.com',
            currentPassword: '',
        },
    ];

    for (const body of invalidRequests) {
        assert.throws(
            () => parseRequestEmailChangeBody(body),
            {
                name: 'ZodError',
            },
        );
    }
});

test('rejects current passwords exceeding 72 UTF-8 bytes', () => {
    assert.throws(
        () => parseRequestEmailChangeBody({
            newEmail: 'nuevo@example.com',
            currentPassword: 'ñ'.repeat(37),
        }),
        {
            name: 'ZodError',
        },
    );
});

test('rejects unexpected fields in email change requests', () => {
    assert.throws(
        () => parseRequestEmailChangeBody({
            newEmail: 'nuevo@example.com',
            currentPassword: 'Actual123!',
            userId: 'another-user',
        }),
        {
            name: 'ZodError',
        },
    );
});

test('accepts a valid six-digit email change confirmation code', () => {
    const result = parseConfirmEmailChangeBody({
        code: '000042',
    });

    assert.deepEqual(result, {
        code: '000042',
    });
});

test('rejects malformed email change confirmation codes', () => {
    const invalidCodes = [
        '',
        '12345',
        '1234567',
        'abcdef',
        ' 123456',
    ];

    for (const code of invalidCodes) {
        assert.throws(
            () => parseConfirmEmailChangeBody({
                code,
            }),
            {
                name: 'ZodError',
            },
        );
    }
});

test('rejects unexpected fields in email change confirmation', () => {
    assert.throws(
        () => parseConfirmEmailChangeBody({
            code: '123456',
            userId: 'another-user',
        }),
        {
            name: 'ZodError',
        },
    );
});
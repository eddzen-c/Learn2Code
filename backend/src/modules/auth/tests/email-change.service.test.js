import assert from 'node:assert/strict';
import test from 'node:test';

import {
    hashEmailChangeCode,
    requestCurrentUserEmailChange,
    confirmCurrentUserEmailChange,
} from '../services/email-change.service.js';

import {
    hashEmailVerificationCode,
} from '../services/email-verification-code.service.js';

const USER_ID =
    '00000000-0000-4000-8000-000000000001';

const SECRET = 's'.repeat(32);

const NOW =
    new Date('2026-11-07T12:00:00.000Z');

const EXPIRES_AT =
    new Date('2026-11-07T12:10:00.000Z');

const CODE = '123456';

const CURRENT_USER = {
    id: USER_ID,
    email: 'actual@example.com',
    passwordHash: 'stored-password-hash',
    emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    isActive: true,
    deletedAt: null,
};

// ============================================================
// PREPARAR DEPENDENCIAS SIMULADAS
// ============================================================

const createScenario = (overrides = {}) => {
    const calls = {
        passwordChecks: [],
        emailLookups: [],
        savedRequests: [],
        sentMessages: [],
        invalidations: [],
    };

    const options = {
        userId: USER_ID,
        newEmail: ' NUEVO@Example.COM ',
        currentPassword: 'Actual123!',
        now: NOW,

        findUser: async () => CURRENT_USER,

        findEmailOwner: async (input) => {
            calls.emailLookups.push(input);
            return null;
        },

        verifyCurrentPassword: async (...args) => {
            calls.passwordChecks.push(args);
            return true;
        },

        getSecret: () => SECRET,

        createCode: () => ({
            code: CODE,
            expiresAt: EXPIRES_AT,
        }),

        saveRequest: async (input) => {
            calls.savedRequests.push(input);

            return {
                userId: input.userId,
                newEmail: input.newEmail,
                expiresAt: input.expiresAt,
            };
        },

        sendMessage: async (input) => {
            calls.sentMessages.push(input);

            return {
                provider: 'mock',
                accepted: true,
                simulated: true,
            };
        },

        markDeliveryFailed: async (input) => {
            calls.invalidations.push(input);
            return true;
        },
    };

    return {
        calls,
        options: {
            ...options,
            ...overrides,
        },
    };
};

// ============================================================
// 1. HASH VINCULADO AL USUARIO Y AL CORREO
// ============================================================

test('email change hash is bound to the user and new email', () => {
    const input = {
        userId: USER_ID,
        newEmail: 'nuevo@example.com',
        code: CODE,
        secret: SECRET,
    };

    const hash = hashEmailChangeCode(input);

    assert.match(hash, /^[0-9a-f]{64}$/);

    assert.equal(
        hash,
        hashEmailChangeCode(input),
    );

    assert.notEqual(
        hash,
        hashEmailChangeCode({
            ...input,
            newEmail: 'otro@example.com',
        }),
    );

    assert.notEqual(
        hash,
        hashEmailChangeCode({
            ...input,
            userId: 'otro-usuario',
        }),
    );

    assert.notEqual(
        hash,
        hashEmailVerificationCode({
            userId: USER_ID,
            code: CODE,
            secret: SECRET,
        }),
    );
});

// ============================================================
// 2. RECHAZAR PARAMETROS INVALIDOS DEL HASH
// ============================================================

test('email change hash rejects invalid parameters', () => {
    const validInput = {
        userId: USER_ID,
        newEmail: 'nuevo@example.com',
        code: CODE,
        secret: SECRET,
    };

    const invalidInputs = [
        { userId: '' },
        { newEmail: '' },
        { code: '12345' },
        { code: 'abcdef' },
        { secret: 'short' },
    ];

    for (const invalidInput of invalidInputs) {
        assert.throws(
            () => hashEmailChangeCode({
                ...validInput,
                ...invalidInput,
            }),
            {
                name: 'TypeError',
                message: 'Invalid email change code parameters',
            },
        );
    }
});

// ============================================================
// 3. SOLICITUD EXITOSA
// ============================================================

test('requests an email change without updating the current email', async () => {
    const { calls, options } = createScenario();

    const result =
        await requestCurrentUserEmailChange(options);

    assert.equal(result.requested, true);
    assert.equal(result.newEmail, 'nuevo@example.com');
    assert.equal(result.expiresAt, EXPIRES_AT);

    assert.deepEqual(result.delivery, {
        provider: 'mock',
        accepted: true,
        simulated: true,
    });

    assert.deepEqual(calls.passwordChecks, [
        ['Actual123!', 'stored-password-hash'],
    ]);

    assert.deepEqual(calls.emailLookups, [
        {
            email: 'nuevo@example.com',
        },
    ]);

    assert.equal(calls.savedRequests.length, 1);

    assert.deepEqual(calls.savedRequests[0], {
        userId: USER_ID,
        newEmail: 'nuevo@example.com',
        codeHash: hashEmailChangeCode({
            userId: USER_ID,
            newEmail: 'nuevo@example.com',
            code: CODE,
            secret: SECRET,
        }),
        createdAt: NOW,
        expiresAt: EXPIRES_AT,
    });

    assert.deepEqual(calls.sentMessages, [
        {
            recipientEmail: 'nuevo@example.com',
            code: CODE,
            expiresAt: EXPIRES_AT,
        },
    ]);

    assert.equal(calls.invalidations.length, 0);
    assert.equal(CURRENT_USER.email, 'actual@example.com');
    assert.equal(Object.isFrozen(result), true);
});

// ============================================================
// 4. RECHAZAR DIRECCION INVALIDA
// ============================================================

test('rejects an invalid new email before database access', async () => {
    let userQueried = false;

    const { options } = createScenario({
        newEmail: 'correo-invalido',

        findUser: async () => {
            userQueried = true;
            return CURRENT_USER;
        },
    });

    await assert.rejects(
        requestCurrentUserEmailChange(options),
        {
            code: 'INVALID_NEW_EMAIL',
            statusCode: 400,
        },
    );

    assert.equal(userQueried, false);
});

// ============================================================
// 5. RECHAZAR CUENTAS INACTIVAS
// ============================================================

test('rejects an inactive account', async () => {
    const { calls, options } = createScenario({
        findUser: async () => ({
            ...CURRENT_USER,
            isActive: false,
        }),
    });

    await assert.rejects(
        requestCurrentUserEmailChange(options),
        {
            name: 'AuthenticationRequiredError',
        },
    );

    assert.equal(calls.savedRequests.length, 0);
    assert.equal(calls.sentMessages.length, 0);
});

// ============================================================
// 6. RECHAZAR CORREO ACTUAL SIN VERIFICAR
// ============================================================

test('requires the current email to be verified', async () => {
    const { calls, options } = createScenario({
        findUser: async () => ({
            ...CURRENT_USER,
            emailVerifiedAt: null,
        }),
    });

    await assert.rejects(
        requestCurrentUserEmailChange(options),
        {
            code: 'EMAIL_CHANGE_UNAVAILABLE',
            statusCode: 403,
        },
    );

    assert.equal(calls.savedRequests.length, 0);
    assert.equal(calls.sentMessages.length, 0);
});

// ============================================================
// 7. RECHAZAR CONTRASEÑA ACTUAL INCORRECTA
// ============================================================

test('rejects an incorrect current password', async () => {
    const { calls, options } = createScenario({
        verifyCurrentPassword: async () => false,
    });

    await assert.rejects(
        requestCurrentUserEmailChange(options),
        {
            code: 'INVALID_CURRENT_PASSWORD',
        },
    );

    assert.equal(calls.emailLookups.length, 0);
    assert.equal(calls.savedRequests.length, 0);
    assert.equal(calls.sentMessages.length, 0);
});

// ============================================================
// 8. RECHAZAR EL MISMO CORREO
// ============================================================

test('rejects changing to the current email', async () => {
    const { calls, options } = createScenario({
        newEmail: 'Actual@Example.Com',
    });

    await assert.rejects(
        requestCurrentUserEmailChange(options),
        {
            code: 'EMAIL_CHANGE_SAME_ADDRESS',
            statusCode: 400,
        },
    );

    assert.equal(calls.emailLookups.length, 0);
    assert.equal(calls.savedRequests.length, 0);
});

// ============================================================
// 9. RECHAZAR UN CORREO REGISTRADO
// ============================================================

test('rejects an email already registered by another user', async () => {
    const { calls, options } = createScenario({
        findEmailOwner: async () => ({
            id: 'another-user',
        }),
    });

    await assert.rejects(
        requestCurrentUserEmailChange(options),
        {
            code: 'EMAIL_ALREADY_IN_USE',
            statusCode: 409,
        },
    );

    assert.equal(calls.savedRequests.length, 0);
    assert.equal(calls.sentMessages.length, 0);
});

// ============================================================
// 10. RESPETAR TIEMPO ENTRE SOLICITUDES
// ============================================================

test('respects the email change request cooldown', async () => {
    const { calls, options } = createScenario({
        saveRequest: async () => null,
    });

    await assert.rejects(
        requestCurrentUserEmailChange(options),
        {
            code: 'EMAIL_CHANGE_COOLDOWN',
            statusCode: 429,
        },
    );

    assert.equal(calls.sentMessages.length, 0);
    assert.equal(calls.invalidations.length, 0);
});

// ============================================================
// 11. INVALIDAR SI FALLA EL PROVEEDOR DE CORREO
// ============================================================

test('invalidates the pending code when email delivery fails', async () => {
    const deliveryError =
        new Error('Email delivery failed');

    const { calls, options } = createScenario({
        sendMessage: async () => {
            throw deliveryError;
        },
    });

    await assert.rejects(
        requestCurrentUserEmailChange(options),
        (error) => error === deliveryError,
    );

    assert.equal(calls.savedRequests.length, 1);
    assert.equal(calls.invalidations.length, 1);

    assert.deepEqual(calls.invalidations[0], {
        userId: USER_ID,
        codeHash: calls.savedRequests[0].codeHash,
        createdAt: NOW,
        failedAt: calls.invalidations[0].failedAt,
    });

    assert.ok(
        calls.invalidations[0].failedAt instanceof Date,
    );
});

// ============================================================
// 12. NO ACEPTAR UNA ENTREGA RECHAZADA
// ============================================================

test('does not report success when the provider rejects delivery', async () => {
    const { calls, options } = createScenario({
        sendMessage: async () => ({
            provider: 'mock',
            accepted: false,
            simulated: true,
        }),
    });

    await assert.rejects(
        requestCurrentUserEmailChange(options),
        {
            code: 'AUTH_EMAIL_DELIVERY_FAILED',
        },
    );

    assert.equal(calls.savedRequests.length, 1);
    assert.equal(calls.invalidations.length, 1);
});

// ============================================================
// PRUEBAS DE CONFIRMACION DEL CAMBIO DE CORREO
// ============================================================

// 1. CONFIRMACION EXITOSA Y HASH VINCULADO AL NUEVO CORREO

test('confirms email change using a hash bound to the pending address', async () => {
    const confirmationCalls = [];

    const result = await confirmCurrentUserEmailChange({
        userId: USER_ID,
        code: CODE,
        now: NOW,
        getSecret: () => SECRET,

        confirmRequest: async (input) => {
            confirmationCalls.push(input);

            const computedHash = input.hashCode({
                userId: USER_ID,
                newEmail: 'nuevo@example.com',
                code: CODE,
            });

            assert.equal(
                computedHash,
                hashEmailChangeCode({
                    userId: USER_ID,
                    newEmail: 'nuevo@example.com',
                    code: CODE,
                    secret: SECRET,
                }),
            );

            assert.notEqual(
                computedHash,
                input.hashCode({
                    userId: USER_ID,
                    newEmail: 'otro@example.com',
                    code: CODE,
                }),
            );

            return {
                changed: true,
                user: {
                    id: USER_ID,
                    email: 'nuevo@example.com',
                    emailVerifiedAt: NOW,
                },
            };
        },
    });

    assert.equal(confirmationCalls.length, 1);
    assert.equal(confirmationCalls[0].userId, USER_ID);
    assert.equal(confirmationCalls[0].code, CODE);
    assert.equal(confirmationCalls[0].confirmedAt, NOW);

    assert.deepEqual(result, {
        changed: true,
        user: {
            id: USER_ID,
            email: 'nuevo@example.com',
            emailVerifiedAt: NOW,
        },
    });

    assert.equal(Object.isFrozen(result), true);
    assert.equal(Object.isFrozen(result.user), true);
});

// 2. RECHAZAR CODIGOS CON FORMATO INVALIDO

test('rejects malformed confirmation codes before checking the secret', async () => {
    let secretCalls = 0;
    let confirmationCalls = 0;

    const invalidCodes = [
        '',
        '12345',
        'abcdef',
        ' 123456',
        null,
    ];

    for (const code of invalidCodes) {
        await assert.rejects(
            confirmCurrentUserEmailChange({
                userId: USER_ID,
                code,
                now: NOW,

                getSecret: () => {
                    secretCalls += 1;
                    return SECRET;
                },

                confirmRequest: async () => {
                    confirmationCalls += 1;
                    return null;
                },
            }),
            {
                code: 'INVALID_EMAIL_CHANGE_CODE',
                statusCode: 400,
            },
        );
    }

    assert.equal(secretCalls, 0);
    assert.equal(confirmationCalls, 0);
});

// 3. RECHAZAR SOLICITUD INEXISTENTE O NO DISPONIBLE

test('rejects confirmation when no pending request is available', async () => {
    await assert.rejects(
        confirmCurrentUserEmailChange({
            userId: USER_ID,
            code: CODE,
            now: NOW,
            getSecret: () => SECRET,
            confirmRequest: async () => null,
        }),
        {
            code: 'INVALID_EMAIL_CHANGE_CODE',
            statusCode: 400,
        },
    );
});

// 4. RECHAZAR CONFIRMACION NO COMPLETADA

test('rejects confirmation when the repository reports no change', async () => {
    await assert.rejects(
        confirmCurrentUserEmailChange({
            userId: USER_ID,
            code: CODE,
            now: NOW,
            getSecret: () => SECRET,

            confirmRequest: async () => ({
                changed: false,
            }),
        }),
        {
            code: 'INVALID_EMAIL_CHANGE_CODE',
            statusCode: 400,
        },
    );
});

// 5. TRADUCIR CONFLICTO DE CORREO DUPLICADO

test('translates a duplicate users email constraint into a conflict', async () => {
    const duplicateError = new Error('Duplicate email');

    duplicateError.code = '23505';
    duplicateError.constraint = 'users_email_key';

    await assert.rejects(
        confirmCurrentUserEmailChange({
            userId: USER_ID,
            code: CODE,
            now: NOW,
            getSecret: () => SECRET,

            confirmRequest: async () => {
                throw duplicateError;
            },
        }),
        {
            name: 'EmailChangeRequestError',
            code: 'EMAIL_ALREADY_IN_USE',
            statusCode: 409,
        },
    );
});

// 6. CONFLICTO SIN NOMBRE DE RESTRICCION

test('handles a duplicate email error without constraint metadata', async () => {
    const duplicateError = new Error('Duplicate email');

    duplicateError.code = '23505';

    await assert.rejects(
        confirmCurrentUserEmailChange({
            userId: USER_ID,
            code: CODE,
            now: NOW,
            getSecret: () => SECRET,

            confirmRequest: async () => {
                throw duplicateError;
            },
        }),
        {
            code: 'EMAIL_ALREADY_IN_USE',
            statusCode: 409,
        },
    );
});

// 7. NO OCULTAR CONFLICTOS DE OTRAS RESTRICCIONES

test('preserves unrelated database unique constraint errors', async () => {
    const databaseError = new Error(
        'Another unique constraint failed',
    );

    databaseError.code = '23505';
    databaseError.constraint = 'other_unique_constraint';

    await assert.rejects(
        confirmCurrentUserEmailChange({
            userId: USER_ID,
            code: CODE,
            now: NOW,
            getSecret: () => SECRET,

            confirmRequest: async () => {
                throw databaseError;
            },
        }),
        (error) => error === databaseError,
    );
});

// 8. CONSERVAR ERRORES INESPERADOS DEL REPOSITORIO

test('preserves unexpected confirmation repository errors', async () => {
    const databaseError = new Error(
        'Database connection failed',
    );

    await assert.rejects(
        confirmCurrentUserEmailChange({
            userId: USER_ID,
            code: CODE,
            now: NOW,
            getSecret: () => SECRET,

            confirmRequest: async () => {
                throw databaseError;
            },
        }),
        (error) => error === databaseError,
    );
});

// 9. NO CONSULTAR POSTGRESQL SI FALLA EL SECRETO

test('does not confirm the email when the verification secret is unavailable', async () => {
    const secretError = new Error(
        'Verification secret unavailable',
    );

    let confirmationCalls = 0;

    await assert.rejects(
        confirmCurrentUserEmailChange({
            userId: USER_ID,
            code: CODE,
            now: NOW,

            getSecret: () => {
                throw secretError;
            },

            confirmRequest: async () => {
                confirmationCalls += 1;
                return null;
            },
        }),
        (error) => error === secretError,
    );

    assert.equal(confirmationCalls, 0);
});
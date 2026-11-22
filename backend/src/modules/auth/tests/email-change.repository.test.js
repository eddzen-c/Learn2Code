import assert from 'node:assert/strict';
import test from 'node:test';

import {
    saveEmailChangeRequest,
    markEmailChangeDeliveryFailed,
    confirmEmailChangeRequest,
} from '../repositories/email-change.repository.js';

const USER_ID =
    '00000000-0000-4000-8000-000000000001';

const CODE_HASH = 'a'.repeat(64);

const CREATED_AT =
    new Date('2026-11-07T12:00:00.000Z');

const EXPIRES_AT =
    new Date('2026-11-07T12:10:00.000Z');

// ============================================================
// GUARDAR UNA SOLICITUD
// ============================================================

test('saveEmailChangeRequest stores the pending email and code hash', async () => {
    const queries = [];

    const client = {
        async query(query) {
            queries.push(query);

            return {
                rows: [{
                    user_id: USER_ID,
                    new_email: 'nuevo@example.com',
                    created_at: CREATED_AT,
                    expires_at: EXPIRES_AT,
                }],
            };
        },
    };

    const result = await saveEmailChangeRequest({
        userId: USER_ID,
        newEmail: 'nuevo@example.com',
        codeHash: CODE_HASH,
        createdAt: CREATED_AT,
        expiresAt: EXPIRES_AT,
        client,
    });

    assert.equal(queries.length, 1);

    assert.match(
        queries[0].text,
        /INSERT INTO email_change_requests/,
    );

    assert.deepEqual(queries[0].values, [
        USER_ID,
        'nuevo@example.com',
        CODE_HASH,
        CREATED_AT,
        EXPIRES_AT,
    ]);

    assert.deepEqual(result, {
        userId: USER_ID,
        newEmail: 'nuevo@example.com',
        createdAt: CREATED_AT,
        expiresAt: EXPIRES_AT,
    });

    assert.equal(Object.isFrozen(result), true);
});

// ============================================================
// CONTROL DE REENVIO
// ============================================================

test('saveEmailChangeRequest enforces resend cooldown in SQL', async () => {
    const client = {
        async query(query) {
            assert.match(
                query.text,
                /ON CONFLICT \(user_id\)/,
            );

            assert.match(
                query.text,
                /INTERVAL '60 seconds'/,
            );

            assert.match(
                query.text,
                /INTERVAL '10 seconds'/,
            );

            return {
                rows: [],
            };
        },
    };

    const result = await saveEmailChangeRequest({
        userId: USER_ID,
        newEmail: 'nuevo@example.com',
        codeHash: CODE_HASH,
        createdAt: CREATED_AT,
        expiresAt: EXPIRES_AT,
        client,
    });

    assert.equal(result, null);
});

// ============================================================
// SUSTITUCION CONTROLADA DE SOLICITUDES
// ============================================================

test('saveEmailChangeRequest replaces the pending request fields', async () => {
    const client = {
        async query(query) {
            assert.match(
                query.text,
                /new_email = EXCLUDED\.new_email/,
            );

            assert.match(
                query.text,
                /code_hash = EXCLUDED\.code_hash/,
            );

            assert.match(
                query.text,
                /used_at = NULL/,
            );

            assert.match(
                query.text,
                /failed_attempts = 0/,
            );

            return {
                rows: [{
                    user_id: USER_ID,
                    new_email: 'otro@example.com',
                    created_at: CREATED_AT,
                    expires_at: EXPIRES_AT,
                }],
            };
        },
    };

    const result = await saveEmailChangeRequest({
        userId: USER_ID,
        newEmail: 'otro@example.com',
        codeHash: CODE_HASH,
        createdAt: CREATED_AT,
        expiresAt: EXPIRES_AT,
        client,
    });

    assert.equal(result.newEmail, 'otro@example.com');
});

// ============================================================
// INVALIDAR SI FALLA EL ENVIO
// ============================================================

test('markEmailChangeDeliveryFailed invalidates the matching request', async () => {
    const queries = [];

    const failedAt =
        new Date('2026-11-07T12:01:00.000Z');

    const client = {
        async query(query) {
            queries.push(query);

            return {
                rows: [{
                    user_id: USER_ID,
                }],
            };
        },
    };

    const result = await markEmailChangeDeliveryFailed({
        userId: USER_ID,
        codeHash: CODE_HASH,
        createdAt: CREATED_AT,
        failedAt,
        client,
    });

    assert.equal(result, true);

    assert.equal(queries.length, 1);

    assert.match(
        queries[0].text,
        /UPDATE email_change_requests/,
    );

    assert.match(
        queries[0].text,
        /used_at = GREATEST/,
    );

    assert.match(
        queries[0].text,
        /AND code_hash = \$2/,
    );

    assert.match(
        queries[0].text,
        /AND created_at = \$3/,
    );

    assert.match(
        queries[0].text,
        /AND used_at IS NULL/,
    );

    assert.deepEqual(queries[0].values, [
        USER_ID,
        CODE_HASH,
        CREATED_AT,
        failedAt,
    ]);
});

// ============================================================
// EVITAR INVALIDAR OTRA SOLICITUD
// ============================================================

test('markEmailChangeDeliveryFailed returns false when no request matches', async () => {
    const client = {
        async query() {
            return {
                rows: [],
            };
        },
    };

    const result = await markEmailChangeDeliveryFailed({
        userId: USER_ID,
        codeHash: CODE_HASH,
        createdAt: CREATED_AT,
        client,
    });

    assert.equal(result, false);
});

// ============================================================
// VALIDACION DE IDENTIFICADOR
// ============================================================

test('markEmailChangeDeliveryFailed rejects an invalid user ID', async () => {
    const client = {
        async query() {
            throw new Error(
                'Database must not be called',
            );
        },
    };

    await assert.rejects(
        markEmailChangeDeliveryFailed({
            userId: '',
            codeHash: CODE_HASH,
            createdAt: CREATED_AT,
            client,
        }),
        {
            name: 'TypeError',
            message: 'Invalid email change delivery parameters',
        },
    );
});

// ============================================================
// VALIDACION DE HASH Y FECHAS
// ============================================================

test('markEmailChangeDeliveryFailed rejects invalid hashes and dates', async () => {
    const client = {
        async query() {
            throw new Error(
                'Database must not be called',
            );
        },
    };

    const invalidInputs = [
        {
            codeHash: 'invalid-hash',
        },
        {
            createdAt: new Date('invalid'),
        },
        {
            failedAt: new Date('invalid'),
        },
    ];

    for (const invalidInput of invalidInputs) {
        await assert.rejects(
            markEmailChangeDeliveryFailed({
                userId: USER_ID,
                codeHash: CODE_HASH,
                createdAt: CREATED_AT,
                failedAt: new Date(),
                client,
                ...invalidInput,
            }),
            {
                name: 'TypeError',
                message: 'Invalid email change delivery parameters',
            },
        );
    }
});

// ============================================================
// PRUEBAS DE CONFIRMACION DEL CAMBIO DE CORREO
// ============================================================

const CONFIRMATION_CODE = '123456';

const createConfirmationScenario = ({
    pendingOverrides = {},
    noRequest = false,
    updateError = null,
    revokeError = null,
} = {}) => {
    const queries = [];
    const revokedSessions = [];

    let released = false;

    const pendingRequest = {
        new_email: 'nuevo@example.com',
        code_hash: CODE_HASH,
        expires_at: EXPIRES_AT,
        used_at: null,
        failed_attempts: 0,
        current_email: 'actual@example.com',
        ...pendingOverrides,
    };

    const client = {
        async query(query) {
            queries.push(query);

            const sql = typeof query === 'string'
                ? query
                : query.text;

            if (
                sql.includes(
                    'FROM email_change_requests request',
                )
            ) {
                return {
                    rows: noRequest
                        ? []
                        : [pendingRequest],
                };
            }

            if (sql.includes('UPDATE users')) {
                if (updateError) {
                    throw updateError;
                }

                return {
                    rows: [{
                        id: USER_ID,
                        email: pendingRequest.new_email,
                        email_verified_at: CREATED_AT,
                    }],
                };
            }

            return {
                rows: [],
                rowCount: 1,
            };
        },

        release() {
            released = true;
        },
    };

    const pool = {
        async connect() {
            return client;
        },
    };

    const revokeSessions = async (input) => {
        revokedSessions.push(input);

        if (revokeError) {
            throw revokeError;
        }

        return 2;
    };

    return {
        client,
        queries,
        revokedSessions,

        get released() {
            return released;
        },

        args: {
            userId: USER_ID,
            code: CONFIRMATION_CODE,
            confirmedAt: CREATED_AT,
            hashCode: () => CODE_HASH,
            pool,
            revokeSessions,
        },
    };
};

const getConfirmationStatements = (scenario) => (
    scenario.queries.map((query) => (
        typeof query === 'string'
            ? query
            : query.text
    ))
);

// ============================================================
// 1. CONFIRMACION EXITOSA
// ============================================================

test('confirmEmailChangeRequest updates email and revokes sessions', async () => {
    const scenario = createConfirmationScenario();

    const result = await confirmEmailChangeRequest(
        scenario.args,
    );

    assert.equal(result.changed, true);

    assert.deepEqual(result.user, {
        id: USER_ID,
        email: 'nuevo@example.com',
        emailVerifiedAt: CREATED_AT,
    });

    const statements =
        getConfirmationStatements(scenario);

    assert.equal(statements[0], 'BEGIN');

    assert.ok(
        statements.some((sql) => (
            sql.includes('FOR UPDATE OF request, users')
        )),
    );

    assert.ok(
        statements.some((sql) => (
            sql.includes('UPDATE users')
            && sql.includes('email_verified_at = $3')
        )),
    );

    assert.ok(
        statements.some((sql) => (
            sql.includes('SET used_at = $2')
        )),
    );

    assert.equal(
        scenario.revokedSessions.length,
        1,
    );

    assert.equal(
        scenario.revokedSessions[0].userId,
        USER_ID,
    );

    assert.equal(
        scenario.revokedSessions[0].client,
        scenario.client,
    );

    assert.ok(statements.includes('COMMIT'));
    assert.ok(!statements.includes('ROLLBACK'));

    assert.equal(scenario.released, true);

    assert.equal(Object.isFrozen(result), true);
    assert.equal(Object.isFrozen(result.user), true);
});

// ============================================================
// 2. CODIGO INCORRECTO
// ============================================================

test('confirmEmailChangeRequest increments attempts for a wrong code', async () => {
    const scenario = createConfirmationScenario();

    const result = await confirmEmailChangeRequest({
        ...scenario.args,
        hashCode: () => 'b'.repeat(64),
    });

    assert.equal(result, null);

    const statements =
        getConfirmationStatements(scenario);

    assert.ok(
        statements.some((sql) => (
            sql.includes('failed_attempts + 1')
        )),
    );

    assert.ok(
        !statements.some((sql) => (
            sql.includes('UPDATE users')
        )),
    );

    assert.equal(
        scenario.revokedSessions.length,
        0,
    );

    assert.ok(statements.includes('COMMIT'));
    assert.equal(scenario.released, true);
});

// ============================================================
// 3. CODIGO CADUCADO
// ============================================================

test('confirmEmailChangeRequest rejects an expired code', async () => {
    const scenario = createConfirmationScenario({
        pendingOverrides: {
            expires_at: new Date(
                '2026-11-07T11:59:00.000Z',
            ),
        },
    });

    const result = await confirmEmailChangeRequest(
        scenario.args,
    );

    assert.equal(result, null);

    const statements =
        getConfirmationStatements(scenario);

    assert.ok(
        !statements.some((sql) => (
            sql.includes('UPDATE users')
        )),
    );

    assert.equal(
        scenario.revokedSessions.length,
        0,
    );

    assert.ok(statements.includes('COMMIT'));
    assert.equal(scenario.released, true);
});

// ============================================================
// 4. CODIGO UTILIZADO O BLOQUEADO
// ============================================================

test('confirmEmailChangeRequest rejects used and blocked codes', async () => {
    const invalidRequests = [
        {
            used_at: CREATED_AT,
        },
        {
            failed_attempts: 5,
        },
    ];

    for (const pendingOverrides of invalidRequests) {
        const scenario = createConfirmationScenario({
            pendingOverrides,
        });

        const result = await confirmEmailChangeRequest(
            scenario.args,
        );

        assert.equal(result, null);

        const statements =
            getConfirmationStatements(scenario);

        assert.ok(
            !statements.some((sql) => (
                sql.includes('UPDATE users')
            )),
        );

        assert.equal(
            scenario.revokedSessions.length,
            0,
        );

        assert.ok(statements.includes('COMMIT'));
        assert.equal(scenario.released, true);
    }
});

// ============================================================
// 5. SOLICITUD INEXISTENTE
// ============================================================

test('confirmEmailChangeRequest rejects a missing request', async () => {
    const scenario = createConfirmationScenario({
        noRequest: true,
    });

    const result = await confirmEmailChangeRequest(
        scenario.args,
    );

    assert.equal(result, null);

    assert.equal(
        scenario.revokedSessions.length,
        0,
    );

    assert.equal(scenario.released, true);
});

// ============================================================
// 6. CORREO NUEVO IGUAL AL ACTUAL
// ============================================================

test('confirmEmailChangeRequest rejects the current email', async () => {
    const scenario = createConfirmationScenario({
        pendingOverrides: {
            new_email: 'actual@example.com',
        },
    });

    const result = await confirmEmailChangeRequest(
        scenario.args,
    );

    assert.equal(result, null);

    const statements =
        getConfirmationStatements(scenario);

    assert.ok(
        !statements.some((sql) => (
            sql.includes('UPDATE users')
        )),
    );

    assert.equal(
        scenario.revokedSessions.length,
        0,
    );
});

// ============================================================
// 7. CORREO DUPLICADO EN POSTGRESQL
// ============================================================

test('confirmEmailChangeRequest rolls back on duplicate email', async () => {
    const duplicateError =
        new Error('Duplicate email');

    duplicateError.code = '23505';

    const scenario = createConfirmationScenario({
        updateError: duplicateError,
    });

    await assert.rejects(
        confirmEmailChangeRequest(scenario.args),
        (error) => error === duplicateError,
    );

    const statements =
        getConfirmationStatements(scenario);

    assert.ok(statements.includes('ROLLBACK'));
    assert.ok(!statements.includes('COMMIT'));

    assert.equal(
        scenario.revokedSessions.length,
        0,
    );

    assert.equal(scenario.released, true);
});

// ============================================================
// 8. ERROR AL REVOCAR SESIONES
// ============================================================

test('confirmEmailChangeRequest rolls back when session revocation fails', async () => {
    const revokeError =
        new Error('Unable to revoke sessions');

    const scenario = createConfirmationScenario({
        revokeError,
    });

    await assert.rejects(
        confirmEmailChangeRequest(scenario.args),
        (error) => error === revokeError,
    );

    const statements =
        getConfirmationStatements(scenario);

    assert.ok(
        statements.some((sql) => (
            sql.includes('UPDATE users')
        )),
    );

    assert.ok(statements.includes('ROLLBACK'));
    assert.ok(!statements.includes('COMMIT'));

    assert.equal(scenario.released, true);
});

// ============================================================
// 9. HASH DE CONFIRMACION INVALIDO
// ============================================================

test('confirmEmailChangeRequest rejects an invalid hash', async () => {
    const scenario = createConfirmationScenario();

    await assert.rejects(
        confirmEmailChangeRequest({
            ...scenario.args,
            hashCode: () => 'invalid-hash',
        }),
        {
            name: 'TypeError',
            message: 'Invalid email change code hash',
        },
    );

    const statements =
        getConfirmationStatements(scenario);

    assert.ok(statements.includes('ROLLBACK'));
    assert.ok(!statements.includes('COMMIT'));

    assert.equal(
        scenario.revokedSessions.length,
        0,
    );

    assert.equal(scenario.released, true);
});

// ============================================================
// 10. PARAMETROS INVALIDOS
// ============================================================

test('confirmEmailChangeRequest rejects invalid parameters', async () => {
    const scenario = createConfirmationScenario();

    const invalidInputs = [
        {
            userId: '',
        },
        {
            code: '12345',
        },
        {
            code: 'abcdef',
        },
        {
            hashCode: null,
        },
        {
            confirmedAt: new Date('invalid'),
        },
    ];

    for (const invalidInput of invalidInputs) {
        await assert.rejects(
            confirmEmailChangeRequest({
                ...scenario.args,
                ...invalidInput,
            }),
            {
                name: 'TypeError',
                message:
                    'Invalid email change confirmation parameters',
            },
        );
    }

    assert.equal(scenario.queries.length, 0);
    assert.equal(scenario.released, false);
});
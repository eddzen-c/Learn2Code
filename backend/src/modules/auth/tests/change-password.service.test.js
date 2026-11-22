
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    changeCurrentUserPassword,
} from '../services/change-password.service.js';

const oldPassword = 'PasswordAnterior123!';
const newPassword = 'PasswordNueva456!';

const createTestContext = () => {
    const operations = [];

    const client = {
        async query(sql) {
            operations.push(sql);
            return { rows: [] };
        },

        release() {
            operations.push('RELEASE');
        },
    };

    const now = new Date(
        '2026-10-29T18:00:00.000Z',
    );

    const args = {
        userId: 'user-1',
        currentPassword: oldPassword,
        newPassword,
        requestIp: '127.0.0.1',
        now,

        pool: {
            connect: async () => client,
        },

        findPassword: async (parameters) => {
            operations.push('FIND');

            assert.equal(parameters.userId, 'user-1');
            assert.equal(parameters.client, client);

            return {
                userId: 'user-1',
                passwordHash: 'stored-hash',
            };
        },

        verifyCurrentPassword: async (
            password,
            passwordHash,
        ) => {
            operations.push('VERIFY');

            return password === oldPassword
                && passwordHash === 'stored-hash';
        },

        hashNewPassword: async (password) => {
            operations.push('HASH');

            assert.equal(password, newPassword);

            return 'new-secure-hash';
        },

        updatePassword: async (parameters) => {
            operations.push('UPDATE');

            assert.equal(parameters.userId, 'user-1');
            assert.equal(
                parameters.passwordHash,
                'new-secure-hash',
            );
            assert.equal(parameters.updatedAt, now);
            assert.equal(parameters.client, client);

            return {
                userId: 'user-1',
            };
        },

        revokeSessions: async (parameters) => {
            operations.push('REVOKE');

            assert.equal(parameters.userId, 'user-1');
            assert.equal(parameters.revokedAt, now);
            assert.equal(
                parameters.revokedByIp,
                '127.0.0.1',
            );
            assert.equal(parameters.client, client);

            return 2;
        },
    };

    return {
        operations,
        args,
    };
};

test('changes the password and revokes sessions atomically', async () => {
    const { operations, args } = createTestContext();

    const result = await changeCurrentUserPassword(args);

    assert.deepEqual(result, {
        changed: true,
    });

    assert.deepEqual(operations, [
        'BEGIN',
        'FIND',
        'VERIFY',
        'HASH',
        'UPDATE',
        'REVOKE',
        'COMMIT',
        'RELEASE',
    ]);
});

test('rejects an incorrect current password', async () => {
    const { operations, args } = createTestContext();

    args.currentPassword = 'Incorrecta123!';

    await assert.rejects(
        () => changeCurrentUserPassword(args),
        (error) => {
            assert.equal(
                error.code,
                'INVALID_CURRENT_PASSWORD',
            );

            return true;
        },
    );

    assert.deepEqual(operations, [
        'BEGIN',
        'FIND',
        'VERIFY',
        'ROLLBACK',
        'RELEASE',
    ]);
});

test('rejects an unavailable user', async () => {
    const { operations, args } = createTestContext();

    args.findPassword = async () => {
        operations.push('FIND');
        return null;
    };

    await assert.rejects(
        () => changeCurrentUserPassword(args),
        (error) => {
            assert.equal(
                error.code,
                'AUTHENTICATION_REQUIRED',
            );

            return true;
        },
    );

    assert.deepEqual(operations, [
        'BEGIN',
        'FIND',
        'ROLLBACK',
        'RELEASE',
    ]);
});

test('rejects reusing the current password', async () => {
    const { operations, args } = createTestContext();

    args.newPassword = oldPassword;

    await assert.rejects(
        () => changeCurrentUserPassword(args),
        (error) => {
            assert.equal(
                error.code,
                'PASSWORD_REUSE_NOT_ALLOWED',
            );

            return true;
        },
    );

    assert.deepEqual(operations, [
        'BEGIN',
        'FIND',
        'VERIFY',
        'ROLLBACK',
        'RELEASE',
    ]);
});

test('rolls back when updating the password fails', async () => {
    const { operations, args } = createTestContext();

    args.updatePassword = async () => {
        operations.push('UPDATE');
        throw new Error('Database update failed');
    };

    await assert.rejects(
        () => changeCurrentUserPassword(args),
        /Database update failed/,
    );

    assert.deepEqual(operations, [
        'BEGIN',
        'FIND',
        'VERIFY',
        'HASH',
        'UPDATE',
        'ROLLBACK',
        'RELEASE',
    ]);
});

test('rolls back if revoking sessions fails', async () => {
    const { operations, args } = createTestContext();

    args.revokeSessions = async () => {
        operations.push('REVOKE');
        throw new Error('Session revocation failed');
    };

    await assert.rejects(
        () => changeCurrentUserPassword(args),
        /Session revocation failed/,
    );

    assert.deepEqual(operations, [
        'BEGIN',
        'FIND',
        'VERIFY',
        'HASH',
        'UPDATE',
        'REVOKE',
        'ROLLBACK',
        'RELEASE',
    ]);
});

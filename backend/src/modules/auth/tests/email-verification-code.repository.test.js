
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    saveEmailVerificationCode,
} from '../repositories/email-verification-code.repository.js';

import {
    confirmEmailVerificationCodeRecord,
} from '../repositories/email-verification-code.repository.js';


test('saves a verification code hash', async () => {
    let capturedQuery;

    const expiresAt = new Date(
        '2026-10-24T12:10:00.000Z',
    );

    const client = {
        query: async (query) => {
            capturedQuery = query;

            return {
                rows: [{
                    user_id: 'user-1',
                    expires_at: expiresAt,
                }],
            };
        },
    };

    const codeHash = 'a'.repeat(64);

    const result = await saveEmailVerificationCode({
        userId: 'user-1',
        codeHash,
        createdAt: new Date(
            '2026-10-24T12:00:00.000Z',
        ),
        expiresAt,
        client,
    });

    assert.equal(result.userId, 'user-1');
    assert.equal(result.expiresAt, expiresAt);

    assert.deepEqual(
        capturedQuery.values.slice(0, 2),
        ['user-1', codeHash],
    );

    assert.match(
        capturedQuery.text,
        /ON CONFLICT \(user_id\)/,
    );

    assert.match(
        capturedQuery.text,
        /INTERVAL '60 seconds'/,
    );
});

test('returns null when another code cannot be issued', async () => {
    const client = {
        query: async () => ({
            rows: [],
        }),
    };

    const result = await saveEmailVerificationCode({
        userId: 'user-1',
        codeHash: 'b'.repeat(64),
        expiresAt: new Date(
            '2026-10-24T12:10:00.000Z',
        ),
        client,
    });

    assert.equal(result, null);
});


const createVerificationPool = ({
    record,
    verifiedUser,
}) => {
    const commands = [];
    let released = false;

    const client = {
        query: async (statement) => {
            commands.push(statement);

            if (typeof statement === 'string') {
                return { rows: [] };
            }

            if (
                statement.text.includes(
                    'FROM email_verification_codes c',
                )
            ) {
                return {
                    rows: record ? [record] : [],
                };
            }

            if (statement.text.includes('UPDATE users')) {
                return {
                    rows: verifiedUser
                        ? [verifiedUser]
                        : [],
                };
            }

            return { rows: [] };
        },

        release: () => {
            released = true;
        },
    };

    return {
        pool: {
            connect: async () => client,
        },
        commands,
        wasReleased: () => released,
    };
};

const verificationDate =
    new Date('2026-10-24T12:00:00.000Z');

test('confirms a valid code only once', async () => {
    const hash = 'a'.repeat(64);

    const context = createVerificationPool({
        record: {
            code_hash: hash,
            expires_at:
                new Date('2026-10-24T12:10:00.000Z'),
            used_at: null,
            failed_attempts: 0,
        },

        verifiedUser: {
            id: 'user-1',
            email: 'student@example.com',
            email_verified_at: verificationDate,
        },
    });

    const result =
        await confirmEmailVerificationCodeRecord({
            userId: 'user-1',
            codeHash: hash,
            verifiedAt: verificationDate,
            pool: context.pool,
        });

    assert.equal(result.verified, true);
    assert.equal(result.user.id, 'user-1');
    assert.equal(context.wasReleased(), true);

    assert.ok(
        context.commands.some(
            (command) =>
                typeof command === 'string'
                && command === 'COMMIT',
        ),
    );

    assert.ok(
        context.commands.some(
            (command) =>
                typeof command === 'object'
                && command.text.includes('FOR UPDATE OF c'),
        ),
    );
});

test('counts an incorrect verification attempt', async () => {
    const context = createVerificationPool({
        record: {
            code_hash: 'a'.repeat(64),
            expires_at:
                new Date('2026-10-24T12:10:00.000Z'),
            used_at: null,
            failed_attempts: 2,
        },
    });

    const result =
        await confirmEmailVerificationCodeRecord({
            userId: 'user-1',
            codeHash: 'b'.repeat(64),
            verifiedAt: verificationDate,
            pool: context.pool,
        });

    assert.equal(result, null);

    assert.ok(
        context.commands.some(
            (command) =>
                typeof command === 'object'
                && command.text.includes(
                    'failed_attempts + 1',
                ),
        ),
    );

    assert.equal(context.wasReleased(), true);
});

test('rejects a code after five failures', async () => {
    const context = createVerificationPool({
        record: {
            code_hash: 'a'.repeat(64),
            expires_at:
                new Date('2026-10-24T12:10:00.000Z'),
            used_at: null,
            failed_attempts: 5,
        },
    });

    const result =
        await confirmEmailVerificationCodeRecord({
            userId: 'user-1',
            codeHash: 'a'.repeat(64),
            verifiedAt: verificationDate,
            pool: context.pool,
        });

    assert.equal(result, null);

    assert.equal(
        context.commands.filter(
            (command) =>
                typeof command === 'object'
                && command.text.includes('UPDATE users'),
        ).length,
        0,
    );
});

test('rejects an expired verification code', async () => {
    const context = createVerificationPool({
        record: {
            code_hash: 'a'.repeat(64),
            expires_at:
                new Date('2026-10-24T11:59:00.000Z'),
            used_at: null,
            failed_attempts: 0,
        },
    });

    const result =
        await confirmEmailVerificationCodeRecord({
            userId: 'user-1',
            codeHash: 'a'.repeat(64),
            verifiedAt: verificationDate,
            pool: context.pool,
        });

    assert.equal(result, null);
});

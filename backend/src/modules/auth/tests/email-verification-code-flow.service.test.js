
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    requestEmailVerificationCode,
    confirmEmailVerificationCode,
} from '../services/email-verification-code-flow.service.js';

const now = new Date('2026-10-24T12:00:00.000Z');

const expiresAt =
    new Date('2026-10-24T12:10:00.000Z');

const user = {
    id: 'user-1',
    email: 'student@example.com',
    isActive: true,
    deletedAt: null,
    emailVerifiedAt: null,
};

const generatedCode = {
    code: '000042',
    codeHash: 'a'.repeat(64),
    expiresAt,
};

test('requests a verification code for an active user', async () => {
    let savedParameters;
    let messageParameters;

    const result = await requestEmailVerificationCode({
        userId: 'user-1',
        now,
        findUser: async () => user,
        getSecret: () => 'test-secret',
        createCode: () => generatedCode,

        saveCode: async (parameters) => {
            savedParameters = parameters;
            return { userId: 'user-1' };
        },

        sendMessage: async (parameters) => {
            messageParameters = parameters;

            return {
                provider: 'mock',
                accepted: true,
                simulated: true,
            };
        },
    });

    assert.equal(result.requested, true);
    assert.equal(result.alreadyVerified, false);
    assert.equal(result.expiresAt, expiresAt);

    assert.equal(savedParameters.codeHash, generatedCode.codeHash);
    assert.equal(messageParameters.code, '000042');

    assert.equal('code' in result, false);
    assert.equal('codeHash' in result, false);
});

test('does not issue codes for verified users', async () => {
    const result = await requestEmailVerificationCode({
        userId: 'user-1',

        findUser: async () => ({
            ...user,
            emailVerifiedAt: now,
        }),

        getSecret: () => {
            throw new Error('Should not generate a code');
        },
    });

    assert.equal(result.requested, false);
    assert.equal(result.alreadyVerified, true);
});

test('rejects requests during the resend cooldown', async () => {
    await assert.rejects(
        requestEmailVerificationCode({
            userId: 'user-1',
            now,
            findUser: async () => user,
            getSecret: () => 'test-secret',
            createCode: () => generatedCode,
            saveCode: async () => null,
        }),
        {
            code: 'EMAIL_VERIFICATION_CODE_COOLDOWN',
        },
    );
});

test('confirms a valid verification code', async () => {
    const result = await confirmEmailVerificationCode({
        userId: 'user-1',
        code: '000042',
        now,
        getSecret: () => 'test-secret',

        hashCode: () => 'a'.repeat(64),

        verifyCode: async () => ({
            verified: true,
            user: {
                id: 'user-1',
                email: user.email,
                emailVerifiedAt: now,
            },
        }),
    });

    assert.equal(result.verified, true);
    assert.equal(result.user.id, 'user-1');
});

test('rejects an incorrect verification code', async () => {
    await assert.rejects(
        confirmEmailVerificationCode({
            userId: 'user-1',
            code: '111111',
            now,
            getSecret: () => 'test-secret',
            hashCode: () => 'b'.repeat(64),
            verifyCode: async () => null,
        }),
        {
            code: 'INVALID_EMAIL_VERIFICATION_CODE',
        },
    );
});

test('rejects a malformed verification code', async () => {
    await assert.rejects(
        confirmEmailVerificationCode({
            userId: 'user-1',
            code: '12345',
            now,
            getSecret: () => 'test-secret',

            hashCode: () => {
                throw new TypeError('Invalid code');
            },
        }),
        {
            code: 'INVALID_EMAIL_VERIFICATION_CODE',
        },
    );
});

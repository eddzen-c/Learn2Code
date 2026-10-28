
import assert from 'node:assert/strict'
import test from 'node:test'

import {
    createEmailVerificationCode,
    hashEmailVerificationCode,
} from '../services/email-verification-code.service.js'

const secret = 'learn2code-test-secret-with-more-than-32-bytes'

test('generates a six-digit verification code', () => {
    const now = new Date('2026-10-23T12:00:00.000Z')

    const result = createEmailVerificationCode({
        userId: 'user-1',
        secret,
        now,
        randomNumber: () => 42,
    })

    assert.equal(result.code, '000042')
    assert.match(result.codeHash, /^[a-f0-9]{64}$/)

    assert.equal(
        result.expiresAt.toISOString(),
        '2026-10-23T12:10:00.000Z'
    )
})

test('binds the code hash to the user', () => {
    const firstHash = hashEmailVerificationCode({
        userId: 'user-1',
        code: '123456',
        secret,
    })

    const secondHash = hashEmailVerificationCode({
        userId: 'user-2',
        code: '123456',
        secret,
    })

    assert.notEqual(firstHash, secondHash)
})

test('rejects invalid verification codes', () => {
    assert.throws(() => {
        hashEmailVerificationCode({
            userId: 'user-1',
            code: '12345',
            secret,
        })
    }, TypeError)
})

import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    getPasswordValidation,
} from './password-policy.js'

describe('getPasswordValidation', () => {
    it('accepts a secure password of exactly 8 characters', () => {
        expect(
            getPasswordValidation('Abc123!x'),
        ).toEqual({
            minLength: true,
            uppercase: true,
            number: true,
            special: true,
            withinByteLimit: true,
        })
    })

    it('rejects passwords shorter than 8 characters', () => {
        expect(
            getPasswordValidation('Ab12!xy').minLength,
        ).toBe(false)
    })

    const invalidPasswords = [
        {
            reason: 'without an uppercase letter',
            password: 'abc123!x',
            requirement: 'uppercase',
        },
        {
            reason: 'without a number',
            password: 'Abcdef!x',
            requirement: 'number',
        },
        {
            reason: 'without a special character',
            password: 'Abc123xy',
            requirement: 'special',
        },
        {
            reason: 'when whitespace replaces the special character',
            password: 'Abc123 x',
            requirement: 'special',
        },
    ]

    it.each(invalidPasswords)(
        'rejects a password $reason',
        ({ password, requirement }) => {
            expect(
                getPasswordValidation(password)[requirement],
            ).toBe(false)
        },
    )

    it('accepts the maximum permitted byte length', () => {
        const password = 'Abc1!' + 'a'.repeat(67)

        expect(
            getPasswordValidation(password).withinByteLimit,
        ).toBe(true)
    })

    it('rejects passwords that exceed the byte limit', () => {
        const password = 'Abc1!' + 'a'.repeat(68)

        expect(
            getPasswordValidation(password).withinByteLimit,
        ).toBe(false)
    })

    it('correctly counts multibyte UTF-8 characters', () => {
        const allowed =
            'Abc1!' + 'a'.repeat(65) + '\u00E1'

        const tooLong =
            'Abc1!' + 'a'.repeat(66) + '\u00E1'

        expect(
            getPasswordValidation(allowed).withinByteLimit,
        ).toBe(true)

        expect(
            getPasswordValidation(tooLong).withinByteLimit,
        ).toBe(false)
    })
})
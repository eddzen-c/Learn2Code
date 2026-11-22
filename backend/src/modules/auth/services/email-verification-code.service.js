
import {
    createHmac,
    randomInt,
} from 'node:crypto'

export const EMAIL_VERIFICATION_CODE_TTL_MS =
    10 * 60 * 1000

export const hashEmailVerificationCode = ({
    userId,
    code,
    secret,
}) => {
    if (typeof userId !== 'string' || !userId.trim()) {
        throw new TypeError('User ID is required')
    }

    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
        throw new TypeError('Verification code must have six digits')
    }

    if (
        typeof secret !== 'string' ||
        Buffer.byteLength(secret, 'utf8') < 32
    ) {
        throw new TypeError('Verification secret must be at least 32 bytes')
    }

    return createHmac('sha256', secret)
        .update(`email-verification-code:${userId}:${code}`)
        .digest('hex')
}

export const createEmailVerificationCode = ({
    userId,
    secret,
    now = new Date(),
    randomNumber = randomInt,
}) => {
    if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
        throw new TypeError('Verification date is invalid')
    }

    const number = randomNumber(0, 1_000_000)

    if (
        !Number.isInteger(number) ||
        number < 0 ||
        number >= 1_000_000
    ) {
        throw new TypeError('Generated verification number is invalid')
    }

    const code = String(number).padStart(6, '0')

    const codeHash = hashEmailVerificationCode({
        userId,
        code,
        secret,
    })

    return Object.freeze({
        code,
        codeHash,
        expiresAt: new Date(
            now.getTime() + EMAIL_VERIFICATION_CODE_TTL_MS
        ),
    })
}
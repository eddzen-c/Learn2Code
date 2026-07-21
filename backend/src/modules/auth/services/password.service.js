import bcrypt from 'bcryptjs';

export const PASSWORD_MIN_CHARACTERS = 8;
export const PASSWORD_MAX_BYTES = 72;

const PASSWORD_SALT_ROUNDS = 12;

const assertPasswordCanBeHashed = (password) => {
    if (typeof password !== 'string') {
        throw new TypeError('Password must be a string');
    }

    if ([...password].length < PASSWORD_MIN_CHARACTERS) {
        throw new RangeError(
            `Password must contain at least ${PASSWORD_MIN_CHARACTERS} characters`,
        );
    }

    if (password.trim().length === 0) {
        throw new RangeError('Password cannot be blank');
    }

    if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
        throw new RangeError(
            `Password cannot exceed ${PASSWORD_MAX_BYTES} UTF-8 bytes`,
        );
    }
};

export const hashPassword = async (password) => {
    assertPasswordCanBeHashed(password);

    return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
};

export const verifyPassword = async (password, passwordHash) => {
    if (
        typeof password !== 'string'
        || typeof passwordHash !== 'string'
        || password.length === 0
        || passwordHash.length === 0
        || Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES
    ) {
        return false;
    }

    try {
        return await bcrypt.compare(password, passwordHash);
    } catch {
        return false;
    }
};
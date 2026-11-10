export const PASSWORD_MIN_CHARACTERS = 8
export const PASSWORD_MAX_BYTES = 72

export const getPasswordValidation = (password) => ({
    minLength:
        [...password].length >= PASSWORD_MIN_CHARACTERS,

    uppercase:
        /[A-Z]/.test(password),

    number:
        /[0-9]/.test(password),

    special:
        /[^A-Za-z0-9\s]/.test(password),

    withinByteLimit:
        new TextEncoder().encode(password).length
        <= PASSWORD_MAX_BYTES,
})
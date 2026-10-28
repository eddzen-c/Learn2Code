
export const getEmailVerificationCodeSecret = () => {
    const secret =
        process.env.EMAIL_VERIFICATION_CODE_SECRET;

    if (
        typeof secret !== 'string'
        || Buffer.byteLength(secret, 'utf8') < 32
    ) {
        throw new Error(
            'EMAIL_VERIFICATION_CODE_SECRET must contain at least 32 UTF-8 bytes',
        );
    }

    return secret;
};
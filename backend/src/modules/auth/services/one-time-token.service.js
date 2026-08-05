import {
    createHash,
    randomBytes,
} from 'node:crypto';

const TOKEN_BYTES = 32;

const assertToken = (token) => {
    if (
        typeof token !== 'string'
        || token.trim().length === 0
    ) {
        throw new TypeError(
            'Token must be a non-empty string',
        );
    }
};

export const hashOneTimeToken =
    (token) => {
        assertToken(token);

        return createHash('sha256')
            .update(token, 'utf8')
            .digest('hex');
    };

export const createOneTimeToken =
    () => {
        const token =
            randomBytes(TOKEN_BYTES)
                .toString('base64url');

        return Object.freeze({
            token,
            tokenHash:
                hashOneTimeToken(token),
        });
    };
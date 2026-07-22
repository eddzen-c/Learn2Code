import {
    AuthenticationRequiredError,
} from '../errors/access-token.errors.js';

import {
    verifyAccessToken,
} from '../services/access-token.service.js';

const extractBearerToken = (authorizationHeader) => {
    if (typeof authorizationHeader !== 'string') {
        throw new AuthenticationRequiredError();
    }

    const parts = authorizationHeader
        .trim()
        .split(/\s+/);

    if (
        parts.length !== 2
        || parts[0].toLowerCase() !== 'bearer'
        || parts[1].length === 0
    ) {
        throw new AuthenticationRequiredError();
    }

    return parts[1];
};

export const requireAuthentication = async (
    req,
    _res,
    next,
) => {
    try {
        const accessToken = extractBearerToken(
            req.get('authorization'),
        );

        req.auth = await verifyAccessToken(
            accessToken,
        );

        next();
    } catch {
        next(new AuthenticationRequiredError());
    }
};
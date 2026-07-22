import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import {
    AuthenticationRequiredError,
} from '../errors/access-token.errors.js';

import {
    requireAuthentication,
} from '../middlewares/authentication.middleware.js';

import {
    createAccessToken,
} from '../services/access-token.service.js';

const executeMiddleware = async (
    authorizationHeader,
) => {
    const req = {
        get(headerName) {
            assert.equal(
                headerName,
                'authorization',
            );

            return authorizationHeader;
        },
    };

    return new Promise((resolve) => {
        requireAuthentication(
            req,
            {},
            (error) => {
                resolve({
                    req,
                    error,
                });
            },
        );
    });
};

const assertAuthenticationError = (error) => {
    assert.ok(
        error instanceof AuthenticationRequiredError,
    );

    assert.equal(error.statusCode, 401);

    assert.equal(
        error.code,
        'AUTHENTICATION_REQUIRED',
    );
};

test('requireAuthentication accepts a valid token', async () => {
    const userId = randomUUID();

    const token = await createAccessToken({
        userId,
        roles: ['student'],
    });

    const result = await executeMiddleware(
        `Bearer ${token}`,
    );

    assert.equal(result.error, undefined);
    assert.equal(result.req.auth.userId, userId);

    assert.deepEqual(
        result.req.auth.roles,
        ['student'],
    );

    assert.ok(result.req.auth.tokenId);
});

test('requireAuthentication rejects a missing header', async () => {
    const result = await executeMiddleware(
        undefined,
    );

    assertAuthenticationError(result.error);
    assert.equal(result.req.auth, undefined);
});

test('requireAuthentication rejects malformed headers', async () => {
    const malformedHeaders = [
        '',
        'Basic abc123',
        'Bearer',
        'Bearer token extra-value',
    ];

    for (const header of malformedHeaders) {
        const result = await executeMiddleware(
            header,
        );

        assertAuthenticationError(result.error);
        assert.equal(result.req.auth, undefined);
    }
});

test('requireAuthentication rejects an invalid token', async () => {
    const token = await createAccessToken({
        userId: randomUUID(),
        roles: ['student'],
    });

    const parts = token.split('.');

    parts[1] = `${parts[1].slice(0, -1)
        }${parts[1].endsWith('a') ? 'b' : 'a'}`;

    const result = await executeMiddleware(
        `Bearer ${parts.join('.')}`,
    );

    assertAuthenticationError(result.error);
    assert.equal(result.req.auth, undefined);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
    AuthenticationRequiredError,
} from '../errors/access-token.errors.js';

import {
    InsufficientPermissionsError,
} from '../errors/authorization.errors.js';

import {
    requireRoles,
} from '../middlewares/authorization.middleware.js';

const executeMiddleware = ({
    allowedRoles,
    authenticatedRoles,
    includeAuthentication = true,
}) => {
    const req = {};

    if (includeAuthentication) {
        req.auth = {
            userId:
                '11111111-1111-4111-8111-111111111111',
            roles: authenticatedRoles,
        };
    }

    let receivedError;

    requireRoles(...allowedRoles)(
        req,
        {},
        (error) => {
            receivedError = error;
        },
    );

    return receivedError;
};

test('requireRoles allows an authorized role', () => {
    const error = executeMiddleware({
        allowedRoles: ['student'],
        authenticatedRoles: ['student'],
    });

    assert.equal(error, undefined);
});

test('requireRoles accepts any matching role', () => {
    const error = executeMiddleware({
        allowedRoles: ['student', 'admin'],
        authenticatedRoles: ['admin'],
    });

    assert.equal(error, undefined);
});

test('requireRoles rejects an unauthorized role', () => {
    const error = executeMiddleware({
        allowedRoles: ['admin'],
        authenticatedRoles: ['student'],
    });

    assert.ok(
        error instanceof InsufficientPermissionsError,
    );

    assert.equal(error.statusCode, 403);

    assert.equal(
        error.code,
        'INSUFFICIENT_PERMISSIONS',
    );
});

test('requireRoles requires authentication claims', () => {
    const error = executeMiddleware({
        allowedRoles: ['admin'],
        authenticatedRoles: [],
        includeAuthentication: false,
    });

    assert.ok(
        error instanceof AuthenticationRequiredError,
    );

    assert.equal(error.statusCode, 401);

    assert.equal(
        error.code,
        'AUTHENTICATION_REQUIRED',
    );
});

test('requireRoles validates its configuration', () => {
    assert.throws(
        () => requireRoles(),
        /At least one valid role is required/,
    );

    assert.throws(
        () => requireRoles(''),
        /At least one valid role is required/,
    );

    assert.throws(
        () => requireRoles('admin', null),
        /At least one valid role is required/,
    );
});
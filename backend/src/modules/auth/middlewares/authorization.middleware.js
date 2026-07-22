import {
    AuthenticationRequiredError,
} from '../errors/access-token.errors.js';

import {
    InsufficientPermissionsError,
} from '../errors/authorization.errors.js';

const normalizeAllowedRoles = (roles) => {
    if (
        roles.length === 0
        || roles.some(
            (role) => (
                typeof role !== 'string'
                || role.trim().length === 0
            ),
        )
    ) {
        throw new TypeError(
            'At least one valid role is required',
        );
    }

    return new Set(
        roles.map((role) => role.trim()),
    );
};

export const requireRoles = (...roles) => {
    const allowedRoles = normalizeAllowedRoles(
        roles,
    );

    return (req, _res, next) => {
        if (
            !req.auth
            || !Array.isArray(req.auth.roles)
        ) {
            next(
                new AuthenticationRequiredError(),
            );

            return;
        }

        const hasAllowedRole = req.auth.roles.some(
            (role) => allowedRoles.has(role),
        );

        if (!hasAllowedRole) {
            next(
                new InsufficientPermissionsError(),
            );

            return;
        }

        next();
    };
};
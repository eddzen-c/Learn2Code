import { databasePool } from '../../../config/database.js';

import {
    AuthenticationRequiredError,
} from '../errors/access-token.errors.js';

import {
    findUserById,
} from '../repositories/user.repository.js';

export const getCurrentUser = async ({
    userId,
    client = databasePool,
}) => {
    const user = await findUserById({
        userId,
        client,
    });

    if (
        !user
        || !user.isActive
        || user.deletedAt !== null
        || user.roles.length === 0
    ) {
        throw new AuthenticationRequiredError();
    }

    return Object.freeze({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        username: user.username,
        bio: user.bio,
        githubUrl: user.githubUrl,
        portfolioUrl: user.portfolioUrl,
        preferredLocale: user.preferredLocale,
        preferredProgrammingLanguageId:
            user.preferredProgrammingLanguageId,
        roles: Object.freeze([...user.roles]),
        emailVerified:
            user.emailVerifiedAt !== null,
        lastLoginAt: user.lastLoginAt,
    });
};
import { databasePool } from '../../../config/database.js';

import {
    AuthenticationRequiredError,
} from '../errors/access-token.errors.js';

import {
    UnsupportedProgrammingLanguageError,
    UsernameAlreadyTakenError,
} from '../errors/profile.errors.js';

import {
    findActiveSupportedLanguageById,
} from '../repositories/supported-language.repository.js';

import {
    updateUserProfileRecord,
} from '../repositories/user.repository.js';

import {
    getCurrentUser,
} from './current-user.service.js';

export const updateCurrentUserProfile = async ({
    userId,
    fullName,
    preferredLocale,
    preferredProgrammingLanguageId,
    username,
    bio,
    githubUrl,
    portfolioUrl,
    client = databasePool,
}) => {
    if (
        preferredProgrammingLanguageId
        !== undefined
        && preferredProgrammingLanguageId !== null
    ) {
        const language =
            await findActiveSupportedLanguageById({
                languageId:
                    preferredProgrammingLanguageId,
                client,
            });

        if (!language) {
            throw new UnsupportedProgrammingLanguageError();
        }
    }

    let updatedRecord;

    try {
        updatedRecord = await updateUserProfileRecord({
            userId,
            fullName,
            preferredLocale,
            preferredProgrammingLanguageId,
            username,
            bio,
            githubUrl,
            portfolioUrl,
            client,
        });
    } catch (error) {
        if (
            error?.code === '23505'
            && error?.constraint === 'uq_users_username'
        ) {
            throw new UsernameAlreadyTakenError();
        }

        throw error;
    }

    if (!updatedRecord) {
        throw new AuthenticationRequiredError();
    }

    return getCurrentUser({
        userId,
        client,
    });
};
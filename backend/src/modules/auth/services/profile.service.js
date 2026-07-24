import { databasePool } from '../../../config/database.js';

import {
    AuthenticationRequiredError,
} from '../errors/access-token.errors.js';

import {
    UnsupportedProgrammingLanguageError,
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

    const updatedRecord =
        await updateUserProfileRecord({
            userId,
            fullName,
            preferredLocale,
            preferredProgrammingLanguageId,
            client,
        });

    if (!updatedRecord) {
        throw new AuthenticationRequiredError();
    }

    return getCurrentUser({
        userId,
        client,
    });
};
import {
    env,
} from '../../../config/env.js';

import {
    ExerciseProviderUnavailableError,
} from '../errors/exercise.errors.js';

import {
    generateMockExercise,
} from '../providers/mock-exercise.provider.js';

const exerciseProviders = new Map([
    [
        'mock',
        generateMockExercise,
    ],
]);

export const generatePersonalizedExercise =
    async ({
        userId,
        variationKey,
        language,
        difficulty,
        topic,
        providerName = env.ai.provider,
    }) => {
        const provider =
            exerciseProviders.get(
                providerName,
            );

        if (!provider) {
            throw new ExerciseProviderUnavailableError(
                providerName,
            );
        }

        return provider({
            userId,
            variationKey,
            language,
            difficulty,
            topic,
        });
    };
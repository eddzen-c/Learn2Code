import {
    env,
} from '../../../config/env.js';

import {
    ExerciseProviderUnavailableError,
} from '../errors/exercise.errors.js';

import {
    generateMockExercise,
} from '../providers/mock-exercise.provider.js';

import {
    generateOpenAiExercise,
} from '../providers/openai-exercise.provider.js';

const exerciseProviders = new Map([
    [
        'mock',
        generateMockExercise,
    ],

    [
        'openai',
        generateOpenAiExercise,
    ],
]);

export const generatePersonalizedExercise =
    async ({
        userId,
        variationKey,
        language,
        difficulty,
        topic,
        personalizationContext = null,
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
            personalizationContext,
        });
    };
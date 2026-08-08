import {
    env,
} from '../../../config/env.js';

import {
    DiagnosticProviderUnavailableError,
} from '../errors/diagnostic.errors.js';

import {
    generateMockDiagnosticQuestions,
} from '../providers/mock-diagnostic.provider.js';

import {
    generateOpenAiDiagnosticQuestions,
} from '../providers/openai-diagnostic.provider.js';

const diagnosticProviders = new Map([
    [
        'mock',
        generateMockDiagnosticQuestions,
    ],
    [
        'openai',
        generateOpenAiDiagnosticQuestions,
    ],
]);

export const isDiagnosticProviderAvailable =
    (providerName) => (
        diagnosticProviders.has(
            providerName,
        )
    );

export const generateDiagnosticQuestions =
    async ({
        userId,
        variationKey = userId,
        language,
        topics,
        difficultyLevels,
        onboardingContext = null,
        questionCount =
        env.ai.diagnosticQuestionCount,
        providerName = env.ai.provider,
    }) => {
        const provider =
            diagnosticProviders.get(
                providerName,
            );

        if (!provider) {
            throw new DiagnosticProviderUnavailableError(
                providerName,
            );
        }

        return provider({
            userId,
            variationKey,
            language,
            topics,
            difficultyLevels,
            onboardingContext,
            questionCount,
        });
    };

import { env } from '../../../config/env.js';

import {
    getLearningPlanContext,
} from './learning-plan-context.service.js';

import {
    generateOpenAiLearningPlan,
} from '../providers/openai-learning-plan.provider.js';

import {
    findLearningPathByDiagnostic,
    saveGeneratedLearningPath,
    confirmLearningPath,
} from '../repositories/learning-path.repository.js';

const pendingGenerations = new Map();

const dependencies = {
    getLearningPlanContext,
    generateOpenAiLearningPlan,
    findLearningPathByDiagnostic,
    saveGeneratedLearningPath,
    confirmLearningPath,
};

const describePlan = (plan) => ({
    state: plan.confirmedAt
        ? 'confirmed'
        : 'recommended',
    plan,
});

export async function getCurrentLearningPlan({
    userId,
    deps = dependencies,
}) {
    const context = await deps.getLearningPlanContext({
        userId,
    });

    if (context.state !== 'ready') {
        return {
            state: context.state,
            plan: null,
        };
    }

    const plan = await deps.findLearningPathByDiagnostic({
        userId,
        assessmentId: context.assessmentId,
    });

    return plan
        ? describePlan(plan)
        : {
            state: 'not_generated',
            plan: null,
        };
}

export async function generateLearningPlan({
    userId,
    deps = dependencies,
}) {
    const context = await deps.getLearningPlanContext({
        userId,
    });

    if (context.state !== 'ready') {
        return {
            state: context.state,
            plan: null,
        };
    }

    const key = `${userId}:${context.assessmentId}`;

    const pending = pendingGenerations.get(key);

    if (pending) {
        return pending;
    }

    const operation = (async () => {
        const existing =
            await deps.findLearningPathByDiagnostic({
                userId,
                assessmentId: context.assessmentId,
            });

        if (existing) {
            return describePlan(existing);
        }

        if (env.ai.provider !== 'openai') {
            const error = new Error(
                'La generación con OpenAI no está habilitada.',
            );

            error.statusCode = 503;
            error.code = 'OPENAI_NOT_CONFIGURED';

            throw error;
        }

        // La especialización la decide OpenAI.
        // No interviene el recomendador por reglas.
        const generation =
            await deps.generateOpenAiLearningPlan({
                onboarding: context.onboarding,
                diagnostic: context.diagnostic,
                topics: context.topics,
            });

        const saved =
            await deps.saveGeneratedLearningPath({
                userId,
                context,
                generation,
            });

        return describePlan(saved);
    })();

    pendingGenerations.set(key, operation);

    try {
        return await operation;
    } finally {
        if (pendingGenerations.get(key) === operation) {
            pendingGenerations.delete(key);
        }
    }
}

export async function confirmStudentLearningPlan({
    userId,
    pathId,
    deps = dependencies,
}) {
    const context = await deps.getLearningPlanContext({
        userId,
    });

    if (context.state !== 'ready') {
        return {
            state: context.state,
            plan: null,
        };
    }

    const confirmed =
        await deps.confirmLearningPath({
            userId,
            assessmentId: context.assessmentId,
            pathId,
        });

    if (!confirmed) {
        const error = new Error(
            'No se encontró un plan válido para confirmar.',
        );

        error.statusCode = 404;
        error.code = 'LEARNING_PATH_NOT_FOUND';

        throw error;
    }

    return describePlan(confirmed);
}

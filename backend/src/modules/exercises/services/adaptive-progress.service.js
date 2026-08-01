import {
    databasePool,
} from '../../../config/database.js';

import {
    createExerciseCompletionXpTransaction,
    findExerciseProgressContext,
    updateKnowledgeStateFromExerciseAttempt,
    updateUserStreakFromExerciseCompletion,
    updateUserXpFromExerciseCompletion,
} from '../repositories/adaptive-progress.repository.js';

const XP_REWARDS = Object.freeze({
    basico: 50,
    intermedio: 75,
    avanzado: 100,
});

const normalizeDifficultyName = (value) => (
    value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
);

export const calculateExerciseXpReward =
    (difficultyName) => {
        if (
            typeof difficultyName !== 'string'
            || difficultyName.trim().length === 0
        ) {
            throw new TypeError(
                'Difficulty name must be a non-empty string',
            );
        }

        const normalizedDifficulty =
            normalizeDifficultyName(
                difficultyName,
            );

        return XP_REWARDS[
            normalizedDifficulty
        ] ?? XP_REWARDS.basico;
    };

const toUtcDateString = (value) => {
    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new TypeError(
            'Completion date must be valid',
        );
    }

    return date
        .toISOString()
        .slice(0, 10);
};

export const applyAdaptiveProgressFromExerciseCompletion =
    async ({
        userId,
        assignmentId,
        exerciseId,
        score,
        completedAt = new Date(),
        client = databasePool,

        findProgressContext =
        findExerciseProgressContext,

        createXpTransaction =
        createExerciseCompletionXpTransaction,

        updateKnowledgeState =
        updateKnowledgeStateFromExerciseAttempt,

        updateUserXp =
        updateUserXpFromExerciseCompletion,

        updateUserStreak =
        updateUserStreakFromExerciseCompletion,
    }) => {
        const activeDate =
            toUtcDateString(
                completedAt,
            );

        const context =
            await findProgressContext({
                exerciseId,
                client,
            });

        if (!context) {
            throw new Error(
                'Exercise progress context is unavailable',
            );
        }

        const xpAmount =
            calculateExerciseXpReward(
                context.difficulty.name,
            );

        const xpTransaction =
            await createXpTransaction({
                userId,
                assignmentId,
                exerciseId,
                difficultyName:
                    context.difficulty.name,
                amount: xpAmount,
                awardedAt: completedAt,
                client,
            });

        if (!xpTransaction) {
            return Object.freeze({
                applied: false,
                xpAwarded: 0,
                knowledgeState: null,
                userXp: null,
                streak: null,
            });
        }

        const knowledgeState =
            await updateKnowledgeState({
                userId,
                topicId: context.topic.id,
                score,
                evaluatedAt: completedAt,
                client,
            });

        const userXp =
            await updateUserXp({
                userId,
                amount: xpAmount,
                updatedAt: completedAt,
                client,
            });

        const streak =
            await updateUserStreak({
                userId,
                activeDate,
                client,
            });

        return Object.freeze({
            applied: true,
            xpAwarded: xpAmount,
            knowledgeState,
            userXp,
            streak,
        });
    };
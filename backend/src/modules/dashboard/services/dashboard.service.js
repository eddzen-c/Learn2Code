import {
    databasePool,
} from '../../../config/database.js';

import {
    AuthenticationRequiredError,
} from '../../auth/errors/access-token.errors.js';

import {
    findDashboardSummaryByUserId,
    findRecentXpTransactionsByUserId,
} from '../repositories/dashboard.repository.js';

const calculateCompletionRate = ({
    exercisesAttempted,
    exercisesSolved,
}) => {
    if (exercisesAttempted === 0) {
        return 0;
    }

    return Number(
        (
            exercisesSolved
            / exercisesAttempted
            * 100
        ).toFixed(2),
    );
};

const calculateLevelProgress = ({
    totalXp,
    currentLevel,
    nextLevel,
}) => {
    if (!currentLevel) {
        return 0;
    }

    if (!nextLevel) {
        return 100;
    }

    const levelRange =
        nextLevel.minimumXp
        - currentLevel.minimumXp;

    if (levelRange <= 0) {
        return 100;
    }

    const earnedInCurrentLevel =
        totalXp
        - currentLevel.minimumXp;

    const percentage =
        earnedInCurrentLevel
        / levelRange
        * 100;

    return Number(
        Math.min(
            100,
            Math.max(0, percentage),
        ).toFixed(2),
    );
};

export const getDashboardSummary = async ({
    userId,
    client = databasePool,
}) => {
    const [
        summary,
        recentActivity,
    ] = await Promise.all([
        findDashboardSummaryByUserId({
            userId,
            client,
        }),

        findRecentXpTransactionsByUserId({
            userId,
            limit: 5,
            client,
        }),
    ]);

    if (!summary) {
        throw new AuthenticationRequiredError();
    }

    const completionRate =
        calculateCompletionRate(
            summary.progress,
        );

    const levelProgressPercentage =
        calculateLevelProgress(
            summary.gamification,
        );

    const xpToNextLevel =
        summary.gamification.nextLevel
            ? Math.max(
                0,
                summary
                    .gamification
                    .nextLevel
                    .minimumXp
                - summary.gamification.totalXp,
            )
            : null;

    return Object.freeze({
        progress: Object.freeze({
            ...summary.progress,
            completionRate,
        }),

        gamification: Object.freeze({
            ...summary.gamification,
            levelProgressPercentage,
            xpToNextLevel,
        }),

        recentActivity: Object.freeze([
            ...recentActivity,
        ]),
    });
};
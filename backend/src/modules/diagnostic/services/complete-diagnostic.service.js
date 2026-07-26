import {
    databasePool,
} from '../../../config/database.js';

import {
    DiagnosticCatalogUnavailableError,
    DiagnosticNotInProgressError,
} from '../errors/diagnostic.errors.js';

import {
    completeDiagnosticAssessmentRecord,
    getDiagnosticScoreSummary,
    listDiagnosticTopicScores,
    upsertKnowledgeStateRecord,
    upsertLearningProfileFromDiagnostic,
} from '../repositories/diagnostic-completion.repository.js';

import {
    listDifficultyLevels,
} from '../repositories/diagnostic-catalog.repository.js';

const defaultDependencies = Object.freeze({
    getDiagnosticScoreSummary,
    listDiagnosticTopicScores,
    listDifficultyLevels,
    upsertKnowledgeStateRecord,
    completeDiagnosticAssessmentRecord,
    upsertLearningProfileFromDiagnostic,
});

const selectResultingDifficulty = (
    overallScore,
    difficultyLevels,
) => {
    let position = 0;

    if (overallScore >= 80) {
        position = 2;
    } else if (overallScore >= 50) {
        position = 1;
    }

    return difficultyLevels[
        Math.min(
            position,
            difficultyLevels.length - 1,
        )
    ];
};

const calculateConfidenceScore = (
    evaluatedCount,
) => (
    Math.min(
        100,
        evaluatedCount * 25,
    )
);

export const completeDiagnosticAssessment =
    async ({
        assessmentId,
        userId,
        completedAt = new Date(),
        client = databasePool,
        dependencies = defaultDependencies,
    }) => {
        const scoreSummary =
            await dependencies
                .getDiagnosticScoreSummary({
                    assessmentId,
                    userId,
                    client,
                });

        const topicScores =
            await dependencies
                .listDiagnosticTopicScores({
                    assessmentId,
                    userId,
                    client,
                });

        const difficultyLevels =
            await dependencies
                .listDifficultyLevels({
                    client,
                });

        if (
            scoreSummary.evaluatedCount === 0
            || topicScores.length === 0
            || difficultyLevels.length === 0
        ) {
            throw new DiagnosticCatalogUnavailableError();
        }

        const resultingDifficulty =
            selectResultingDifficulty(
                scoreSummary.overallScore,
                difficultyLevels,
            );

        const knowledgeStates = [];

        for (const topicScore of topicScores) {
            const knowledgeState =
                await dependencies
                    .upsertKnowledgeStateRecord({
                        userId,
                        topicId:
                            topicScore.topicId,
                        masteryScore:
                            topicScore.masteryScore,
                        confidenceScore:
                            calculateConfidenceScore(
                                topicScore
                                    .evaluatedCount,
                            ),
                        attemptsCount:
                            topicScore.evaluatedCount,
                        evaluatedAt:
                            completedAt,
                        client,
                    });

            knowledgeStates.push(
                knowledgeState,
            );
        }

        const assessment =
            await dependencies
                .completeDiagnosticAssessmentRecord({
                    assessmentId,
                    userId,
                    overallScore:
                        scoreSummary.overallScore,
                    resultingDifficultyId:
                        resultingDifficulty.id,
                    completedAt,
                    client,
                });

        if (!assessment) {
            throw new DiagnosticNotInProgressError();
        }

        const learningProfile =
            await dependencies
                .upsertLearningProfileFromDiagnostic({
                    userId,
                    difficultyId:
                        resultingDifficulty.id,
                    assessmentId,
                    completedAt,
                    client,
                });

        return Object.freeze({
            assessment,

            resultingDifficulty:
                Object.freeze({
                    id: resultingDifficulty.id,
                    name:
                        resultingDifficulty.name,
                }),

            topicScores,

            knowledgeStates:
                Object.freeze(
                    knowledgeStates,
                ),

            learningProfile,
        });
    };
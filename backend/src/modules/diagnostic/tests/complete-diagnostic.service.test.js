import assert from 'node:assert/strict';
import test from 'node:test';

import {
    DiagnosticCatalogUnavailableError,
} from '../errors/diagnostic.errors.js';

import {
    completeDiagnosticAssessment,
} from '../services/complete-diagnostic.service.js';

const completedAt =
    new Date('2026-07-25T21:00:00Z');

const difficultyLevels = Object.freeze([
    Object.freeze({
        id: 1,
        name: 'básico',
    }),
    Object.freeze({
        id: 2,
        name: 'intermedio',
    }),
    Object.freeze({
        id: 3,
        name: 'avanzado',
    }),
]);

const defaultTopicScores = Object.freeze([
    Object.freeze({
        topicId: 1,
        evaluatedCount: 2,
        masteryScore: 75,
    }),
]);

const createDependencies = ({
    overallScore = 75,
    levels = difficultyLevels,
    topicScores = defaultTopicScores,
    onKnowledgeState = () => {},
    onLearningProfile = () => {},
} = {}) => ({
    getDiagnosticScoreSummary:
        async () => ({
            evaluatedCount: 8,
            overallScore,
        }),

    listDiagnosticTopicScores:
        async () => topicScores,

    listDifficultyLevels:
        async () => levels,

    upsertKnowledgeStateRecord:
        async (input) => {
            onKnowledgeState(input);

            return Object.freeze({
                id:
                    `knowledge-${input.topicId}`,
                userId: input.userId,
                topicId: input.topicId,
                masteryScore:
                    input.masteryScore,
                confidenceScore:
                    input.confidenceScore,
                attemptsCount:
                    input.attemptsCount,
                lastEvaluatedAt:
                    input.evaluatedAt,
            });
        },

    completeDiagnosticAssessmentRecord:
        async (input) => (
            Object.freeze({
                id: input.assessmentId,
                userId: input.userId,
                status: 'completed',
                questionCount: 8,
                answeredCount: 8,
                overallScore:
                    input.overallScore,
                resultingDifficultyId:
                    input.resultingDifficultyId,
                completedAt:
                    input.completedAt,
            })
        ),

    upsertLearningProfileFromDiagnostic:
        async (input) => {
            onLearningProfile(input);

            return Object.freeze({
                userId: input.userId,
                currentDifficultyId:
                    input.difficultyId,
                diagnosticCompletedAt:
                    input.completedAt,
                lastDiagnosticAssessmentId:
                    input.assessmentId,
                updatedAt:
                    input.completedAt,
            });
        },
});

const difficultyCases = [
    {
        score: 30,
        expectedId: 1,
        expectedName: 'básico',
    },
    {
        score: 65,
        expectedId: 2,
        expectedName: 'intermedio',
    },
    {
        score: 90,
        expectedId: 3,
        expectedName: 'avanzado',
    },
];

difficultyCases.forEach((testCase) => {
    test(
        `completeDiagnosticAssessment selects ${testCase.expectedName}`,
        async () => {
            const result =
                await completeDiagnosticAssessment({
                    assessmentId:
                        'assessment-1',
                    userId: 'user-1',
                    completedAt,
                    client: {},
                    dependencies:
                        createDependencies({
                            overallScore:
                                testCase.score,
                        }),
                });

            assert.equal(
                result
                    .resultingDifficulty
                    .id,
                testCase.expectedId,
            );

            assert.equal(
                result
                    .resultingDifficulty
                    .name,
                testCase.expectedName,
            );

            assert.equal(
                result.assessment.overallScore,
                testCase.score,
            );
        },
    );
});

test(
    'completeDiagnosticAssessment updates topic confidence and profile',
    async () => {
        const knowledgeInputs = [];
        let profileInput;

        const result =
            await completeDiagnosticAssessment({
                assessmentId:
                    'assessment-1',
                userId: 'user-1',
                completedAt,
                client: {},
                dependencies:
                    createDependencies({
                        overallScore: 65,

                        topicScores: [
                            {
                                topicId: 1,
                                evaluatedCount: 2,
                                masteryScore: 100,
                            },
                            {
                                topicId: 2,
                                evaluatedCount: 1,
                                masteryScore: 0,
                            },
                        ],

                        onKnowledgeState:
                            (input) => {
                                knowledgeInputs.push(
                                    input,
                                );
                            },

                        onLearningProfile:
                            (input) => {
                                profileInput = input;
                            },
                    }),
            });

        assert.equal(
            knowledgeInputs.length,
            2,
        );

        assert.equal(
            knowledgeInputs[0]
                .confidenceScore,
            50,
        );

        assert.equal(
            knowledgeInputs[1]
                .confidenceScore,
            25,
        );

        assert.equal(
            profileInput.difficultyId,
            2,
        );

        assert.equal(
            result.knowledgeStates.length,
            2,
        );
    },
);

test(
    'completeDiagnosticAssessment rejects an empty catalog',
    async () => {
        await assert.rejects(
            () => (
                completeDiagnosticAssessment({
                    assessmentId:
                        'assessment-1',
                    userId: 'user-1',
                    completedAt,
                    client: {},
                    dependencies:
                        createDependencies({
                            levels: [],
                        }),
                })
            ),
            DiagnosticCatalogUnavailableError,
        );
    },
);
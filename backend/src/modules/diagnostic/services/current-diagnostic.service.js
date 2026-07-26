import {
    databasePool,
} from '../../../config/database.js';

import {
    findLatestDiagnosticAssessmentByUserId,
} from '../repositories/diagnostic-assessment.repository.js';

import {
    listDifficultyLevels,
} from '../repositories/diagnostic-catalog.repository.js';

import {
    listDiagnosticQuestionsForStudent,
} from '../repositories/diagnostic-question.repository.js';

import {
    listDiagnosticResponsesByAssessment,
} from '../repositories/diagnostic-response.repository.js';

const defaultDependencies = Object.freeze({
    findLatestDiagnosticAssessmentByUserId,
    listDiagnosticQuestionsForStudent,
    listDiagnosticResponsesByAssessment,
    listDifficultyLevels,
});

const resolveState = (status) => {
    if (
        status === 'failed'
        || status === 'expired'
    ) {
        return 'available';
    }

    return status;
};

export const getCurrentDiagnostic =
    async ({
        userId,
        client = databasePool,
        dependencies = defaultDependencies,
    }) => {
        const assessment =
            await dependencies
                .findLatestDiagnosticAssessmentByUserId({
                    userId,
                    client,
                });

        if (!assessment) {
            return Object.freeze({
                state: 'not_started',
                assessment: null,
                questions: Object.freeze([]),
                result: null,
            });
        }

        const questions =
            await dependencies
                .listDiagnosticQuestionsForStudent({
                    assessmentId:
                        assessment.id,
                    userId,
                    client,
                });

        const responses =
            await dependencies
                .listDiagnosticResponsesByAssessment({
                    assessmentId:
                        assessment.id,
                    userId,
                    client,
                });

        const responsesByQuestion = new Map(
            responses.map((response) => [
                response.questionId,
                response,
            ]),
        );

        const questionsWithResponses =
            questions.map((question) => {
                const response =
                    responsesByQuestion.get(
                        question.id,
                    );

                return Object.freeze({
                    ...question,

                    response: response
                        ? Object.freeze({
                            status:
                                response.status,
                            answer:
                                response.answer,
                            submittedCode:
                                response.submittedCode,
                            isCorrect:
                                response.isCorrect,
                            score:
                                response.score,
                            feedback:
                                response.feedback,
                            evaluatedAt:
                                response.evaluatedAt,
                        })
                        : null,
                });
            });

        let resultingDifficulty = null;

        if (
            assessment.resultingDifficultyId
            !== null
        ) {
            const difficultyLevels =
                await dependencies
                    .listDifficultyLevels({
                        client,
                    });

            const difficulty =
                difficultyLevels.find(
                    (level) => (
                        level.id
                        === assessment
                            .resultingDifficultyId
                    ),
                );

            if (difficulty) {
                resultingDifficulty =
                    Object.freeze({
                        id: difficulty.id,
                        name: difficulty.name,
                    });
            }
        }

        const result =
            assessment.status === 'completed'
                ? Object.freeze({
                    overallScore:
                        assessment.overallScore,
                    resultingDifficulty,
                    completedAt:
                        assessment.completedAt,
                })
                : null;

        return Object.freeze({
            state:
                resolveState(
                    assessment.status,
                ),

            assessment: Object.freeze({
                id: assessment.id,
                attemptNumber:
                    assessment.attemptNumber,
                status: assessment.status,
                questionCount:
                    assessment.questionCount,
                answeredCount:
                    assessment.answeredCount,
                startedAt:
                    assessment.startedAt,
                expiresAt:
                    assessment.expiresAt,
            }),

            questions: Object.freeze(
                questionsWithResponses,
            ),

            result,
        });
    };
import {
    databasePool,
} from '../../../config/database.js';

import {
    DiagnosticExpiredError,
    DiagnosticNotInProgressError,
    DiagnosticQuestionAlreadyAnsweredError,
    DiagnosticQuestionNotFoundError,
} from '../errors/diagnostic.errors.js';

import {
    incrementDiagnosticAnsweredCount,
} from '../repositories/diagnostic-assessment.repository.js';

import {
    createEvaluatedDiagnosticResponseRecord,
    findDiagnosticQuestionForEvaluation,
} from '../repositories/diagnostic-response.repository.js';

import {
    evaluateDiagnosticAnswer,
} from './diagnostic-answer-evaluator.service.js';

import {
    completeDiagnosticAssessment,
} from './complete-diagnostic.service.js';

const defaultDependencies = Object.freeze({
    findDiagnosticQuestionForEvaluation,
    createEvaluatedDiagnosticResponseRecord,
    incrementDiagnosticAnsweredCount,
});

const runInTransaction = async (
    pool,
    callback,
) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await callback(client);

        await client.query('COMMIT');

        return result;
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch {
            // The original error remains the priority.
        }

        throw error;
    } finally {
        client.release();
    }
};

export const submitDiagnosticAnswer =
    async ({
        assessmentId,
        questionId,
        userId,
        answer,
        submittedCode = null,
        now = new Date(),
        pool = databasePool,
        answerEvaluator =
        evaluateDiagnosticAnswer,
        diagnosticCompleter =
        completeDiagnosticAssessment,
        dependencies = defaultDependencies,
    }) => (
        runInTransaction(
            pool,
            async (client) => {
                await client.query({
                    text: `
                        SELECT
                            pg_advisory_xact_lock(
                                hashtext($1)
                            )
                    `,
                    values: [
                        `diagnostic-question:${questionId}`,
                    ],
                });

                const question =
                    await dependencies
                        .findDiagnosticQuestionForEvaluation({
                            assessmentId,
                            questionId,
                            userId,
                            client,
                        });

                if (!question) {
                    throw new DiagnosticQuestionNotFoundError();
                }

                if (
                    question.assessmentStatus
                    !== 'in_progress'
                ) {
                    throw new DiagnosticNotInProgressError();
                }

                if (
                    question.assessmentExpiresAt
                    && (
                        question
                            .assessmentExpiresAt
                            .getTime()
                        <= now.getTime()
                    )
                ) {
                    throw new DiagnosticExpiredError();
                }

                const evaluation =
                    answerEvaluator({
                        answer,
                        expectedAnswer:
                            question.expectedAnswer,
                        maxScore:
                            question.maxScore,
                        evaluationCriteria:
                            question.evaluationCriteria,
                        explanation:
                            question.explanation,
                    });

                const response =
                    await dependencies
                        .createEvaluatedDiagnosticResponseRecord({
                            questionId,
                            userId,
                            answer,
                            submittedCode,
                            isCorrect:
                                evaluation.isCorrect,
                            score:
                                evaluation.score,
                            feedback:
                                evaluation.feedback,
                            evaluationSource:
                                evaluation
                                    .evaluationSource,
                            evaluationMetadata:
                                evaluation
                                    .evaluationMetadata,
                            evaluatedAt: now,
                            client,
                        });

                if (!response) {
                    throw new DiagnosticQuestionAlreadyAnsweredError();
                }

                const assessment =
                    await dependencies
                        .incrementDiagnosticAnsweredCount({
                            assessmentId,
                            userId,
                            updatedAt: now,
                            client,
                        });

                if (!assessment) {
                    throw new DiagnosticNotInProgressError();
                }

                const allAnswered =
                    assessment.answeredCount
                    === assessment.questionCount;

                const completion = allAnswered
                    ? await diagnosticCompleter({
                        assessmentId,
                        userId,
                        completedAt: now,
                        client,
                    })
                    : null;

                return Object.freeze({
                    response: Object.freeze({
                        id: response.id,
                        questionId:
                            response.questionId,
                        status: response.status,
                        isCorrect:
                            response.isCorrect,
                        score: response.score,
                        feedback:
                            response.feedback,
                        evaluatedAt:
                            response.evaluatedAt,
                    }),

                    progress: Object.freeze({
                        answeredCount:
                            assessment.answeredCount,
                        questionCount:
                            assessment.questionCount,
                        allAnswered:
                            allAnswered,
                    }),
                    completion: completion
                        ? Object.freeze({
                            status:
                                completion
                                    .assessment
                                    .status,

                            overallScore:
                                completion
                                    .assessment
                                    .overallScore,

                            resultingDifficulty:
                                completion
                                    .resultingDifficulty,

                            topicScores:
                                completion
                                    .topicScores,
                        })
                        : null,
                });
            },
        )
    );
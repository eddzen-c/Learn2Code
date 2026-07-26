import {
    submitDiagnosticAnswer,
} from '../services/submit-diagnostic-answer.service.js';

import {
    parseDiagnosticAssessmentParams,
    parseSubmitDiagnosticAnswerBody,
} from '../validators/submit-diagnostic-answer.validator.js';

export const submitDiagnosticAnswerController =
    async (
        req,
        res,
        next,
    ) => {
        try {
            const params =
                parseDiagnosticAssessmentParams(
                    req.params,
                );

            const input =
                parseSubmitDiagnosticAnswerBody(
                    req.body,
                );

            const result =
                await submitDiagnosticAnswer({
                    assessmentId:
                        params.assessmentId,
                    questionId:
                        input.questionId,
                    userId:
                        req.auth.userId,
                    answer:
                        input.answer,
                    submittedCode:
                        input.submittedCode
                        ?? null,
                });

            res.status(201).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
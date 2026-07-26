import {
    startDiagnosticAssessment,
} from '../services/start-diagnostic.service.js';

import {
    parseStartDiagnosticBody,
} from '../validators/start-diagnostic.validator.js';

export const startDiagnosticController =
    async (
        req,
        res,
        next,
    ) => {
        try {
            const input =
                parseStartDiagnosticBody(
                    req.body,
                );

            const result =
                await startDiagnosticAssessment({
                    userId: req.auth.userId,
                    languageId:
                        input.languageId,
                });

            res.status(201).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
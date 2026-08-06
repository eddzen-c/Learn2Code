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
            parseStartDiagnosticBody(
                req.body,
            );

            const result =
                await startDiagnosticAssessment({
                    userId:
                        req.auth.userId,
                });

            res.status(201).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
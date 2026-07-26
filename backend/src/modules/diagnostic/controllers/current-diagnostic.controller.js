import {
    getCurrentDiagnostic,
} from '../services/current-diagnostic.service.js';

export const currentDiagnosticController =
    async (
        req,
        res,
        next,
    ) => {
        try {
            const result =
                await getCurrentDiagnostic({
                    userId:
                        req.auth.userId,
                });

            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
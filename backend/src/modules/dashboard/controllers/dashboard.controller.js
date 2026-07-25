import {
    getDashboardSummary,
} from '../services/dashboard.service.js';

export const dashboardSummaryController = async (
    req,
    res,
    next,
) => {
    try {
        const summary = await getDashboardSummary({
            userId: req.auth.userId,
        });

        res.status(200).json({
            status: 'success',
            data: {
                summary,
            },
        });
    } catch (error) {
        next(error);
    }
};
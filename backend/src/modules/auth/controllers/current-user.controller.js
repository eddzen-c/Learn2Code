import {
    getCurrentUser,
} from '../services/current-user.service.js';

export const currentUserController = async (
    req,
    res,
    next,
) => {
    try {
        const user = await getCurrentUser({
            userId: req.auth.userId,
        });

        res.status(200).json({
            status: 'success',
            data: {
                user,
            },
        });
    } catch (error) {
        next(error);
    }
};
import {
    getCurrentExercise,
} from '../services/current-exercise.service.js';

export const currentExerciseController =
    async (
        req,
        res,
        next,
    ) => {
        try {
            const result =
                await getCurrentExercise({
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
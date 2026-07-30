import {
    generateNextExercise,
} from '../services/generate-next-exercise.service.js';

export const generateNextExerciseController =
    async (
        req,
        res,
        next,
    ) => {
        try {
            const result =
                await generateNextExercise({
                    userId:
                        req.auth.userId,
                });

            res.status(
                result.created
                    ? 201
                    : 200,
            ).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
import {
    submitExerciseAttempt,
} from '../services/submit-exercise-attempt.service.js';

import {
    parseExerciseAssignmentParams,
    parseSubmitExerciseAttemptBody,
} from '../validators/submit-exercise-attempt.validator.js';

export const submitExerciseAttemptController =
    async (
        req,
        res,
        next,
    ) => {
        try {
            const {
                assignmentId,
            } = parseExerciseAssignmentParams(
                req.params,
            );

            const {
                submittedCode,
            } = parseSubmitExerciseAttemptBody(
                req.body,
            );

            const result =
                await submitExerciseAttempt({
                    userId:
                        req.auth.userId,
                    assignmentId,
                    submittedCode,
                });

            res.status(201).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
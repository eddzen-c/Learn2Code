import {
    databasePool,
} from '../../../config/database.js';

import {
    findActiveExerciseAssignmentByUserId,
} from '../repositories/exercise.repository.js';

export const getCurrentExercise =
    async ({
        userId,
        client = databasePool,
        findActiveAssignment =
        findActiveExerciseAssignmentByUserId,
    }) => {
        const activeAssignment =
            await findActiveAssignment({
                userId,
                client,
            });

        if (!activeAssignment) {
            return Object.freeze({
                state: 'none',
                assignment: null,
                exercise: null,
            });
        }

        return Object.freeze({
            state:
                activeAssignment
                    .assignment
                    .status,

            assignment:
                activeAssignment.assignment,

            exercise:
                activeAssignment.exercise,
        });
    };
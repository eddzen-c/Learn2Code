import assert from 'node:assert/strict';
import {
    randomUUID,
} from 'node:crypto';
import test from 'node:test';

import {
    getCurrentExercise,
} from '../services/current-exercise.service.js';

test(
    'getCurrentExercise returns an active assignment',
    async () => {
        const userId = randomUUID();

        const activeAssignment = {
            assignment: {
                id: randomUUID(),
                userId,
                status: 'assigned',
            },

            exercise: {
                id: randomUUID(),
                title:
                    'Ejercicio personalizado',
            },
        };

        const result =
            await getCurrentExercise({
                userId,

                findActiveAssignment:
                    async (input) => {
                        assert.equal(
                            input.userId,
                            userId,
                        );

                        return activeAssignment;
                    },
            });

        assert.equal(
            result.state,
            'assigned',
        );

        assert.equal(
            result.assignment,
            activeAssignment.assignment,
        );

        assert.equal(
            result.exercise,
            activeAssignment.exercise,
        );
    },
);

test(
    'getCurrentExercise returns none without an active assignment',
    async () => {
        const result =
            await getCurrentExercise({
                userId: randomUUID(),

                findActiveAssignment:
                    async () => null,
            });

        assert.deepEqual(
            result,
            {
                state: 'none',
                assignment: null,
                exercise: null,
            },
        );
    },
);
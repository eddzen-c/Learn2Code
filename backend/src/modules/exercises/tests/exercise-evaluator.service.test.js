import assert from 'node:assert/strict';
import {
    randomUUID,
} from 'node:crypto';
import test from 'node:test';

import {
    ExerciseEvaluationFailedError,
} from '../errors/exercise.errors.js';

import {
    evaluateExerciseSubmission,
} from '../services/exercise-evaluator.service.js';

const createInput = () => ({
    submittedCode:
        'console.log("correcto");',

    solutionCode:
        'console.log("correcto");',

    testCases: [
        {
            id: randomUUID(),
            expectedOutput:
                'correcto',
            weight: 1,
        },
    ],
});

test(
    'evaluateExerciseSubmission uses the mock evaluator',
    async () => {
        const result =
            await evaluateExerciseSubmission({
                ...createInput(),
                evaluatorName: 'mock',
            });

        assert.equal(
            result.provider,
            'mock',
        );

        assert.equal(result.passed, true);
        assert.equal(result.score, 100);
    },
);

test(
    'evaluateExerciseSubmission rejects an unknown evaluator',
    async () => {
        await assert.rejects(
            () => evaluateExerciseSubmission({
                ...createInput(),
                evaluatorName:
                    'unknown',
            }),
            (error) => {
                assert.ok(
                    error instanceof
                    ExerciseEvaluationFailedError,
                );

                assert.equal(
                    error.code,
                    'EXERCISE_EVALUATION_FAILED',
                );

                return true;
            },
        );
    },
);

test(
    'evaluateExerciseSubmission validates evaluator input',
    async () => {
        await assert.rejects(
            () => evaluateExerciseSubmission({
                ...createInput(),
                submittedCode: '',
                evaluatorName: 'mock',
            }),
            /Submitted code must be a non-empty string/,
        );
    },
);
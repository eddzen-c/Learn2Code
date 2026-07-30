import {
    ExerciseEvaluationFailedError,
} from '../errors/exercise.errors.js';

import {
    evaluateMockExerciseSubmission,
} from '../providers/mock-exercise-evaluator.provider.js';

const exerciseEvaluators = new Map([
    [
        'mock',
        evaluateMockExerciseSubmission,
    ],
]);

export const evaluateExerciseSubmission =
    async ({
        submittedCode,
        solutionCode,
        testCases,
        evaluatorName = 'mock',
    }) => {
        const evaluator =
            exerciseEvaluators.get(
                evaluatorName,
            );

        if (!evaluator) {
            throw new ExerciseEvaluationFailedError();
        }

        return evaluator({
            submittedCode,
            solutionCode,
            testCases,
        });
    };
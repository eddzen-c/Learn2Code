import {
    ExerciseEvaluationFailedError,
} from '../errors/exercise.errors.js';

import {
    evaluateMockExerciseSubmission,
} from '../providers/mock-exercise-evaluator.provider.js';

import {
    evaluateDockerExerciseSubmission,
} from '../providers/docker-exercise-evaluator.provider.js';

const exerciseEvaluators = new Map([
    [
        'mock',
        evaluateMockExerciseSubmission,
    ],
    [
        'docker',
        evaluateDockerExerciseSubmission,
    ],
]);

export const evaluateExerciseSubmission =
    async ({
        submittedCode,
        solutionCode,
        testCases,
        languageId,
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
            languageId,
        });
    };
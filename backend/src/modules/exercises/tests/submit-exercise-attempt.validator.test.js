import assert from 'node:assert/strict';
import {
    randomUUID,
} from 'node:crypto';
import test from 'node:test';

import {
    parseExerciseAssignmentParams,
    parseSubmitExerciseAttemptBody,
} from '../validators/submit-exercise-attempt.validator.js';

test(
    'exercise attempt validator accepts valid input',
    () => {
        const assignmentId = randomUUID();

        assert.deepEqual(
            parseExerciseAssignmentParams({
                assignmentId,
            }),
            {
                assignmentId,
            },
        );

        assert.deepEqual(
            parseSubmitExerciseAttemptBody({
                submittedCode:
                    'console.log("Hola");',
            }),
            {
                submittedCode:
                    'console.log("Hola");',
            },
        );
    },
);

test(
    'exercise attempt validator rejects an invalid assignment ID',
    () => {
        assert.throws(
            () => (
                parseExerciseAssignmentParams({
                    assignmentId:
                        'invalid-id',
                })
            ),
        );
    },
);

test(
    'exercise attempt validator rejects empty code',
    () => {
        assert.throws(
            () => (
                parseSubmitExerciseAttemptBody({
                    submittedCode: '',
                })
            ),
        );
    },
);

test(
    'exercise attempt validator rejects oversized code',
    () => {
        assert.throws(
            () => (
                parseSubmitExerciseAttemptBody({
                    submittedCode:
                        'a'.repeat(100_001),
                })
            ),
            /cannot exceed 100000 UTF-8 bytes/,
        );
    },
);

test(
    'exercise attempt validator rejects unknown fields',
    () => {
        assert.throws(
            () => (
                parseSubmitExerciseAttemptBody({
                    submittedCode:
                        'print("Hola")',
                    result: 'accepted',
                })
            ),
        );
    },
);
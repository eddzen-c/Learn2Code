import assert from 'node:assert/strict';
import {
    randomUUID,
} from 'node:crypto';
import test from 'node:test';

import {
    parseDiagnosticAssessmentParams,
    parseSubmitDiagnosticAnswerBody,
} from '../validators/submit-diagnostic-answer.validator.js';

test(
    'parseDiagnosticAssessmentParams accepts an assessment ID',
    () => {
        const assessmentId = randomUUID();

        const result =
            parseDiagnosticAssessmentParams({
                assessmentId,
            });

        assert.deepEqual(result, {
            assessmentId,
        });
    },
);

test(
    'parseDiagnosticAssessmentParams rejects invalid parameters',
    () => {
        assert.throws(
            () => (
                parseDiagnosticAssessmentParams({
                    assessmentId:
                        'invalid-assessment',
                })
            ),
        );

        assert.throws(
            () => (
                parseDiagnosticAssessmentParams({
                    assessmentId:
                        randomUUID(),
                    userId:
                        randomUUID(),
                })
            ),
        );
    },
);

test(
    'parseSubmitDiagnosticAnswerBody accepts supported answers',
    () => {
        const questionId = randomUUID();

        const stringAnswer =
            parseSubmitDiagnosticAnswerBody({
                questionId,
                answer: 'Aprobado',
                submittedCode: null,
            });

        assert.equal(
            stringAnswer.answer,
            'Aprobado',
        );

        const numberAnswer =
            parseSubmitDiagnosticAnswerBody({
                questionId,
                answer: 15,
            });

        assert.equal(numberAnswer.answer, 15);

        const booleanAnswer =
            parseSubmitDiagnosticAnswerBody({
                questionId,
                answer: true,
            });

        assert.equal(
            booleanAnswer.answer,
            true,
        );
    },
);

test(
    'parseSubmitDiagnosticAnswerBody rejects invalid bodies',
    () => {
        const questionId = randomUUID();

        assert.throws(
            () => (
                parseSubmitDiagnosticAnswerBody({
                    questionId,
                    answer: '',
                })
            ),
        );

        assert.throws(
            () => (
                parseSubmitDiagnosticAnswerBody({
                    questionId:
                        'invalid-question',
                    answer: '5',
                })
            ),
        );

        assert.throws(
            () => (
                parseSubmitDiagnosticAnswerBody({
                    questionId,
                    answer: '5',
                    unexpected: true,
                })
            ),
        );
    },
);
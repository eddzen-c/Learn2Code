import assert from 'node:assert/strict';
import test from 'node:test';

import {
    evaluateDiagnosticAnswer,
} from '../services/diagnostic-answer-evaluator.service.js';

test(
    'evaluateDiagnosticAnswer accepts a correct answer',
    () => {
        const result =
            evaluateDiagnosticAnswer({
                answer: '  APROBADO ',
                expectedAnswer: 'Aprobado',
                maxScore: 100,
            });

        assert.equal(result.isCorrect, true);
        assert.equal(result.score, 100);

        assert.equal(
            result.feedback,
            'Respuesta correcta.',
        );
    },
);

test(
    'evaluateDiagnosticAnswer rejects an incorrect answer',
    () => {
        const result =
            evaluateDiagnosticAnswer({
                answer: 'Repaso',
                expectedAnswer: 'Aprobado',
                maxScore: 100,
                explanation:
                    'La condición produce Aprobado.',
            });

        assert.equal(result.isCorrect, false);
        assert.equal(result.score, 0);

        assert.equal(
            result.feedback,
            'La condición produce Aprobado.',
        );
    },
);

test(
    'evaluateDiagnosticAnswer supports case-sensitive answers',
    () => {
        const result =
            evaluateDiagnosticAnswer({
                answer: 'aprobado',
                expectedAnswer: 'Aprobado',
                evaluationCriteria: {
                    mode: 'exact_match',
                    caseSensitive: true,
                },
            });

        assert.equal(result.isCorrect, false);
    },
);

test(
    'evaluateDiagnosticAnswer compares numbers and strings',
    () => {
        const result =
            evaluateDiagnosticAnswer({
                answer: 15,
                expectedAnswer: '15',
                maxScore: 50,
            });

        assert.equal(result.isCorrect, true);
        assert.equal(result.score, 50);
    },
);

test(
    'evaluateDiagnosticAnswer validates its input',
    () => {
        assert.throws(
            () => evaluateDiagnosticAnswer({
                answer: null,
                expectedAnswer: '5',
            }),
            /Diagnostic answer is required/,
        );

        assert.throws(
            () => evaluateDiagnosticAnswer({
                answer: '5',
                expectedAnswer: '5',
                maxScore: 101,
            }),
            /Maximum score must be between 1 and 100/,
        );

        assert.throws(
            () => evaluateDiagnosticAnswer({
                answer: '5',
                expectedAnswer: '5',
                evaluationCriteria: {
                    mode: 'ai',
                },
            }),
            /is not supported/,
        );
    },
);
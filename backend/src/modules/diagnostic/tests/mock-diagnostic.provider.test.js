import assert from 'node:assert/strict';
import test from 'node:test';

import {
    generateMockDiagnosticQuestions,
} from '../providers/mock-diagnostic.provider.js';

const language = {
    id: 1,
    name: 'JavaScript',
    slug: 'javascript',
};

const topics = [
    {
        id: 1,
        name: 'Variables',
    },
    {
        id: 2,
        name: 'Condicionales',
    },
    {
        id: 3,
        name: 'Ciclos',
    },
    {
        id: 4,
        name: 'Funciones',
    },
    {
        id: 5,
        name: 'Arreglos',
    },
];

const difficultyLevels = [
    {
        id: 1,
        name: 'Principiante',
    },
    {
        id: 2,
        name: 'Intermedio',
    },
    {
        id: 3,
        name: 'Avanzado',
    },
];

const generateQuestions = ({
    userId = 'student-one',
    selectedLanguage = language,
    questionCount = 8,
} = {}) => (
    generateMockDiagnosticQuestions({
        userId,
        language: selectedLanguage,
        topics,
        difficultyLevels,
        questionCount,
    })
);

test(
    'generates the requested diagnostic questions',
    () => {
        const result = generateQuestions();

        assert.equal(result.provider, 'mock');

        assert.equal(
            result.model,
            'learn2code-mock-diagnostic-v1',
        );

        assert.equal(result.questions.length, 8);

        result.questions.forEach(
            (question, index) => {
                assert.equal(
                    question.position,
                    index + 1,
                );

                assert.equal(
                    question.questionType,
                    'code_output',
                );

                assert.ok(
                    question.options.includes(
                        question.expectedAnswer,
                    ),
                );

                assert.match(
                    question.contentFingerprint,
                    /^[a-f0-9]{64}$/,
                );
            },
        );
    },
);

test(
    'generates the same questions for the same user',
    () => {
        const firstResult = generateQuestions({
            userId: 'same-student',
        });

        const secondResult = generateQuestions({
            userId: 'same-student',
        });

        assert.deepEqual(
            firstResult.questions,
            secondResult.questions,
        );
    },
);

test(
    'personalizes questions for different users',
    () => {
        const firstResult = generateQuestions({
            userId: 'student-alpha',
        });

        const secondResult = generateQuestions({
            userId: 'student-beta',
        });

        const firstFingerprints =
            firstResult.questions.map(
                (question) => (
                    question.contentFingerprint
                ),
            );

        const secondFingerprints =
            secondResult.questions.map(
                (question) => (
                    question.contentFingerprint
                ),
            );

        assert.notDeepEqual(
            firstFingerprints,
            secondFingerprints,
        );
    },
);

test(
    'generates Python questions when selected',
    () => {
        const result = generateQuestions({
            selectedLanguage: {
                id: 2,
                name: 'Python',
                slug: 'python',
            },
            questionCount: 5,
        });

        result.questions.forEach((question) => {
            assert.match(
                question.prompt,
                /print\(/,
            );

            assert.doesNotMatch(
                question.prompt,
                /console\.log/,
            );
        });
    },
);

test(
    'validates the generator input',
    () => {
        assert.throws(
            () => generateQuestions({
                userId: '',
            }),
            /User ID must be a non-empty string/,
        );

        assert.throws(
            () => (
                generateMockDiagnosticQuestions({
                    userId: 'student',
                    language,
                    topics: [],
                    difficultyLevels,
                })
            ),
            /At least one topic is required/,
        );

        assert.throws(
            () => generateQuestions({
                questionCount: 21,
            }),
            /Question count must be between 1 and 20/,
        );
    },
);

test(
    'generates different questions for each attempt',
    () => {
        const firstAttempt =
            generateMockDiagnosticQuestions({
                userId: 'student-retry',
                variationKey:
                    'student-retry:attempt-1',
                language,
                topics,
                difficultyLevels,
                questionCount: 5,
            });

        const secondAttempt =
            generateMockDiagnosticQuestions({
                userId: 'student-retry',
                variationKey:
                    'student-retry:attempt-2',
                language,
                topics,
                difficultyLevels,
                questionCount: 5,
            });

        const firstFingerprints =
            firstAttempt.questions.map(
                (question) => (
                    question.contentFingerprint
                ),
            );

        const secondFingerprints =
            secondAttempt.questions.map(
                (question) => (
                    question.contentFingerprint
                ),
            );

        assert.notDeepEqual(
            firstFingerprints,
            secondFingerprints,
        );
    },
);
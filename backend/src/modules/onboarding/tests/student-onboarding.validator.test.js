import assert from 'node:assert/strict';
import test from 'node:test';

import {
    ZodError,
} from 'zod';

import {
    parseStudentOnboardingBody,
} from '../validators/student-onboarding.validator.js';

const validBody = {
    languageId: 1,

    selfAssessedDifficultyId: 1,

    learningGoal:
        'career_preparation',

    weeklyTimeCommitment:
        'five_to_ten',

    learningStyle:
        'practical',

    technologyInterestKeys: [
        'javascript',
        'react',
        'nodejs',
    ],

    projectIdea:
        'Crear una aplicación web',
};

test(
    'parseStudentOnboardingBody accepts the mockup preferences',
    () => {
        const result =
            parseStudentOnboardingBody(
                validBody,
            );

        assert.deepEqual(
            result,
            validBody,
        );
    },
);

test(
    'parseStudentOnboardingBody accepts a null project idea',
    () => {
        const result =
            parseStudentOnboardingBody({
                ...validBody,
                projectIdea: null,
            });

        assert.equal(
            result.projectIdea,
            null,
        );
    },
);

test(
    'parseStudentOnboardingBody trims the project idea',
    () => {
        const result =
            parseStudentOnboardingBody({
                ...validBody,

                projectIdea:
                    '  Crear una API  ',
            });

        assert.equal(
            result.projectIdea,
            'Crear una API',
        );
    },
);

test(
    'parseStudentOnboardingBody rejects an invalid learning goal',
    () => {
        assert.throws(
            () => (
                parseStudentOnboardingBody({
                    ...validBody,

                    learningGoal:
                        'unsupported_goal',
                })
            ),
            ZodError,
        );
    },
);

test(
    'parseStudentOnboardingBody rejects an invalid weekly time commitment',
    () => {
        assert.throws(
            () => (
                parseStudentOnboardingBody({
                    ...validBody,

                    weeklyTimeCommitment:
                        'all_day',
                })
            ),
            ZodError,
        );
    },
);

test(
    'parseStudentOnboardingBody rejects an invalid learning style',
    () => {
        assert.throws(
            () => (
                parseStudentOnboardingBody({
                    ...validBody,

                    learningStyle:
                        'unsupported_style',
                })
            ),
            ZodError,
        );
    },
);

test(
    'parseStudentOnboardingBody requires at least one technology',
    () => {
        assert.throws(
            () => (
                parseStudentOnboardingBody({
                    ...validBody,

                    technologyInterestKeys:
                        [],
                })
            ),
            ZodError,
        );
    },
);

test(
    'parseStudentOnboardingBody accepts at most three technologies',
    () => {
        assert.throws(
            () => (
                parseStudentOnboardingBody({
                    ...validBody,

                    technologyInterestKeys: [
                        'javascript',
                        'python',
                        'react',
                        'nodejs',
                    ],
                })
            ),
            ZodError,
        );
    },
);

test(
    'parseStudentOnboardingBody rejects duplicated technologies',
    () => {
        assert.throws(
            () => (
                parseStudentOnboardingBody({
                    ...validBody,

                    technologyInterestKeys: [
                        'javascript',
                        'react',
                        'react',
                    ],
                })
            ),
            ZodError,
        );
    },
);

test(
    'parseStudentOnboardingBody rejects an invalid project idea',
    () => {
        assert.throws(
            () => (
                parseStudentOnboardingBody({
                    ...validBody,

                    projectIdea:
                        ' '.repeat(10),
                })
            ),
            ZodError,
        );

        assert.throws(
            () => (
                parseStudentOnboardingBody({
                    ...validBody,

                    projectIdea:
                        'a'.repeat(101),
                })
            ),
            ZodError,
        );
    },
);

test(
    'parseStudentOnboardingBody rejects unknown fields',
    () => {
        assert.throws(
            () => (
                parseStudentOnboardingBody({
                    ...validBody,
                    unexpected: true,
                })
            ),
            ZodError,
        );
    },
);
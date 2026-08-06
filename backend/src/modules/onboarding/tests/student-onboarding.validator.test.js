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
        'programming_fundamentals',
    topicIds: [
        1,
        2,
        4,
    ],
};

test(
    'parseStudentOnboardingBody accepts valid preferences',
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
    'parseStudentOnboardingBody requires at least one topic',
    () => {
        assert.throws(
            () => (
                parseStudentOnboardingBody({
                    ...validBody,
                    topicIds: [],
                })
            ),
            ZodError,
        );
    },
);

test(
    'parseStudentOnboardingBody rejects duplicated topics',
    () => {
        assert.throws(
            () => (
                parseStudentOnboardingBody({
                    ...validBody,
                    topicIds: [
                        1,
                        1,
                    ],
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
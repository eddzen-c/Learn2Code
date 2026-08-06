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
    studyPace: 'student',
    interestKeys: [
        'video_games',
        'music',
    ],
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
    'parseStudentOnboardingBody accepts the build product goal',
    () => {
        const result =
            parseStudentOnboardingBody({
                ...validBody,
                learningGoal:
                    'build_product',
            });

        assert.equal(
            result.learningGoal,
            'build_product',
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
    'parseStudentOnboardingBody rejects an invalid study pace',
    () => {
        assert.throws(
            () => (
                parseStudentOnboardingBody({
                    ...validBody,
                    studyPace:
                        'unsupported_pace',
                })
            ),
            ZodError,
        );
    },
);

test(
    'parseStudentOnboardingBody requires at least one interest',
    () => {
        assert.throws(
            () => (
                parseStudentOnboardingBody({
                    ...validBody,
                    interestKeys: [],
                })
            ),
            ZodError,
        );
    },
);

test(
    'parseStudentOnboardingBody accepts at most three interests',
    () => {
        assert.throws(
            () => (
                parseStudentOnboardingBody({
                    ...validBody,
                    interestKeys: [
                        'video_games',
                        'music',
                        'sports_fitness',
                        'finance_crypto',
                    ],
                })
            ),
            ZodError,
        );
    },
);

test(
    'parseStudentOnboardingBody rejects duplicated interests',
    () => {
        assert.throws(
            () => (
                parseStudentOnboardingBody({
                    ...validBody,
                    interestKeys: [
                        'music',
                        'music',
                    ],
                })
            ),
            ZodError,
        );
    },
);

test(
    'parseStudentOnboardingBody rejects unsupported interests',
    () => {
        assert.throws(
            () => (
                parseStudentOnboardingBody({
                    ...validBody,
                    interestKeys: [
                        'unsupported_interest',
                    ],
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
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createDiagnosticAssessmentRecord,
    findActiveDiagnosticAssessmentByUserId,
    getNextDiagnosticAttemptNumber,
    incrementDiagnosticAnsweredCount,
    markDiagnosticAssessmentFailed,
    markDiagnosticAssessmentInProgress,
    findLatestDiagnosticAssessmentByUserId,
} from '../repositories/diagnostic-assessment.repository.js';

const assessmentRow = (overrides = {}) => ({
    id: 'assessment-1',
    user_id: 'user-1',
    language_id: 1,
    prompt_version_id: null,
    attempt_number: 1,
    status: 'generating',
    question_count: 0,
    answered_count: 0,
    overall_score: null,
    resulting_difficulty_id: null,
    model_name:
        'learn2code-mock-diagnostic-v1',
    generation_metadata: {
        provider: 'mock',
    },
    started_at: null,
    completed_at: null,
    expires_at: null,
    created_at:
        new Date('2026-07-25T12:00:00Z'),
    updated_at:
        new Date('2026-07-25T12:00:00Z'),
    ...overrides,
});

const createClient = (rows) => {
    const calls = [];

    return {
        calls,

        query: async (query) => {
            calls.push(query);

            return {
                rows,
            };
        },
    };
};

test(
    'findActiveDiagnosticAssessmentByUserId maps an assessment',
    async () => {
        const client = createClient([
            assessmentRow({
                overall_score: '87.50',
            }),
        ]);

        const assessment =
            await findActiveDiagnosticAssessmentByUserId({
                userId: 'user-1',
                client,
            });

        assert.equal(
            assessment.id,
            'assessment-1',
        );

        assert.equal(
            assessment.overallScore,
            87.5,
        );

        assert.deepEqual(
            client.calls[0].values[0],
            'user-1',
        );

        assert.deepEqual(
            client.calls[0].values[1],
            [
                'pending',
                'generating',
                'in_progress',
                'evaluating',
            ],
        );

        assert.ok(Object.isFrozen(assessment));
    },
);

test(
    'findActiveDiagnosticAssessmentByUserId returns null',
    async () => {
        const client = createClient([]);

        const assessment =
            await findActiveDiagnosticAssessmentByUserId({
                userId: 'user-without-diagnostic',
                client,
            });

        assert.equal(assessment, null);
    },
);

test(
    'getNextDiagnosticAttemptNumber returns the next attempt',
    async () => {
        const client = createClient([
            {
                attempt_number: '3',
            },
        ]);

        const attemptNumber =
            await getNextDiagnosticAttemptNumber({
                userId: 'user-1',
                client,
            });

        assert.equal(attemptNumber, 3);

        assert.deepEqual(
            client.calls[0].values,
            ['user-1'],
        );
    },
);

test(
    'createDiagnosticAssessmentRecord creates a generating assessment',
    async () => {
        const client = createClient([
            assessmentRow(),
        ]);

        const generationMetadata = {
            provider: 'mock',
            questionCount: 8,
        };

        const assessment =
            await createDiagnosticAssessmentRecord({
                userId: 'user-1',
                languageId: 1,
                attemptNumber: 1,
                modelName:
                    'learn2code-mock-diagnostic-v1',
                generationMetadata,
                client,
            });

        assert.equal(
            assessment.status,
            'generating',
        );

        assert.deepEqual(
            client.calls[0].values.slice(0, 4),
            [
                'user-1',
                1,
                1,
                'learn2code-mock-diagnostic-v1',
            ],
        );

        assert.equal(
            client.calls[0].values[4],
            JSON.stringify(generationMetadata),
        );
    },
);

test(
    'markDiagnosticAssessmentInProgress updates the assessment',
    async () => {
        const startedAt =
            new Date('2026-07-25T13:00:00Z');

        const client = createClient([
            assessmentRow({
                status: 'in_progress',
                question_count: 8,
                started_at: startedAt,
                updated_at: startedAt,
            }),
        ]);

        const assessment =
            await markDiagnosticAssessmentInProgress({
                assessmentId: 'assessment-1',
                userId: 'user-1',
                questionCount: 8,
                modelName:
                    'learn2code-mock-diagnostic-v1',
                generationMetadata: {
                    provider: 'mock',
                },
                startedAt,
                client,
            });

        assert.equal(
            assessment.status,
            'in_progress',
        );

        assert.equal(
            assessment.questionCount,
            8,
        );

        assert.deepEqual(
            client.calls[0].values,
            [
                'assessment-1',
                'user-1',
                8,
                startedAt,
                'learn2code-mock-diagnostic-v1',
                JSON.stringify({
                    provider: 'mock',
                }),
            ],
        );
    },
);

test(
    'markDiagnosticAssessmentFailed stores failure metadata',
    async () => {
        const failedAt =
            new Date('2026-07-25T14:00:00Z');

        const client = createClient([
            assessmentRow({
                status: 'failed',
                generation_metadata: {
                    provider: 'mock',
                    failureCode:
                        'GENERATION_FAILED',
                },
                updated_at: failedAt,
            }),
        ]);

        const assessment =
            await markDiagnosticAssessmentFailed({
                assessmentId: 'assessment-1',
                userId: 'user-1',
                failureMetadata: {
                    failureCode:
                        'GENERATION_FAILED',
                },
                failedAt,
                client,
            });

        assert.equal(
            assessment.status,
            'failed',
        );

        assert.deepEqual(
            assessment.generationMetadata,
            {
                provider: 'mock',
                failureCode:
                    'GENERATION_FAILED',
            },
        );

        assert.equal(
            client.calls[0].values[2],
            JSON.stringify({
                failureCode:
                    'GENERATION_FAILED',
            }),
        );
    },
);

test(
    'incrementDiagnosticAnsweredCount updates progress',
    async () => {
        const updatedAt =
            new Date('2026-07-25T18:00:00Z');

        const client = createClient([
            assessmentRow({
                status: 'in_progress',
                question_count: 8,
                answered_count: 3,
                updated_at: updatedAt,
            }),
        ]);

        const assessment =
            await incrementDiagnosticAnsweredCount({
                assessmentId: 'assessment-1',
                userId: 'user-1',
                updatedAt,
                client,
            });

        assert.equal(
            assessment.questionCount,
            8,
        );

        assert.equal(
            assessment.answeredCount,
            3,
        );

        assert.deepEqual(
            client.calls[0].values,
            [
                'assessment-1',
                'user-1',
                updatedAt,
            ],
        );
    },
);

test(
    'findLatestDiagnosticAssessmentByUserId returns the latest assessment',
    async () => {
        const client = createClient([
            assessmentRow({
                attempt_number: 2,
                status: 'completed',
                question_count: 8,
                answered_count: 8,
                overall_score: '87.50',
                resulting_difficulty_id: 3,
                completed_at:
                    new Date(
                        '2026-07-25T22:00:00Z',
                    ),
            }),
        ]);

        const assessment =
            await findLatestDiagnosticAssessmentByUserId({
                userId: 'user-1',
                client,
            });

        assert.equal(
            assessment.attemptNumber,
            2,
        );

        assert.equal(
            assessment.status,
            'completed',
        );

        assert.equal(
            assessment.overallScore,
            87.5,
        );

        assert.equal(
            assessment.resultingDifficultyId,
            3,
        );

        assert.deepEqual(
            client.calls[0].values,
            ['user-1'],
        );
    },
);
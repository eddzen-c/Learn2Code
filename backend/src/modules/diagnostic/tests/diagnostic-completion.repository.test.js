import assert from 'node:assert/strict';
import test from 'node:test';

import {
    completeDiagnosticAssessmentRecord,
    getDiagnosticScoreSummary,
    listDiagnosticTopicScores,
    upsertKnowledgeStateRecord,
    upsertLearningProfileFromDiagnostic,
} from '../repositories/diagnostic-completion.repository.js';

const completedAt =
    new Date('2026-07-25T20:00:00Z');

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
    'getDiagnosticScoreSummary maps the overall result',
    async () => {
        const client = createClient([
            {
                evaluated_count: '8',
                overall_score: '75.50',
            },
        ]);

        const summary =
            await getDiagnosticScoreSummary({
                assessmentId: 'assessment-1',
                userId: 'user-1',
                client,
            });

        assert.deepEqual(summary, {
            evaluatedCount: 8,
            overallScore: 75.5,
        });

        assert.deepEqual(
            client.calls[0].values,
            [
                'assessment-1',
                'user-1',
            ],
        );
    },
);

test(
    'listDiagnosticTopicScores maps topic results',
    async () => {
        const client = createClient([
            {
                topic_id: 1,
                evaluated_count: '2',
                mastery_score: '100.00',
            },
            {
                topic_id: 2,
                evaluated_count: '2',
                mastery_score: '50.00',
            },
        ]);

        const topicScores =
            await listDiagnosticTopicScores({
                assessmentId: 'assessment-1',
                userId: 'user-1',
                client,
            });

        assert.deepEqual(topicScores, [
            {
                topicId: 1,
                evaluatedCount: 2,
                masteryScore: 100,
            },
            {
                topicId: 2,
                evaluatedCount: 2,
                masteryScore: 50,
            },
        ]);

        assert.ok(
            Object.isFrozen(topicScores),
        );
    },
);

test(
    'upsertKnowledgeStateRecord stores topic mastery',
    async () => {
        const client = createClient([
            {
                id: 'knowledge-1',
                user_id: 'user-1',
                topic_id: 1,
                mastery_score: '80.00',
                confidence_score: '50.00',
                attempts_count: 2,
                last_evaluated_at:
                    completedAt,
            },
        ]);

        const state =
            await upsertKnowledgeStateRecord({
                userId: 'user-1',
                topicId: 1,
                masteryScore: 80,
                confidenceScore: 50,
                attemptsCount: 2,
                evaluatedAt: completedAt,
                client,
            });

        assert.equal(
            state.masteryScore,
            80,
        );

        assert.equal(
            state.confidenceScore,
            50,
        );

        assert.equal(
            state.attemptsCount,
            2,
        );

        assert.deepEqual(
            client.calls[0].values,
            [
                'user-1',
                1,
                80,
                50,
                2,
                completedAt,
            ],
        );
    },
);

test(
    'completeDiagnosticAssessmentRecord completes the assessment',
    async () => {
        const client = createClient([
            {
                id: 'assessment-1',
                user_id: 'user-1',
                status: 'completed',
                question_count: 8,
                answered_count: 8,
                overall_score: '75.00',
                resulting_difficulty_id: 2,
                completed_at: completedAt,
            },
        ]);

        const assessment =
            await completeDiagnosticAssessmentRecord({
                assessmentId: 'assessment-1',
                userId: 'user-1',
                overallScore: 75,
                resultingDifficultyId: 2,
                completedAt,
                client,
            });

        assert.equal(
            assessment.status,
            'completed',
        );

        assert.equal(
            assessment.overallScore,
            75,
        );

        assert.equal(
            assessment.resultingDifficultyId,
            2,
        );

        assert.deepEqual(
            client.calls[0].values,
            [
                'assessment-1',
                'user-1',
                75,
                2,
                completedAt,
            ],
        );
    },
);

test(
    'upsertLearningProfileFromDiagnostic updates the profile',
    async () => {
        const client = createClient([
            {
                user_id: 'user-1',
                current_difficulty_id: 2,
                diagnostic_completed_at:
                    completedAt,
                last_diagnostic_assessment_id:
                    'assessment-1',
                updated_at: completedAt,
            },
        ]);

        const profile =
            await upsertLearningProfileFromDiagnostic({
                userId: 'user-1',
                difficultyId: 2,
                assessmentId: 'assessment-1',
                completedAt,
                client,
            });

        assert.equal(
            profile.currentDifficultyId,
            2,
        );

        assert.equal(
            profile.lastDiagnosticAssessmentId,
            'assessment-1',
        );

        assert.deepEqual(
            client.calls[0].values,
            [
                'user-1',
                2,
                completedAt,
                'assessment-1',
            ],
        );
    },
);
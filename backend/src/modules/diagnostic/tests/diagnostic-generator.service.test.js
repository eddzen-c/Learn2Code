import assert from 'node:assert/strict';
import test from 'node:test';

import {
    ActiveDiagnosticAssessmentError,
    DiagnosticCatalogUnavailableError,
    DiagnosticProviderUnavailableError,
    UnsupportedDiagnosticLanguageError,
} from '../errors/diagnostic.errors.js';

import {
    generateDiagnosticQuestions,
} from '../services/diagnostic-generator.service.js';

const input = {
    userId: 'diagnostic-student',
    language: {
        id: 1,
        name: 'JavaScript',
        fileExtension: '.js',
    },
    topics: [
        {
            id: 1,
            name: 'variables',
        },
        {
            id: 2,
            name: 'condicionales',
        },
    ],
    difficultyLevels: [
        {
            id: 1,
            name: 'básico',
        },
        {
            id: 2,
            name: 'intermedio',
        },
    ],
    questionCount: 4,
};

test(
    'generateDiagnosticQuestions uses the mock provider',
    async () => {
        const result =
            await generateDiagnosticQuestions({
                ...input,
                providerName: 'mock',
            });

        assert.equal(result.provider, 'mock');

        assert.equal(
            result.model,
            'learn2code-mock-diagnostic-v1',
        );

        assert.equal(
            result.questions.length,
            4,
        );
    },
);

test(
    'generateDiagnosticQuestions rejects an unavailable provider',
    async () => {
        await assert.rejects(
            () => (
                generateDiagnosticQuestions({
                    ...input,
                    providerName: 'unknown',
                })
            ),
            (error) => {
                assert.ok(
                    error
                    instanceof
                    DiagnosticProviderUnavailableError,
                );

                assert.equal(
                    error.code,
                    'DIAGNOSTIC_PROVIDER_UNAVAILABLE',
                );

                assert.equal(
                    error.statusCode,
                    503,
                );

                assert.equal(
                    error.providerName,
                    'unknown',
                );

                return true;
            },
        );
    },
);

test(
    'diagnostic errors expose HTTP information',
    () => {
        const errors = [
            new ActiveDiagnosticAssessmentError(),
            new UnsupportedDiagnosticLanguageError(),
            new DiagnosticCatalogUnavailableError(),
        ];

        assert.deepEqual(
            errors.map((error) => ({
                code: error.code,
                statusCode: error.statusCode,
            })),
            [
                {
                    code:
                        'ACTIVE_DIAGNOSTIC_ASSESSMENT',
                    statusCode: 409,
                },
                {
                    code:
                        'UNSUPPORTED_DIAGNOSTIC_LANGUAGE',
                    statusCode: 400,
                },
                {
                    code:
                        'DIAGNOSTIC_CATALOG_UNAVAILABLE',
                    statusCode: 503,
                },
            ],
        );
    },
);
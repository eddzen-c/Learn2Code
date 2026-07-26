import assert from 'node:assert/strict';
import test from 'node:test';

import {
    parseStartDiagnosticBody,
} from '../validators/start-diagnostic.validator.js';

test(
    'parseStartDiagnosticBody accepts a language ID',
    () => {
        const result =
            parseStartDiagnosticBody({
                languageId: 1,
            });

        assert.deepEqual(result, {
            languageId: 1,
        });
    },
);

test(
    'parseStartDiagnosticBody rejects invalid language IDs',
    () => {
        const invalidValues = [
            0,
            -1,
            1.5,
            '1',
            null,
        ];

        invalidValues.forEach(
            (languageId) => {
                assert.throws(
                    () => (
                        parseStartDiagnosticBody({
                            languageId,
                        })
                    ),
                );
            },
        );
    },
);

test(
    'parseStartDiagnosticBody rejects unexpected properties',
    () => {
        assert.throws(
            () => (
                parseStartDiagnosticBody({
                    languageId: 1,
                    userId: 'another-user',
                })
            ),
        );
    },
);
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    parseStartDiagnosticBody,
} from '../validators/start-diagnostic.validator.js';

test(
    'parseStartDiagnosticBody accepts an empty body',
    () => {
        const result =
            parseStartDiagnosticBody({});

        assert.deepEqual(result, {});
    },
);

test(
    'parseStartDiagnosticBody accepts an undefined body',
    () => {
        const result =
            parseStartDiagnosticBody();

        assert.deepEqual(result, {});
    },
);

test(
    'parseStartDiagnosticBody rejects unexpected properties',
    () => {
        assert.throws(
            () => (
                parseStartDiagnosticBody({
                    languageId: 1,
                })
            ),
        );
    },
);
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    findActiveSupportedLanguageById,
} from '../repositories/supported-language.repository.js';

test('findActiveSupportedLanguageById maps a language', async () => {
    const client = {
        async query(query) {
            assert.match(
                query.text,
                /FROM supported_languages/,
            );

            assert.deepEqual(
                query.values,
                [2],
            );

            return {
                rows: [{
                    id: 2,
                    name: 'Python',
                    file_extension: '.py',
                    sandbox_image:
                        'learn2code-sandbox-python:3.12',
                }],
            };
        },
    };

    const result =
        await findActiveSupportedLanguageById({
            languageId: 2,
            client,
        });

    assert.deepEqual(result, {
        id: 2,
        name: 'Python',
        fileExtension: '.py',
        sandboxImage:
            'learn2code-sandbox-python:3.12',
    });
});

test('findActiveSupportedLanguageById returns null when missing', async () => {
    const client = {
        async query() {
            return {
                rows: [],
            };
        },
    };

    const result =
        await findActiveSupportedLanguageById({
            languageId: 999,
            client,
        });

    assert.equal(result, null);
});
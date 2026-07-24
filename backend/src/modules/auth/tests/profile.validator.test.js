import assert from 'node:assert/strict';
import test from 'node:test';

import {
    parseUpdateProfileBody,
} from '../validators/profile.validator.js';

test('profile validator parses all fields', () => {
    const result = parseUpdateProfileBody({
        fullName: '  Ada Lovelace  ',
        preferredLocale: 'es-MX',
        preferredProgrammingLanguageId: 2,
    });

    assert.deepEqual(result, {
        fullName: 'Ada Lovelace',
        preferredLocale: 'es-MX',
        preferredProgrammingLanguageId: 2,
    });
});

test('profile validator accepts partial updates', () => {
    assert.deepEqual(
        parseUpdateProfileBody({
            fullName: 'Grace Hopper',
        }),
        {
            fullName: 'Grace Hopper',
        },
    );

    assert.deepEqual(
        parseUpdateProfileBody({
            preferredProgrammingLanguageId: null,
        }),
        {
            preferredProgrammingLanguageId: null,
        },
    );
});

test('profile validator rejects an empty body', () => {
    assert.throws(
        () => parseUpdateProfileBody({}),
        /At least one profile field is required/,
    );
});

test('profile validator rejects an invalid locale', () => {
    assert.throws(
        () => parseUpdateProfileBody({
            preferredLocale: 'spanish',
        }),
        /Locale must use a format such as es-MX/,
    );
});

test('profile validator rejects unknown fields', () => {
    assert.throws(
        () => parseUpdateProfileBody({
            email: 'new-email@example.com',
        }),
    );
});
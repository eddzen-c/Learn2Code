
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    parseUpdateProfileBody,
} from '../validators/profile.validator.js';

test('accepts and normalizes profile fields', () => {
    const result = parseUpdateProfileBody({
        fullName: ' Ada Lovelace ',
        username: ' Ada_Code ',
        bio: ' Aprendiendo programación ',
        githubUrl: 'https://github.com/ada',
        portfolioUrl: 'https://example.com',
    });

    assert.equal(result.fullName, 'Ada Lovelace');
    assert.equal(result.username, 'ada_code');
    assert.equal(result.bio, 'Aprendiendo programación');
    assert.equal(result.githubUrl, 'https://github.com/ada');
    assert.equal(result.portfolioUrl, 'https://example.com');
});

test('allows clearing optional profile fields', () => {
    const result = parseUpdateProfileBody({
        username: null,
        bio: null,
        githubUrl: null,
        portfolioUrl: null,
    });

    assert.equal(result.username, null);
    assert.equal(result.bio, null);
    assert.equal(result.githubUrl, null);
    assert.equal(result.portfolioUrl, null);
});

test('rejects invalid usernames', () => {
    assert.throws(() => {
        parseUpdateProfileBody({
            username: 'usuario con espacios',
        });
    });
});

test('rejects invalid profile URLs', () => {
    assert.throws(() => {
        parseUpdateProfileBody({
            githubUrl: 'https://example.com/usuario',
        });
    });

    assert.throws(() => {
        parseUpdateProfileBody({
            portfolioUrl: 'javascript:alert(1)',
        });
    });
});

test('preserves existing profile fields', () => {
    const result = parseUpdateProfileBody({
        fullName: 'Ada Lovelace',
        preferredLocale: 'es-MX',
        preferredProgrammingLanguageId: 1,
    });

    assert.equal(result.fullName, 'Ada Lovelace');
    assert.equal(result.preferredLocale, 'es-MX');
    assert.equal(
        result.preferredProgrammingLanguageId,
        1,
    );
});

test('rejects empty requests and unknown fields', () => {
    assert.throws(() => {
        parseUpdateProfileBody({});
    });

    assert.throws(() => {
        parseUpdateProfileBody({
            isAdmin: true,
        });
    });
});

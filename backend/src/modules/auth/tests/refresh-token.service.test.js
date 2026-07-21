import assert from 'node:assert/strict';
import test from 'node:test';

import { env } from '../../../config/env.js';
import {
    hashRefreshToken,
    issueRefreshToken,
} from '../services/refresh-token.service.js';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

test('issueRefreshToken creates a random secure token', () => {
    const issuedToken = issueRefreshToken();

    assert.match(
        issuedToken.token,
        /^[A-Za-z0-9_-]+$/,
    );

    assert.ok(issuedToken.token.length >= 80);

    assert.match(
        issuedToken.tokenHash,
        /^[a-f0-9]{64}$/,
    );

    assert.equal(
        hashRefreshToken(issuedToken.token),
        issuedToken.tokenHash,
    );
});

test('issueRefreshToken creates different tokens', () => {
    const firstToken = issueRefreshToken();
    const secondToken = issueRefreshToken();

    assert.notEqual(
        firstToken.token,
        secondToken.token,
    );

    assert.notEqual(
        firstToken.tokenHash,
        secondToken.tokenHash,
    );
});

test('issueRefreshToken calculates its expiration', () => {
    const now = new Date('2026-07-21T12:00:00.000Z');

    const issuedToken = issueRefreshToken({ now });

    const expectedExpiration = new Date(
        now.getTime()
        + (
            env.auth.refreshTokenTtlDays
            * MILLISECONDS_PER_DAY
        ),
    );

    assert.equal(
        issuedToken.expiresAt.toISOString(),
        expectedExpiration.toISOString(),
    );
});

test('hashRefreshToken is deterministic', () => {
    const token = issueRefreshToken().token;

    assert.equal(
        hashRefreshToken(token),
        hashRefreshToken(token),
    );
});

test('refresh token service rejects invalid values', () => {
    assert.throws(
        () => hashRefreshToken(''),
        /must be a non-empty string/,
    );

    assert.throws(
        () => hashRefreshToken(null),
        /must be a non-empty string/,
    );

    assert.throws(
        () => issueRefreshToken({
            now: new Date('invalid'),
        }),
        /Now must be a valid Date/,
    );
});
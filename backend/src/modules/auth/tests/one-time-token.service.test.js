import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createOneTimeToken,
    hashOneTimeToken,
} from '../services/one-time-token.service.js';

test(
    'createOneTimeToken creates a secure token and its hash',
    () => {
        const result =
            createOneTimeToken();

        assert.match(
            result.token,
            /^[A-Za-z0-9_-]+$/,
        );

        assert.equal(
            result.tokenHash.length,
            64,
        );

        assert.equal(
            result.tokenHash,
            hashOneTimeToken(
                result.token,
            ),
        );

        assert.notEqual(
            result.token,
            result.tokenHash,
        );

        assert.equal(
            Object.isFrozen(result),
            true,
        );
    },
);

test(
    'createOneTimeToken creates unique values',
    () => {
        const first =
            createOneTimeToken();

        const second =
            createOneTimeToken();

        assert.notEqual(
            first.token,
            second.token,
        );

        assert.notEqual(
            first.tokenHash,
            second.tokenHash,
        );
    },
);

test(
    'hashOneTimeToken rejects invalid tokens',
    () => {
        assert.throws(
            () => hashOneTimeToken(''),
            TypeError,
        );

        assert.throws(
            () => hashOneTimeToken('   '),
            TypeError,
        );

        assert.throws(
            () => hashOneTimeToken(null),
            TypeError,
        );
    },
);

import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';

import app from '../../../app.js';

test('legacy email verification links cannot verify accounts', async () => {
    const response = await request(app)
        .post('/api/v1/auth/email-verification/confirm')
        .send({
            token: 'any-old-verification-token',
        });

    assert.equal(response.status, 410);

    assert.equal(
        response.body.code,
        'EMAIL_VERIFICATION_LINK_DISABLED',
    );
});

test('legacy verification requests are not available', async () => {
    const response = await request(app)
        .post('/api/v1/auth/email-verification/request')
        .send({});

    assert.equal(response.status, 401);
});

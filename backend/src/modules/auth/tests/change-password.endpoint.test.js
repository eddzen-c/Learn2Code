
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import request from 'supertest';

import app from '../../../app.js';

import {
    createAccessToken,
} from '../services/access-token.service.js';

const endpoint = '/api/v1/auth/me/password';

const validBody = {
    currentPassword: 'PasswordAnterior123!',
    newPassword: 'PasswordNueva456!',
    confirmPassword: 'PasswordNueva456!',
};

const createAuthorizationHeader = async () => {
    const token = await createAccessToken({
        userId: randomUUID(),
        roles: ['student'],
    });

    return `Bearer ${token}`;
};

test('rejects anonymous password changes', async () => {
    const response = await request(app)
        .patch(endpoint)
        .send(validBody);

    assert.equal(response.status, 401);
    assert.equal(
        response.body.code,
        'AUTHENTICATION_REQUIRED',
    );
});

test('rejects invalid access tokens', async () => {
    const response = await request(app)
        .patch(endpoint)
        .set('Authorization', 'Bearer invalid-token')
        .send(validBody);

    assert.equal(response.status, 401);
    assert.equal(
        response.body.code,
        'AUTHENTICATION_REQUIRED',
    );
});

test('rejects mismatched passwords before database access', async () => {
    const authorization =
        await createAuthorizationHeader();

    const response = await request(app)
        .patch(endpoint)
        .set('Authorization', authorization)
        .send({
            ...validBody,
            confirmPassword: 'OtraPassword456!',
        });

    assert.equal(response.status, 400);
    assert.equal(
        response.body.code,
        'VALIDATION_ERROR',
    );
});

test('rejects unexpected user IDs in the request', async () => {
    const authorization =
        await createAuthorizationHeader();

    const response = await request(app)
        .patch(endpoint)
        .set('Authorization', authorization)
        .send({
            ...validBody,
            userId: randomUUID(),
        });

    assert.equal(response.status, 400);
    assert.equal(
        response.body.code,
        'VALIDATION_ERROR',
    );
});

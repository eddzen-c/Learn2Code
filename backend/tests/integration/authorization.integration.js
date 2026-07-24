import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import express from 'express';
import request from 'supertest';

import {
    requireAuthentication,
} from '../../src/modules/auth/middlewares/authentication.middleware.js';

import {
    requireRoles,
} from '../../src/modules/auth/middlewares/authorization.middleware.js';

import {
    createAccessToken,
} from '../../src/modules/auth/services/access-token.service.js';

const app = express();

app.get(
    '/admin',
    requireAuthentication,
    requireRoles('admin'),
    (req, res) => {
        res.status(200).json({
            status: 'success',
            data: {
                userId: req.auth.userId,
                roles: req.auth.roles,
            },
        });
    },
);

app.use((error, _req, res, _next) => {
    res.status(error.statusCode ?? 500).json({
        status: 'error',
        code: error.code ?? 'INTERNAL_ERROR',
        message:
            error.message ?? 'Internal server error',
    });
});

test('authentication and role middleware protect a route', async () => {
    const adminUserId = randomUUID();

    const adminToken = await createAccessToken({
        userId: adminUserId,
        roles: ['admin'],
    });

    const studentToken = await createAccessToken({
        userId: randomUUID(),
        roles: ['student'],
    });

    const adminResponse = await request(app)
        .get('/admin')
        .set(
            'Authorization',
            `Bearer ${adminToken}`,
        );

    assert.equal(adminResponse.status, 200);

    assert.equal(
        adminResponse.body.data.userId,
        adminUserId,
    );

    assert.deepEqual(
        adminResponse.body.data.roles,
        ['admin'],
    );

    const studentResponse = await request(app)
        .get('/admin')
        .set(
            'Authorization',
            `Bearer ${studentToken}`,
        );

    assert.equal(studentResponse.status, 403);

    assert.equal(
        studentResponse.body.code,
        'INSUFFICIENT_PERMISSIONS',
    );

    const anonymousResponse = await request(app)
        .get('/admin');

    assert.equal(anonymousResponse.status, 401);

    assert.equal(
        anonymousResponse.body.code,
        'AUTHENTICATION_REQUIRED',
    );
});
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import request from 'supertest';

import app from '../../../app.js';

import {
    redisClient,
    connectRedis,
    closeRedisConnection,
} from '../../../config/redis.js';

import {
    createAccessToken,
} from '../services/access-token.service.js';

// ============================================================
// ENDPOINTS DEL CAMBIO DE CORREO
// ============================================================

const requestEndpoint =
    '/api/v1/auth/me/email-change/request';

const confirmEndpoint =
    '/api/v1/auth/me/email-change/confirm';

const validRequestBody = {
    newEmail: 'nuevo@example.com',
    currentPassword: 'Actual123!',
};

const validConfirmationBody = {
    code: '123456',
};

// ============================================================
// TOKEN DE ACCESO PARA PRUEBAS DE VALIDACION
// ============================================================

const createAuthorizationHeader = async () => {
    const token = await createAccessToken({
        userId: randomUUID(),
        roles: ['student'],
    });

    return `Bearer ${token}`;
};

// ============================================================
// PREPARAR REDIS PARA LAS PRUEBAS HTTP
// ============================================================

test.before(async () => {
    await connectRedis();
});

// ============================================================
// CERRAR REDIS AL TERMINAR TODAS LAS PRUEBAS
// ============================================================

test.after(async () => {
    await closeRedisConnection();
});

// ============================================================
// 1. RECHAZAR SOLICITUDES SIN AUTENTICACION
// ============================================================

test('rejects anonymous email change requests', async () => {
    const response = await request(app)
        .post(requestEndpoint)
        .send(validRequestBody);

    assert.equal(response.status, 401);

    assert.equal(
        response.body.code,
        'AUTHENTICATION_REQUIRED',
    );
});

// ============================================================
// 2. RECHAZAR CONFIRMACIONES SIN AUTENTICACION
// ============================================================

test('rejects anonymous email change confirmations', async () => {
    const response = await request(app)
        .post(confirmEndpoint)
        .send(validConfirmationBody);

    assert.equal(response.status, 401);

    assert.equal(
        response.body.code,
        'AUTHENTICATION_REQUIRED',
    );
});

// ============================================================
// 3. RECHAZAR TOKENS DE ACCESO INVALIDOS
// ============================================================

test('rejects invalid access tokens on both email change endpoints', async () => {
    for (const endpoint of [
        requestEndpoint,
        confirmEndpoint,
    ]) {
        const response = await request(app)
            .post(endpoint)
            .set(
                'Authorization',
                'Bearer invalid-token',
            )
            .send(
                endpoint === requestEndpoint
                    ? validRequestBody
                    : validConfirmationBody,
            );

        assert.equal(response.status, 401);

        assert.equal(
            response.body.code,
            'AUTHENTICATION_REQUIRED',
        );
    }
});

// ============================================================
// 4. RECHAZAR DIRECCIONES DE CORREO INVALIDAS
// ============================================================

test('rejects invalid email addresses before database access', async () => {
    const authorization =
        await createAuthorizationHeader();

    const invalidEmails = [
        '',
        'correo-invalido',
        `${'a'.repeat(245)}@example.com`,
    ];

    for (const newEmail of invalidEmails) {
        const response = await request(app)
            .post(requestEndpoint)
            .set('Authorization', authorization)
            .send({
                ...validRequestBody,
                newEmail,
            });

        assert.equal(response.status, 400);

        assert.equal(
            response.body.code,
            'VALIDATION_ERROR',
        );
    }
});

// ============================================================
// 5. VALIDAR LA CONTRASEÑA ACTUAL
// ============================================================

test('rejects missing, empty or oversized current passwords', async () => {
    const authorization =
        await createAuthorizationHeader();

    const invalidBodies = [
        {
            newEmail: 'nuevo@example.com',
        },
        {
            newEmail: 'nuevo@example.com',
            currentPassword: '',
        },
        {
            newEmail: 'nuevo@example.com',
            currentPassword: 'a'.repeat(73),
        },
    ];

    for (const body of invalidBodies) {
        const response = await request(app)
            .post(requestEndpoint)
            .set('Authorization', authorization)
            .send(body);

        assert.equal(response.status, 400);

        assert.equal(
            response.body.code,
            'VALIDATION_ERROR',
        );
    }
});

// ============================================================
// 6. RECHAZAR CAMPOS ADICIONALES EN LA SOLICITUD
// ============================================================

test('rejects unexpected user IDs in email change requests', async () => {
    const authorization =
        await createAuthorizationHeader();

    const response = await request(app)
        .post(requestEndpoint)
        .set('Authorization', authorization)
        .send({
            ...validRequestBody,
            userId: randomUUID(),
        });

    assert.equal(response.status, 400);

    assert.equal(
        response.body.code,
        'VALIDATION_ERROR',
    );
});

// ============================================================
// 7. RECHAZAR CODIGOS DE CONFIRMACION INVALIDOS
// ============================================================

test('rejects malformed email change confirmation codes', async () => {
    const authorization =
        await createAuthorizationHeader();

    const invalidCodes = [
        '',
        '12345',
        '1234567',
        'abcdef',
        ' 123456',
    ];

    for (const code of invalidCodes) {
        const response = await request(app)
            .post(confirmEndpoint)
            .set('Authorization', authorization)
            .send({ code });

        assert.equal(response.status, 400);

        assert.equal(
            response.body.code,
            'VALIDATION_ERROR',
        );
    }
});

// ============================================================
// 8. RECHAZAR CAMPOS ADICIONALES EN LA CONFIRMACION
// ============================================================

test('rejects unexpected fields in email change confirmations', async () => {
    const authorization =
        await createAuthorizationHeader();

    const response = await request(app)
        .post(confirmEndpoint)
        .set('Authorization', authorization)
        .send({
            ...validConfirmationBody,
            userId: randomUUID(),
        });

    assert.equal(response.status, 400);

    assert.equal(
        response.body.code,
        'VALIDATION_ERROR',
    );
});

// ============================================================
// 9. BLOQUEAR SOLICITUDES AL AGOTAR LA CUOTA EN REDIS
// ============================================================

test(
    'returns HTTP 429 when the email change request quota is exhausted',
    async () => {
        const userId = randomUUID();

        const quotaKey =
            `learn2code:email-change:request:account:${userId}`;

        const token = await createAccessToken({
            userId,
            roles: ['student'],
        });

        try {
            // Preparar únicamente el contador temporal
            // de este usuario de prueba.
            await redisClient.set(
                quotaKey,
                '6',
                { EX: 120 },
            );

            const response = await request(app)
                .post(requestEndpoint)
                .set(
                    'Authorization',
                    `Bearer ${token}`,
                )
                .send(validRequestBody);

            assert.equal(response.status, 429);

            assert.equal(
                response.body.code,
                'EMAIL_CHANGE_RATE_LIMITED',
            );

            const retryAfter = Number(
                response.headers['retry-after'],
            );

            assert.ok(Number.isInteger(retryAfter));

            assert.ok(retryAfter >= 1);

            assert.ok(retryAfter <= 120);
        } finally {
            // Eliminar solo el contador temporal.
            await redisClient.del(quotaKey);
        }
    },
);

// ============================================================
// 10. BLOQUEAR CONFIRMACIONES AL AGOTAR LA CUOTA
// ============================================================

test(
    'returns HTTP 429 when the email change confirmation quota is exhausted',
    async () => {
        const userId = randomUUID();

        const quotaKey =
            `learn2code:email-change:confirm:account:${userId}`;

        const token = await createAccessToken({
            userId,
            roles: ['student'],
        });

        try {
            // Simular que este usuario temporal
            // ya consumió sus 30 confirmaciones.
            await redisClient.set(
                quotaKey,
                '30',
                { EX: 120 },
            );

            const response = await request(app)
                .post(confirmEndpoint)
                .set(
                    'Authorization',
                    `Bearer ${token}`,
                )
                .send(validConfirmationBody);

            assert.equal(response.status, 429);

            assert.equal(
                response.body.code,
                'EMAIL_CHANGE_RATE_LIMITED',
            );

            const retryAfter = Number(
                response.headers['retry-after'],
            );

            assert.ok(Number.isInteger(retryAfter));

            assert.ok(retryAfter >= 1);

            assert.ok(retryAfter <= 120);
        } finally {
            // Eliminar solo el contador temporal.
            await redisClient.del(quotaKey);
        }
    },
);
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import request from 'supertest';

import app from '../../src/app.js';

import {
    closeDatabaseConnection,
    databasePool,
} from '../../src/config/database.js';

import {
    createEmailVerificationTokenRecord,
    deletePendingEmailVerificationTokens,
} from '../../src/modules/auth/repositories/email-verification.repository.js';

import {
    createPasswordResetRequestRecord,
    deletePendingPasswordResetRequests,
} from '../../src/modules/auth/repositories/password-reset.repository.js';

import {
    createOneTimeToken,
} from '../../src/modules/auth/services/one-time-token.service.js';

import {
    verifyPassword,
} from '../../src/modules/auth/services/password.service.js';

test(
    'account verification and password recovery work with PostgreSQL',
    async () => {
        const email =
            `recovery-${randomUUID()}@example.test`;

        const originalPassword =
            'Learn2Code-Original-2026!';

        const newPassword =
            'Learn2Code-Updated-2026!';

        let userId;

        try {
            const registrationResponse =
                await request(app)
                    .post('/api/v1/auth/register')
                    .send({
                        fullName:
                            'Recovery Integration Student',
                        email,
                        password:
                            originalPassword,
                    });

            assert.equal(
                registrationResponse.status,
                201,
            );

            assert.equal(
                registrationResponse
                    .body
                    .data
                    .emailVerification
                    .requested,
                true,
            );

            userId =
                registrationResponse
                    .body
                    .data
                    .user
                    .id;

            const accessToken =
                registrationResponse
                    .body
                    .data
                    .accessToken;

            const resendResponse =
                await request(app)
                    .post(
                        '/api/v1/auth/email-verification/request',
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    )
                    .send({});

            assert.equal(
                resendResponse.status,
                202,
            );

            assert.equal(
                resendResponse
                    .body
                    .data
                    .requested,
                true,
            );

            const verificationToken =
                createOneTimeToken();

            await deletePendingEmailVerificationTokens({
                userId,
                client:
                    databasePool,
            });

            await createEmailVerificationTokenRecord({
                userId,
                tokenHash:
                    verificationToken.tokenHash,
                expiresAt:
                    new Date(
                        Date.now()
                        + 60 * 60 * 1000,
                    ),
                client:
                    databasePool,
            });

            const verificationResponse =
                await request(app)
                    .post(
                        '/api/v1/auth/email-verification/confirm',
                    )
                    .send({
                        token:
                            verificationToken.token,
                    });

            assert.equal(
                verificationResponse.status,
                200,
            );

            assert.equal(
                verificationResponse
                    .body
                    .data
                    .verified,
                true,
            );

            assert.equal(
                verificationResponse
                    .body
                    .data
                    .user
                    .email,
                email,
            );

            const reusedVerificationResponse =
                await request(app)
                    .post(
                        '/api/v1/auth/email-verification/confirm',
                    )
                    .send({
                        token:
                            verificationToken.token,
                    });

            assert.equal(
                reusedVerificationResponse.status,
                400,
            );

            assert.equal(
                reusedVerificationResponse
                    .body
                    .code,
                'INVALID_EMAIL_VERIFICATION_TOKEN',
            );

            const verifiedUserResult =
                await databasePool.query({
                    text: `
                        SELECT
                            email_verified_at
                        FROM users
                        WHERE id = $1
                    `,
                    values: [userId],
                });

            assert.ok(
                verifiedUserResult
                    .rows[0]
                    .email_verified_at
                instanceof Date,
            );

            const alreadyVerifiedResponse =
                await request(app)
                    .post(
                        '/api/v1/auth/email-verification/request',
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`,
                    )
                    .send({});

            assert.equal(
                alreadyVerifiedResponse.status,
                200,
            );

            assert.equal(
                alreadyVerifiedResponse
                    .body
                    .data
                    .alreadyVerified,
                true,
            );

            const unknownAccountResponse =
                await request(app)
                    .post(
                        '/api/v1/auth/password-reset/request',
                    )
                    .send({
                        email:
                            `unknown-${randomUUID()
                            }@example.test`,
                    });

            assert.equal(
                unknownAccountResponse.status,
                202,
            );

            assert.deepEqual(
                unknownAccountResponse.body.data,
                {
                    requested: true,
                },
            );

            const resetRequestResponse =
                await request(app)
                    .post(
                        '/api/v1/auth/password-reset/request',
                    )
                    .send({
                        email:
                            email.toUpperCase(),
                    });

            assert.equal(
                resetRequestResponse.status,
                202,
            );

            assert.deepEqual(
                resetRequestResponse.body.data,
                {
                    requested: true,
                },
            );

            const pendingResetResult =
                await databasePool.query({
                    text: `
                        SELECT COUNT(*)::integer
                            AS request_count
                        FROM password_reset_requests
                        WHERE user_id = $1
                            AND used_at IS NULL
                    `,
                    values: [userId],
                });

            assert.equal(
                pendingResetResult
                    .rows[0]
                    .request_count,
                1,
            );

            const resetToken =
                createOneTimeToken();

            await deletePendingPasswordResetRequests({
                userId,
                client:
                    databasePool,
            });

            await createPasswordResetRequestRecord({
                userId,
                tokenHash:
                    resetToken.tokenHash,
                expiresAt:
                    new Date(
                        Date.now()
                        + 60 * 60 * 1000,
                    ),
                requestedIp:
                    '127.0.0.1',
                client:
                    databasePool,
            });

            const loginBeforeReset =
                await request(app)
                    .post('/api/v1/auth/login')
                    .send({
                        email,
                        password:
                            originalPassword,
                    });

            assert.equal(
                loginBeforeReset.status,
                200,
            );

            const resetResponse =
                await request(app)
                    .post(
                        '/api/v1/auth/password-reset/confirm',
                    )
                    .send({
                        token:
                            resetToken.token,
                        newPassword,
                    });

            assert.equal(
                resetResponse.status,
                200,
            );

            assert.deepEqual(
                resetResponse.body.data,
                {
                    reset: true,
                },
            );

            const reusedResetResponse =
                await request(app)
                    .post(
                        '/api/v1/auth/password-reset/confirm',
                    )
                    .send({
                        token:
                            resetToken.token,
                        newPassword:
                            'Another-Password-2026!',
                    });

            assert.equal(
                reusedResetResponse.status,
                400,
            );

            assert.equal(
                reusedResetResponse.body.code,
                'INVALID_PASSWORD_RESET_TOKEN',
            );

            const updatedUserResult =
                await databasePool.query({
                    text: `
                        SELECT password_hash
                        FROM users
                        WHERE id = $1
                    `,
                    values: [userId],
                });

            const passwordHash =
                updatedUserResult
                    .rows[0]
                    .password_hash;

            assert.equal(
                await verifyPassword(
                    originalPassword,
                    passwordHash,
                ),
                false,
            );

            assert.equal(
                await verifyPassword(
                    newPassword,
                    passwordHash,
                ),
                true,
            );

            const activeSessionsResult =
                await databasePool.query({
                    text: `
                        SELECT COUNT(*)::integer
                            AS session_count
                        FROM refresh_tokens
                        WHERE user_id = $1
                    `,
                    values: [userId],
                });

            assert.equal(
                activeSessionsResult
                    .rows[0]
                    .session_count,
                0,
            );

            const oldPasswordLogin =
                await request(app)
                    .post('/api/v1/auth/login')
                    .send({
                        email,
                        password:
                            originalPassword,
                    });

            assert.equal(
                oldPasswordLogin.status,
                401,
            );

            const newPasswordLogin =
                await request(app)
                    .post('/api/v1/auth/login')
                    .send({
                        email,
                        password:
                            newPassword,
                    });

            assert.equal(
                newPasswordLogin.status,
                200,
            );
        } finally {
            try {
                if (userId) {
                    await databasePool.query({
                        text: `
                            DELETE FROM users
                            WHERE id = $1
                        `,
                        values: [userId],
                    });
                }
            } finally {
                await closeDatabaseConnection();
            }
        }
    },
);
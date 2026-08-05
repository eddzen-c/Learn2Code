import {
    databasePool,
} from '../../../config/database.js';

import {
    EmailVerificationUnavailableError,
    InvalidEmailVerificationTokenError,
} from '../errors/account-recovery.errors.js';

import {
    createEmailVerificationTokenRecord,
    deletePendingEmailVerificationTokens,
    verifyEmailWithTokenHash,
} from '../repositories/email-verification.repository.js';

import {
    findUserById,
} from '../repositories/user.repository.js';

import {
    sendEmailVerificationMessage,
} from './auth-email.service.js';

import {
    createOneTimeToken,
    hashOneTimeToken,
} from './one-time-token.service.js';

const EMAIL_VERIFICATION_TTL_MS =
    24 * 60 * 60 * 1000;

const assertDate = (value) => {
    if (
        !(value instanceof Date)
        || Number.isNaN(value.getTime())
    ) {
        throw new TypeError(
            'Verification date is invalid',
        );
    }
};

export const requestEmailVerification =
    async ({
        userId,
        now = new Date(),
        pool = databasePool,
        findUser = findUserById,
        createToken = createOneTimeToken,
        deletePendingTokens =
        deletePendingEmailVerificationTokens,
        createTokenRecord =
        createEmailVerificationTokenRecord,
        sendMessage =
        sendEmailVerificationMessage,
    }) => {
        assertDate(now);

        const client =
            await pool.connect();

        let transactionCompleted = false;
        let user;
        let tokenDetails;
        let expiresAt;

        try {
            await client.query('BEGIN');

            user =
                await findUser({
                    userId,
                    client,
                });

            if (!user) {
                throw new EmailVerificationUnavailableError();
            }

            if (user.emailVerifiedAt !== null) {
                await client.query('COMMIT');
                transactionCompleted = true;

                return Object.freeze({
                    requested: false,
                    alreadyVerified: true,
                    expiresAt: null,
                    delivery: null,
                });
            }

            tokenDetails =
                createToken();

            expiresAt =
                new Date(
                    now.getTime()
                    + EMAIL_VERIFICATION_TTL_MS,
                );

            await deletePendingTokens({
                userId,
                client,
            });

            const tokenRecord =
                await createTokenRecord({
                    userId,
                    tokenHash:
                        tokenDetails.tokenHash,
                    expiresAt,
                    client,
                });

            if (!tokenRecord) {
                throw new EmailVerificationUnavailableError();
            }

            await client.query('COMMIT');
            transactionCompleted = true;
        } catch (error) {
            if (!transactionCompleted) {
                try {
                    await client.query(
                        'ROLLBACK',
                    );
                } catch {
                    // Preserve the original error.
                }
            }

            throw error;
        } finally {
            client.release();
        }

        const delivery =
            await sendMessage({
                recipientEmail:
                    user.email,
                token:
                    tokenDetails.token,
                expiresAt,
            });

        return Object.freeze({
            requested: true,
            alreadyVerified: false,
            expiresAt,

            delivery: Object.freeze({
                provider:
                    delivery.provider,
                accepted:
                    delivery.accepted,
            }),
        });
    };

export const confirmEmailVerification =
    async ({
        token,
        verifiedAt = new Date(),
        client = databasePool,
        hashToken = hashOneTimeToken,
        verifyEmail =
        verifyEmailWithTokenHash,
    }) => {
        assertDate(verifiedAt);

        let tokenHash;

        try {
            tokenHash =
                hashToken(token);
        } catch {
            throw new InvalidEmailVerificationTokenError();
        }

        const verifiedUser =
            await verifyEmail({
                tokenHash,
                verifiedAt,
                client,
            });

        if (!verifiedUser) {
            throw new InvalidEmailVerificationTokenError();
        }

        return Object.freeze({
            verified: true,

            user: Object.freeze({
                id:
                    verifiedUser.userId,
                email:
                    verifiedUser.email,
                emailVerifiedAt:
                    verifiedUser
                        .emailVerifiedAt,
            }),
        });
    };
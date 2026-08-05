import {
    databasePool,
} from '../../../config/database.js';

import {
    InvalidPasswordResetTokenError,
} from '../errors/account-recovery.errors.js';

import {
    deletePendingPasswordResetRequests,
    createPasswordResetRequestRecord,
    resetPasswordWithTokenHash,
} from '../repositories/password-reset.repository.js';

import {
    findUserByEmail,
} from '../repositories/user.repository.js';

import {
    sendPasswordResetMessage,
} from './auth-email.service.js';

import {
    hashPassword,
} from './password.service.js';

import {
    createOneTimeToken,
    hashOneTimeToken,
} from './one-time-token.service.js';

const PASSWORD_RESET_TTL_MS =
    60 * 60 * 1000;

const createPublicRequestResult = () => (
    Object.freeze({
        requested: true,
    })
);

const assertValidDate = (value) => {
    if (
        !(value instanceof Date)
        || Number.isNaN(value.getTime())
    ) {
        throw new TypeError(
            'Now must be a valid Date',
        );
    }
};

export const requestPasswordReset =
    async ({
        email,
        requestedIp = null,
        now = new Date(),
        pool = databasePool,
        findUser = findUserByEmail,
        deletePendingRequests =
        deletePendingPasswordResetRequests,
        createResetRequest =
        createPasswordResetRequestRecord,
        createToken = createOneTimeToken,
        sendResetMessage =
        sendPasswordResetMessage,
    }) => {
        assertValidDate(now);

        const client = await pool.connect();

        let transactionCompleted = false;
        let deliveryContext = null;

        try {
            await client.query('BEGIN');

            const user = await findUser({
                email,
                client,
            });

            if (
                user
                && user.isActive
                && user.deletedAt === null
            ) {
                const {
                    token,
                    tokenHash,
                } = createToken();

                const expiresAt = new Date(
                    now.getTime()
                    + PASSWORD_RESET_TTL_MS,
                );

                await deletePendingRequests({
                    userId: user.id,
                    client,
                });

                const resetRequest =
                    await createResetRequest({
                        userId: user.id,
                        tokenHash,
                        expiresAt,
                        requestedIp,
                        client,
                    });

                if (!resetRequest) {
                    throw new Error(
                        'Password reset request could not be created',
                    );
                }

                deliveryContext = {
                    recipientEmail:
                        user.email,
                    token,
                    expiresAt,
                };
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

        if (deliveryContext) {
            await sendResetMessage(
                deliveryContext,
            );
        }

        return createPublicRequestResult();
    };

export const resetPassword =
    async ({
        token,
        newPassword,
        now = new Date(),
        client = databasePool,
        hashToken = hashOneTimeToken,
        hashNewPassword = hashPassword,
        resetWithToken =
        resetPasswordWithTokenHash,
    }) => {
        assertValidDate(now);

        let resetTokenHash;

        try {
            resetTokenHash =
                hashToken(token);
        } catch {
            throw new InvalidPasswordResetTokenError();
        }

        const passwordHash =
            await hashNewPassword(
                newPassword,
            );

        const passwordReset =
            await resetWithToken({
                tokenHash:
                    resetTokenHash,
                passwordHash,
                usedAt: now,
                client,
            });

        if (!passwordReset) {
            throw new InvalidPasswordResetTokenError();
        }

        return Object.freeze({
            reset: true,
        });
    };
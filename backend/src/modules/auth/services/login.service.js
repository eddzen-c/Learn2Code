import { databasePool } from '../../../config/database.js';
import {
    InvalidCredentialsError,
} from '../errors/login.errors.js';
import {
    findUserByEmail,
    updateUserLastLogin,
} from '../repositories/user.repository.js';
import {
    createAccessToken,
} from './access-token.service.js';
import {
    verifyPassword,
} from './password.service.js';
import {
    createRefreshSession,
} from './refresh-session.service.js';

const DUMMY_PASSWORD_HASH =
    '$2b$12$OifSAZraUQ/4YRZpWrAHdeOfct/Ib1kMENYthoT55/VPzYjExJqx.';

const rejectInvalidCredentials = async (password) => {
    await verifyPassword(
        password,
        DUMMY_PASSWORD_HASH,
    );

    throw new InvalidCredentialsError();
};

export const loginUser = async ({
    email,
    password,
    requestIp = null,
    userAgent = null,
    now = new Date(),
    pool = databasePool,
}) => {
    const user = await findUserByEmail({
        email,
        client: pool,
    });

    if (!user) {
        return rejectInvalidCredentials(password);
    }

    const passwordIsValid = await verifyPassword(
        password,
        user.passwordHash,
    );

    if (
        !passwordIsValid
        || !user.isActive
        || user.deletedAt !== null
        || user.roles.length === 0
    ) {
        throw new InvalidCredentialsError();
    }

    const client = await pool.connect();
    let transactionCompleted = false;

    try {
        await client.query('BEGIN');

        const loginUpdate = await updateUserLastLogin({
            userId: user.id,
            lastLoginAt: now,
            client,
        });

        if (!loginUpdate) {
            throw new InvalidCredentialsError();
        }

        const refreshSession = await createRefreshSession({
            userId: user.id,
            createdByIp: requestIp,
            userAgent,
            now,
            client,
        });

        const accessToken = await createAccessToken({
            userId: user.id,
            roles: user.roles,
        });

        await client.query('COMMIT');
        transactionCompleted = true;

        return Object.freeze({
            user: Object.freeze({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                roles: Object.freeze([...user.roles]),
                emailVerified: (
                    user.emailVerifiedAt !== null
                ),
            }),
            accessToken,
            refreshToken: refreshSession.refreshToken,
            refreshTokenExpiresAt:
                refreshSession.expiresAt,
        });
    } catch (error) {
        if (!transactionCompleted) {
            try {
                await client.query('ROLLBACK');
            } catch {
                // The original login error remains the priority.
            }
        }

        throw error;
    } finally {
        client.release();
    }
};
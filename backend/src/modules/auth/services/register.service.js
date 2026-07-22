import { databasePool } from '../../../config/database.js';
import {
    EmailAlreadyRegisteredError,
    StudentRoleNotFoundError,
} from '../errors/register.errors.js';
import {
    assignRoleToUser,
    createUserRecord,
} from '../repositories/user.repository.js';
import {
    createAccessToken,
} from './access-token.service.js';
import {
    hashPassword,
} from './password.service.js';
import {
    createRefreshSession,
} from './refresh-session.service.js';

const DEFAULT_ROLE = 'student';

export const registerUser = async ({
    fullName,
    email,
    password,
    requestIp = null,
    userAgent = null,
    now = new Date(),
    pool = databasePool,
}) => {
    const passwordHash = await hashPassword(password);
    const client = await pool.connect();

    let transactionCompleted = false;

    try {
        await client.query('BEGIN');

        const user = await createUserRecord({
            fullName,
            email,
            passwordHash,
            client,
        });

        const roleAssignment = await assignRoleToUser({
            userId: user.id,
            roleName: DEFAULT_ROLE,
            client,
        });

        if (!roleAssignment) {
            throw new StudentRoleNotFoundError();
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
            roles: [DEFAULT_ROLE],
        });

        await client.query('COMMIT');
        transactionCompleted = true;

        return Object.freeze({
            user: Object.freeze({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                roles: Object.freeze([DEFAULT_ROLE]),
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
                // The original registration error remains the priority.
            }
        }

        if (
            error.code === '23505'
            && error.constraint === 'users_email_key'
        ) {
            throw new EmailAlreadyRegisteredError();
        }

        throw error;
    } finally {
        client.release();
    }
};
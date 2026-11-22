
import {
    databasePool,
} from '../../../config/database.js';

import {
    AuthenticationRequiredError,
} from '../errors/access-token.errors.js';

import {
    InvalidCurrentPasswordError,
    PasswordReuseNotAllowedError,
} from '../errors/password-change.errors.js';

import {
    findPasswordForUpdate,
    updatePasswordHash,
} from '../repositories/password-change.repository.js';

import {
    revokeAllUserRefreshTokens,
} from '../repositories/refresh-token.repository.js';

import {
    hashPassword,
    verifyPassword,
} from './password.service.js';

export const changeCurrentUserPassword = async ({
    userId,
    currentPassword,
    newPassword,
    requestIp = null,
    now = new Date(),
    pool = databasePool,

    findPassword = findPasswordForUpdate,
    updatePassword = updatePasswordHash,
    revokeSessions = revokeAllUserRefreshTokens,

    verifyCurrentPassword = verifyPassword,
    hashNewPassword = hashPassword,
}) => {
    const client = await pool.connect();

    let transactionCompleted = false;

    try {
        await client.query('BEGIN');

        // Leer y bloquear el usuario autenticado.
        const currentUser = await findPassword({
            userId,
            client,
        });

        if (!currentUser) {
            throw new AuthenticationRequiredError();
        }

        // Verificar la contraseña actual.
        const passwordMatches =
            await verifyCurrentPassword(
                currentPassword,
                currentUser.passwordHash,
            );

        if (!passwordMatches) {
            throw new InvalidCurrentPasswordError();
        }

        // Protección adicional a la validación Zod.
        if (currentPassword === newPassword) {
            throw new PasswordReuseNotAllowedError();
        }

        // Nunca guardar contraseñas en texto plano.
        const newPasswordHash =
            await hashNewPassword(newPassword);

        const updatedUser = await updatePassword({
            userId,
            passwordHash: newPasswordHash,
            updatedAt: now,
            client,
        });

        if (!updatedUser) {
            throw new AuthenticationRequiredError();
        }

        // Revocar los tokens de renovación existentes.
        await revokeSessions({
            userId,
            revokedAt: now,
            revokedByIp: requestIp,
            client,
        });

        // Confirmar únicamente si todo tuvo éxito.
        await client.query('COMMIT');
        transactionCompleted = true;

        return Object.freeze({
            changed: true,
        });
    } catch (error) {
        if (!transactionCompleted) {
            try {
                await client.query('ROLLBACK');
            } catch {
                // Mantener el error original.
            }
        }

        throw error;
    } finally {
        client.release();
    }
};

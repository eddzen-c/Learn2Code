
import {
    findUserById,
} from '../repositories/user.repository.js';

export const requireVerifiedEmail = async (
    req,
    res,
    next,
) => {
    try {
        // Este middleware se ejecuta después
        // de requireAuthentication.
        if (!req.auth?.userId) {
            return res.status(401).json({
                status: 'error',
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Inicia sesión para continuar.',
            });
        }

        // Consultamos PostgreSQL para utilizar
        // el estado actual de la cuenta.
        const user = await findUserById({
            userId: req.auth.userId,
        });

        if (
            !user
            || user.isActive !== true
            || user.deletedAt !== null
        ) {
            return res.status(401).json({
                status: 'error',
                code: 'AUTHENTICATION_REQUIRED',
                message: 'La sesión ya no es válida.',
            });
        }

        if (user.emailVerifiedAt == null) {
            return res.status(403).json({
                status: 'error',
                code: 'EMAIL_NOT_VERIFIED',
                message:
                    'Debes verificar tu correo electrónico antes de continuar.',
            });
        }

        return next();
    } catch (error) {
        return next(error);
    }
};
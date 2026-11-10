import {
    requestCurrentUserEmailChange,
    confirmCurrentUserEmailChange,
} from '../services/email-change.service.js';

import {
    parseRequestEmailChangeBody,
    parseConfirmEmailChangeBody,
} from '../validators/account-recovery.validator.js';

import {
    clearRefreshTokenCookie,
} from '../utils/refresh-token-cookie.js';

// ============================================================
// SOLICITAR CAMBIO DE CORREO
// ============================================================

export const requestEmailChangeController = async (
    req,
    res,
    next,
) => {
    try {
        // Validar los datos recibidos.
        const {
            newEmail,
            currentPassword,
        } = parseRequestEmailChangeBody(req.body);

        // Iniciar el proceso para el usuario autenticado.
        const result = await requestCurrentUserEmailChange({
            userId: req.auth.userId,
            newEmail,
            currentPassword,
        });

        // El código fue aceptado por el proveedor configurado.
        return res.status(202).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// CONFIRMAR CAMBIO DE CORREO
// ============================================================

export const confirmEmailChangeController = async (
    req,
    res,
    next,
) => {
    try {
        // Validar el código de seis dígitos.
        const {
            code,
        } = parseConfirmEmailChangeBody(req.body);

        // Confirmar el cambio de correo.
        const result = await confirmCurrentUserEmailChange({
            userId: req.auth.userId,
            code,
        });

        // El repositorio revocó los tokens de renovación.
        // Eliminar también la cookie del navegador.
        clearRefreshTokenCookie(res);

        return res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
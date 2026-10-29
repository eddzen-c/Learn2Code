
import {
    changeCurrentUserPassword,
} from '../services/change-password.service.js';

import {
    parseChangePasswordBody,
} from '../validators/change-password.validator.js';

import {
    clearRefreshTokenCookie,
} from '../utils/refresh-token-cookie.js';

export const changePasswordController = async (
    req,
    res,
    next,
) => {
    try {
        const {
            currentPassword,
            newPassword,
        } = parseChangePasswordBody(req.body);

        const result = await changeCurrentUserPassword({
            userId: req.auth.userId,
            currentPassword,
            newPassword,
            requestIp: req.ip ?? null,
        });

        // Los tokens de renovación fueron revocados
        // por el servicio. Eliminar también la cookie.
        clearRefreshTokenCookie(res);

        return res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

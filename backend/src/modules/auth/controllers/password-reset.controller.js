import {
    requestPasswordReset,
    resetPassword,
} from '../services/password-reset.service.js';

import {
    parseRequestPasswordResetBody,
    parseResetPasswordBody,
} from '../validators/account-recovery.validator.js';

export const requestPasswordResetController =
    async (
        req,
        res,
        next,
    ) => {
        try {
            const {
                email,
            } =
                parseRequestPasswordResetBody(
                    req.body,
                );

            const result =
                await requestPasswordReset({
                    email,
                    requestedIp:
                        req.ip ?? null,
                });

            res.status(202).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

export const resetPasswordController =
    async (
        req,
        res,
        next,
    ) => {
        try {
            const {
                token,
                newPassword,
            } =
                parseResetPasswordBody(
                    req.body,
                );

            const result =
                await resetPassword({
                    token,
                    newPassword,
                });

            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
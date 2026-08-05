import {
    confirmEmailVerification,
    requestEmailVerification,
} from '../services/email-verification.service.js';

import {
    parseConfirmEmailVerificationBody,
} from '../validators/account-recovery.validator.js';

export const requestEmailVerificationController =
    async (
        req,
        res,
        next,
    ) => {
        try {
            const result =
                await requestEmailVerification({
                    userId:
                        req.auth.userId,
                });

            res.status(
                result.requested
                    ? 202
                    : 200,
            ).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

export const confirmEmailVerificationController =
    async (
        req,
        res,
        next,
    ) => {
        try {
            const {
                token,
            } =
                parseConfirmEmailVerificationBody(
                    req.body,
                );

            const result =
                await confirmEmailVerification({
                    token,
                });

            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
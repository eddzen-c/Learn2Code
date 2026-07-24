import {
    updateCurrentUserProfile,
} from '../services/profile.service.js';

import {
    parseUpdateProfileBody,
} from '../validators/profile.validator.js';

export const updateProfileController = async (
    req,
    res,
    next,
) => {
    try {
        const input = parseUpdateProfileBody(
            req.body,
        );

        const user =
            await updateCurrentUserProfile({
                userId: req.auth.userId,
                ...input,
            });

        res.status(200).json({
            status: 'success',
            data: {
                user,
            },
        });
    } catch (error) {
        next(error);
    }
};
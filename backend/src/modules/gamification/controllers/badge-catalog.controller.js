import {
    getUserBadgeCatalog,
} from '../services/badge-catalog.service.js';

export const badgeCatalogController =
    async (
        req,
        res,
        next,
    ) => {
        try {
            const catalog =
                await getUserBadgeCatalog({
                    userId:
                        req.auth.userId,
                });

            res.status(200).json({
                status: 'success',
                data: catalog,
            });
        } catch (error) {
            next(error);
        }
    };
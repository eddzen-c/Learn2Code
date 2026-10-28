import {
    Router,
} from 'express';

import {
    requireAuthentication,
} from '../../auth/middlewares/authentication.middleware.js';

import {
    badgeCatalogController,
} from '../controllers/badge-catalog.controller.js';

import {
    requireVerifiedEmail,
} from '../../auth/middlewares/verified-email.middleware.js';

const gamificationRouter = Router();

gamificationRouter.get(
    '/badges',
    requireAuthentication,
    requireVerifiedEmail,
    badgeCatalogController,
);

export default gamificationRouter;
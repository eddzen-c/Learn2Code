import {
    Router,
} from 'express';

import {
    requireAuthentication,
} from '../../auth/middlewares/authentication.middleware.js';

import {
    badgeCatalogController,
} from '../controllers/badge-catalog.controller.js';

const gamificationRouter = Router();

gamificationRouter.get(
    '/badges',
    requireAuthentication,
    badgeCatalogController,
);

export default gamificationRouter;
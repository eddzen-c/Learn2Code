import {
    Router,
} from 'express';

import {
    requireAuthentication,
} from '../../auth/middlewares/authentication.middleware.js';

import {
    dashboardSummaryController,
} from '../controllers/dashboard.controller.js';

import {
    requireVerifiedEmail,
} from '../../auth/middlewares/verified-email.middleware.js';

const dashboardRouter = Router();

dashboardRouter.get(
    '/summary',
    requireAuthentication,
    requireVerifiedEmail,
    dashboardSummaryController,
);

export default dashboardRouter;
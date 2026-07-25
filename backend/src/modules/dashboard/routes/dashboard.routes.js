import {
    Router,
} from 'express';

import {
    requireAuthentication,
} from '../../auth/middlewares/authentication.middleware.js';

import {
    dashboardSummaryController,
} from '../controllers/dashboard.controller.js';

const dashboardRouter = Router();

dashboardRouter.get(
    '/summary',
    requireAuthentication,
    dashboardSummaryController,
);

export default dashboardRouter;
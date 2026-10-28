import {
    Router,
} from 'express';

import {
    requireAuthentication,
} from '../../auth/middlewares/authentication.middleware.js';

import {
    startDiagnosticController,
} from '../controllers/start-diagnostic.controller.js';

import {
    submitDiagnosticAnswerController,
} from '../controllers/submit-diagnostic-answer.controller.js';

import {
    currentDiagnosticController,
} from '../controllers/current-diagnostic.controller.js';

import {
    requireVerifiedEmail,
} from '../../auth/middlewares/verified-email.middleware.js';

const diagnosticRouter = Router();

diagnosticRouter.get(
    '/current',
    requireAuthentication,
    requireVerifiedEmail,
    currentDiagnosticController,
);

diagnosticRouter.post(
    '/',
    requireAuthentication,
    requireVerifiedEmail,
    startDiagnosticController,
);

diagnosticRouter.post(
    '/:assessmentId/responses',
    requireAuthentication,
    requireVerifiedEmail,
    submitDiagnosticAnswerController,
);

export default diagnosticRouter;
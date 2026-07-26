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

const diagnosticRouter = Router();

diagnosticRouter.get(
    '/current',
    requireAuthentication,
    currentDiagnosticController,
);

diagnosticRouter.post(
    '/',
    requireAuthentication,
    startDiagnosticController,
);

diagnosticRouter.post(
    '/:assessmentId/responses',
    requireAuthentication,
    submitDiagnosticAnswerController,
);

export default diagnosticRouter;
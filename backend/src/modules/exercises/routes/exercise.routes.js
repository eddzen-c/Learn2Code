import {
    Router,
} from 'express';

import {
    requireAuthentication,
} from '../../auth/middlewares/authentication.middleware.js';

import {
    currentExerciseController,
} from '../controllers/current-exercise.controller.js';

import {
    generateNextExerciseController,
} from '../controllers/generate-next-exercise.controller.js';

import {
    submitExerciseAttemptController,
} from '../controllers/submit-exercise-attempt.controller.js';

import {
    requireVerifiedEmail,
} from '../../auth/middlewares/verified-email.middleware.js';

const exerciseRouter = Router();

exerciseRouter.get(
    '/current',
    requireAuthentication,
    requireVerifiedEmail,
    currentExerciseController,
);

exerciseRouter.post(
    '/next',
    requireAuthentication,
    requireVerifiedEmail,
    generateNextExerciseController,
);

exerciseRouter.post(
    '/assignments/:assignmentId/attempts',
    requireAuthentication,
    requireVerifiedEmail,
    submitExerciseAttemptController,
);

export default exerciseRouter;
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

const exerciseRouter = Router();

exerciseRouter.get(
    '/current',
    requireAuthentication,
    currentExerciseController,
);

exerciseRouter.post(
    '/next',
    requireAuthentication,
    generateNextExerciseController,
);

export default exerciseRouter;
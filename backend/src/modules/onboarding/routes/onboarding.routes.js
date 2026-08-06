import {
    Router,
} from 'express';

import {
    requireAuthentication,
} from '../../auth/middlewares/authentication.middleware.js';

import {
    completeStudentOnboardingController,
    currentStudentOnboardingController,
    studentOnboardingOptionsController,
} from '../controllers/student-onboarding.controller.js';

const onboardingRouter = Router();

onboardingRouter.get(
    '/options',
    requireAuthentication,
    studentOnboardingOptionsController,
);

onboardingRouter.get(
    '/current',
    requireAuthentication,
    currentStudentOnboardingController,
);

onboardingRouter.put(
    '/',
    requireAuthentication,
    completeStudentOnboardingController,
);

export default onboardingRouter;
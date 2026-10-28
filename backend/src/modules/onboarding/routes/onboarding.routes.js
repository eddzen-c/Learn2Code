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

import {
    requireVerifiedEmail,
} from '../../auth/middlewares/verified-email.middleware.js';

const onboardingRouter = Router();

onboardingRouter.get(
    '/options',
    requireAuthentication,
    requireVerifiedEmail,
    studentOnboardingOptionsController,
);

onboardingRouter.get(
    '/current',
    requireAuthentication,
    requireVerifiedEmail,
    currentStudentOnboardingController,
);

onboardingRouter.put(
    '/',
    requireAuthentication,
    requireVerifiedEmail,
    completeStudentOnboardingController,
);

export default onboardingRouter;
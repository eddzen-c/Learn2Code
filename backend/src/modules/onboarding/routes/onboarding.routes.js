import {
    Router,
} from 'express';

import {
    requireAuthentication,
} from '../../auth/middlewares/authentication.middleware.js';

import {
    completeStudentLearningFlowController,
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
    '/learning-flow/complete',
    requireAuthentication,
    requireVerifiedEmail,
    completeStudentLearningFlowController,
);

onboardingRouter.put(
    '/',
    requireAuthentication,
    requireVerifiedEmail,
    completeStudentOnboardingController,
);

export default onboardingRouter;
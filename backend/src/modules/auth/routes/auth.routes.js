import { Router } from 'express';

import {
    loginController,
} from '../controllers/login.controller.js';

import {
    refreshController,
} from '../controllers/refresh.controller.js';

import {
    registerController,
} from '../controllers/register.controller.js';

import {
    logoutController,
} from '../controllers/logout.controller.js';

import {
    currentUserController,
} from '../controllers/current-user.controller.js';

import {
    requireAuthentication,
} from '../middlewares/authentication.middleware.js';

import {
    updateProfileController,
} from '../controllers/profile.controller.js';

import {
    confirmEmailVerificationController,
    requestEmailVerificationController,
} from '../controllers/email-verification.controller.js';

import {
    requestPasswordResetController,
    resetPasswordController,
} from '../controllers/password-reset.controller.js';

const authRouter = Router();

authRouter.post(
    '/register',
    registerController,
);

authRouter.post(
    '/login',
    loginController,
);

authRouter.post(
    '/refresh',
    refreshController,
);

authRouter.post(
    '/logout',
    logoutController,
);

authRouter.get(
    '/me',
    requireAuthentication,
    currentUserController,
);

authRouter.patch(
    '/me',
    requireAuthentication,
    updateProfileController,
);

authRouter.post(
    '/email-verification/request',
    requireAuthentication,
    requestEmailVerificationController,
);

authRouter.post(
    '/email-verification/confirm',
    confirmEmailVerificationController,
);

authRouter.post(
    '/password-reset/request',
    requestPasswordResetController,
);

authRouter.post(
    '/password-reset/confirm',
    resetPasswordController,
);

export default authRouter;
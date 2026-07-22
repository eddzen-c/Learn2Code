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

export default authRouter;
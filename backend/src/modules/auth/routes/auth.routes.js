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

export default authRouter;
import { Router } from 'express';

import {
    registerController,
} from '../controllers/register.controller.js';

const authRouter = Router();

authRouter.post(
    '/register',
    registerController,
);

export default authRouter;
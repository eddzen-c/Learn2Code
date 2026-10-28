
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
    requestEmailVerificationCodeController,
    confirmEmailVerificationCodeController,
} from '../controllers/email-verification.controller.js';

import {
    requestPasswordResetController,
    resetPasswordController,
} from '../controllers/password-reset.controller.js';

import {
    requireEmailVerificationCodeQuota,
} from '../middlewares/email-verification-code-rate-limit.middleware.js';

const authRouter = Router();

// ======================================================
// REGISTRO E INICIO DE SESIÓN
// ======================================================

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

// ======================================================
// PERFIL DEL USUARIO
// ======================================================

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

// ======================================================
// VERIFICACIÓN POR CÓDIGO DE SEIS DÍGITOS
// ======================================================

authRouter.post(
    '/email-verification/code/request',
    requireAuthentication,
    requireEmailVerificationCodeQuota,
    requestEmailVerificationCodeController,
);



authRouter.post(
    '/email-verification/code/confirm',
    requireAuthentication,
    confirmEmailVerificationCodeController,
);

// ======================================================
// DESACTIVAR VERIFICACIÓN MEDIANTE ENLACES
// ======================================================

const legacyVerificationDisabled = (_req, res) => {
    res.status(410).json({
        status: 'error',
        code: 'EMAIL_VERIFICATION_LINK_DISABLED',
        message:
            'La verificación mediante enlaces ya no está disponible. Utiliza el código de seis dígitos.',
    });
};

authRouter.post(
    '/email-verification/request',
    requireAuthentication,
    legacyVerificationDisabled,
);

authRouter.post(
    '/email-verification/confirm',
    legacyVerificationDisabled,
);

// ======================================================
// RECUPERACIÓN DE CONTRASEÑA
// ======================================================

authRouter.post(
    '/password-reset/request',
    requestPasswordResetController,
);

authRouter.post(
    '/password-reset/confirm',
    resetPasswordController,
);

export default authRouter;

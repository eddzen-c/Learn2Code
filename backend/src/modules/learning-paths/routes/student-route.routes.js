
import { Router } from 'express';
import { z } from 'zod';

import {
    requireAuthentication,
} from '../../auth/middlewares/authentication.middleware.js';

import {
    requireVerifiedEmail,
} from '../../auth/middlewares/verified-email.middleware.js';

import {
    getLearningPlanContext,
} from '../services/learning-plan-context.service.js';

import {
    findStudentRouteSelection,
    saveStudentRouteSelection,
} from '../repositories/student-route.repository.js';

const studentRouteRouter = Router();

const selectionSchema = z.object({
    specializationKey: z.enum([
        'frontend',
        'backend',
        'fullstack',
        'devops',
    ]),
}).strict();

studentRouteRouter.use(
    requireAuthentication,
    requireVerifiedEmail,
);

// Consultar la elección persistida del estudiante.
studentRouteRouter.get(
    '/current',
    async (req, res, next) => {
        try {
            const selection =
                await findStudentRouteSelection({
                    userId: req.auth.userId,
                });

            return res.status(200).json({
                status: 'success',
                data: {
                    state: selection
                        ? 'selected'
                        : 'not_selected',
                    selection,
                },
            });
        } catch (error) {
            return next(error);
        }
    },
);

// Registrar únicamente una elección explícita.
studentRouteRouter.put(
    '/current',
    async (req, res, next) => {
        try {
            const { specializationKey } =
                selectionSchema.parse(req.body);

            // Conservar el orden académico establecido:
            // Sobre ti -> Diagnóstico -> Rutas.
            const context =
                await getLearningPlanContext({
                    userId: req.auth.userId,
                });

            if (context.state !== 'ready') {
                return res.status(409).json({
                    status: 'error',
                    code: 'LEARNING_PREREQUISITES_REQUIRED',
                    message:
                        'Completa Sobre ti y tu diagnóstico antes de elegir una ruta.',
                });
            }

            const selection =
                await saveStudentRouteSelection({
                    userId: req.auth.userId,
                    specializationKey,
                });

            return res.status(200).json({
                status: 'success',
                data: {
                    state: 'selected',
                    selection,
                },
            });
        } catch (error) {
            return next(error);
        }
    },
);

export default studentRouteRouter;

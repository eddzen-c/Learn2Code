
import { Router } from 'express';

import {
    requireAuthentication,
} from '../../auth/middlewares/authentication.middleware.js';

import {
    getCurrentLearningPlan,
    generateLearningPlan,
    confirmStudentLearningPlan,
} from '../services/learning-path.service.js';

const learningPathRouter = Router();

const validUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

learningPathRouter.use(requireAuthentication);

learningPathRouter.get(
    '/current',
    async (req, res, next) => {
        try {
            const data = await getCurrentLearningPlan({
                userId: req.auth.userId,
            });

            res.status(200).json({
                status: 'success',
                data,
            });
        } catch (error) {
            next(error);
        }
    },
);

learningPathRouter.post(
    '/',
    async (req, res, next) => {
        try {
            const data = await generateLearningPlan({
                userId: req.auth.userId,
            });

            if (
                data.state === 'onboarding_required'
                || data.state === 'diagnostic_required'
            ) {
                return res.status(409).json({
                    status: 'error',
                    code: data.state.toUpperCase(),
                    message:
                        'Completa los pasos previos para generar tu plan.',
                });
            }

            return res.status(200).json({
                status: 'success',
                data,
            });
        } catch (error) {
            return next(error);
        }
    },
);

learningPathRouter.post(
    '/:pathId/confirm',
    async (req, res, next) => {
        try {
            const { pathId } = req.params;

            if (!validUuid.test(pathId)) {
                return res.status(400).json({
                    status: 'error',
                    code: 'INVALID_PATH_ID',
                    message:
                        'El identificador del plan es inválido.',
                });
            }

            const data =
                await confirmStudentLearningPlan({
                    userId: req.auth.userId,
                    pathId,
                });

            if (data.state !== 'confirmed') {
                return res.status(409).json({
                    status: 'error',
                    code: 'PREREQUISITES_REQUIRED',
                    message:
                        'El estudiante debe completar los pasos previos.',
                });
            }

            return res.status(200).json({
                status: 'success',
                data,
            });
        } catch (error) {
            return next(error);
        }
    },
);

export default learningPathRouter;

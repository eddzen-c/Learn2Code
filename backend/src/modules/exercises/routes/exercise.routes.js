import {
    Router,
} from 'express';

import { z } from 'zod';
import { TUTOR_MODEL_IDS } from '../tutor-models.js';

import {
    askExerciseTutor,
    getExerciseTutorChatUsage,
} from '../services/exercise-tutor.service.js';

import {
    requireAuthentication,
} from '../../auth/middlewares/authentication.middleware.js';

import {
    currentExerciseController,
} from '../controllers/current-exercise.controller.js';

import {
    generateNextExerciseController,
} from '../controllers/generate-next-exercise.controller.js';

import {
    submitExerciseAttemptController,
} from '../controllers/submit-exercise-attempt.controller.js';

import {
    requireVerifiedEmail,
} from '../../auth/middlewares/verified-email.middleware.js';

import {
    listAcademicCatalog,
    listPublishedUnitExercises,
} from '../repositories/academic-catalog.repository.js';
import {
    getPersonalizedAcademicCatalog,
} from '../services/academic-personalization.service.js';
import {
    generateAcademicUnitPractice,
} from '../services/generate-academic-unit-practice.service.js';

import {
    assignAcademicExercise,
    AcademicExerciseAssignmentConflictError,
} from '../services/assign-academic-exercise.service.js';

import {
    findActiveExerciseAssignmentByUserId,
} from '../repositories/exercise.repository.js';

const exerciseRouter = Router();
const validUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exerciseRouter.get(
    '/catalog',
    requireAuthentication,
    requireVerifiedEmail,
    async (req, res, next) => {
        try {
            const result = await getPersonalizedAcademicCatalog({
                userId: req.auth.userId,
                listCatalog: listAcademicCatalog,
            });

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            return next(error);
        }
    },
);

exerciseRouter.get(
    '/catalog/units/:unitId/exercises',
    requireAuthentication,
    requireVerifiedEmail,
    async (req, res, next) => {
        try {
            const { unitId } = req.params;

            if (!validUuid.test(unitId)) {
                return res.status(400).json({
                    status: 'error',
                    code: 'INVALID_ACADEMIC_UNIT_ID',
                    message: 'El identificador de la unidad es inválido.',
                });
            }

            const result =
                await listPublishedUnitExercises({
                    unitId,
                    userId: req.auth.userId,
                });

            if (!result) {
                return res.status(404).json({
                    status: 'error',
                    code: 'ACADEMIC_UNIT_NOT_FOUND',
                    message: 'La unidad académica no está disponible.',
                });
            }

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            return next(error);
        }
    },
);

exerciseRouter.post(
    '/catalog/units/:unitId/personalized-practice',
    requireAuthentication,
    requireVerifiedEmail,
    async (req, res, next) => {
        try {
            if (!validUuid.test(req.params.unitId)) {
                return res.status(400).json({
                    status: 'error',
                    code: 'INVALID_ACADEMIC_UNIT_ID',
                    message: 'El identificador de la unidad es inválido.',
                });
            }

            const result = await generateAcademicUnitPractice({
                userId: req.auth.userId,
                unitId: req.params.unitId,
            });

            return res.status(result.created ? 201 : 200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            if (Number.isInteger(error.statusCode)) {
                return res.status(error.statusCode).json({
                    status: 'error',
                    code: error.code,
                    message: error.message,
                });
            }
            return next(error);
        }
    },
);

exerciseRouter.post(
    '/catalog/units/:unitId/exercises/:exerciseId/assignments',
    requireAuthentication,
    requireVerifiedEmail,
    async (req, res, next) => {
        try {
            const {
                unitId,
                exerciseId,
            } = req.params;

            if (!validUuid.test(unitId)) {
                return res.status(400).json({
                    status: 'error',
                    code: 'INVALID_ACADEMIC_UNIT_ID',
                    message:
                        'El identificador de la unidad es inválido.',
                });
            }

            if (!validUuid.test(exerciseId)) {
                return res.status(400).json({
                    status: 'error',
                    code: 'INVALID_ACADEMIC_EXERCISE_ID',
                    message:
                        'El identificador del ejercicio es inválido.',
                });
            }

            const result = await assignAcademicExercise({
                userId: req.auth.userId,
                unitId,
                exerciseId,
            });

            if (!result) {
                return res.status(404).json({
                    status: 'error',
                    code: 'ACADEMIC_EXERCISE_NOT_FOUND',
                    message:
                        'El ejercicio no está disponible en esta unidad académica.',
                });
            }

            return res.status(
                result.created ? 201 : 200,
            ).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            if (
                error instanceof
                AcademicExerciseAssignmentConflictError
            ) {
                return res.status(409).json({
                    status: 'error',
                    code: error.code,
                    message: error.message,
                });
            }

            return next(error);
        }
    },
);

exerciseRouter.get(
    '/current',
    requireAuthentication,
    requireVerifiedEmail,
    currentExerciseController,
);

exerciseRouter.post(
    '/next',
    requireAuthentication,
    requireVerifiedEmail,
    generateNextExerciseController,
);

exerciseRouter.get(
    '/assignments/:assignmentId',
    requireAuthentication,
    requireVerifiedEmail,
    async (req, res, next) => {
        try {
            const { assignmentId } = req.params;

            if (!validUuid.test(assignmentId)) {
                return res.status(400).json({
                    status: 'error',
                    code: 'INVALID_EXERCISE_ASSIGNMENT_ID',
                    message:
                        'El identificador de la asignación es inválido.',
                });
            }

            const result =
                await findActiveExerciseAssignmentByUserId({
                    userId: req.auth.userId,
                    assignmentId,
                    source: 'manual',
                });

            if (!result) {
                return res.status(404).json({
                    status: 'error',
                    code: 'ACADEMIC_ASSIGNMENT_NOT_FOUND',
                    message:
                        'La asignación académica no está disponible.',
                });
            }

            return res.status(200).json({
                status: 'success',
                data: {
                    state: result.assignment.status,
                    assignment: result.assignment,
                    exercise: result.exercise,
                },
            });
        } catch (error) {
            return next(error);
        }
    },
);

// Tutor por separado del generador y del evaluador de ejercicios.
const tutorRequestSchema = z.object({
    kind: z.enum(['hint', 'question']),
    model: z.enum(TUTOR_MODEL_IDS).optional(),
    requestId: z.string().uuid().optional(),
    hintLevel: z.number().int().min(1).max(3).optional(),
    message: z.string().trim().min(1).max(800).optional(),
    history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(1000),
    }).strict()).max(6).optional(),
}).strict().superRefine((body, context) => {
    if (body.kind === 'question' && !body.message) {
        context.addIssue({
            code: 'custom',
            path: ['message'],
            message: 'La pregunta es obligatoria.',
        });
    }
    if (body.kind === 'question' && !body.requestId) {
        context.addIssue({
            code: 'custom',
            path: ['requestId'],
            message: 'El identificador del mensaje es obligatorio.',
        });
    }
});

exerciseRouter.get(
    '/assignments/:assignmentId/tutor/usage',
    requireAuthentication,
    requireVerifiedEmail,
    async (req, res, next) => {
        try {
            if (!validUuid.test(req.params.assignmentId)) {
                return res.status(400).json({
                    status: 'error',
                    code: 'INVALID_EXERCISE_ASSIGNMENT_ID',
                    message: 'La asignación no es válida.',
                });
            }
            const usage = await getExerciseTutorChatUsage({
                userId: req.auth.userId,
                assignmentId: req.params.assignmentId,
            });
            return res.status(200).json({
                status: 'success',
                data: usage,
            });
        } catch (error) {
            return next(error);
        }
    },
);

exerciseRouter.post(
    '/assignments/:assignmentId/tutor',
    requireAuthentication,
    requireVerifiedEmail,
    async (req, res, next) => {
        try {
            const { assignmentId } = req.params;
            if (!validUuid.test(assignmentId)) {
                return res.status(400).json({
                    status: 'error',
                    code: 'INVALID_EXERCISE_ASSIGNMENT_ID',
                    message: 'La asignación no es válida.',
                });
            }

            const body = tutorRequestSchema.parse(req.body);
            const answer = await askExerciseTutor({
                userId: req.auth.userId,
                assignmentId,
                kind: body.kind,
                hintLevel: body.hintLevel ?? 1,
                model: body.model,
                requestId: body.requestId,
                message: body.message ?? '',
                history: body.history ?? [],
            });

            return res.status(200).json({
                status: 'success',
                data: {
                    reply: answer.reply,
                    ...(answer.chatUsage ? { chatUsage: answer.chatUsage } : {}),
                },
            });
        } catch (error) {
            return next(error);
        }
    },
);

exerciseRouter.post(
    '/assignments/:assignmentId/attempts',
    requireAuthentication,
    requireVerifiedEmail,
    submitExerciseAttemptController,
);

export default exerciseRouter;
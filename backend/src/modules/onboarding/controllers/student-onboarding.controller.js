import {
    completeStudentLearningFlow,
    completeStudentOnboarding,
    getCurrentStudentOnboarding,
    getStudentOnboardingOptions,
} from '../services/student-onboarding.service.js';

import {
    parseStudentOnboardingBody,
} from '../validators/student-onboarding.validator.js';

export const studentOnboardingOptionsController =
    async (
        _req,
        res,
        next,
    ) => {
        try {
            const result =
                await getStudentOnboardingOptions();

            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

/**
* Finaliza el recorrido inicial de cinco pantallas.
*
* No modifica la información de "Sobre ti",
* no confirma planes y no selecciona rutas.
*/
export const completeStudentLearningFlowController =
    async (
        req,
        res,
        next,
    ) => {
        try {
            const result =
                await completeStudentLearningFlow({
                    userId: req.auth.userId,
                });

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            return next(error);
        }
    };

export const currentStudentOnboardingController =
    async (
        req,
        res,
        next,
    ) => {
        try {
            const result =
                await getCurrentStudentOnboarding({
                    userId:
                        req.auth.userId,
                });

            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

export const completeStudentOnboardingController =
    async (
        req,
        res,
        next,
    ) => {
        try {
            const input =
                parseStudentOnboardingBody(
                    req.body,
                );

            const result =
                await completeStudentOnboarding({
                    userId:
                        req.auth.userId,

                    ...input,
                });

            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

import {
    databasePool,
} from '../../../config/database.js';

import {
    getCurrentDiagnostic,
} from '../../diagnostic/services/current-diagnostic.service.js';

import {
    listActiveTopics,
} from '../../diagnostic/repositories/diagnostic-catalog.repository.js';

import {
    listDiagnosticTopicScores,
    listDiagnosticTechnologyScores,
} from '../../diagnostic/repositories/diagnostic-completion.repository.js';

import {
    findStudentOnboardingByUserId,
} from '../../onboarding/repositories/student-onboarding.repository.js';

const defaultDependencies = Object.freeze({
    getCurrentDiagnostic,
    listActiveTopics,
    listDiagnosticTopicScores,
    listDiagnosticTechnologyScores,
    findStudentOnboardingByUserId,
});

/**
 * Reúne el contexto académico necesario para
 * generar un plan de aprendizaje con OpenAI.
 *
 * No genera contenido ni crea registros nuevos.
 */
export async function getLearningPlanContext({
    userId,
    client = databasePool,
    dependencies = defaultDependencies,
}) {
    if (
        typeof userId !== 'string'
        || userId.trim().length === 0
    ) {
        throw new TypeError(
            'Se requiere un identificador de estudiante.',
        );
    }

    const onboarding =
        await dependencies.findStudentOnboardingByUserId({
            userId,
            client,
        });

    if (!onboarding) {
        return {
            state: 'onboarding_required',
            assessmentId: null,
        };
    }

    const diagnostic =
        await dependencies.getCurrentDiagnostic({
            userId,
            client,
        });

    // Nunca construir el plan de un examen
    // pendiente, fallido o vencido.
    if (
        diagnostic.state !== 'completed'
        || !diagnostic.assessment?.id
        || !diagnostic.result?.resultingDifficulty
        || !Number.isFinite(
            Number(diagnostic.result.overallScore),
        )
    ) {
        return {
            state: 'diagnostic_required',
            assessmentId: null,
        };
    }

    const assessmentId =
        diagnostic.assessment.id;

    const [
        topics,
        topicScores,
        technologyScores,
    ] = await Promise.all([
        dependencies.listActiveTopics({
            client,
        }),

        dependencies.listDiagnosticTopicScores({
            assessmentId,
            userId,
            client,
        }),

        dependencies.listDiagnosticTechnologyScores({
            assessmentId,
            userId,
            client,
        }),
    ]);

    if (topics.length < 3) {
        throw new Error(
            'El catálogo de temas no tiene suficientes registros.',
        );
    }

    return {
        state: 'ready',

        assessmentId,

        // Claves foráneas existentes.
        languageId: onboarding.language.id,

        difficultyId:
            diagnostic.result.resultingDifficulty.id,

        // Información de "Sobre ti".
        onboarding: {
            learningGoal: onboarding.learningGoal,

            weeklyTimeCommitment:
                onboarding.weeklyTimeCommitment,

            learningStyle:
                onboarding.learningStyle,

            technologyInterestKeys:
                onboarding.technologyInterestKeys,

            projectIdea: onboarding.projectIdea,
        },

        // Resultados evaluados y persistidos.
        diagnostic: {
            overallScore: Number(
                diagnostic.result.overallScore,
            ),

            difficultyName:
                diagnostic.result.resultingDifficulty.name,

            topicScores,

            technologyScores,
        },

        // Temas permitidos en PostgreSQL.
        topics: topics.map((topic) => ({
            id: topic.id,
            name: topic.name,
        })),
    };
}

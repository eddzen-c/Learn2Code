
import { databasePool } from '../../../config/database.js'
import { randomUUID } from 'node:crypto'
import {
    findStudentOnboardingByUserId,
} from '../../onboarding/repositories/student-onboarding.repository.js'
import {
    createExerciseAssignmentRecord,
    createExerciseRecord,
    createExerciseTestCaseRecords,
} from '../repositories/exercise.repository.js'
import {
    createExerciseGenerationLogRecord,
} from '../repositories/exercise-generation-log.repository.js'
import { generatePersonalizedExercise } from './exercise-generator.service.js'
import { evaluateExerciseSubmission } from './exercise-evaluator.service.js'

const errorWithCode = (code, message, statusCode) =>
    Object.assign(new Error(message), { code, statusCode })

export const choosePersonalizedDifficulty = ({ profileDifficultyId, mastery, attempts }) => {
    const base = Math.min(3, Math.max(1, Number(profileDifficultyId)))
    if (mastery !== null && mastery < 45) return Math.max(1, base - 1)
    if (mastery !== null && mastery >= 85 && attempts >= 3) {
        return Math.min(3, base + 1)
    }
    return base
}

export async function findAcademicUnitGenerationContext({
    userId,
    unitId,
    client = databasePool,
}) {
    const result = await client.query({
        text: `
            SELECT u.id AS unit_id, u.title AS unit_title,
                   u.description AS unit_description,
                   m.title AS module_title, st.title AS stage_title,
                   sp.name AS specialization_name,
                   t.id AS topic_id, t.name AS topic_name,
                   t.description AS topic_description,
                   e.language_id, l.name AS language_name,
                   l.file_extension,
                   lp.current_difficulty_id,
                   da.id AS diagnostic_assessment_id,
                   ks.mastery_score, ks.confidence_score, ks.attempts_count
            FROM academic_units u
            JOIN academic_modules m ON m.id = u.module_id
                 AND m.status = 'published'
            JOIN academic_stages st ON st.id = m.stage_id
                 AND st.status = 'published'
            JOIN academic_specializations sp ON sp.key = st.specialization_key
            JOIN academic_unit_topics aut ON aut.unit_id = u.id
            JOIN topics t ON t.id = aut.topic_id AND t.is_active = TRUE
            JOIN academic_unit_exercises ue ON ue.unit_id = u.id
            JOIN exercises e ON e.id = ue.exercise_id
                 AND e.status = 'published'
            JOIN supported_languages l ON l.id = e.language_id AND l.is_active = TRUE
            LEFT JOIN learning_profiles lp ON lp.user_id = $2
            LEFT JOIN diagnostic_assessments da
                 ON da.id = lp.last_diagnostic_assessment_id
                 AND da.user_id = $2 AND da.status = 'completed'
            LEFT JOIN knowledge_states ks
                 ON ks.user_id = $2 AND ks.topic_id = t.id
            WHERE u.id = $1 AND u.status = 'published'
            ORDER BY ks.mastery_score ASC NULLS LAST, aut.topic_id, ue.position
            LIMIT 1
        `,
        values: [unitId, userId],
    })
    const row = result.rows[0]
    if (!row) return null
    if (!row.diagnostic_assessment_id || !row.current_difficulty_id) {
        return { diagnosticRequired: true }
    }
    const mastery = row.mastery_score === null ? null : Number(row.mastery_score)
    const attempts = Number(row.attempts_count ?? 0)
    const difficultyId = choosePersonalizedDifficulty({
        profileDifficultyId: row.current_difficulty_id,
        mastery,
        attempts,
    })
    const difficulty = await client.query({
        text: `SELECT id, name FROM difficulty_levels WHERE id = $1`,
        values: [difficultyId],
    })
    if (!difficulty.rows[0]) throw new Error('Difficulty catalog unavailable')

    return {
        unitId: row.unit_id,
        topic: {
            id: row.topic_id,
            name: row.topic_name,
            description: row.topic_description,
            masteryScore: mastery,
            confidenceScore: row.confidence_score === null
                ? null : Number(row.confidence_score),
        },
        language: {
            id: row.language_id,
            name: row.language_name,
            fileExtension: row.file_extension,
        },
        difficulty: difficulty.rows[0],
        diagnosticAssessmentId: row.diagnostic_assessment_id,
        curriculumContext: {
            specialization: row.specialization_name,
            stage: row.stage_title,
            module: row.module_title,
            unit: row.unit_title,
            description: row.unit_description,
        },
    }
}

export async function findActivePersonalizedUnitPractice({
    userId,
    unitId,
    client = databasePool,
}) {
    const result = await client.query({
        text: `
            SELECT id, exercise_id, status
            FROM exercise_assignments
            WHERE user_id = $1
              AND academic_unit_id = $2
              AND source = 'manual'
              AND metadata->>'academicPersonalized' = 'true'
              AND status IN ('assigned', 'started')
              AND (expires_at IS NULL OR expires_at > NOW())
            ORDER BY assigned_at DESC, id DESC
            LIMIT 1
        `,
        values: [userId, unitId],
    })
    if (!result.rows[0]) return null
    return {
        id: result.rows[0].id,
        exerciseId: result.rows[0].exercise_id,
        academicUnitId: unitId,
        status: result.rows[0].status,
    }
}

export async function verifyGeneratedAcademicSolution({
    generated,
    language,
    evaluate = evaluateExerciseSubmission,
}) {
    if (Number(language.id) !== 1) {
        throw errorWithCode(
            'ACADEMIC_GENERATION_LANGUAGE_UNSUPPORTED',
            'Por ahora la práctica personalizada admite JavaScript.',
            409,
        )
    }
    const tests = generated.testCases.map((item, index) => ({
        ...item,
        id: 'generated-test-' + index,
    }))
    const result = await evaluate({
        evaluatorName: 'docker',
        languageId: Number(language.id),
        submittedCode: generated.solutionCode,
        solutionCode: generated.solutionCode,
        testCases: tests,
    })
    if (!result.passed || result.testsPassed !== tests.length) {
        throw errorWithCode(
            'ACADEMIC_GENERATION_VALIDATION_FAILED',
            'No se pudo validar el ejercicio. Vuelve a intentar.',
            502,
        )
    }
}

export async function generateAcademicUnitPractice({
    userId,
    unitId,
    pool = databasePool,
    readContext = findAcademicUnitGenerationContext,
    findActive = findActivePersonalizedUnitPractice,
    findOnboarding = findStudentOnboardingByUserId,
    generate = generatePersonalizedExercise,
    verify = verifyGeneratedAcademicSolution,
    createExercise = createExerciseRecord,
    createTests = createExerciseTestCaseRecords,
    createAssignment = createExerciseAssignmentRecord,
    createLog = createExerciseGenerationLogRecord,
}) {
    const existing = await findActive({ userId, unitId, client: pool })
    if (existing) return { created: false, assignment: existing }

    const context = await readContext({ userId, unitId, client: pool })
    if (!context) {
        throw errorWithCode(
            'ACADEMIC_UNIT_NOT_FOUND',
            'La unidad académica no está publicada.',
            404,
        )
    }
    if (context.diagnosticRequired) {
        throw errorWithCode(
            'ACADEMIC_DIAGNOSTIC_REQUIRED',
            'Completa el diagnóstico para generar ejercicios a tu nivel.',
            409,
        )
    }
    if (Number(context.language.id) !== 1) {
        throw errorWithCode(
            'ACADEMIC_GENERATION_LANGUAGE_UNSUPPORTED',
            'Por ahora la práctica personalizada admite JavaScript.',
            409,
        )
    }

    const onboarding = await findOnboarding({ userId, client: pool })
    const interests = onboarding?.technologyInterestKeys?.length
        ? onboarding.technologyInterestKeys
        : onboarding?.interestKeys
    const personalizationContext = onboarding && Array.isArray(interests)
        && interests.length > 0 ? {
            learningGoal: onboarding.learningGoal,
            studyPace: onboarding.studyPace,
            interestKeys: interests.slice(0, 3),
        } : null

    const sequence = await pool.query({
        text: `
            SELECT COUNT(*)::int AS total
            FROM exercise_assignments
            WHERE user_id = $1
              AND academic_unit_id = $2
              AND metadata->>'academicPersonalized' = 'true'
        `,
        values: [userId, unitId],
    })
    const variationKey = [
        context.diagnosticAssessmentId,
        unitId,
        Number(sequence.rows[0]?.total ?? 0) + 1,
        randomUUID(),
    ].join(':')

    const started = Date.now()
    const generation = await generate({
        userId,
        variationKey,
        language: context.language,
        difficulty: context.difficulty,
        topic: context.topic,
        personalizationContext,
        curriculumContext: context.curriculumContext,
    })
    const item = generation?.exercise
    if (!item || !Array.isArray(item.testCases) || item.testCases.length < 3
        || Number(item.topicId) !== Number(context.topic.id)
        || Number(item.difficultyId) !== Number(context.difficulty.id)
        || Number(item.languageId) !== Number(context.language.id)) {
        throw errorWithCode(
            'ACADEMIC_GENERATION_INVALID',
            'El ejercicio generado no coincide con el tema y nivel solicitado.',
            502,
        )
    }

    await verify({ generated: item, language: context.language })

    const client = await pool.connect()
    let tx = false
    try {
        await client.query('BEGIN')
        tx = true
        await client.query({
            text: `SELECT pg_advisory_xact_lock(
                hashtextextended($1::text || ':' || $2::text, 0)
            )`,
            values: [userId, unitId],
        })
        // Una segunda pestaña puede haber generado otra práctica mientras
        // esta petición esperaba la respuesta de IA.
        const simultaneous = await findActive({ userId, unitId, client })
        if (simultaneous) {
            await client.query('COMMIT')
            tx = false
            return { created: false, assignment: simultaneous }
        }

        const exercise = await createExercise({
            topicId: item.topicId,
            difficultyId: item.difficultyId,
            languageId: item.languageId,
            createdByUserId: userId,
            title: item.title,
            statement: item.statement,
            instructions: item.instructions,
            starterCode: item.starterCode,
            solutionCode: item.solutionCode,
            estimatedMinutes: item.estimatedMinutes,
            generationSource: 'ai',
            status: 'published',
            client,
        })
        await createTests({
            exerciseId: exercise.id,
            testCases: item.testCases,
            client,
        })
        const assignment = await createAssignment({
            userId,
            exerciseId: exercise.id,
            academicUnitId: unitId,
            source: 'manual',
            status: 'assigned',
            expiresAt: null,
            metadata: {
                academicPersonalized: true,
                generatedFromUnitId: unitId,
                diagnosticAssessmentId: context.diagnosticAssessmentId,
                topicId: context.topic.id,
                difficultyId: context.difficulty.id,
                masteryScore: context.topic.masteryScore,
                provider: generation.provider,
                model: generation.model,
            },
            client,
        })
        await createLog({
            userId,
            exerciseId: exercise.id,
            modelName: generation.model,
            generationParams: {
                academicUnitId: unitId,
                variationKey,
                topicId: context.topic.id,
                difficultyId: context.difficulty.id,
                provider: generation.provider,
            },
            latencyMs: Math.max(0, Date.now() - started),
            success: true,
            client,
        })
        await client.query('COMMIT')
        tx = false
        return {
            created: true,
            assignment: {
                id: assignment.id,
                exerciseId: exercise.id,
                academicUnitId: unitId,
                status: 'assigned',
            },
        }
    } catch (error) {
        if (tx) await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

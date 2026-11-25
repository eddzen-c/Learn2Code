
import { databasePool } from '../../../config/database.js'

export async function findAcademicPersonalizationSignals({ userId, client = databasePool }) {
    const [profile, knowledge, assignments] = await Promise.all([
        client.query({
            text: `
                SELECT lp.current_difficulty_id, dl.name AS difficulty_name,
                       lp.last_diagnostic_assessment_id, da.overall_score
                FROM learning_profiles lp
                LEFT JOIN difficulty_levels dl ON dl.id = lp.current_difficulty_id
                LEFT JOIN diagnostic_assessments da
                    ON da.id = lp.last_diagnostic_assessment_id
                   AND da.user_id = lp.user_id
                   AND da.status = 'completed'
                WHERE lp.user_id = $1
            `,
            values: [userId],
        }),
        client.query({
            text: `
                SELECT aut.unit_id, aut.topic_id, ks.mastery_score,
                       ks.confidence_score, ks.attempts_count
                FROM academic_unit_topics aut
                LEFT JOIN knowledge_states ks
                  ON ks.topic_id = aut.topic_id AND ks.user_id = $1
            `,
            values: [userId],
        }),
        client.query({
            text: `
                SELECT academic_unit_id AS unit_id,
                       COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_count,
                       COUNT(*) FILTER (
                           WHERE status IN ('assigned', 'started')
                             AND (expires_at IS NULL OR expires_at > NOW())
                       )::int AS active_count
                FROM exercise_assignments
                WHERE user_id = $1 AND academic_unit_id IS NOT NULL
                GROUP BY academic_unit_id
            `,
            values: [userId],
        }),
    ])
    const row = profile.rows[0]
    const hasDiagnostic = Boolean(
        row?.last_diagnostic_assessment_id
        && row?.overall_score !== null
        && row?.overall_score !== undefined
        && row?.current_difficulty_id,
    )
    return {
        profile: hasDiagnostic ? {
            difficultyId: Number(row.current_difficulty_id),
            difficultyName: row.difficulty_name,
            overallScore: Number(row.overall_score),
        } : null,
        knowledge: knowledge.rows.map((item) => ({
            unitId: item.unit_id,
            topicId: Number(item.topic_id),
            mastery: item.mastery_score === null ? null : Number(item.mastery_score),
            confidence: item.confidence_score === null ? null : Number(item.confidence_score),
            attempts: Number(item.attempts_count ?? 0),
        })),
        assignments: assignments.rows.map((item) => ({
            unitId: item.unit_id,
            completed: Number(item.completed_count),
            active: Number(item.active_count),
        })),
    }
}

export function personalizeAcademicCatalog(catalog, signals) {
    const profile = signals?.profile ?? null
    if (!profile) {
        return {
            specializations: catalog,
            personalization: {
                status: 'diagnostic_required',
                difficulty: null,
                message: 'Realiza el diagnóstico para recibir recomendaciones según tus conocimientos.',
            },
        }
    }

    const topicMap = new Map()
    for (const record of signals.knowledge ?? []) {
        if (!topicMap.has(record.unitId)) topicMap.set(record.unitId, [])
        topicMap.get(record.unitId).push(record)
    }
    const attemptMap = new Map(
        (signals.assignments ?? []).map((record) => [record.unitId, record]),
    )
    const difficultyId = Math.min(3, Math.max(1, profile.difficultyId))
    const targetPosition = difficultyId === 1 ? 1 : difficultyId === 2 ? 2 : 3
    const preferredMastery = difficultyId === 1 ? 45 : difficultyId === 2 ? 65 : 82

    const mapped = catalog.map((specialization) => {
        const stages = (specialization.stages ?? []).map((stage) => {
            const modules = (stage.modules ?? []).map((mod) => {
                const units = (mod.units ?? []).map((unit) => {
                    const known = (topicMap.get(unit.id) ?? []).filter(
                        (topic) => topic.mastery !== null,
                    )
                    const mastery = known.length
                        ? Math.round(known.reduce((sum, item) => sum + item.mastery, 0) / known.length)
                        : null
                    const progress = attemptMap.get(unit.id) ?? { completed: 0, active: 0 }
                    const completed = progress.completed > 0
                    const state = completed ? 'completed'
                        : progress.active > 0 ? 'in_progress'
                            : mastery !== null && mastery < 55 ? 'reinforce'
                                : mastery !== null && mastery >= 85 ? 'challenge'
                                    : 'practice'
                    const distance = Math.abs(Number(stage.position) - targetPosition)
                    const need = mastery === null ? 45 : Math.abs(mastery - preferredMastery)
                    const priority = (completed ? 500 : 0)
                        + distance * 18
                        + (mastery === null ? 12 : 0)
                        + (mastery !== null && mastery < 55 ? -45 : 0)
                        + (mastery !== null && mastery >= 85 ? 40 : 0)
                        + (progress.active > 0 ? -80 : 0)
                        + need / 10
                    const messages = {
                        completed: 'Ya completaste una práctica de esta unidad. Puedes profundizar o repetirla.',
                        in_progress: 'Tienes un ejercicio en curso en esta unidad.',
                        reinforce: 'Tu desempeño en este tema sugiere reforzar sus fundamentos.',
                        challenge: 'Tu dominio en este tema permite practicar retos más exigentes.',
                        practice: 'Practica este tema para seguir desarrollando tus habilidades.',
                    }
                    return {
                        ...unit,
                        personalization: {
                            state,
                            mastery,
                            completedExercises: progress.completed,
                            activeExercises: progress.active,
                            suggestedDifficulty: difficultyId === 3 && mastery !== null && mastery < 55
                                ? 2 : difficultyId === 2 && mastery !== null && mastery < 40
                                    ? 1 : difficultyId,
                            message: messages[state],
                            priority,
                            recommended: false,
                        },
                    }
                })
                return { ...mod, units }
            })
            return { ...stage, modules }
        })

        const candidates = stages.flatMap((stage) =>
            stage.modules.flatMap((mod) => mod.units))
        const recommended = candidates
            .filter((unit) => unit.personalization.state !== 'completed')
            .sort((a, b) => a.personalization.priority - b.personalization.priority)[0]
        const enrichedStages = stages.map((stage) => ({
            ...stage,
            modules: stage.modules.map((mod) => ({
                ...mod,
                units: mod.units.map((unit) => ({
                    ...unit,
                    personalization: {
                        ...unit.personalization,
                        recommended: unit.id === recommended?.id,
                    },
                })),
                personalization: {
                    recommended: mod.units.some((unit) => unit.id === recommended?.id),
                },
            })),
            personalization: {
                recommended: stage.modules.some(
                    (mod) => mod.units.some((unit) => unit.id === recommended?.id),
                ),
            },
        }))
        return {
            ...specialization,
            stages: enrichedStages,
            personalization: {
                recommendedUnitId: recommended?.id ?? null,
                recommendedStageId: enrichedStages.find(
                    (stage) => stage.personalization.recommended,
                )?.id ?? null,
            },
        }
    })
    return {
        specializations: mapped,
        personalization: {
            status: 'personalized',
            difficulty: { id: difficultyId, name: profile.difficultyName },
            diagnosticScore: profile.overallScore,
            message: 'Recomendaciones calculadas con el diagnóstico y el dominio registrado por tema.',
        },
    }
}

export async function getPersonalizedAcademicCatalog({
    userId,
    client = databasePool,
    listCatalog,
    readSignals = findAcademicPersonalizationSignals,
}) {
    const [catalog, signals] = await Promise.all([
        listCatalog({ client }),
        readSignals({ userId, client }),
    ])
    return personalizeAcademicCatalog(catalog, signals)
}

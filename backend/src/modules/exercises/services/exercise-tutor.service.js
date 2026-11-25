import { databasePool } from '../../../config/database.js';
import { redisClient } from '../../../config/redis.js';
import {
    readTutorQuestionUsage,
    releaseTutorQuestion,
    reserveTutorQuestion,
} from './exercise-tutor-chat-quota.service.js';
import {
    generateExerciseTutorReply,
} from '../providers/openai-exercise-tutor.provider.js';

export async function consumeTutorQuota(userId, redis = redisClient) {
    // Límite por usuario: doce consultas en una ventana de sesenta segundos.
    const key = 'exercise:tutor:minute:' + userId;
    const [count] = await redis.multi()
        .incr(key)
        .expire(key, 60, 'NX')
        .exec();

    if (count > 12) {
        const error = new Error(
            'Has alcanzado el límite temporal de consultas. Intenta de nuevo en un minuto.',
        );
        error.code = 'EXERCISE_TUTOR_RATE_LIMIT';
        error.statusCode = 429;
        throw error;
    }
}

export async function askExerciseTutor({
    userId,
    assignmentId,
    kind,
    hintLevel,
    message,
    history,
    model,
    requestId,
    client = databasePool,
    reserveQuestion = reserveTutorQuestion,
    releaseQuestion = releaseTutorQuestion,
    readUsage = readTutorQuestionUsage,
    consumeQuota = consumeTutorQuota,
    generateReply = generateExerciseTutorReply,
}) {
    const result = await client.query({
        text: `
            SELECT
                e.title, e.statement, e.instructions, e.starter_code,
                t.name AS topic_name,
                l.name AS language_name,
                d.name AS difficulty_name,
                ks.mastery_score AS student_mastery,
                ks.confidence_score AS student_confidence,
                ks.attempts_count AS student_attempts,
                CASE WHEN da.id IS NOT NULL
                    THEN lp.current_difficulty_id
                    ELSE NULL
                END AS student_difficulty_id,
                COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'input', tc.input,
                            'expectedOutput', tc.expected_output
                        ) ORDER BY tc.position
                    )
                    FROM exercise_test_cases tc
                    WHERE tc.exercise_id = e.id
                      AND tc.is_hidden = FALSE
                ), '[]'::jsonb) AS public_examples
            FROM exercise_assignments a
            JOIN exercises e ON e.id = a.exercise_id
                AND e.status = 'published'
            JOIN topics t ON t.id = e.topic_id
            JOIN supported_languages l ON l.id = e.language_id
            JOIN difficulty_levels d ON d.id = e.difficulty_id
            LEFT JOIN learning_profiles lp ON lp.user_id = a.user_id
            LEFT JOIN diagnostic_assessments da
                ON da.id = lp.last_diagnostic_assessment_id
                AND da.user_id = a.user_id
                AND da.status = 'completed'
            LEFT JOIN knowledge_states ks
                ON ks.user_id = a.user_id AND ks.topic_id = e.topic_id
            WHERE a.id = $1
              AND a.user_id = $2
              AND a.source IN ('manual', 'adaptive_ai')
              AND (
                  a.status = 'completed'
                  OR (
                      a.status IN ('assigned', 'started')
                      AND (a.expires_at IS NULL OR a.expires_at > NOW())
                  )
              )
            LIMIT 1
        `,
        values: [assignmentId, userId],
    });

    const row = result.rows[0];
    if (!row) {
        const error = new Error(
            'No tienes acceso a esta asignación de ejercicio.',
        );
        error.code = 'EXERCISE_TUTOR_ASSIGNMENT_NOT_FOUND';
        error.statusCode = 404;
        throw error;
    }

    await consumeQuota(userId);

    const exercise = {
        title: row.title,
        statement: row.statement,
        instructions: row.instructions,
        starterCode: row.starter_code,
        topic: row.topic_name,
        language: row.language_name,
        difficulty: row.difficulty_name,
        publicTestCases: row.public_examples ?? [],
        studentContext: {
            difficultyId: row.student_difficulty_id ?? null,
            mastery: row.student_mastery === null || row.student_mastery === undefined
                ? null : Number(row.student_mastery),
            confidence: row.student_confidence === null || row.student_confidence === undefined
                ? null : Number(row.student_confidence),
            attempts: Number(row.student_attempts ?? 0),
        },
    };

    let reserved = false;
    if (kind === 'question') {
        reserved = await reserveQuestion({
            userId,
            assignmentId,
            requestId,
        });
    }

    try {
        const answer = await generateReply({
            userId,
            exercise,
            kind,
            hintLevel,
            message,
            history,
            model,
        });

        if (kind !== 'question') return answer;

        return {
            ...answer,
            chatUsage: await readUsage({ userId, assignmentId }),
        };
    } catch (error) {
        if (reserved) {
            await releaseQuestion({
                userId,
                assignmentId,
                requestId,
            });
        }
        throw error;
    }
}

export async function getExerciseTutorChatUsage({
    userId,
    assignmentId,
    client = databasePool,
    readUsage = readTutorQuestionUsage,
}) {
    const result = await client.query({
        text: `
            SELECT id
            FROM exercise_assignments
            WHERE id = $1
              AND user_id = $2
              AND source IN ('manual', 'adaptive_ai')
              AND (
                  status = 'completed'
                  OR (
                      status IN ('assigned', 'started')
                      AND (expires_at IS NULL OR expires_at > NOW())
                  )
              )
            LIMIT 1
        `,
        values: [assignmentId, userId],
    });

    if (!result.rows[0]) {
        const error = new Error(
            'No tienes acceso a esta asignación de ejercicio.',
        );
        error.statusCode = 404;
        error.code = 'EXERCISE_TUTOR_ASSIGNMENT_NOT_FOUND';
        throw error;
    }

    return readUsage({ userId, assignmentId });
}

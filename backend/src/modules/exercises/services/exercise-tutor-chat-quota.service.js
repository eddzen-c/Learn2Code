import { redisClient } from '../../../config/redis.js'

export const TUTOR_CHAT_LIMIT = 30

const quotaKey = (userId, assignmentId) =>
    `exercise:tutor:questions:${userId}:${assignmentId}`

// Reserva atómica: no puede superar el límite con dos pestañas simultáneas.
// El ID de la petición permite reintentar sin ocupar otra plaza.
const reserveLua = `
    if redis.call('SISMEMBER', KEYS[1], ARGV[1]) == 1 then
        return 1
    end
    if redis.call('SCARD', KEYS[1]) >= tonumber(ARGV[2]) then
        return 0
    end
    redis.call('SADD', KEYS[1], ARGV[1])
    return 2
`

export async function reserveTutorQuestion({
    userId,
    assignmentId,
    requestId,
    redis = redisClient,
}) {
    const result = await redis.eval(reserveLua, {
        keys: [quotaKey(userId, assignmentId)],
        arguments: [requestId, String(TUTOR_CHAT_LIMIT)],
    })
    if (result === 0) {
        const error = new Error(
            'Alcanzaste las 30 preguntas disponibles para este ejercicio.',
        )
        error.statusCode = 429
        error.code = 'EXERCISE_TUTOR_CHAT_LIMIT'
        throw error
    }
    return result === 2
}

export async function releaseTutorQuestion({
    userId,
    assignmentId,
    requestId,
    redis = redisClient,
}) {
    await redis.sRem(quotaKey(userId, assignmentId), requestId)
}

export async function readTutorQuestionUsage({
    userId,
    assignmentId,
    redis = redisClient,
}) {
    const used = await redis.sCard(quotaKey(userId, assignmentId))
    return { used, limit: TUTOR_CHAT_LIMIT }
}

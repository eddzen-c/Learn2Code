import assert from 'node:assert/strict'
import test from 'node:test'

import {
    readTutorQuestionUsage,
    releaseTutorQuestion,
    reserveTutorQuestion,
} from '../services/exercise-tutor-chat-quota.service.js'
import {
    askExerciseTutor,
    getExerciseTutorChatUsage,
} from '../services/exercise-tutor.service.js'

const userId = 'user-a'
const assignmentId = 'assignment-a'

function fakeRedis() {
    const data = new Map()
    return {
        async eval(_script, { keys, arguments: args }) {
            const [key] = keys
            const [requestId, limit] = args
            if (!data.has(key)) data.set(key, new Set())
            const set = data.get(key)
            if (set.has(requestId)) return 1
            if (set.size >= Number(limit)) return 0
            set.add(requestId)
            return 2
        },
        async sRem(key, requestId) {
            return data.get(key)?.delete(requestId) ? 1 : 0
        },
        async sCard(key) {
            return data.get(key)?.size ?? 0
        },
    }
}

test('only thirty unique questions per assignment; retries use the same slot', async () => {
    const redis = fakeRedis()

    for (let i = 0; i < 30; i++) {
        const reserved = await reserveTutorQuestion({
            userId, assignmentId, requestId: 'id-' + i, redis,
        })
        assert.equal(reserved, true)
    }

    assert.deepEqual(
        await readTutorQuestionUsage({ userId, assignmentId, redis }),
        { used: 30, limit: 30 },
    )

    assert.equal(await reserveTutorQuestion({
        userId, assignmentId, requestId: 'id-1', redis,
    }), false)

    await assert.rejects(
        reserveTutorQuestion({
            userId, assignmentId, requestId: 'id-30', redis,
        }),
        (error) => error.code === 'EXERCISE_TUTOR_CHAT_LIMIT'
            && error.statusCode === 429,
    )

    // Otro ejercicio comienza con su propio cupo.
    assert.deepEqual(
        await readTutorQuestionUsage({
            userId, assignmentId: 'assignment-b', redis,
        }),
        { used: 0, limit: 30 },
    )

    await releaseTutorQuestion({
        userId, assignmentId, requestId: 'id-29', redis,
    })

    assert.equal(await reserveTutorQuestion({
        userId, assignmentId, requestId: 'id-30', redis,
    }), true)
})

const context = {
    title: 'Filtrar productos',
    statement: 'Devuelve los nombres',
    instructions: 'Solo JSON',
    starter_code: '// inicial',
    topic_name: 'estructuras_de_datos',
    language_name: 'JavaScript',
    difficulty_name: 'Intermedio',
    public_examples: [],
}

test('a failed tutor question releases quota; hints never spend a slot', async () => {
    let reserved = 0
    let released = 0

    const base = {
        userId,
        assignmentId,
        requestId: 'request-123',
        message: '¿Cómo empiezo?',
        history: [],
        client: {
            query: async () => ({ rows: [context] }),
        },
        consumeQuota: async () => {},
        reserveQuestion: async () => {
            reserved++
            return true
        },
        releaseQuestion: async () => { released++ },
        readUsage: async () => ({ used: 1, limit: 30 }),
    }

    await assert.rejects(
        askExerciseTutor({
            ...base,
            kind: 'question',
            generateReply: async () => { throw new Error('API unavailable') },
        }),
        /API unavailable/,
    )

    assert.equal(reserved, 1)
    assert.equal(released, 1)

    const success = await askExerciseTutor({
        ...base,
        kind: 'question',
        generateReply: async () => ({ reply: 'Revisa el arreglo.' }),
    })
    assert.deepEqual(success.chatUsage, { used: 1, limit: 30 })
    assert.equal(reserved, 2)
    assert.equal(released, 1)

    const hint = await askExerciseTutor({
        ...base,
        kind: 'hint',
        hintLevel: 1,
        generateReply: async () => ({ reply: 'Piensa en la entrada.' }),
    })
    assert.equal(hint.chatUsage, undefined)
    assert.equal(reserved, 2)
})

test('usage endpoint checks assignment ownership', async () => {
    const used = await getExerciseTutorChatUsage({
        userId,
        assignmentId,
        client: {
            query: async (query) => {
                assert.deepEqual(query.values, [assignmentId, userId])
                return { rows: [{ id: assignmentId }] }
            },
        },
        readUsage: async () => ({ used: 7, limit: 30 }),
    })
    assert.deepEqual(used, { used: 7, limit: 30 })

    await assert.rejects(
        getExerciseTutorChatUsage({
            userId,
            assignmentId,
            client: { query: async () => ({ rows: [] }) },
        }),
        (error) => error.code === 'EXERCISE_TUTOR_ASSIGNMENT_NOT_FOUND',
    )
})

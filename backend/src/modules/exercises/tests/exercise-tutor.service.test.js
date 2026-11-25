import assert from 'node:assert/strict';
import test from 'node:test';

import { env } from '../../../config/env.js';
import {
    generateExerciseTutorReply,
} from '../providers/openai-exercise-tutor.provider.js';
import {
    askExerciseTutor,
    consumeTutorQuota,
} from '../services/exercise-tutor.service.js';

const assignmentId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';

test('tutor retrieves only published public context scoped to the user', async () => {
    let calledQuery = null;
    let capturedRequest = null;

    const reply = await askExerciseTutor({
        userId,
        assignmentId,
        kind: 'hint',
        hintLevel: 2,
        model: 'gpt-5.4-mini',
        message: '',
        history: [],
        client: {
            query: async (query) => {
                calledQuery = query;
                return { rows: [{
                    title: 'Filtra productos',
                    statement: 'Devuelve nombres disponibles',
                    instructions: 'Solo JSON',
                    starter_code: '// inicial',
                    topic_name: 'estructuras_de_datos',
                    language_name: 'JavaScript',
                    difficulty_name: 'Intermedio',
                    student_difficulty_id: 2,
                    student_mastery: 32,
                    student_confidence: 48,
                    student_attempts: 4,
                    public_examples: [{input:'[]',expectedOutput:'[]'}],
                }] };
            },
        },
        consumeQuota: async () => undefined,
        generateReply: async (request) => {
            capturedRequest = request;
            return { reply: 'Prueba separar los casos.', model: 'tutor' };
        },
    });

    assert.equal(reply.reply, 'Prueba separar los casos.');
    assert.deepEqual(calledQuery.values, [assignmentId, userId]);
    assert.match(calledQuery.text, /a\.user_id\s*=\s*\$2/);
    assert.match(calledQuery.text, /tc\.is_hidden\s*=\s*FALSE/);
    assert.doesNotMatch(calledQuery.text, /e\.solution_code/);
    assert.equal(capturedRequest.kind, 'hint');
    assert.equal(capturedRequest.hintLevel, 2);
    assert.equal(capturedRequest.model, 'gpt-5.4-mini');
    assert.equal(capturedRequest.exercise.title, 'Filtra productos');
    assert.equal(capturedRequest.exercise.publicTestCases.length, 1);
    assert.equal(capturedRequest.exercise.solutionCode, undefined);
    assert.deepEqual(capturedRequest.exercise.studentContext, {
        difficultyId: 2, mastery: 32, confidence: 48, attempts: 4,
    });
    assert.match(calledQuery.text, /knowledge_states/);
    assert.match(calledQuery.text, /diagnostic_assessments/);
});

test('tutor rejects unavailable or foreign assignments without invoking AI', async () => {
    let generated = false;
    await assert.rejects(
        askExerciseTutor({
            userId, assignmentId, kind: 'question', message: 'Hola', history: [],
            client: { query: async () => ({rows: []}) },
            consumeQuota: async () => {},
            generateReply: async () => { generated = true; },
        }),
        (error) => error.statusCode === 404
            && error.code === 'EXERCISE_TUTOR_ASSIGNMENT_NOT_FOUND',
    );
    assert.equal(generated, false);
});

test('tutor rate limit blocks more than twelve requests per minute', async () => {
    let count = 12;
    const redis = {
        multi() {
            return {
                incr() { return this; },
                expire() { return this; },
                async exec() { return [++count, true]; },
            };
        },
    };
    await assert.rejects(
        consumeTutorQuota(userId, redis),
        (error) => error.statusCode === 429
            && error.code === 'EXERCISE_TUTOR_RATE_LIMIT',
    );
});

test('tutor OpenAI request selects a separate model, no storage or answers', async () => {
    if (env.ai.provider !== 'openai') return;
    let request = null;
    const reply = await generateExerciseTutorReply({
        userId,
        exercise: {
            title: 'Calcular suma',
            statement: 'Suma dos números',
            instructions: 'Muestra JSON',
            starterCode: '// inicio',
            topic: 'variables',
            language: 'JavaScript',
            difficulty: 'Inicial',
            publicTestCases: [],
            solutionCode: 'NO_DEBE_LLEGAR_AL_TUTOR',
            hiddenTests: ['PRUEBA_PRIVADA'],
        },
        kind: 'hint',
        hintLevel: 1,
        client: {
            responses: {
                create: async (params) => {
                    request = params;
                    return {output_text: 'Piensa qué datos necesitas.'};
                },
            },
        },
    });
    assert.equal(reply.reply, 'Piensa qué datos necesitas.');
    assert.equal(request.model, env.ai.tutorModel);
    assert.equal(request.store, false);
    assert.equal(request.safety_identifier.length, 64);
    assert.doesNotMatch(request.input, /NO_DEBE_LLEGAR_AL_TUTOR|PRUEBA_PRIVADA/);
    assert.match(request.instructions, /No escribas la solución completa/);
});

test('tutor refuses unapproved model IDs before calling OpenAI', async () => {
    if (env.ai.provider !== 'openai') return;
    let reachedApi = false;
    await assert.rejects(
        generateExerciseTutorReply({
            userId,
            exercise: { title: 'Ejercicio de prueba' },
            kind: 'question',
            message: '¿Cómo comienzo?',
            model: 'gpt-5.6-terra',
            client: {
                responses: {
                    create: async () => {
                        reachedApi = true;
                        return { output_text: 'Nunca se invoca.' };
                    },
                },
            },
        }),
        (error) => error.statusCode === 400
            && error.code === 'INVALID_TUTOR_MODEL',
    );
    assert.equal(reachedApi, false);
});

test('tutor can select a permitted mini model per request', async () => {
    if (env.ai.provider !== 'openai') return;
    let calledModel = null;
    const result = await generateExerciseTutorReply({
        userId,
        exercise: {
            title: 'Filtrar una lista',
            statement: 'Filtra los datos',
            publicTestCases: [],
        },
        kind: 'question',
        message: 'Ayúdame',
        model: 'gpt-4o-mini',
        client: {
            responses: {
                create: async (params) => {
                    calledModel = params.model;
                    return { output_text: 'Revisa la condición primero.' };
                },
            },
        },
    });
    assert.equal(calledModel, 'gpt-4o-mini');
    assert.equal(result.model, 'gpt-4o-mini');
});

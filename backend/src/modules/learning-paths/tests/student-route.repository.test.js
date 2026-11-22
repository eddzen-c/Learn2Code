
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    findStudentRouteSelection,
    saveStudentRouteSelection,
} from '../repositories/student-route.repository.js';

const date = '2026-10-28T20:00:00.000Z';

function createFakeDatabase() {
    const records = new Map();
    const calls = [];

    const client = {
        async query({ text, values }) {
            calls.push({ text, values });

            if (text.includes('INSERT INTO student_route_selections')) {
                const [userId, specializationKey] = values;

                const previous = records.get(userId);

                const row = {
                    user_id: userId,
                    specialization_key: specializationKey,
                    selected_at: previous?.selected_at ?? date,
                    updated_at: date,
                };

                records.set(userId, row);

                return { rows: [row] };
            }

            if (text.includes('FROM student_route_selections')) {
                const row = records.get(values[0]);

                return {
                    rows: row ? [row] : [],
                };
            }

            throw new Error('Consulta SQL inesperada');
        },
    };

    return {
        client,
        records,
        calls,
    };
}

test('returns null when the student has no route', async () => {
    const db = createFakeDatabase();

    const result = await findStudentRouteSelection({
        userId: 'student-1',
        client: db.client,
    });

    assert.equal(result, null);
    assert.equal(db.records.size, 0);
    assert.equal(db.calls.length, 1);

    assert.match(db.calls[0].text, /SELECT/);
    assert.doesNotMatch(db.calls[0].text, /INSERT INTO/);
});

test('saves an explicit Frontend selection', async () => {
    const db = createFakeDatabase();

    const selection = await saveStudentRouteSelection({
        userId: 'student-1',
        specializationKey: 'frontend',
        client: db.client,
    });

    assert.equal(selection.userId, 'student-1');
    assert.equal(selection.specializationKey, 'frontend');
    assert.equal(db.records.size, 1);

    assert.deepEqual(db.calls[0].values, [
        'student-1',
        'frontend',
    ]);
});

test('recovers the persisted selection', async () => {
    const db = createFakeDatabase();

    await saveStudentRouteSelection({
        userId: 'student-1',
        specializationKey: 'frontend',
        client: db.client,
    });

    const result = await findStudentRouteSelection({
        userId: 'student-1',
        client: db.client,
    });

    assert.equal(result.specializationKey, 'frontend');
    assert.equal(result.selectedAt, date);
    assert.equal(db.records.size, 1);
});

test('changes specialization without duplicating records', async () => {
    const db = createFakeDatabase();

    await saveStudentRouteSelection({
        userId: 'student-1',
        specializationKey: 'frontend',
        client: db.client,
    });

    await saveStudentRouteSelection({
        userId: 'student-1',
        specializationKey: 'backend',
        client: db.client,
    });

    const result = await findStudentRouteSelection({
        userId: 'student-1',
        client: db.client,
    });

    assert.equal(result.specializationKey, 'backend');
    assert.equal(db.records.size, 1);

    assert.match(db.calls[1].text, /ON CONFLICT/);
});

test('does not expose another student selection', async () => {
    const db = createFakeDatabase();

    await saveStudentRouteSelection({
        userId: 'student-1',
        specializationKey: 'frontend',
        client: db.client,
    });

    const otherStudent =
        await findStudentRouteSelection({
            userId: 'student-2',
            client: db.client,
        });

    assert.equal(otherStudent, null);
});

test('does not modify the AI learning plan', async () => {
    const db = createFakeDatabase();

    await saveStudentRouteSelection({
        userId: 'student-1',
        specializationKey: 'devops',
        client: db.client,
    });

    for (const call of db.calls) {
        assert.doesNotMatch(
            call.text,
            /UPDATE\s+learning_paths/i,
        );

        assert.doesNotMatch(
            call.text,
            /INSERT\s+INTO\s+learning_paths/i,
        );
    }
});

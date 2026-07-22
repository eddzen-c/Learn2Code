import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import {
    assignRoleToUser,
    createUserRecord,
    findUserByEmail,
} from '../repositories/user.repository.js';

const createUserRow = (overrides = {}) => ({
    id: randomUUID(),
    full_name: 'Learn2Code Student',
    email: 'student@example.test',
    password_hash: 'secure-password-hash',
    avatar_url: null,
    preferred_locale: 'es-MX',
    preferred_programming_language_id: null,
    email_verified_at: null,
    last_login_at: null,
    is_active: true,
    deleted_at: null,
    created_at: new Date('2026-07-21T12:00:00.000Z'),
    updated_at: new Date('2026-07-21T12:00:00.000Z'),
    roles: [],
    ...overrides,
});

const createFakeClient = ({
    rows = [],
    rowCount = rows.length,
} = {}) => {
    const queries = [];

    return {
        queries,

        query: async (queryConfig) => {
            queries.push(queryConfig);

            return {
                rows,
                rowCount,
            };
        },
    };
};

test('createUserRecord inserts and maps a user', async () => {
    const row = createUserRow();
    const client = createFakeClient({
        rows: [row],
        rowCount: 1,
    });

    const user = await createUserRecord({
        fullName: row.full_name,
        email: row.email,
        passwordHash: row.password_hash,
        client,
    });

    assert.match(
        client.queries[0].text,
        /INSERT INTO users/,
    );

    assert.deepEqual(
        client.queries[0].values,
        [
            row.full_name,
            row.email,
            row.password_hash,
        ],
    );

    assert.equal(user.id, row.id);
    assert.equal(user.fullName, row.full_name);
    assert.equal(user.email, row.email);
    assert.equal(user.passwordHash, row.password_hash);
    assert.deepEqual(user.roles, []);
});

test('assignRoleToUser assigns a role by name', async () => {
    const userId = randomUUID();
    const assignedAt =
        new Date('2026-07-21T12:00:00.000Z');

    const client = createFakeClient({
        rows: [{
            user_id: userId,
            role_id: 1,
            assigned_at: assignedAt,
        }],
        rowCount: 1,
    });

    const assignment = await assignRoleToUser({
        userId,
        roleName: 'student',
        client,
    });

    assert.match(
        client.queries[0].text,
        /INSERT INTO user_roles/,
    );

    assert.deepEqual(
        client.queries[0].values,
        [userId, 'student'],
    );

    assert.equal(assignment.userId, userId);
    assert.equal(assignment.roleId, 1);
    assert.equal(assignment.roleName, 'student');
});

test('assignRoleToUser returns null for missing role', async () => {
    const client = createFakeClient();

    const assignment = await assignRoleToUser({
        userId: randomUUID(),
        roleName: 'missing-role',
        client,
    });

    assert.equal(assignment, null);
});

test('findUserByEmail maps the user and roles', async () => {
    const row = createUserRow({
        roles: ['admin', 'student'],
    });

    const client = createFakeClient({
        rows: [row],
        rowCount: 1,
    });

    const user = await findUserByEmail({
        email: row.email,
        client,
    });

    assert.match(
        client.queries[0].text,
        /WHERE users\.email = \$1/,
    );

    assert.deepEqual(
        client.queries[0].values,
        [row.email],
    );

    assert.equal(user.id, row.id);
    assert.deepEqual(
        user.roles,
        ['admin', 'student'],
    );
});
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import request from 'supertest';

import app from '../../../app.js';

import {
    databasePool,
} from '../../../config/database.js';

import {
    createUserRecord,
    assignRoleToUser,
} from '../repositories/user.repository.js';

import {
    createAccessToken,
} from '../services/access-token.service.js';

import {
    DEFAULT_PRIVACY_PREFERENCES,
} from '../services/profile-privacy.service.js';

import {
    DEFAULT_NOTIFICATION_PREFERENCES,
} from '../services/profile-notifications.service.js';

const privacyEndpoint =
    '/api/v1/auth/me/privacy/preferences';

const notificationsEndpoint =
    '/api/v1/auth/me/notifications/preferences';

test('profile preferences endpoints', async (t) => {
    const temporaryUsers = [];

    // --------------------------------------------------------
    // LIMPIEZA AUTOMÁTICA
    // --------------------------------------------------------

    t.after(async () => {
        try {
            for (const user of temporaryUsers) {
                const result = await databasePool.query(
                    `
                    DELETE FROM users
                    WHERE id = $1
                      AND email = $2
                    RETURNING id
                    `,
                    [user.id, user.email],
                );

                assert.equal(result.rowCount, 1);
            }
        } finally {
            await databasePool.end();
        }
    });

    // --------------------------------------------------------
    // PREPARAR USUARIOS TEMPORALES
    // --------------------------------------------------------

    const createTemporaryUser = async () => {
        const email =
            `profile-preferences-test-${randomUUID()}@example.invalid`;

        const user = await createUserRecord({
            fullName: 'Prueba Temporal Perfil',
            email,
            passwordHash: 'temporary-test-hash',
        });

        temporaryUsers.push({
            id: user.id,
            email,
        });

        await assignRoleToUser({
            userId: user.id,
            roleName: 'student',
        });

        const token = await createAccessToken({
            userId: user.id,
            roles: ['student'],
        });

        return {
            userId: user.id,
            authorization: `Bearer ${token}`,
        };
    };

    // --------------------------------------------------------
    // AUTENTICACIÓN
    // --------------------------------------------------------

    await t.test(
        'rejects anonymous and invalid requests',
        async () => {
            for (const endpoint of [
                privacyEndpoint,
                notificationsEndpoint,
            ]) {
                for (const method of ['get', 'patch']) {
                    const anonymous =
                        await request(app)[method](endpoint);

                    assert.equal(anonymous.status, 401);

                    const invalid =
                        await request(app)[method](endpoint)
                            .set(
                                'Authorization',
                                'Bearer invalid-token',
                            );

                    assert.equal(invalid.status, 401);
                }
            }
        },
    );

    await t.test(
        'rejects tokens belonging to nonexistent users',
        async () => {
            const token = await createAccessToken({
                userId: randomUUID(),
                roles: ['student'],
            });

            for (const endpoint of [
                privacyEndpoint,
                notificationsEndpoint,
            ]) {
                const response = await request(app)
                    .get(endpoint)
                    .set('Authorization', `Bearer ${token}`);

                assert.equal(response.status, 401);
            }
        },
    );

    // --------------------------------------------------------
    // CREAR CUENTAS PARA LAS PRUEBAS
    // --------------------------------------------------------

    const first = await createTemporaryUser();
    const second = await createTemporaryUser();

    // --------------------------------------------------------
    // VALORES PREDETERMINADOS
    // --------------------------------------------------------

    await t.test(
        'loads default preferences from both endpoints',
        async () => {
            const privacy = await request(app)
                .get(privacyEndpoint)
                .set('Authorization', first.authorization);

            assert.equal(privacy.status, 200);

            assert.deepEqual(
                privacy.body.data.preferences,
                DEFAULT_PRIVACY_PREFERENCES,
            );

            const notifications = await request(app)
                .get(notificationsEndpoint)
                .set('Authorization', first.authorization);

            assert.equal(notifications.status, 200);

            assert.deepEqual(
                notifications.body.data.preferences,
                DEFAULT_NOTIFICATION_PREFERENCES,
            );
        },
    );

    // --------------------------------------------------------
    // VALIDACIONES DE PRIVACIDAD
    // --------------------------------------------------------

    await t.test(
        'rejects invalid privacy preferences',
        async () => {
            const invalidBodies = [
                { audience: 'public' },
                { showLevel: 'true' },
                { userId: second.userId },
                {},
            ];

            for (const body of invalidBodies) {
                const response = await request(app)
                    .patch(privacyEndpoint)
                    .set('Authorization', first.authorization)
                    .send(body);

                assert.equal(response.status, 400);

                assert.equal(
                    response.body.code,
                    'INVALID_PRIVACY_PREFERENCES',
                );
            }
        },
    );

    // --------------------------------------------------------
    // VALIDACIONES DE NOTIFICACIONES
    // --------------------------------------------------------

    await t.test(
        'rejects invalid notification preferences',
        async () => {
            const invalidBodies = [
                { mentionsWeb: 'false' },
                { reminderTime: '25:00' },
                { reminderFrequency: 'monthly' },
                { reminderChannel: 'sms' },
                { userId: second.userId },
                {},
            ];

            for (const body of invalidBodies) {
                const response = await request(app)
                    .patch(notificationsEndpoint)
                    .set('Authorization', first.authorization)
                    .send(body);

                assert.equal(response.status, 400);

                assert.equal(
                    response.body.code,
                    'INVALID_NOTIFICATION_PREFERENCES',
                );
            }
        },
    );

    // --------------------------------------------------------
    // GUARDAR Y RECUPERAR PRIVACIDAD
    // --------------------------------------------------------

    await t.test(
        'persists privacy preferences and partial updates',
        async () => {
            const saved = await request(app)
                .patch(privacyEndpoint)
                .set('Authorization', first.authorization)
                .send({
                    audience: 'private',
                    showRoute: false,
                    showAchievements: false,
                });

            assert.equal(saved.status, 200);

            assert.equal(
                saved.body.data.preferences.audience,
                'private',
            );

            const updated = await request(app)
                .patch(privacyEndpoint)
                .set('Authorization', first.authorization)
                .send({
                    showLevel: true,
                });

            assert.equal(updated.status, 200);

            assert.equal(
                updated.body.data.preferences.showLevel,
                true,
            );

            assert.equal(
                updated.body.data.preferences.showRoute,
                false,
            );

            const retrieved = await request(app)
                .get(privacyEndpoint)
                .set('Authorization', first.authorization);

            assert.equal(retrieved.status, 200);

            assert.equal(
                retrieved.body.data.preferences.audience,
                'private',
            );

            assert.equal(
                retrieved.body.data.preferences.showLevel,
                true,
            );

            const databaseResult = await databasePool.query(
                `
                SELECT audience, show_route, show_level
                FROM user_privacy_preferences
                WHERE user_id = $1
                `,
                [first.userId],
            );

            assert.equal(databaseResult.rowCount, 1);

            assert.deepEqual(databaseResult.rows[0], {
                audience: 'private',
                show_route: false,
                show_level: true,
            });
        },
    );

    // --------------------------------------------------------
    // GUARDAR Y RECUPERAR NOTIFICACIONES
    // --------------------------------------------------------

    await t.test(
        'persists notification preferences and partial updates',
        async () => {
            const saved = await request(app)
                .patch(notificationsEndpoint)
                .set('Authorization', first.authorization)
                .send({
                    mentionsWeb: false,
                    projectsEmail: true,
                    reminderTime: '08:00',
                    reminderFrequency: 'everyday',
                });

            assert.equal(saved.status, 200);

            assert.equal(
                saved.body.data.preferences.mentionsWeb,
                false,
            );

            const updated = await request(app)
                .patch(notificationsEndpoint)
                .set('Authorization', first.authorization)
                .send({
                    weeklySummary: true,
                });

            assert.equal(updated.status, 200);

            assert.equal(
                updated.body.data.preferences.weeklySummary,
                true,
            );

            assert.equal(
                updated.body.data.preferences.mentionsWeb,
                false,
            );

            const retrieved = await request(app)
                .get(notificationsEndpoint)
                .set('Authorization', first.authorization);

            assert.equal(retrieved.status, 200);

            assert.equal(
                retrieved.body.data.preferences.reminderTime,
                '08:00',
            );

            const databaseResult = await databasePool.query(
                `
                SELECT
                    mentions_web,
                    projects_email,
                    weekly_summary,
                    reminder_time
                FROM user_notification_preferences
                WHERE user_id = $1
                `,
                [first.userId],
            );

            assert.equal(databaseResult.rowCount, 1);

            assert.deepEqual(databaseResult.rows[0], {
                mentions_web: false,
                projects_email: true,
                weekly_summary: true,
                reminder_time: '08:00',
            });
        },
    );

    // --------------------------------------------------------
    // AISLAMIENTO ENTRE USUARIOS
    // --------------------------------------------------------

    await t.test(
        'does not expose another user preferences',
        async () => {
            const privacy = await request(app)
                .get(privacyEndpoint)
                .set('Authorization', second.authorization);

            assert.equal(privacy.status, 200);

            assert.deepEqual(
                privacy.body.data.preferences,
                DEFAULT_PRIVACY_PREFERENCES,
            );

            const notifications = await request(app)
                .get(notificationsEndpoint)
                .set('Authorization', second.authorization);

            assert.equal(notifications.status, 200);

            assert.deepEqual(
                notifications.body.data.preferences,
                DEFAULT_NOTIFICATION_PREFERENCES,
            );
        },
    );
});
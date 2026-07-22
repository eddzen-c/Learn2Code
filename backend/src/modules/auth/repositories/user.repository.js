import { databasePool } from '../../../config/database.js';

const mapUserRow = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        passwordHash: row.password_hash,
        avatarUrl: row.avatar_url,
        preferredLocale: row.preferred_locale,
        preferredProgrammingLanguageId:
            row.preferred_programming_language_id,
        emailVerifiedAt: row.email_verified_at,
        lastLoginAt: row.last_login_at,
        isActive: row.is_active,
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        roles: Object.freeze([...(row.roles ?? [])]),
    });
};

export const createUserRecord = async ({
    fullName,
    email,
    passwordHash,
    client = databasePool,
}) => {
    const result = await client.query({
        text: `
            INSERT INTO users (
                full_name,
                email,
                password_hash
            )
            VALUES ($1, $2, $3)
            RETURNING
                id,
                full_name,
                email,
                password_hash,
                avatar_url,
                preferred_locale,
                preferred_programming_language_id,
                email_verified_at,
                last_login_at,
                is_active,
                deleted_at,
                created_at,
                updated_at
        `,
        values: [
            fullName,
            email,
            passwordHash,
        ],
    });

    return mapUserRow(result.rows[0]);
};

export const assignRoleToUser = async ({
    userId,
    roleName,
    client = databasePool,
}) => {
    const result = await client.query({
        text: `
            INSERT INTO user_roles (
                user_id,
                role_id
            )
            SELECT
                $1,
                id
            FROM roles
            WHERE name = $2
            RETURNING
                user_id,
                role_id,
                assigned_at
        `,
        values: [
            userId,
            roleName,
        ],
    });

    const row = result.rows[0];

    if (!row) {
        return null;
    }

    return Object.freeze({
        userId: row.user_id,
        roleId: row.role_id,
        roleName,
        assignedAt: row.assigned_at,
    });
};

export const findUserByEmail = async ({
    email,
    client = databasePool,
}) => {
    const result = await client.query({
        text: `
            SELECT
                users.id,
                users.full_name,
                users.email,
                users.password_hash,
                users.avatar_url,
                users.preferred_locale,
                users.preferred_programming_language_id,
                users.email_verified_at,
                users.last_login_at,
                users.is_active,
                users.deleted_at,
                users.created_at,
                users.updated_at,
                COALESCE(
                    ARRAY_AGG(roles.name ORDER BY roles.name)
                        FILTER (WHERE roles.name IS NOT NULL),
                    ARRAY[]::VARCHAR[]
                ) AS roles
            FROM users
            LEFT JOIN user_roles
                ON user_roles.user_id = users.id
            LEFT JOIN roles
                ON roles.id = user_roles.role_id
            WHERE users.email = $1
              AND users.deleted_at IS NULL
            GROUP BY users.id
        `,
        values: [email],
    });

    return mapUserRow(result.rows[0]);
};

export const updateUserLastLogin = async ({
    userId,
    lastLoginAt = new Date(),
    client = databasePool,
}) => {
    const result = await client.query({
        text: `
            UPDATE users
            SET last_login_at = $2
            WHERE id = $1
              AND deleted_at IS NULL
            RETURNING
                id,
                last_login_at
        `,
        values: [
            userId,
            lastLoginAt,
        ],
    });

    const row = result.rows[0];

    if (!row) {
        return null;
    }

    return Object.freeze({
        userId: row.id,
        lastLoginAt: row.last_login_at,
    });
};
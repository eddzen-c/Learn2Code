import {
    databasePool,
} from '../../../config/database.js';

const mapSupportedLanguage = (row) => {
    if (!row) {
        return null;
    }

    return Object.freeze({
        id: row.id,
        name: row.name,
        fileExtension: row.file_extension,
        sandboxImage: row.sandbox_image,
        isActive: row.is_active,
    });
};

const mapTopic = (row) => (
    Object.freeze({
        id: row.id,
        name: row.name,
        description: row.description,
        isActive: row.is_active,
    })
);

const mapDifficultyLevel = (row) => (
    Object.freeze({
        id: row.id,
        name: row.name,
    })
);

export const findActiveSupportedLanguageById =
    async ({
        languageId,
        client = databasePool,
    }) => {
        const result = await client.query({
            text: `
                SELECT
                    id,
                    name,
                    file_extension,
                    sandbox_image,
                    is_active
                FROM supported_languages
                WHERE id = $1
                  AND is_active = TRUE
            `,
            values: [languageId],
        });

        return mapSupportedLanguage(
            result.rows[0],
        );
    };

export const listActiveSupportedLanguages =
    async ({
        client = databasePool,
    } = {}) => {
        const result = await client.query({
            text: `
                SELECT
                    id,
                    name,
                    file_extension,
                    sandbox_image,
                    is_active
                FROM supported_languages
                WHERE is_active = TRUE
                ORDER BY id
            `,
            values: [],
        });

        return Object.freeze(
            result.rows.map(
                mapSupportedLanguage,
            ),
        );
    };

export const listActiveTopics = async ({
    client = databasePool,
} = {}) => {
    const result = await client.query({
        text: `
            SELECT
                id,
                name,
                description,
                is_active
            FROM topics
            WHERE is_active = TRUE
            ORDER BY id
        `,
        values: [],
    });

    return Object.freeze(
        result.rows.map(mapTopic),
    );
};

export const listDifficultyLevels = async ({
    client = databasePool,
} = {}) => {
    const result = await client.query({
        text: `
            SELECT
                id,
                name
            FROM difficulty_levels
            ORDER BY id
        `,
        values: [],
    });

    return Object.freeze(
        result.rows.map(
            mapDifficultyLevel,
        ),
    );
};
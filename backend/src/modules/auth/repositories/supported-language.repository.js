import { databasePool } from '../../../config/database.js';

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
                    sandbox_image
                FROM supported_languages
                WHERE id = $1
                  AND is_active = TRUE
            `,
            values: [languageId],
        });

        const row = result.rows[0];

        if (!row) {
            return null;
        }

        return Object.freeze({
            id: row.id,
            name: row.name,
            fileExtension: row.file_extension,
            sandboxImage: row.sandbox_image,
        });
    };
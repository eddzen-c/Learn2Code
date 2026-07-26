import assert from 'node:assert/strict';
import test from 'node:test';

import {
    findActiveSupportedLanguageById,
    listActiveSupportedLanguages,
    listActiveTopics,
    listDifficultyLevels,
} from '../repositories/diagnostic-catalog.repository.js';

const createClient = (rows) => {
    const calls = [];

    return {
        calls,

        query: async (query) => {
            calls.push(query);

            return {
                rows,
            };
        },
    };
};

test(
    'findActiveSupportedLanguageById maps a language',
    async () => {
        const client = createClient([
            {
                id: 2,
                name: 'Python',
                file_extension: '.py',
                sandbox_image:
                    'learn2code-sandbox-python:3.12',
                is_active: true,
            },
        ]);

        const language =
            await findActiveSupportedLanguageById({
                languageId: 2,
                client,
            });

        assert.deepEqual(language, {
            id: 2,
            name: 'Python',
            fileExtension: '.py',
            sandboxImage:
                'learn2code-sandbox-python:3.12',
            isActive: true,
        });

        assert.deepEqual(
            client.calls[0].values,
            [2],
        );

        assert.ok(Object.isFrozen(language));
    },
);

test(
    'findActiveSupportedLanguageById returns null',
    async () => {
        const client = createClient([]);

        const language =
            await findActiveSupportedLanguageById({
                languageId: 99,
                client,
            });

        assert.equal(language, null);
    },
);

test(
    'listActiveSupportedLanguages returns languages',
    async () => {
        const client = createClient([
            {
                id: 1,
                name: 'JavaScript',
                file_extension: '.js',
                sandbox_image:
                    'learn2code-sandbox-node:20',
                is_active: true,
            },
            {
                id: 2,
                name: 'Python',
                file_extension: '.py',
                sandbox_image:
                    'learn2code-sandbox-python:3.12',
                is_active: true,
            },
        ]);

        const languages =
            await listActiveSupportedLanguages({
                client,
            });

        assert.equal(languages.length, 2);
        assert.equal(
            languages[0].name,
            'JavaScript',
        );

        assert.equal(
            languages[1].fileExtension,
            '.py',
        );

        assert.ok(Object.isFrozen(languages));
    },
);

test(
    'listActiveTopics returns active topics',
    async () => {
        const client = createClient([
            {
                id: 1,
                name: 'variables',
                description:
                    'Declaración y asignación',
                is_active: true,
            },
            {
                id: 2,
                name: 'condicionales',
                description:
                    'Estructuras de decisión',
                is_active: true,
            },
        ]);

        const topics = await listActiveTopics({
            client,
        });

        assert.equal(topics.length, 2);

        assert.deepEqual(topics[0], {
            id: 1,
            name: 'variables',
            description:
                'Declaración y asignación',
            isActive: true,
        });

        assert.ok(Object.isFrozen(topics));
    },
);

test(
    'listDifficultyLevels returns difficulty levels',
    async () => {
        const client = createClient([
            {
                id: 1,
                name: 'básico',
            },
            {
                id: 2,
                name: 'intermedio',
            },
            {
                id: 3,
                name: 'avanzado',
            },
        ]);

        const difficultyLevels =
            await listDifficultyLevels({
                client,
            });

        assert.deepEqual(
            difficultyLevels,
            [
                {
                    id: 1,
                    name: 'básico',
                },
                {
                    id: 2,
                    name: 'intermedio',
                },
                {
                    id: 3,
                    name: 'avanzado',
                },
            ],
        );

        assert.ok(
            Object.isFrozen(difficultyLevels),
        );
    },
);
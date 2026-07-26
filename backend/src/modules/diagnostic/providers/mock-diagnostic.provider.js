import {
    createHash,
} from 'node:crypto';

import {
    env,
} from '../../../config/env.js';

const normalizeText = (value) => (
    String(value)
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
);

const createSeed = (value) => (
    Number.parseInt(
        createHash('sha256')
            .update(value)
            .digest('hex')
            .slice(0, 8),
        16,
    )
);

const rotateValues = (values, offset) => {
    const position = offset % values.length;

    return [
        ...values.slice(position),
        ...values.slice(0, position),
    ];
};

const resolvePattern = (topicName, position) => {
    const topic = normalizeText(topicName);

    if (topic.includes('condicional')) {
        return 'conditionals';
    }

    if (
        topic.includes('ciclo')
        || topic.includes('bucle')
        || topic.includes('loop')
    ) {
        return 'loops';
    }

    if (topic.includes('funcion')) {
        return 'functions';
    }

    if (
        topic.includes('arreglo')
        || topic.includes('lista')
        || topic.includes('array')
    ) {
        return 'collections';
    }

    return [
        'variables',
        'conditionals',
        'loops',
        'functions',
        'collections',
    ][position % 5];
};

const buildQuestionContent = ({
    pattern,
    isPython,
    seed,
}) => {
    const first = (seed % 8) + 2;
    const second = ((seed >> 3) % 7) + 2;

    if (pattern === 'conditionals') {
        const threshold = first + 2;
        const value = first + second;

        return {
            code: isPython
                ? `score = ${value}\nprint("Aprobado" if score >= ${threshold} else "Repaso")`
                : `const score = ${value};\nconsole.log(score >= ${threshold} ? "Aprobado" : "Repaso");`,
            answer:
                value >= threshold
                    ? 'Aprobado'
                    : 'Repaso',
            distractors: [
                'Aprobado',
                'Repaso',
                'Error',
            ],
            explanation:
                'La condición compara el valor con el límite indicado.',
        };
    }

    if (pattern === 'loops') {
        const limit = (seed % 4) + 3;
        const total = (
            limit * (limit + 1)
        ) / 2;

        return {
            code: isPython
                ? `total = 0\nfor number in range(1, ${limit + 1}):\n    total += number\nprint(total)`
                : `let total = 0;\nfor (let number = 1; number <= ${limit}; number += 1) {\n    total += number;\n}\nconsole.log(total);`,
            answer: String(total),
            distractors: [
                String(total),
                String(total - 1),
                String(total + 1),
                String(limit),
            ],
            explanation:
                'El ciclo acumula todos los números desde 1 hasta el límite.',
        };
    }

    if (pattern === 'functions') {
        const result = first * second;

        return {
            code: isPython
                ? `def transform(value):\n    return value * ${second}\n\nprint(transform(${first}))`
                : `function transform(value) {\n    return value * ${second};\n}\n\nconsole.log(transform(${first}));`,
            answer: String(result),
            distractors: [
                String(result),
                String(first + second),
                String(result + second),
                String(first),
            ],
            explanation:
                'La función multiplica el argumento por el valor definido.',
        };
    }

    if (pattern === 'collections') {
        const values = [
            first,
            first + second,
            first * second,
        ];

        return {
            code: isPython
                ? `values = [${values.join(', ')}]\nprint(values[1])`
                : `const values = [${values.join(', ')}];\nconsole.log(values[1]);`,
            answer: String(values[1]),
            distractors: values.map(String),
            explanation:
                'Los arreglos y listas comienzan en la posición cero.',
        };
    }

    const result = first + second;

    return {
        code: isPython
            ? `value = ${first}\nvalue += ${second}\nprint(value)`
            : `let value = ${first};\nvalue += ${second};\nconsole.log(value);`,
        answer: String(result),
        distractors: [
            String(result),
            String(first),
            String(second),
            String(first * second),
        ],
        explanation:
            'La variable guarda el resultado de sumar ambos valores.',
    };
};

const createContentFingerprint = (question) => (
    createHash('sha256')
        .update(JSON.stringify({
            topicId: question.topicId,
            difficultyLevelId:
                question.difficultyLevelId,
            prompt: question.prompt,
            expectedAnswer: question.expectedAnswer,
        }))
        .digest('hex')
);

export const generateMockDiagnosticQuestions = ({
    userId,
    variationKey = userId,
    language,
    topics,
    difficultyLevels,
    questionCount =
    env.ai.diagnosticQuestionCount,
}) => {
    if (
        typeof userId !== 'string'
        || userId.trim().length === 0
    ) {
        throw new TypeError(
            'User ID must be a non-empty string',
        );
    }

    if (
        typeof variationKey !== 'string'
        || variationKey.trim().length === 0
    ) {
        throw new TypeError(
            'Variation key must be a non-empty string',
        );
    }

    if (!language || typeof language !== 'object') {
        throw new TypeError('Language is required');
    }

    if (!Array.isArray(topics) || topics.length === 0) {
        throw new TypeError(
            'At least one topic is required',
        );
    }

    if (
        !Array.isArray(difficultyLevels)
        || difficultyLevels.length === 0
    ) {
        throw new TypeError(
            'At least one difficulty level is required',
        );
    }

    if (
        !Number.isInteger(questionCount)
        || questionCount < 1
        || questionCount > 20
    ) {
        throw new TypeError(
            'Question count must be between 1 and 20',
        );
    }

    const languageName =
        language.slug ?? language.name;

    const isPython = normalizeText(
        languageName,
    ).includes('python');

    const userSeed = createSeed(variationKey);
    const topicOffset = userSeed % topics.length;

    const questions = Array.from(
        {
            length: questionCount,
        },
        (_, index) => {
            const position = index + 1;

            const topic = topics[
                (topicOffset + index) % topics.length
            ];

            const difficultyLevel =
                difficultyLevels[
                index % difficultyLevels.length
                ];

            const questionSeed = createSeed(
                `${variationKey}:${topic.id}:${position}`,
            );

            const pattern = resolvePattern(
                topic.name,
                index,
            );

            const content = buildQuestionContent({
                pattern,
                isPython,
                seed: questionSeed,
            });

            const uniqueOptions = [
                ...new Set(content.distractors),
            ];

            const question = {
                topicId: topic.id,
                difficultyLevelId:
                    difficultyLevel.id,
                position,
                questionType: 'code_output',
                prompt:
                    `¿Qué resultado muestra el siguiente código?\n\n${content.code}`,
                options: rotateValues(
                    uniqueOptions,
                    questionSeed,
                ),
                starterCode: null,
                expectedAnswer: content.answer,
                evaluationCriteria: {
                    mode: 'exact_match',
                    caseSensitive: false,
                    maximumScore: 100,
                },
                explanation: content.explanation,
            };

            return Object.freeze({
                ...question,
                options: Object.freeze([
                    ...question.options,
                ]),
                evaluationCriteria: Object.freeze({
                    ...question.evaluationCriteria,
                }),
                contentFingerprint:
                    createContentFingerprint(question),
            });
        },
    );

    return Object.freeze({
        provider: 'mock',
        model: 'learn2code-mock-diagnostic-v1',
        questions: Object.freeze(questions),
    });
};

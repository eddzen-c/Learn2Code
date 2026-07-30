import {
    createHash,
} from 'node:crypto';

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

const resolvePattern = (topicName) => {
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
        topic.includes('estructura')
        || topic.includes('arreglo')
        || topic.includes('lista')
        || topic.includes('array')
    ) {
        return 'collections';
    }

    return 'variables';
};

const createTestCases = (values) => (
    Object.freeze(
        values.map(
            (
                {
                    input,
                    expectedOutput,
                },
                index,
            ) => (
                Object.freeze({
                    position: index + 1,
                    input: String(input),
                    expectedOutput:
                        String(expectedOutput),
                    isHidden:
                        index === values.length - 1,
                    weight: 1,
                })
            ),
        ),
    )
);

const createStarterCode = (isPython) => (
    isPython
        ? `import sys

data = sys.stdin.read().strip()

# Escribe tu solución aquí.
`
        : `const fs = require('node:fs');

const input = fs.readFileSync(0, 'utf8').trim();

// Escribe tu solución aquí.
`
);

const buildVariablesExercise = ({
    isPython,
    seed,
}) => {
    const operation = seed % 3;

    const configurations = [
        {
            title: 'Suma de dos valores',
            statement:
                'Lee dos números enteros separados por un espacio y muestra su suma.',
            operator: '+',
            calculate: (first, second) => (
                first + second
            ),
        },
        {
            title: 'Diferencia de dos valores',
            statement:
                'Lee dos números enteros separados por un espacio y muestra el resultado de restar el segundo al primero.',
            operator: '-',
            calculate: (first, second) => (
                first - second
            ),
        },
        {
            title: 'Producto de dos valores',
            statement:
                'Lee dos números enteros separados por un espacio y muestra su producto.',
            operator: '*',
            calculate: (first, second) => (
                first * second
            ),
        },
    ];

    const configuration =
        configurations[operation];

    const offset = (seed % 6) + 2;

    const inputs = [
        [offset, offset + 3],
        [offset + 5, offset - 1],
        [offset * 2, offset + 1],
    ];

    const solutionCode = isPython
        ? `import sys

first, second = map(int, sys.stdin.read().split())
print(first ${configuration.operator} second)
`
        : `const fs = require('node:fs');

const [first, second] = fs
    .readFileSync(0, 'utf8')
    .trim()
    .split(/\\s+/)
    .map(Number);

console.log(first ${configuration.operator} second);
`;

    return {
        title: configuration.title,
        statement: configuration.statement,
        solutionCode,
        testCases: createTestCases(
            inputs.map(([first, second]) => ({
                input: `${first} ${second}`,
                expectedOutput:
                    configuration.calculate(
                        first,
                        second,
                    ),
            })),
        ),
    };
};

const buildConditionalsExercise = ({
    isPython,
    seed,
}) => {
    const threshold = (seed % 31) + 50;

    const values = [
        threshold - 1,
        threshold,
        threshold + 12,
    ];

    const solutionCode = isPython
        ? `import sys

score = int(sys.stdin.read().strip())
print("Aprobado" if score >= ${threshold} else "Repaso")
`
        : `const fs = require('node:fs');

const score = Number(
    fs.readFileSync(0, 'utf8').trim(),
);

console.log(
    score >= ${threshold}
        ? 'Aprobado'
        : 'Repaso',
);
`;

    return {
        title: 'Clasificador de resultados',
        statement:
            `Lee una calificación entera. Muestra "Aprobado" cuando sea mayor o igual que ${threshold}; en caso contrario muestra "Repaso".`,
        solutionCode,
        testCases: createTestCases(
            values.map((value) => ({
                input: value,
                expectedOutput:
                    value >= threshold
                        ? 'Aprobado'
                        : 'Repaso',
            })),
        ),
    };
};

const buildLoopsExercise = ({
    isPython,
    seed,
}) => {
    const offset = (seed % 4) + 3;

    const values = [
        offset,
        offset + 2,
        offset + 5,
    ];

    const calculateTotal = (limit) => (
        limit * (limit + 1) / 2
    );

    const solutionCode = isPython
        ? `import sys

limit = int(sys.stdin.read().strip())
total = 0

for number in range(1, limit + 1):
    total += number

print(total)
`
        : `const fs = require('node:fs');

const limit = Number(
    fs.readFileSync(0, 'utf8').trim(),
);

let total = 0;

for (
    let number = 1;
    number <= limit;
    number += 1
) {
    total += number;
}

console.log(total);
`;

    return {
        title: 'Suma acumulada',
        statement:
            'Lee un número entero positivo y muestra la suma de todos los números desde 1 hasta ese número.',
        solutionCode,
        testCases: createTestCases(
            values.map((value) => ({
                input: value,
                expectedOutput:
                    calculateTotal(value),
            })),
        ),
    };
};

const buildFunctionsExercise = ({
    isPython,
    seed,
}) => {
    const bonus = seed % 6;

    const inputs = [
        [2, 4],
        [5, 3],
        [7, 6],
    ];

    const calculateResult = (
        first,
        second,
    ) => (
        first * second + bonus
    );

    const solutionCode = isPython
        ? `import sys

def transform(first, second):
    return first * second + ${bonus}

first, second = map(int, sys.stdin.read().split())
print(transform(first, second))
`
        : `const fs = require('node:fs');

function transform(first, second) {
    return first * second + ${bonus};
}

const [first, second] = fs
    .readFileSync(0, 'utf8')
    .trim()
    .split(/\\s+/)
    .map(Number);

console.log(transform(first, second));
`;

    return {
        title: 'Transformación mediante función',
        statement:
            `Crea una función que reciba dos enteros, multiplique ambos valores y sume ${bonus} al resultado. Muestra el valor retornado.`,
        solutionCode,
        testCases: createTestCases(
            inputs.map(([first, second]) => ({
                input: `${first} ${second}`,
                expectedOutput:
                    calculateResult(
                        first,
                        second,
                    ),
            })),
        ),
    };
};

const buildCollectionsExercise = ({
    isPython,
    seed,
}) => {
    const operation = seed % 3;

    const configurations = [
        {
            title: 'Mayor valor de una colección',
            statement:
                'Lee una lista de enteros separados por comas y muestra el valor mayor.',
            expression: 'max(values)',
            jsExpression:
                'Math.max(...values)',
            calculate: (values) => (
                Math.max(...values)
            ),
        },
        {
            title: 'Menor valor de una colección',
            statement:
                'Lee una lista de enteros separados por comas y muestra el valor menor.',
            expression: 'min(values)',
            jsExpression:
                'Math.min(...values)',
            calculate: (values) => (
                Math.min(...values)
            ),
        },
        {
            title: 'Suma de una colección',
            statement:
                'Lee una lista de enteros separados por comas y muestra la suma de todos sus elementos.',
            expression: 'sum(values)',
            jsExpression:
                'values.reduce((total, value) => total + value, 0)',
            calculate: (values) => (
                values.reduce(
                    (total, value) => (
                        total + value
                    ),
                    0,
                )
            ),
        },
    ];

    const configuration =
        configurations[operation];

    const offset = (seed % 5) + 1;

    const inputs = [
        [offset, offset + 4, offset + 2],
        [offset + 8, offset - 1, offset + 3],
        [offset * 2, offset * 3, offset],
    ];

    const solutionCode = isPython
        ? `import sys

values = [
    int(value)
    for value in sys.stdin.read().strip().split(",")
]

print(${configuration.expression})
`
        : `const fs = require('node:fs');

const values = fs
    .readFileSync(0, 'utf8')
    .trim()
    .split(',')
    .map(Number);

console.log(${configuration.jsExpression});
`;

    return {
        title: configuration.title,
        statement: configuration.statement,
        solutionCode,
        testCases: createTestCases(
            inputs.map((values) => ({
                input: values.join(','),
                expectedOutput:
                    configuration.calculate(values),
            })),
        ),
    };
};

const exerciseBuilders = new Map([
    ['variables', buildVariablesExercise],
    ['conditionals', buildConditionalsExercise],
    ['loops', buildLoopsExercise],
    ['functions', buildFunctionsExercise],
    ['collections', buildCollectionsExercise],
]);

export const generateMockExercise = ({
    userId,
    variationKey,
    language,
    difficulty,
    topic,
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

    if (!difficulty || typeof difficulty !== 'object') {
        throw new TypeError('Difficulty is required');
    }

    if (!topic || typeof topic !== 'object') {
        throw new TypeError('Topic is required');
    }

    const languageName =
        language.slug ?? language.name;

    const isPython = normalizeText(
        languageName,
    ).includes('python');

    const pattern = resolvePattern(
        topic.name,
    );

    const seed = createSeed(
        [
            userId,
            variationKey,
            language.id,
            difficulty.id,
            topic.id,
        ].join(':'),
    );

    const builder =
        exerciseBuilders.get(pattern);

    const content = builder({
        isPython,
        seed,
    });

    const difficultyId = Number(
        difficulty.id,
    );

    const exercise = Object.freeze({
        topicId: topic.id,
        difficultyId: difficulty.id,
        languageId: language.id,
        title: content.title,
        statement: content.statement,
        instructions:
            'Lee la entrada estándar, resuelve el problema y muestra únicamente el resultado solicitado.',
        starterCode:
            createStarterCode(isPython),
        solutionCode:
            content.solutionCode,
        estimatedMinutes:
            8 + Math.max(1, difficultyId) * 4,
        testCases: content.testCases,
        generationMetadata: Object.freeze({
            pattern,
            variationKey,
            masteryScore:
                topic.masteryScore,
            confidenceScore:
                topic.confidenceScore,
        }),
    });

    return Object.freeze({
        provider: 'mock',
        model:
            'learn2code-mock-exercise-v1',
        exercise,
    });
};
import {
    generateOpenAiDiagnosticQuestions,
} from '../src/modules/diagnostic/providers/openai-diagnostic.provider.js';

const language = Object.freeze({
    id: 1,
    name: 'JavaScript',
    fileExtension: '.js',
    sandboxImage:
        'learn2code-sandbox-node:20',
    isActive: true,
});

const topics = Object.freeze([
    Object.freeze({
        id: 1,
        name: 'variables',
    }),
    Object.freeze({
        id: 2,
        name: 'condicionales',
    }),
]);

const difficultyLevels = Object.freeze([
    Object.freeze({
        id: 1,
        name: 'básico',
    }),
    Object.freeze({
        id: 2,
        name: 'intermedio',
    }),
]);

const onboardingContext = Object.freeze({
    learningGoal:
        'career_preparation',
    studyPace:
        'casual',
    interestKeys: Object.freeze([
        'video_games',
    ]),
    selfAssessedDifficultyId: 1,
    topicIds: Object.freeze([
        1,
        2,
    ]),
});

try {
    console.log(
        'Generando diagnóstico real con OpenAI...',
    );

    const result =
        await generateOpenAiDiagnosticQuestions({
            userId:
                'manual-smoke-user',
            variationKey:
                `manual-smoke-${Date.now()}`,
            language,
            topics,
            difficultyLevels,
            onboardingContext,
            questionCount: 2,
        });

    console.log({
        provider: result.provider,
        model: result.model,
        promptVersion:
            result.promptVersion,
        responseId:
            result.responseId,
        questionCount:
            result.questions.length,
    });

    result.questions.forEach(
        (question) => {
            console.log({
                position:
                    question.position,
                topicId:
                    question.topicId,
                difficultyLevelId:
                    question.difficultyLevelId,
                questionType:
                    question.questionType,
                prompt:
                    question.prompt,
                options:
                    question.options,
            });
        },
    );

    console.log(
        'Prueba real completada correctamente.',
    );
} catch (error) {
    console.error(
        'La prueba real falló:',
        {
            name: error.name,
            code: error.code,
            message: error.message,
            cause:
                error.cause?.message
                ?? null,
        },
    );

    process.exitCode = 1;
}
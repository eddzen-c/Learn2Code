import {
    useEffect,
    useState,
} from 'react'

import {
    Link,
} from 'react-router-dom'

import {
    getCurrentDiagnostic,
    startDiagnostic,
    submitDiagnosticAnswer,
} from '../api/diagnostic.api.js'

import {
    getAuthErrorMessage,
} from '../auth/auth-error-message.js'

import {
    useAuth,
} from '../auth/useAuth.js'


export function DiagnosticPage() {
    const {
        accessToken,
    } = useAuth()

    const [diagnostic, setDiagnostic] =
        useState(null)

    const [loadError, setLoadError] =
        useState('')

    const [startError, setStartError] =
        useState('')

    const [isStarting, setIsStarting] =
        useState(false)

    const [
        selectedAnswer,
        setSelectedAnswer,
    ] = useState('')

    const [answerError, setAnswerError] =
        useState('')

    const [lastFeedback, setLastFeedback] =
        useState(null)

    const [isSubmitting, setIsSubmitting] =
        useState(false)

    const [reloadKey, setReloadKey] =
        useState(0)


    useEffect(() => {
        let active = true

        getCurrentDiagnostic(accessToken)
            .then((data) => {
                if (active) {
                    setDiagnostic(data)
                    setLoadError('')
                }
            })
            .catch((error) => {
                if (active) {
                    setDiagnostic(null)

                    setLoadError(
                        getAuthErrorMessage(error),
                    )
                }
            })

        return () => {
            active = false
        }
    }, [
        accessToken,
        reloadKey,
    ])

    const handleRetry = () => {
        setDiagnostic(null)
        setLoadError('')
        setReloadKey(
            (current) => current + 1,
        )
    }

    const currentQuestion =
        diagnostic?.state === 'in_progress'
            ? diagnostic.questions.find(
                (question) => (
                    !question.response
                ),
            )
            : null

    const handleStart = async (event) => {
        event.preventDefault()

        setStartError('')
        setIsStarting(true)

        try {
            const data =
                await startDiagnostic(
                    accessToken,
                )

            setDiagnostic({
                state:
                    data.assessment.status,
                assessment:
                    data.assessment,
                questions:
                    data.questions,
                result: null,
                language:
                    data.language,
                generation:
                    data.generation,
            })
        } catch (error) {
            setStartError(
                getAuthErrorMessage(error),
            )
        } finally {
            setIsStarting(false)
        }
    }

    const handleSubmitAnswer = async (
        event,
    ) => {
        event.preventDefault()

        if (
            !currentQuestion
            || selectedAnswer.trim().length === 0
        ) {
            setAnswerError(
                'Selecciona una respuesta.',
            )

            return
        }

        setAnswerError('')
        setIsSubmitting(true)

        try {
            const data =
                await submitDiagnosticAnswer({
                    accessToken,
                    assessmentId:
                        diagnostic.assessment.id,
                    questionId:
                        currentQuestion.id,
                    answer:
                        selectedAnswer,
                })

            const updatedQuestions =
                diagnostic.questions.map(
                    (question) => (
                        question.id
                            === currentQuestion.id
                            ? {
                                ...question,

                                response: {
                                    ...data.response,
                                    answer:
                                        selectedAnswer,
                                    submittedCode:
                                        null,
                                },
                            }
                            : question
                    ),
                )

            setLastFeedback({
                isCorrect:
                    data.response.isCorrect,
                feedback:
                    data.response.feedback,
            })

            setSelectedAnswer('')

            if (data.completion) {
                setDiagnostic({
                    ...diagnostic,

                    state: 'completed',

                    assessment: {
                        ...diagnostic.assessment,
                        status: 'completed',
                        answeredCount:
                            data.progress
                                .answeredCount,
                    },

                    questions:
                        updatedQuestions,

                    result: {
                        overallScore:
                            data.completion
                                .overallScore,

                        resultingDifficulty:
                            data.completion
                                .resultingDifficulty,

                        completedAt:
                            data.response
                                .evaluatedAt,
                    },
                })

                return
            }

            setDiagnostic({
                ...diagnostic,

                assessment: {
                    ...diagnostic.assessment,
                    answeredCount:
                        data.progress
                            .answeredCount,
                },

                questions:
                    updatedQuestions,
            })
        } catch (error) {
            setAnswerError(
                getAuthErrorMessage(error),
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!diagnostic && !loadError) {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <p role="status">
                        Revisando tu diagnóstico...
                    </p>
                </section>
            </main>
        )
    }

    if (loadError) {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <p
                        className="form-error"
                        role="alert"
                    >
                        {loadError}
                    </p>

                    <button
                        onClick={handleRetry}
                        type="button"
                    >
                        Reintentar
                    </button>
                </section>
            </main>
        )
    }

    if (
        diagnostic.state === 'not_started'
        || diagnostic.state === 'available'
    ) {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <header className="auth-header">
                        <p className="eyebrow">
                            Evaluación inicial
                        </p>

                        <h1>
                            Descubramos tu nivel
                        </h1>

                        <p>
                            Responderás ocho preguntas
                            adaptadas para conocer tus
                            fortalezas y los temas que
                            necesitas reforzar.
                        </p>
                    </header>

                    <form
                        className="auth-form"
                        onSubmit={handleStart}
                    >

                        {startError && (
                            <p
                                className="form-error"
                                role="alert"
                            >
                                {startError}
                            </p>
                        )}

                        <button
                            disabled={isStarting}
                            type="submit"
                        >
                            {
                                isStarting
                                    ? 'Preparando evaluación...'
                                    : 'Comenzar diagnóstico'
                            }
                        </button>
                    </form>

                    <p className="auth-switch">
                        <Link to="/dashboard">
                            Volver al panel
                        </Link>
                    </p>
                </section>
            </main>
        )
    }

    if (diagnostic.state === 'completed') {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <header className="auth-header">
                        <p className="eyebrow">
                            Diagnóstico completado
                        </p>

                        <h1>
                            Tu resultado
                        </h1>
                    </header>

                    <div className="diagnostic-result">
                        <p>
                            Calificación:{' '}
                            <strong>
                                {
                                    diagnostic
                                        .result
                                        .overallScore
                                }%
                            </strong>
                        </p>

                        <p>
                            Nivel asignado:{' '}
                            <strong>
                                {
                                    diagnostic
                                        .result
                                        .resultingDifficulty
                                        ?.name
                                    ?? 'Sin nivel'
                                }
                            </strong>
                        </p>
                    </div>

                    <p className="auth-switch">
                        <Link to="/dashboard">
                            Continuar al panel
                        </Link>
                    </p>
                </section>
            </main>
        )
    }

    return (
        <main className="diagnostic-page">
            <section className="diagnostic-card">
                <header className="auth-header">
                    <p className="eyebrow">
                        Diagnóstico en progreso
                    </p>

                    <h1>
                        Pregunta{' '}
                        {
                            currentQuestion
                                ?.position
                            ?? diagnostic
                                .assessment
                                .answeredCount
                        } de{' '}
                        {
                            diagnostic
                                .assessment
                                .questionCount
                        }
                    </h1>

                    <p>
                        Respondidas:{' '}
                        {
                            diagnostic
                                .assessment
                                .answeredCount
                        } de{' '}
                        {
                            diagnostic
                                .assessment
                                .questionCount
                        }
                    </p>
                </header>

                <div
                    aria-label="Progreso del diagnóstico"
                    aria-valuemax={
                        diagnostic
                            .assessment
                            .questionCount
                    }
                    aria-valuemin="0"
                    aria-valuenow={
                        diagnostic
                            .assessment
                            .answeredCount
                    }
                    className="progress-track"
                    role="progressbar"
                >
                    <span
                        style={{
                            width: `${(
                                diagnostic
                                    .assessment
                                    .answeredCount
                                / diagnostic
                                    .assessment
                                    .questionCount
                            )
                                * 100
                                }%`,
                        }}
                    />
                </div>

                {lastFeedback && (
                    <p
                        className={
                            lastFeedback.isCorrect
                                ? 'form-success'
                                : 'form-error'
                        }
                        role="status"
                    >
                        {lastFeedback.feedback}
                    </p>
                )}

                {currentQuestion ? (
                    <form
                        className="diagnostic-form"
                        onSubmit={
                            handleSubmitAnswer
                        }
                    >
                        <div className="question-meta">
                            <span>
                                {
                                    currentQuestion
                                        .topic
                                        .name
                                }
                            </span>

                            <span>
                                {
                                    currentQuestion
                                        .difficulty
                                        .name
                                }
                            </span>
                        </div>

                        <pre className="diagnostic-prompt">
                            <code>
                                {
                                    currentQuestion
                                        .prompt
                                }
                            </code>
                        </pre>

                        <fieldset
                            disabled={
                                isSubmitting
                            }
                        >
                            <legend>
                                Selecciona el resultado
                            </legend>

                            {
                                currentQuestion
                                    .options
                                    .map((option) => {
                                        const value =
                                            String(option)

                                        return (
                                            <label
                                                className="diagnostic-option"
                                                key={value}
                                            >
                                                <input
                                                    checked={
                                                        selectedAnswer
                                                        === value
                                                    }
                                                    name="diagnostic-answer"
                                                    onChange={(event) => {
                                                        setSelectedAnswer(
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }}
                                                    type="radio"
                                                    value={value}
                                                />

                                                <span>
                                                    {value}
                                                </span>
                                            </label>
                                        )
                                    })
                            }
                        </fieldset>

                        {answerError && (
                            <p
                                className="form-error"
                                role="alert"
                            >
                                {answerError}
                            </p>
                        )}

                        <button
                            disabled={isSubmitting}
                            type="submit"
                        >
                            {
                                isSubmitting
                                    ? 'Evaluando...'
                                    : 'Enviar respuesta'
                            }
                        </button>
                    </form>
                ) : (
                    <p role="status">
                        Procesando el resultado...
                    </p>
                )}

                <p className="auth-switch">
                    <Link to="/dashboard">
                        Guardar y continuar después
                    </Link>
                </p>
            </section>
        </main>
    )
}
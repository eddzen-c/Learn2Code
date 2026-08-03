import {
    useEffect,
    useState,
} from 'react'

import {
    Link,
} from 'react-router-dom'

import {
    generateNextExercise,
    getCurrentExercise,
    submitExerciseAttempt,
} from '../api/exercise.api.js'

import {
    useAuth,
} from '../auth/useAuth.js'

const LEVEL_NAMES = Object.freeze({
    1: 'Principiante',
    2: 'Programador Junior',
    3: 'Programador Intermedio',
    4: 'Programador Avanzado',
})

const getLevelName = (levelId) => (
    LEVEL_NAMES[levelId]
    ?? `Nivel ${levelId}`
)

const getExerciseErrorMessage = (error) => {
    switch (error?.code) {
        case 'DIAGNOSTIC_REQUIRED_FOR_EXERCISE':
            return 'Completa primero tu evaluación de nivel.'

        case 'ADAPTIVE_EXERCISE_CONTEXT_UNAVAILABLE':
            return 'Todavía no tenemos suficiente información para generar tu ejercicio.'

        case 'EXERCISE_ASSIGNMENT_NOT_FOUND':
            return 'El ejercicio asignado ya no está disponible.'

        case 'EXERCISE_ASSIGNMENT_UNAVAILABLE':
            return 'Este ejercicio ya no acepta nuevos intentos.'

        case 'EXERCISE_PROVIDER_UNAVAILABLE':
        case 'EXERCISE_GENERATION_FAILED':
            return 'No fue posible generar el ejercicio personalizado.'

        case 'EXERCISE_EVALUATION_FAILED':
            return 'No fue posible evaluar tu solución.'

        case 'AUTHENTICATION_REQUIRED':
            return 'Tu sesión expiró. Inicia sesión nuevamente.'

        case 'NETWORK_ERROR':
            return 'No fue posible conectar con el servidor.'

        default:
            return 'Ocurrió un error inesperado. Inténtalo nuevamente.'
    }
}

const formatTestValue = (value) => {
    if (
        value === null
        || value === undefined
    ) {
        return 'Sin datos'
    }

    if (typeof value === 'string') {
        return value
    }

    return JSON.stringify(
        value,
        null,
        2,
    )
}

export function ExercisePage() {
    const {
        accessToken,
    } = useAuth()

    const [exerciseSession, setExerciseSession] =
        useState(null)

    const [submittedCode, setSubmittedCode] =
        useState('')

    const [attemptResult, setAttemptResult] =
        useState(null)

    const [errorMessage, setErrorMessage] =
        useState('')

    const [isLoading, setIsLoading] =
        useState(true)

    const [isGenerating, setIsGenerating] =
        useState(false)

    const [isSubmitting, setIsSubmitting] =
        useState(false)

    useEffect(() => {
        let active = true

        getCurrentExercise(accessToken)
            .then((data) => {
                if (!active) {
                    return
                }

                setExerciseSession(data)

                setSubmittedCode(
                    data.exercise?.starterCode ?? '',
                )
            })
            .catch((error) => {
                if (active) {
                    setErrorMessage(
                        getExerciseErrorMessage(error),
                    )
                }
            })
            .finally(() => {
                if (active) {
                    setIsLoading(false)
                }
            })

        return () => {
            active = false
        }
    }, [accessToken])

    const handleGenerateExercise = async () => {
        setErrorMessage('')
        setAttemptResult(null)
        setIsGenerating(true)

        try {
            const data = await generateNextExercise(
                accessToken,
            )

            setExerciseSession({
                state: data.assignment.status,
                assignment: data.assignment,
                exercise: data.exercise,
            })

            setSubmittedCode(
                data.exercise.starterCode ?? '',
            )
        } catch (error) {
            setErrorMessage(
                getExerciseErrorMessage(error),
            )
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (!exerciseSession?.assignment?.id) {
            return
        }

        setErrorMessage('')
        setAttemptResult(null)
        setIsSubmitting(true)

        try {
            const data =
                await submitExerciseAttempt({
                    accessToken,
                    assignmentId:
                        exerciseSession.assignment.id,
                    submittedCode,
                })

            setAttemptResult(data)

            setExerciseSession(
                (currentSession) => ({
                    ...currentSession,
                    state: data.assignment.status,

                    assignment: {
                        ...currentSession.assignment,
                        ...data.assignment,
                    },
                }),
            )
        } catch (error) {
            setErrorMessage(
                getExerciseErrorMessage(error),
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <main className="exercise-page">
                <p>Cargando ejercicio...</p>
            </main>
        )
    }

    const assignment =
        exerciseSession?.assignment

    const exercise =
        exerciseSession?.exercise

    return (
        <main className="exercise-page">
            <header className="exercise-page-header">
                <div>
                    <p className="eyebrow">
                        Práctica adaptativa
                    </p>

                    <h1>Ejercicio personalizado</h1>

                    <p>
                        Cada ejercicio se adapta a tu nivel,
                        lenguaje y temas que necesitan refuerzo.
                    </p>
                </div>

                <Link to="/dashboard">
                    Volver al panel
                </Link>
            </header>

            {errorMessage && (
                <p
                    className="form-error"
                    role="alert"
                >
                    {errorMessage}
                </p>
            )}

            {!exercise && (
                <section className="exercise-empty-card">
                    <h2>
                        No tienes un ejercicio pendiente
                    </h2>

                    <p>
                        Generaremos una práctica basada en el
                        resultado de tu evaluación inicial.
                    </p>

                    <button
                        disabled={isGenerating}
                        onClick={handleGenerateExercise}
                        type="button"
                    >
                        {isGenerating
                            ? 'Generando ejercicio...'
                            : 'Generar ejercicio personalizado'}
                    </button>
                </section>
            )}

            {exercise && (
                <div className="exercise-workspace">
                    <article className="exercise-card">
                        <div className="exercise-metadata">
                            <span>
                                {exercise.language.name}
                            </span>

                            <span>
                                {exercise.topic.name}
                            </span>

                            <span>
                                {exercise.difficulty.name}
                            </span>

                            {exercise.estimatedMinutes && (
                                <span>
                                    {exercise.estimatedMinutes}
                                    {' '}minutos
                                </span>
                            )}
                        </div>

                        <h2>{exercise.title}</h2>

                        <p className="exercise-statement">
                            {exercise.statement}
                        </p>

                        {exercise.instructions && (
                            <section>
                                <h3>Instrucciones</h3>

                                <p>
                                    {exercise.instructions}
                                </p>
                            </section>
                        )}

                        <section>
                            <h3>Ejemplos públicos</h3>

                            <div className="exercise-test-cases">
                                {exercise.publicTestCases.map(
                                    (testCase) => (
                                        <article
                                            className="exercise-test-case"
                                            key={testCase.id}
                                        >
                                            <h4>
                                                Caso {testCase.position}
                                            </h4>

                                            <p>Entrada</p>

                                            <pre>
                                                {formatTestValue(
                                                    testCase.input,
                                                )}
                                            </pre>

                                            <p>Salida esperada</p>

                                            <pre>
                                                {formatTestValue(
                                                    testCase
                                                        .expectedOutput,
                                                )}
                                            </pre>
                                        </article>
                                    ),
                                )}
                            </div>
                        </section>
                    </article>

                    <section className="exercise-editor-card">
                        <form onSubmit={handleSubmit}>
                            <label htmlFor="exercise-code">
                                Tu solución
                            </label>

                            <textarea
                                id="exercise-code"
                                onChange={(event) => {
                                    setSubmittedCode(
                                        event.target.value,
                                    )
                                }}
                                required
                                spellCheck="false"
                                value={submittedCode}
                            />

                            <button
                                disabled={
                                    isSubmitting
                                    || assignment.status
                                    === 'completed'
                                }
                                type="submit"
                            >
                                {isSubmitting
                                    ? 'Evaluando solución...'
                                    : 'Enviar solución'}
                            </button>
                        </form>

                        {attemptResult && (
                            <section
                                className={
                                    attemptResult.attempt.passed
                                        ? 'attempt-result attempt-result-success'
                                        : 'attempt-result attempt-result-error'
                                }
                            >
                                <h2>
                                    {attemptResult.attempt.passed
                                        ? '¡Ejercicio superado!'
                                        : 'Sigue intentándolo'}
                                </h2>

                                <p>
                                    Puntuación:{' '}
                                    {attemptResult.attempt.score}
                                    /100
                                </p>

                                <p>
                                    Pruebas superadas:{' '}
                                    {
                                        attemptResult
                                            .attempt
                                            .testsPassed
                                    }
                                    /
                                    {
                                        attemptResult
                                            .attempt
                                            .testsTotal
                                    }
                                </p>

                                <p>
                                    {
                                        attemptResult
                                            .attempt
                                            .feedback
                                    }
                                </p>

                                {attemptResult.progress?.applied && (
                                    <section
                                        aria-labelledby="exercise-progress-title"
                                        className="exercise-progress-reward"
                                    >
                                        <h3 id="exercise-progress-title">
                                            Progreso obtenido
                                        </h3>

                                        <p className="exercise-xp-reward">
                                            +{attemptResult.progress.xpAwarded} XP
                                        </p>

                                        <dl className="exercise-progress-summary">
                                            <div>
                                                <dt>XP total</dt>
                                                <dd>
                                                    {
                                                        attemptResult
                                                            .progress
                                                            .userXp
                                                            .totalXp
                                                    }
                                                </dd>
                                            </div>

                                            <div>
                                                <dt>Nivel actual</dt>
                                                <dd>
                                                    {
                                                        getLevelName(
                                                            attemptResult
                                                                .progress
                                                                .userXp
                                                                .currentLevelId,
                                                        )
                                                    }
                                                </dd>
                                            </div>

                                            <div>
                                                <dt>Racha actual</dt>
                                                <dd>
                                                    {
                                                        attemptResult
                                                            .progress
                                                            .streak
                                                            .currentStreak
                                                    } días
                                                </dd>
                                            </div>

                                            <div>
                                                <dt>Mejor racha</dt>
                                                <dd>
                                                    {
                                                        attemptResult
                                                            .progress
                                                            .streak
                                                            .longestStreak
                                                    } días
                                                </dd>
                                            </div>
                                        </dl>

                                        {
                                            attemptResult
                                                .progress
                                                .badgeAwards
                                                ?.awarded
                                            && (
                                                <section
                                                    aria-label="Insignias desbloqueadas"
                                                    className="exercise-badge-awards"
                                                >
                                                    <h4>
                                                        {
                                                            attemptResult
                                                                .progress
                                                                .badgeAwards
                                                                .count === 1
                                                                ? '¡Nueva insignia!'
                                                                : '¡Nuevas insignias!'
                                                        }
                                                    </h4>

                                                    <ul>
                                                        {
                                                            attemptResult
                                                                .progress
                                                                .badgeAwards
                                                                .badges
                                                                .map(
                                                                    (award) => (
                                                                        <li
                                                                            key={
                                                                                award.id
                                                                            }
                                                                        >
                                                                            🏆{' '}
                                                                            {
                                                                                award
                                                                                    .badge
                                                                                    .name
                                                                            }
                                                                        </li>
                                                                    ),
                                                                )
                                                        }
                                                    </ul>

                                                    <Link to="/badges">
                                                        Ver todas mis insignias
                                                    </Link>
                                                </section>
                                            )
                                        }
                                    </section>
                                )}

                                {attemptResult.results.length > 0 && (
                                    <ul className="attempt-tests">
                                        {attemptResult.results.map(
                                            (result) => (
                                                <li
                                                    key={
                                                        result
                                                            .testCaseId
                                                    }
                                                >
                                                    Caso{' '}
                                                    {result.position}:{' '}
                                                    {result.passed
                                                        ? 'correcto'
                                                        : 'incorrecto'}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                )}

                                {attemptResult.attempt.passed && (
                                    <button
                                        disabled={isGenerating}
                                        onClick={
                                            handleGenerateExercise
                                        }
                                        type="button"
                                    >
                                        {isGenerating
                                            ? 'Generando...'
                                            : 'Generar otro ejercicio'}
                                    </button>
                                )}
                            </section>
                        )}
                    </section>
                </div>
            )}
        </main>
    )
}
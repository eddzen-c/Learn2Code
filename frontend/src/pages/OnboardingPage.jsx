import {
    useEffect,
    useState,
} from 'react'

import {
    useNavigate,
} from 'react-router-dom'

import {
    completeStudentOnboarding,
    getCurrentStudentOnboarding,
    getStudentOnboardingOptions,
} from '../api/onboarding.api.js'

import {
    getAuthErrorMessage,
} from '../auth/auth-error-message.js'

import {
    useAuth,
} from '../auth/useAuth.js'

const interestLabels = {
    video_games:
        'Videojuegos',
    music:
        'Música y conciertos',
    sports_fitness:
        'Deportes y fitness',
    cooking_gastronomy:
        'Cocina y gastronomía',
    movies_series_anime:
        'Cine, series y anime',
    finance_crypto:
        'Finanzas y criptomonedas',
}

const studyPaceLabels = {
    casual:
        'Casual — 15 minutos al día',
    student:
        'Estudiante — 1 hora al día',
    intensive:
        'Intensivo — más de 2 horas al día',
}

const learningGoalLabels = {
    programming_fundamentals:
        'Aprender fundamentos de programación',
    web_development:
        'Aprender desarrollo web',
    automation:
        'Automatizar tareas',
    academic_support:
        'Aprobar mis materias',
    career_preparation:
        'Conseguir mi primer empleo',
    build_product:
        'Crear mi propia aplicación',
    other:
        'Otro objetivo',
}

const createInitialPreferences = () => ({
    languageId: '',
    selfAssessedDifficultyId: '',
    learningGoal: '',
    studyPace: '',
    interestKeys: [],
    topicIds: [],
})

export function OnboardingPage() {
    const {
        accessToken,
    } = useAuth()

    const navigate = useNavigate()

    const [options, setOptions] =
        useState(null)

    const [preferences, setPreferences] =
        useState(
            createInitialPreferences,
        )

    const [loadError, setLoadError] =
        useState('')

    const [formError, setFormError] =
        useState('')

    const [isSubmitting, setIsSubmitting] =
        useState(false)

    const [reloadKey, setReloadKey] =
        useState(0)

    useEffect(() => {
        let active = true

        Promise.all([
            getStudentOnboardingOptions(
                accessToken,
            ),
            getCurrentStudentOnboarding(
                accessToken,
            ),
        ])
            .then(([
                availableOptions,
                currentOnboarding,
            ]) => {
                if (!active) {
                    return
                }

                if (
                    currentOnboarding.state
                    === 'completed'
                ) {
                    navigate(
                        '/diagnostic',
                        {
                            replace: true,
                        },
                    )

                    return
                }

                setOptions(
                    availableOptions,
                )

                setPreferences({
                    languageId:
                        String(
                            availableOptions
                                .languages[0]
                                .id,
                        ),

                    selfAssessedDifficultyId:
                        String(
                            availableOptions
                                .difficulties[0]
                                .id,
                        ),

                    learningGoal:
                        availableOptions
                            .learningGoals
                            .includes(
                                'build_product',
                            )
                            ? 'build_product'
                            : availableOptions
                                .learningGoals[0],

                    studyPace:
                        availableOptions
                            .studyPaces
                            .includes('student')
                            ? 'student'
                            : availableOptions
                                .studyPaces[0],

                    interestKeys: [],

                    topicIds:
                        availableOptions
                            .topics
                            .map(
                                (topic) => (
                                    String(
                                        topic.id,
                                    )
                                ),
                            ),
                })

                setLoadError('')
            })
            .catch((error) => {
                if (active) {
                    setOptions(null)

                    setLoadError(
                        getAuthErrorMessage(
                            error,
                        ),
                    )
                }
            })

        return () => {
            active = false
        }
    }, [
        accessToken,
        navigate,
        reloadKey,
    ])

    const updatePreference = (
        name,
        value,
    ) => {
        setPreferences(
            (current) => ({
                ...current,
                [name]: value,
            }),
        )
    }

    const toggleInterest = (
        interestKey,
    ) => {
        setFormError('')

        if (
            preferences.interestKeys
                .includes(interestKey)
        ) {
            updatePreference(
                'interestKeys',
                preferences
                    .interestKeys
                    .filter(
                        (key) => (
                            key !== interestKey
                        ),
                    ),
            )

            return
        }

        if (
            preferences.interestKeys.length
            >= 3
        ) {
            setFormError(
                'Selecciona como máximo tres intereses.',
            )

            return
        }

        updatePreference(
            'interestKeys',
            [
                ...preferences.interestKeys,
                interestKey,
            ],
        )
    }

    const toggleTopic = (topicId) => {
        setFormError('')

        setPreferences((current) => ({
            ...current,

            topicIds:
                current.topicIds
                    .includes(topicId)
                    ? current
                        .topicIds
                        .filter(
                            (id) => (
                                id !== topicId
                            ),
                        )
                    : [
                        ...current.topicIds,
                        topicId,
                    ],
        }))
    }

    const handleRetry = () => {
        setLoadError('')
        setReloadKey(
            (current) => current + 1,
        )
    }

    const handleSubmit = async (
        event,
    ) => {
        event.preventDefault()
        setFormError('')

        if (
            preferences.interestKeys.length
            === 0
        ) {
            setFormError(
                'Selecciona al menos un interés.',
            )

            return
        }

        if (
            preferences.topicIds.length
            === 0
        ) {
            setFormError(
                'Selecciona al menos un tema técnico.',
            )

            return
        }

        setIsSubmitting(true)

        try {
            await completeStudentOnboarding({
                accessToken,

                preferences: {
                    languageId:
                        Number(
                            preferences
                                .languageId,
                        ),

                    selfAssessedDifficultyId:
                        Number(
                            preferences
                                .selfAssessedDifficultyId,
                        ),

                    learningGoal:
                        preferences
                            .learningGoal,

                    studyPace:
                        preferences
                            .studyPace,

                    interestKeys:
                        preferences
                            .interestKeys,

                    topicIds:
                        preferences
                            .topicIds
                            .map(Number),
                },
            })

            navigate(
                '/diagnostic',
                {
                    replace: true,
                },
            )
        } catch (error) {
            setFormError(
                getAuthErrorMessage(error),
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!options && !loadError) {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <p role="status">
                        Preparando tu experiencia...
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

    return (
        <main className="auth-page">
            <section className="auth-card">
                <header className="auth-header">
                    <p className="eyebrow">
                        Personaliza tu aprendizaje
                    </p>

                    <h1>
                        Cuéntanos sobre ti
                    </h1>

                    <p>
                        Usaremos tus respuestas para
                        preparar un diagnóstico y
                        ejercicios adecuados para ti.
                    </p>
                </header>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    <label htmlFor="onboarding-language">
                        Lenguaje de programación
                    </label>

                    <select
                        disabled={isSubmitting}
                        id="onboarding-language"
                        onChange={(event) => {
                            updatePreference(
                                'languageId',
                                event.target.value,
                            )
                        }}
                        value={preferences.languageId}
                    >
                        {options.languages.map(
                            (language) => (
                                <option
                                    key={language.id}
                                    value={language.id}
                                >
                                    {language.name}
                                </option>
                            ),
                        )}
                    </select>

                    <fieldset disabled={isSubmitting}>
                        <legend>
                            Tus intereses — máximo 3
                        </legend>

                        {options.interests.map(
                            (interestKey) => (
                                <label
                                    className="diagnostic-option"
                                    key={interestKey}
                                >
                                    <input
                                        checked={
                                            preferences
                                                .interestKeys
                                                .includes(
                                                    interestKey,
                                                )
                                        }
                                        onChange={() => {
                                            toggleInterest(
                                                interestKey,
                                            )
                                        }}
                                        type="checkbox"
                                    />

                                    <span>
                                        {
                                            interestLabels[
                                            interestKey
                                            ]
                                            ?? interestKey
                                        }
                                    </span>
                                </label>
                            ),
                        )}
                    </fieldset>

                    <fieldset disabled={isSubmitting}>
                        <legend>
                            Tu nivel actual
                        </legend>

                        {options.difficulties.map(
                            (difficulty) => (
                                <label
                                    className="diagnostic-option"
                                    key={difficulty.id}
                                >
                                    <input
                                        checked={
                                            preferences
                                                .selfAssessedDifficultyId
                                            === String(
                                                difficulty.id,
                                            )
                                        }
                                        name="onboarding-difficulty"
                                        onChange={(event) => {
                                            updatePreference(
                                                'selfAssessedDifficultyId',
                                                event.target.value,
                                            )
                                        }}
                                        type="radio"
                                        value={difficulty.id}
                                    />

                                    <span>
                                        {difficulty.name}
                                    </span>
                                </label>
                            ),
                        )}
                    </fieldset>

                    <fieldset disabled={isSubmitting}>
                        <legend>
                            Tiempo disponible
                        </legend>

                        {options.studyPaces.map(
                            (studyPace) => (
                                <label
                                    className="diagnostic-option"
                                    key={studyPace}
                                >
                                    <input
                                        checked={
                                            preferences
                                                .studyPace
                                            === studyPace
                                        }
                                        name="onboarding-pace"
                                        onChange={(event) => {
                                            updatePreference(
                                                'studyPace',
                                                event.target.value,
                                            )
                                        }}
                                        type="radio"
                                        value={studyPace}
                                    />

                                    <span>
                                        {
                                            studyPaceLabels[
                                            studyPace
                                            ]
                                            ?? studyPace
                                        }
                                    </span>
                                </label>
                            ),
                        )}
                    </fieldset>

                    <label htmlFor="onboarding-goal">
                        Objetivo principal
                    </label>

                    <select
                        disabled={isSubmitting}
                        id="onboarding-goal"
                        onChange={(event) => {
                            updatePreference(
                                'learningGoal',
                                event.target.value,
                            )
                        }}
                        value={preferences.learningGoal}
                    >
                        {options.learningGoals.map(
                            (learningGoal) => (
                                <option
                                    key={learningGoal}
                                    value={learningGoal}
                                >
                                    {
                                        learningGoalLabels[
                                        learningGoal
                                        ]
                                        ?? learningGoal
                                    }
                                </option>
                            ),
                        )}
                    </select>

                    <fieldset disabled={isSubmitting}>
                        <legend>
                            Temas que quieres practicar
                        </legend>

                        {options.topics.map(
                            (topic) => {
                                const topicId =
                                    String(
                                        topic.id,
                                    )

                                return (
                                    <label
                                        className="diagnostic-option"
                                        key={topic.id}
                                    >
                                        <input
                                            checked={
                                                preferences
                                                    .topicIds
                                                    .includes(
                                                        topicId,
                                                    )
                                            }
                                            onChange={() => {
                                                toggleTopic(
                                                    topicId,
                                                )
                                            }}
                                            type="checkbox"
                                        />

                                        <span>
                                            {topic.name}
                                        </span>
                                    </label>
                                )
                            },
                        )}
                    </fieldset>

                    {formError && (
                        <p
                            className="form-error"
                            role="alert"
                        >
                            {formError}
                        </p>
                    )}

                    <button
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {
                            isSubmitting
                                ? 'Guardando...'
                                : 'Crear mi diagnóstico'
                        }
                    </button>
                </form>
            </section>
        </main>
    )
}
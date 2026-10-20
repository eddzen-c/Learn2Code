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

import {
    LearningTopbar,
} from '../components/LearningTopbar.jsx'

import {
    LearningSidebar,
} from '../components/LearningSidebar.jsx'

const MAX_TECHNOLOGIES = 3
const MAX_PROJECT_IDEA_LENGTH = 100

const learningGoalOptions = {
    career_preparation: {
        icon: '🎯',
        label:
            'Conseguir trabajo como desarrollador',
        description:
            'Quiero prepararme para iniciar mi carrera.',
    },

    professional_growth: {
        icon: '🚀',
        label:
            'Mejorar en mi trabajo actual',
        description:
            'Quiero fortalecer mis conocimientos.',
    },

    build_product: {
        icon: '💡',
        label:
            'Crear mis propios proyectos',
        description:
            'Quiero convertir mis ideas en aplicaciones.',
    },

    personal_interest: {
        icon: '🎮',
        label:
            'Explorar por interés personal',
        description:
            'Quiero aprender y descubrir nuevas tecnologías.',
    },
}

const technologyOptions = {
    javascript: {
        icon: 'JS',
        label: 'JavaScript',
    },

    python: {
        icon: 'Py',
        label: 'Python',
    },

    react: {
        icon: '⚛',
        label: 'React',
    },

    html_css: {
        icon: 'H5',
        label: 'HTML y CSS',
    },

    nodejs: {
        icon: 'N',
        label: 'Node.js',
    },

    typescript: {
        icon: 'TS',
        label: 'TypeScript',
    },

    java: {
        icon: 'J',
        label: 'Java',
    },

    sql: {
        icon: 'DB',
        label: 'SQL',
    },

    other: {
        icon: '•••',
        label: 'Otra',
    },
}

const weeklyTimeOptions = {
    less_than_5: {
        icon: '◴',
        label: 'Menos de 5 horas',
    },

    five_to_ten: {
        icon: '◷',
        label: '5 - 10 horas',
    },

    ten_to_twenty: {
        icon: '◶',
        label: '10 - 20 horas',
    },

    more_than_twenty: {
        icon: '◵',
        label: 'Más de 20 horas',
    },
}

const learningStyleOptions = {
    practical: {
        icon: '🛠',
        label: 'Práctico',
        description:
            'Aprendo haciendo proyectos.',
    },

    visual: {
        icon: '◉',
        label: 'Visual',
        description:
            'Aprendo con ejemplos y diagramas.',
    },

    reading: {
        icon: '▤',
        label: 'Lectura',
        description:
            'Prefiero leer y documentarme.',
    },

    guided: {
        icon: '⚑',
        label: 'Guiado',
        description:
            'Prefiero avanzar paso a paso.',
    },
}

const createInitialPreferences = () => ({
    selfAssessedDifficultyId: '',
    learningGoal: '',
    weeklyTimeCommitment: '',
    learningStyle: '',
    technologyInterestKeys: [],
    projectIdea: '',
})

const getFirstName = (fullName) => {
    if (
        typeof fullName !== 'string'
        || fullName.trim().length === 0
    ) {
        return 'estudiante'
    }

    return fullName
        .trim()
        .split(/\s+/)[0]
}

const getDifficultyLabel = (
    difficulty,
) => {
    const name =
        difficulty.name
            .toLocaleLowerCase('es')

    if (
        name.includes('básico')
        || name.includes('basico')
    ) {
        return {
            icon: '🌱',
            label: 'Principiante',
            description:
                'Estoy comenzando desde cero.',
        }
    }

    if (name.includes('intermedio')) {
        return {
            icon: '▥',
            label: 'Intermedio',
            description:
                'Tengo conocimientos básicos.',
        }
    }

    return {
        icon: '🚀',
        label: 'Avanzado',
        description:
            'Tengo experiencia sólida.',
    }
}

const resolveLanguageId = ({
    languages,
    technologyInterestKeys,
}) => {
    const javascriptTechnologies =
        new Set([
            'javascript',
            'react',
            'html_css',
            'nodejs',
            'typescript',
        ])

    const usesJavaScript =
        technologyInterestKeys.some(
            (technologyKey) => (
                javascriptTechnologies.has(
                    technologyKey,
                )
            ),
        )

    let preferredLanguage =
        'JavaScript'

    if (
        technologyInterestKeys
            .includes('python')
        && !usesJavaScript
    ) {
        preferredLanguage =
            'Python'
    } else if (
        technologyInterestKeys
            .includes('java')
        && !usesJavaScript
        && !technologyInterestKeys
            .includes('python')
    ) {
        preferredLanguage =
            'Java'
    }

    const language =
        languages.find(
            (availableLanguage) => (
                availableLanguage.name
                    .toLocaleLowerCase()
                === preferredLanguage
                    .toLocaleLowerCase()
            ),
        )
        ?? languages[0]

    return language?.id ?? ''
}

export function OnboardingPage() {
    const {
        accessToken,
        user,
    } = useAuth()

    const navigate =
        useNavigate()

    const [options, setOptions] =
        useState(null)

    const [
        preferences,
        setPreferences,
    ] = useState(
        createInitialPreferences,
    )

    const [loadError, setLoadError] =
        useState('')

    const [formError, setFormError] =
        useState('')

    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false)

    const [reloadKey, setReloadKey] =
        useState(0)

    const firstName =
        getFirstName(
            user?.fullName,
        )

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

                const defaultGoal =
                    availableOptions
                        .learningGoals
                        .includes(
                            'career_preparation',
                        )
                        ? 'career_preparation'
                        : availableOptions
                            .learningGoals[0]

                const defaultTime =
                    availableOptions
                        .weeklyTimeCommitments
                        .includes(
                            'five_to_ten',
                        )
                        ? 'five_to_ten'
                        : availableOptions
                            .weeklyTimeCommitments[0]

                const defaultStyle =
                    availableOptions
                        .learningStyles
                        .includes('practical')
                        ? 'practical'
                        : availableOptions
                            .learningStyles[0]

                setOptions(
                    availableOptions,
                )

                setPreferences({
                    selfAssessedDifficultyId:
                        String(
                            availableOptions
                                .difficulties[0]
                                .id,
                        ),

                    learningGoal:
                        defaultGoal,

                    weeklyTimeCommitment:
                        defaultTime,

                    learningStyle:
                        defaultStyle,

                    technologyInterestKeys:
                        [],

                    projectIdea:
                        '',
                })

                setLoadError('')
            })
            .catch((error) => {
                if (!active) {
                    return
                }

                setOptions(null)

                setLoadError(
                    getAuthErrorMessage(
                        error,
                    ),
                )
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
        setFormError('')

        setPreferences(
            (current) => ({
                ...current,
                [name]: value,
            }),
        )
    }

    const toggleTechnology = (
        technologyKey,
    ) => {
        setFormError('')

        if (
            preferences
                .technologyInterestKeys
                .includes(
                    technologyKey,
                )
        ) {
            updatePreference(
                'technologyInterestKeys',
                preferences
                    .technologyInterestKeys
                    .filter(
                        (key) => (
                            key
                            !== technologyKey
                        ),
                    ),
            )

            return
        }

        if (
            preferences
                .technologyInterestKeys
                .length
            >= MAX_TECHNOLOGIES
        ) {
            setFormError(
                'Selecciona como máximo tres tecnologías.',
            )

            return
        }

        updatePreference(
            'technologyInterestKeys',
            [
                ...preferences
                    .technologyInterestKeys,

                technologyKey,
            ],
        )
    }

    const handleRetry = () => {
        setLoadError('')

        setReloadKey(
            (current) => (
                current + 1
            ),
        )
    }

    const handleSubmit = async (
        event,
    ) => {
        event.preventDefault()
        setFormError('')

        if (
            preferences
                .technologyInterestKeys
                .length
            === 0
        ) {
            setFormError(
                'Selecciona al menos una tecnología.',
            )

            return
        }

        const languageId =
            resolveLanguageId({
                languages:
                    options.languages,

                technologyInterestKeys:
                    preferences
                        .technologyInterestKeys,
            })

        if (!languageId) {
            setFormError(
                'No fue posible seleccionar un lenguaje para el diagnóstico.',
            )

            return
        }

        const normalizedProjectIdea =
            preferences.projectIdea
                .trim()

        setIsSubmitting(true)

        try {
            await completeStudentOnboarding({
                accessToken,

                preferences: {
                    languageId:
                        Number(languageId),

                    selfAssessedDifficultyId:
                        Number(
                            preferences
                                .selfAssessedDifficultyId,
                        ),

                    learningGoal:
                        preferences
                            .learningGoal,

                    weeklyTimeCommitment:
                        preferences
                            .weeklyTimeCommitment,

                    learningStyle:
                        preferences
                            .learningStyle,

                    technologyInterestKeys:
                        preferences
                            .technologyInterestKeys,

                    projectIdea:
                        normalizedProjectIdea
                            .length > 0
                            ? normalizedProjectIdea
                            : null,
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
            <main className="onboarding-page onboarding-page--centered">
                <section className="onboarding-status-card">
                    <span
                        aria-hidden="true"
                        className="onboarding-status-icon"
                    >
                        {'</>'}
                    </span>

                    <p role="status">
                        Preparando tu experiencia...
                    </p>
                </section>
            </main>
        )
    }

    if (loadError) {
        return (
            <main className="onboarding-page onboarding-page--centered">
                <section className="onboarding-status-card">
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
        <main className="onboarding-page">
            <LearningSidebar
                activeItem="home"
                mascotAlt="Mascota de Learn2Code programando"
                mascotSrc="/images/learn2code-mascot-laptop.png"
                message="Configura tu perfil para recibir un diagnóstico y una ruta adaptados a ti."
                messageTitle="Tu camino comienza aquí"
            />

            <section className="onboarding-content">
                <LearningTopbar
                    activeStep={1}
                    userName={firstName}
                />

                <div className="onboarding-workspace">
                    <section className="onboarding-form-area">
                        <header className="onboarding-introduction">
                            <p className="eyebrow">
                                Paso 1 de 5
                            </p>

                            <h1>
                                ¡Te damos la bienvenida,{' '}
                                {firstName}!
                            </h1>

                            <p>
                                Para personalizar tu
                                aprendizaje, cuéntanos
                                un poco sobre ti.
                            </p>
                        </header>

                        <form
                            className="onboarding-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="onboarding-form-grid">
                                <fieldset
                                    className="onboarding-question-card"
                                    disabled={isSubmitting}
                                >
                                    <legend>
                                        ¿Cuál es tu objetivo principal?
                                    </legend>

                                    <p>
                                        Elige una opción principal.
                                    </p>

                                    <div className="onboarding-choice-grid onboarding-choice-grid--four">
                                        {options
                                            .learningGoals
                                            .map(
                                                (
                                                    learningGoal,
                                                ) => {
                                                    const option =
                                                        learningGoalOptions[
                                                        learningGoal
                                                        ]
                                                        ?? {
                                                            icon: '◎',
                                                            label:
                                                                learningGoal,
                                                            description:
                                                                '',
                                                        }

                                                    return (
                                                        <label
                                                            className="onboarding-choice"
                                                            key={
                                                                learningGoal
                                                            }
                                                        >
                                                            <input
                                                                checked={
                                                                    preferences
                                                                        .learningGoal
                                                                    === learningGoal
                                                                }
                                                                name="learning-goal"
                                                                onChange={(
                                                                    event,
                                                                ) => {
                                                                    updatePreference(
                                                                        'learningGoal',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }}
                                                                type="radio"
                                                                value={
                                                                    learningGoal
                                                                }
                                                            />

                                                            <span className="onboarding-choice-content">
                                                                <span
                                                                    aria-hidden="true"
                                                                    className="onboarding-choice-icon"
                                                                >
                                                                    {
                                                                        option.icon
                                                                    }
                                                                </span>

                                                                <strong>
                                                                    {
                                                                        option.label
                                                                    }
                                                                </strong>

                                                                <small>
                                                                    {
                                                                        option.description
                                                                    }
                                                                </small>
                                                            </span>
                                                        </label>
                                                    )
                                                },
                                            )}
                                    </div>
                                </fieldset>

                                <fieldset
                                    className="onboarding-question-card"
                                    disabled={isSubmitting}
                                >
                                    <legend>
                                        ¿Cuál es tu experiencia actual?
                                    </legend>

                                    <p>
                                        Sé honesto; esto ayudará
                                        a elegir el mejor punto
                                        de partida.
                                    </p>

                                    <div className="onboarding-choice-grid onboarding-choice-grid--three">
                                        {options
                                            .difficulties
                                            .map(
                                                (
                                                    difficulty,
                                                ) => {
                                                    const option =
                                                        getDifficultyLabel(
                                                            difficulty,
                                                        )

                                                    return (
                                                        <label
                                                            className="onboarding-choice"
                                                            key={
                                                                difficulty.id
                                                            }
                                                        >
                                                            <input
                                                                checked={
                                                                    preferences
                                                                        .selfAssessedDifficultyId
                                                                    === String(
                                                                        difficulty.id,
                                                                    )
                                                                }
                                                                name="difficulty"
                                                                onChange={(
                                                                    event,
                                                                ) => {
                                                                    updatePreference(
                                                                        'selfAssessedDifficultyId',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }}
                                                                type="radio"
                                                                value={
                                                                    difficulty.id
                                                                }
                                                            />

                                                            <span className="onboarding-choice-content">
                                                                <span
                                                                    aria-hidden="true"
                                                                    className="onboarding-choice-icon"
                                                                >
                                                                    {
                                                                        option.icon
                                                                    }
                                                                </span>

                                                                <strong>
                                                                    {
                                                                        option.label
                                                                    }
                                                                </strong>

                                                                <small>
                                                                    {
                                                                        option.description
                                                                    }
                                                                </small>
                                                            </span>
                                                        </label>
                                                    )
                                                },
                                            )}
                                    </div>
                                </fieldset>

                                <fieldset
                                    className="onboarding-question-card"
                                    disabled={isSubmitting}
                                >
                                    <legend>
                                        ¿Qué tecnologías te interesan más?
                                    </legend>

                                    <p>
                                        Selecciona entre una y
                                        tres tecnologías.
                                    </p>

                                    <div className="onboarding-technology-grid">
                                        {options
                                            .technologyInterests
                                            .map(
                                                (
                                                    technologyKey,
                                                ) => {
                                                    const option =
                                                        technologyOptions[
                                                        technologyKey
                                                        ]
                                                        ?? {
                                                            icon: '•',
                                                            label:
                                                                technologyKey,
                                                        }

                                                    return (
                                                        <label
                                                            className="onboarding-technology"
                                                            key={
                                                                technologyKey
                                                            }
                                                        >
                                                            <input
                                                                checked={
                                                                    preferences
                                                                        .technologyInterestKeys
                                                                        .includes(
                                                                            technologyKey,
                                                                        )
                                                                }
                                                                onChange={() => {
                                                                    toggleTechnology(
                                                                        technologyKey,
                                                                    )
                                                                }}
                                                                type="checkbox"
                                                            />

                                                            <span>
                                                                <b aria-hidden="true">
                                                                    {
                                                                        option.icon
                                                                    }
                                                                </b>

                                                                <strong>
                                                                    {
                                                                        option.label
                                                                    }
                                                                </strong>
                                                            </span>
                                                        </label>
                                                    )
                                                },
                                            )}
                                    </div>
                                </fieldset>

                                <fieldset
                                    className="onboarding-question-card"
                                    disabled={isSubmitting}
                                >
                                    <legend>
                                        ¿Cuánto tiempo puedes dedicar por semana?
                                    </legend>

                                    <p>
                                        La constancia es más
                                        importante que la cantidad.
                                    </p>

                                    <div className="onboarding-choice-grid onboarding-choice-grid--four">
                                        {options
                                            .weeklyTimeCommitments
                                            .map(
                                                (
                                                    weeklyTime,
                                                ) => {
                                                    const option =
                                                        weeklyTimeOptions[
                                                        weeklyTime
                                                        ]
                                                        ?? {
                                                            icon: '◷',
                                                            label:
                                                                weeklyTime,
                                                        }

                                                    return (
                                                        <label
                                                            className="onboarding-choice"
                                                            key={
                                                                weeklyTime
                                                            }
                                                        >
                                                            <input
                                                                checked={
                                                                    preferences
                                                                        .weeklyTimeCommitment
                                                                    === weeklyTime
                                                                }
                                                                name="weekly-time"
                                                                onChange={(
                                                                    event,
                                                                ) => {
                                                                    updatePreference(
                                                                        'weeklyTimeCommitment',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }}
                                                                type="radio"
                                                                value={
                                                                    weeklyTime
                                                                }
                                                            />

                                                            <span className="onboarding-choice-content">
                                                                <span
                                                                    aria-hidden="true"
                                                                    className="onboarding-choice-icon"
                                                                >
                                                                    {
                                                                        option.icon
                                                                    }
                                                                </span>

                                                                <strong>
                                                                    {
                                                                        option.label
                                                                    }
                                                                </strong>
                                                            </span>
                                                        </label>
                                                    )
                                                },
                                            )}
                                    </div>
                                </fieldset>

                                <fieldset
                                    className="onboarding-question-card"
                                    disabled={isSubmitting}
                                >
                                    <legend>
                                        ¿Cómo prefieres aprender?
                                    </legend>

                                    <p>
                                        Elige el estilo que mejor
                                        se adapte a ti.
                                    </p>

                                    <div className="onboarding-choice-grid onboarding-choice-grid--four">
                                        {options
                                            .learningStyles
                                            .map(
                                                (
                                                    learningStyle,
                                                ) => {
                                                    const option =
                                                        learningStyleOptions[
                                                        learningStyle
                                                        ]
                                                        ?? {
                                                            icon: '◉',
                                                            label:
                                                                learningStyle,
                                                            description:
                                                                '',
                                                        }

                                                    return (
                                                        <label
                                                            className="onboarding-choice"
                                                            key={
                                                                learningStyle
                                                            }
                                                        >
                                                            <input
                                                                checked={
                                                                    preferences
                                                                        .learningStyle
                                                                    === learningStyle
                                                                }
                                                                name="learning-style"
                                                                onChange={(
                                                                    event,
                                                                ) => {
                                                                    updatePreference(
                                                                        'learningStyle',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }}
                                                                type="radio"
                                                                value={
                                                                    learningStyle
                                                                }
                                                            />

                                                            <span className="onboarding-choice-content">
                                                                <span
                                                                    aria-hidden="true"
                                                                    className="onboarding-choice-icon"
                                                                >
                                                                    {
                                                                        option.icon
                                                                    }
                                                                </span>

                                                                <strong>
                                                                    {
                                                                        option.label
                                                                    }
                                                                </strong>

                                                                <small>
                                                                    {
                                                                        option.description
                                                                    }
                                                                </small>
                                                            </span>
                                                        </label>
                                                    )
                                                },
                                            )}
                                    </div>
                                </fieldset>

                                <section className="onboarding-question-card">
                                    <label htmlFor="project-idea">
                                        ¿Qué te gustaría construir primero?
                                    </label>

                                    <p>
                                        Este campo es opcional.
                                        Puedes describir brevemente
                                        una idea.
                                    </p>

                                    <textarea
                                        disabled={isSubmitting}
                                        id="project-idea"
                                        maxLength={
                                            MAX_PROJECT_IDEA_LENGTH
                                        }
                                        onChange={(event) => {
                                            updatePreference(
                                                'projectIdea',
                                                event.target.value,
                                            )
                                        }}
                                        placeholder="Ejemplo: una página web, una API o una aplicación educativa"
                                        rows="5"
                                        value={
                                            preferences
                                                .projectIdea
                                        }
                                    />

                                    <small className="onboarding-character-count">
                                        {
                                            preferences
                                                .projectIdea
                                                .length
                                        }
                                        /
                                        {
                                            MAX_PROJECT_IDEA_LENGTH
                                        }
                                    </small>
                                </section>
                            </div>

                            {formError && (
                                <p
                                    className="form-error"
                                    role="alert"
                                >
                                    {formError}
                                </p>
                            )}

                            <div className="onboarding-actions">
                                <button
                                    className="secondary-button"
                                    disabled={isSubmitting}
                                    onClick={() => {
                                        navigate(
                                            '/dashboard',
                                        )
                                    }}
                                    type="button"
                                >
                                    Completar después
                                </button>

                                <button
                                    className="primary-button"
                                    disabled={isSubmitting}
                                    type="submit"
                                >
                                    {
                                        isSubmitting
                                            ? 'Guardando...'
                                            : 'Continuar al diagnóstico'
                                    }
                                </button>
                            </div>
                        </form>
                    </section>

                    <aside className="onboarding-summary">
                        <p className="eyebrow">
                            Tu perfil inicial
                        </p>

                        <h2>
                            Resumen de tus selecciones
                        </h2>

                        <dl>
                            <div>
                                <dt>
                                    Objetivo principal
                                </dt>

                                <dd>
                                    {
                                        learningGoalOptions[
                                            preferences
                                                .learningGoal
                                        ]?.label
                                        ?? 'Por definir'
                                    }
                                </dd>
                            </div>

                            <div>
                                <dt>
                                    Experiencia actual
                                </dt>

                                <dd>
                                    {
                                        getDifficultyLabel(
                                            options
                                                .difficulties
                                                .find(
                                                    (
                                                        difficulty,
                                                    ) => (
                                                        String(
                                                            difficulty.id,
                                                        )
                                                        === preferences
                                                            .selfAssessedDifficultyId
                                                    ),
                                                )
                                            ?? options
                                                .difficulties[0],
                                        ).label
                                    }
                                </dd>
                            </div>

                            <div>
                                <dt>
                                    Tecnologías de interés
                                </dt>

                                <dd>
                                    {
                                        preferences
                                            .technologyInterestKeys
                                            .length > 0
                                            ? preferences
                                                .technologyInterestKeys
                                                .map(
                                                    (
                                                        technologyKey,
                                                    ) => (
                                                        technologyOptions[
                                                            technologyKey
                                                        ]?.label
                                                        ?? technologyKey
                                                    ),
                                                )
                                                .join(', ')
                                            : 'Aún no seleccionadas'
                                    }
                                </dd>
                            </div>

                            <div>
                                <dt>
                                    Tiempo disponible
                                </dt>

                                <dd>
                                    {
                                        weeklyTimeOptions[
                                            preferences
                                                .weeklyTimeCommitment
                                        ]?.label
                                        ?? 'Por definir'
                                    }
                                </dd>
                            </div>

                            <div>
                                <dt>
                                    Estilo de aprendizaje
                                </dt>

                                <dd>
                                    {
                                        learningStyleOptions[
                                            preferences
                                                .learningStyle
                                        ]?.label
                                        ?? 'Por definir'
                                    }
                                </dd>
                            </div>

                            <div>
                                <dt>
                                    Quiero construir
                                </dt>

                                <dd>
                                    {
                                        preferences
                                            .projectIdea
                                            .trim()
                                        || 'Aún no definido'
                                    }
                                </dd>
                            </div>
                        </dl>
                    </aside>
                </div>
            </section>
        </main>
    )
}
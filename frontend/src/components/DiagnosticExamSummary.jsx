import {
    FiClock,
    FiGrid,
    FiList,
    FiTarget,
} from 'react-icons/fi'

import {
    TechnologyIcon,
} from './TechnologyIcon.jsx'

import {
    DiagnosticCountdown,
} from './DiagnosticCountdown.jsx';

const createTechnologyDistribution = (
    questions,
    totalQuestions,
) => {
    const counts = new Map()

    questions.forEach((question) => {
        const technologyKey =
            question.technologyKey
            ?? 'other'

        counts.set(
            technologyKey,
            (
                counts.get(technologyKey)
                ?? 0
            ) + 1,
        )
    })

    return Array.from(
        counts.entries(),
    ).map(([
        technologyKey,
        questionCount,
    ]) => ({
        technologyKey,
        questionCount,

        percentage:
            totalQuestions > 0
                ? Math.round(
                    (
                        questionCount
                        / totalQuestions
                    ) * 100,
                )
                : 0,
    }))
}

export function DiagnosticExamSummary({
    answeredCount = 0,
    questionCount = 0,
    questions = [],
    expiresAt = null,
}) {
    const safeQuestions =
        Array.isArray(questions)
            ? questions
            : []

    const totalQuestions =
        Number.isInteger(questionCount)
            && questionCount > 0
            ? questionCount
            : safeQuestions.length

    const estimatedMinutes = Math.max(
        5,
        Math.ceil(
            (
                totalQuestions
                * 3.75
            ) / 5,
        ) * 5,
    )

    const answeredPercentage =
        totalQuestions > 0
            ? Math.round(
                (
                    answeredCount
                    / totalQuestions
                ) * 100,
            )
            : 0

    const technologyDistribution =
        createTechnologyDistribution(
            safeQuestions,
            totalQuestions,
        )

    return (
        <aside
            aria-label="Resumen del examen"
            className="diagnostic-exam-summary"
        >
            <section className="diagnostic-summary-card">
                <header>
                    <FiClock aria-hidden="true" />

                    <strong>
                        {expiresAt ? 'Tiempo restante' : 'Tiempo estimado'}
                    </strong>
                </header>

                {expiresAt ? (
                    <DiagnosticCountdown expiresAt={expiresAt} />
                ) : (
                    <p className="diagnostic-summary-time">
                        {estimatedMinutes}

                        <small>
                            minutos
                        </small>
                    </p>
                )}

                <div className="diagnostic-summary-progress">
                    <span
                        style={{
                            width:
                                `${answeredPercentage}%`,
                        }}
                    />
                </div>

                <small>
                    {answeredCount} de{' '}
                    {totalQuestions}{' '}
                    preguntas respondidas
                </small>
            </section>

            <section className="diagnostic-summary-card">
                <header>
                    <FiGrid aria-hidden="true" />

                    <strong>
                        Distribución del examen
                    </strong>
                </header>

                <ul className="diagnostic-summary-statistics">
                    <li>
                        <FiList aria-hidden="true" />

                        <strong>
                            {totalQuestions}
                        </strong>

                        <span>
                            Preguntas totales
                        </span>
                    </li>

                    <li>
                        <FiClock aria-hidden="true" />

                        <strong>
                            {expiresAt ? 30 : estimatedMinutes} min
                        </strong>

                        <span>
                            Duración estimada
                        </span>
                    </li>

                    <li>
                        <FiTarget aria-hidden="true" />

                        <strong>
                            {
                                technologyDistribution
                                    .length
                            }
                        </strong>

                        <span>
                            Tecnologías
                        </span>
                    </li>

                    <li>
                        <FiGrid aria-hidden="true" />

                        <strong>
                            1
                        </strong>

                        <span>
                            Intento
                        </span>
                    </li>
                </ul>
            </section>

            <section className="diagnostic-summary-card">
                <header>
                    <FiTarget aria-hidden="true" />

                    <strong>
                        Tecnologías evaluadas
                    </strong>
                </header>

                <ul className="diagnostic-technology-distribution">
                    {
                        technologyDistribution.map(
                            (technology) => (
                                <li
                                    key={
                                        technology
                                            .technologyKey
                                    }
                                >
                                    <TechnologyIcon
                                        showLabel
                                        size={18}
                                        technologyKey={
                                            technology
                                                .technologyKey
                                        }
                                    />

                                    <div>
                                        <span
                                            style={{
                                                width:
                                                    `${technology.percentage}%`,
                                            }}
                                        />
                                    </div>

                                    <strong>
                                        {
                                            technology
                                                .percentage
                                        }%
                                    </strong>
                                </li>
                            ),
                        )
                    }
                </ul>
            </section>
        </aside>
    )
}
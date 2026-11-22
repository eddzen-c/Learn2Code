
import {
    useEffect,
    useState,
} from 'react'

import {
    Link,
} from 'react-router-dom'

import {
    confirmLearningPlan,
    generateLearningPlan,
    getCurrentLearningPlan,
} from '../api/learning-paths.api.js'

const specializationNames = {
    frontend: 'Desarrollo Frontend',
    backend: 'Desarrollo Backend',
    fullstack: 'Desarrollo Full Stack',
    devops: 'DevOps',
}

export function LearningPlanRecommendation({
    accessToken,
}) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [error, setError] = useState('')
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let active = true

        getCurrentLearningPlan(accessToken)
            .then((result) => {
                if (active) {
                    setData(result)
                    setError('')
                }
            })
            .catch((requestError) => {
                if (active) {
                    setError(
                        requestError.message
                        ?? 'No fue posible consultar el plan.',
                    )
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false)
                }
            })

        return () => {
            active = false
        }
    }, [accessToken, reloadKey])

    const handleGenerate = async () => {
        if (generating) {
            return
        }

        setError('')
        setGenerating(true)

        try {
            const result = await generateLearningPlan(
                accessToken,
            )

            setData(result)
        } catch (requestError) {
            setError(
                requestError.message
                ?? 'No fue posible generar tu plan.',
            )
        } finally {
            setGenerating(false)
        }
    }

    const handleConfirm = async () => {
        if (!data?.plan?.id || confirming) {
            return
        }

        setError('')
        setConfirming(true)

        try {
            const result = await confirmLearningPlan({
                accessToken,
                pathId: data.plan.id,
            })

            setData(result)
        } catch (requestError) {
            setError(
                requestError.message
                ?? 'No fue posible confirmar el plan.',
            )
        } finally {
            setConfirming(false)
        }
    }

    if (loading) {
        return (
            <section className="rp-ai-panel">
                <p>Cargando tu plan recomendado...</p>
            </section>
        )
    }

    if (error && !data) {
        return (
            <section className="rp-ai-panel">
                <p role="alert">{error}</p>

                <button
                    type="button"
                    onClick={() => {
                        setLoading(true)
                        setReloadKey((value) => value + 1)
                    }}
                >
                    Reintentar
                </button>
            </section>
        )
    }

    if (data?.state === 'onboarding_required') {
        return (
            <section className="rp-ai-panel">
                <p>Primero debes completar «Sobre ti».</p>
                <Link to="/onboarding">
                    Completar perfil inicial
                </Link>
            </section>
        )
    }

    if (data?.state === 'diagnostic_required') {
        return (
            <section className="rp-ai-panel">
                <p>
                    Completa el diagnóstico para recibir
                    una recomendación personalizada.
                </p>

                <Link to="/diagnostic">
                    Ir al diagnóstico
                </Link>
            </section>
        )
    }

    if (data?.state === 'not_generated') {
        return (
            <section className="rp-ai-panel">
                <h2>Tu próxima ruta comienza aquí</h2>

                <p>
                    Analizaremos tus intereses, objetivos,
                    disponibilidad y resultados del diagnóstico
                    para recomendarte una especialización.
                </p>

                {error && (
                    <p role="alert" className="rp-ai-error">
                        {error}
                    </p>
                )}

                <button
                    className="rp-ai-primary"
                    type="button"
                    disabled={generating}
                    onClick={handleGenerate}
                >
                    {generating
                        ? 'Generando plan personalizado...'
                        : 'Generar mi plan con IA'}
                </button>
            </section>
        )
    }

    const plan = data?.plan

    if (!plan) {
        return (
            <section className="rp-ai-panel">
                <p>No encontramos un plan disponible.</p>
            </section>
        )
    }

    const confirmed = data.state === 'confirmed'

    return (
        <section
            className="rp-ai-panel"
            aria-label="Plan personalizado por IA"
        >
            <span className="rp-ai-eyebrow">
                RECOMENDACIÓN PERSONALIZADA
            </span>

            <h2>
                {specializationNames[plan.specializationKey]
                    ?? plan.title}
            </h2>

            <p className="rp-ai-description">
                {plan.description}
            </p>

            <div className="rp-ai-duration">
                Duración estimada:
                {' '}
                <strong>{plan.estimatedWeeks} semanas</strong>
            </div>

            <h3>¿Por qué te recomendamos esta ruta?</h3>

            <p>{plan.reason}</p>

            <h3>Tu plan de aprendizaje</h3>

            <ol className="rp-ai-steps">
                {plan.steps.map((step) => (
                    <li key={step.id ?? step.position}>
                        <strong>{step.title}</strong>
                        <p>{step.description}</p>
                    </li>
                ))}
            </ol>

            {error && (
                <p role="alert" className="rp-ai-error">
                    {error}
                </p>
            )}

            {confirmed ? (
                <div
                    className="rp-ai-confirmed"
                    role="status"
                >
                    Plan confirmado correctamente.
                    Tu ruta ya está guardada.
                </div>
            ) : (
                <button
                    className="rp-ai-primary"
                    type="button"
                    disabled={confirming}
                    onClick={handleConfirm}
                >
                    {confirming
                        ? 'Confirmando plan...'
                        : 'Confirmar mi plan'}
                </button>
            )}
        </section>
    )
}


import {
    useEffect,
    useState,
} from 'react'

import { Link } from 'react-router-dom'

import {
    FiArrowRight,
    FiBarChart2,
    FiBookOpen,
    FiBox,
    FiInfo,
    FiRepeat,
} from 'react-icons/fi'

import { useAuth } from '../auth/useAuth.js'

import {
    getCurrentStudentOnboarding,
} from '../api/onboarding.api.js'

import {
    getCurrentDiagnostic,
} from '../api/diagnostic.api.js'

import {
    getCurrentStudentRoute,
} from '../api/student-routes.api.js'

import {
    getCurrentLearningPlan,
} from '../api/learning-paths.api.js'

import './ProfileLearning.css'

const technologyNames = {
    javascript: 'JavaScript',
    python: 'Python',
    react: 'React',
    html_css: 'HTML y CSS',
    nodejs: 'Node.js',
    typescript: 'TypeScript',
    java: 'Java',
    sql: 'SQL',
    other: 'Otra',
}

const learningGoals = {
    career_preparation: 'Conseguir trabajo como desarrollador',
    professional_growth: 'Mejorar profesionalmente',
    build_product: 'Crear mis propios proyectos',
    personal_interest: 'Aprender por interés personal',
}

const weeklyCommitments = {
    less_than_5: 'Menos de 5 horas',
    five_to_ten: '5 a 10 horas',
    ten_to_twenty: '10 a 20 horas',
    more_than_twenty: 'Más de 20 horas',
}

const learningStyles = {
    practical: 'Práctico',
    visual: 'Visual',
    reading: 'Lectura',
    guided: 'Guiado',
}

const specializationNames = {
    frontend: 'Frontend',
    backend: 'Backend',
    fullstack: 'Full Stack',
    devops: 'DevOps',
}

function getSpecializationName(key) {
    return specializationNames[key] ?? 'No disponible'
}

export function ProfileLearning() {
    const { accessToken } = useAuth()

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [failedResources, setFailedResources] = useState([])
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        if (!accessToken) {
            return undefined
        }

        let active = true

        const requests = [
            getCurrentStudentOnboarding(accessToken),
            getCurrentDiagnostic(accessToken),
            getCurrentStudentRoute(accessToken),
            getCurrentLearningPlan(accessToken),
        ]

        Promise.allSettled(requests).then((results) => {
            if (!active) {
                return
            }

            const resourceNames = [
                'onboarding',
                'diagnostic',
                'selection',
                'plan',
            ]

            const failures = results
                .map((result, index) =>
                    result.status === 'rejected'
                        ? resourceNames[index]
                        : null,
                )
                .filter(Boolean)

            const values = results.map((result) =>
                result.status === 'fulfilled'
                    ? result.value
                    : null,
            )

            setData({
                onboarding: values[0],
                diagnostic: values[1],
                selection: values[2],
                plan: values[3],
            })

            setFailedResources(failures)
            setLoading(false)
        })

        return () => {
            active = false
        }
    }, [accessToken, reloadKey])

    const onboarding = data?.onboarding?.onboarding

    const diagnostic = data?.diagnostic

    const selectedRoute =
        data?.selection?.state === 'selected'
            ? data.selection.selection
            : null

    const recommendedPlan = data?.plan?.plan

    const technologies = Array.isArray(
        onboarding?.technologyInterestKeys,
    )
        ? onboarding.technologyInterestKeys
        : []

    const diagnosticCompleted =
        diagnostic?.state === 'completed'

    const diagnosticLevel = diagnosticCompleted
        ? diagnostic?.result?.resultingDifficulty?.name
        : null

    const diagnosticScore = diagnosticCompleted
        ? diagnostic?.result?.overallScore
        : null

    const failed = (resource) =>
        failedResources.includes(resource)

    const handleRetry = () => {
        setLoading(true)
        setData(null)
        setFailedResources([])
        setReloadKey((current) => current + 1)
    }

    return (
        <section className="profile-learning">
            <div className="profile-learning__main">
                <article className="profile-learning__card">
                    <div className="profile-learning__header">
                        <h2>Mi aprendizaje</h2>

                        <p>
                            Consulta la información que
                            proporcionaste en «Acerca de ti».
                        </p>
                    </div>

                    {!accessToken && (
                        <p role="alert">
                            Necesitas iniciar sesión para
                            consultar tus preferencias.
                        </p>
                    )}

                    {loading && accessToken && (
                        <p role="status">
                            Cargando tus preferencias de aprendizaje...
                        </p>
                    )}

                    {!loading && failedResources.length > 0 && (
                        <div
                            className="profile-learning__notice"
                            role="alert"
                        >
                            <p>
                                No fue posible recuperar toda tu
                                información de aprendizaje.
                            </p>

                            <button
                                type="button"
                                onClick={handleRetry}
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {!loading && !onboarding && !failed('onboarding') && (
                        <p className="profile-learning__notice">
                            Todavía no has completado «Acerca de ti».
                            Puedes comenzar desde el onboarding.
                        </p>
                    )}

                    {!loading && onboarding && (
                        <>
                            <div className="profile-learning__field">
                                <span className="profile-learning__read-label">
                                    Objetivo de aprendizaje
                                </span>

                                <p className="profile-learning__read-value">
                                    {learningGoals[onboarding.learningGoal]
                                        ?? 'No registrado'}
                                </p>
                            </div>

                            <div className="profile-learning__grid-two">
                                <div className="profile-learning__field">
                                    <span className="profile-learning__read-label">
                                        Dedicación semanal
                                    </span>

                                    <p className="profile-learning__read-value">
                                        {weeklyCommitments[
                                            onboarding.weeklyTimeCommitment
                                        ] ?? 'No registrada'}
                                    </p>
                                </div>

                                <div className="profile-learning__field">
                                    <span className="profile-learning__read-label">
                                        Estilo de aprendizaje
                                    </span>

                                    <p className="profile-learning__read-value">
                                        {learningStyles[
                                            onboarding.learningStyle
                                        ] ?? 'No registrado'}
                                    </p>
                                </div>
                            </div>

                            <div className="profile-learning__field">
                                <span className="profile-learning__read-label">
                                    Tecnologías de interés
                                </span>

                                <div className="profile-learning__tech-list">
                                    {technologies.map((key) => (
                                        <span
                                            key={key}
                                            className="profile-learning__tech-chip profile-learning__tech-chip--active"
                                        >
                                            <span
                                                className="profile-learning__chip-indicator profile-learning__chip-indicator--active"
                                                aria-hidden="true"
                                            >
                                                ✓
                                            </span>

                                            <span>
                                                {technologyNames[key] ?? key}
                                            </span>
                                        </span>
                                    ))}

                                    {technologies.length === 0 && (
                                        <p>No hay tecnologías registradas.</p>
                                    )}
                                </div>
                            </div>

                            <div className="profile-learning__field">
                                <span className="profile-learning__read-label">
                                    Lenguaje de programación
                                </span>

                                <p className="profile-learning__read-value">
                                    {onboarding.language?.name
                                        ?? 'No registrado'}
                                </p>
                            </div>

                            {onboarding.projectIdea && (
                                <div className="profile-learning__field">
                                    <span className="profile-learning__read-label">
                                        Proyecto que te gustaría crear
                                    </span>

                                    <p className="profile-learning__read-value">
                                        {onboarding.projectIdea}
                                    </p>
                                </div>
                            )}

                            <p className="profile-learning__read-note">
                                <FiInfo aria-hidden="true" />
                                Estas respuestas se recuperan de tu
                                perfil inicial. No se modifican
                                desde esta sección.
                            </p>
                        </>
                    )}
                </article>
            </div>

            <aside className="profile-learning__sidebar">
                <article className="profile-learning__side-card">
                    <div className="profile-learning__side-title">
                        <FiBox aria-hidden="true" />
                        <h3>Tu ruta elegida</h3>
                    </div>

                    <div className="profile-learning__route-tags">
                        <span className="profile-learning__route-tag">
                            {loading
                                ? 'Consultando ruta...'
                                : failed('selection')
                                    ? 'Ruta no disponible'
                                    : selectedRoute
                                        ? `Ruta ${getSpecializationName(
                                            selectedRoute.specializationKey,
                                        )}`
                                        : 'Ninguna ruta elegida'}
                        </span>
                    </div>

                    <p className="profile-learning__progress-text">
                        {selectedRoute
                            ? 'Esta es la especialización que elegiste.'
                            : 'Puedes explorar las especializaciones disponibles.'}
                    </p>

                    <Link
                        className="profile-learning__outline-action"
                        to="/routes"
                    >
                        <FiRepeat aria-hidden="true" />
                        <span>Explorar rutas</span>
                    </Link>
                </article>

                <article className="profile-learning__side-card">
                    <div className="profile-learning__side-title">
                        <FiBookOpen aria-hidden="true" />
                        <h3>Recomendación de OpenAI</h3>
                    </div>

                    <p className="profile-learning__progress-text">
                        {loading
                            ? 'Consultando recomendación...'
                            : failed('plan')
                                ? 'No fue posible consultar el plan.'
                                : recommendedPlan
                                    ? getSpecializationName(
                                        recommendedPlan.specializationKey,
                                    )
                                    : 'Todavía no hay un plan generado.'}
                    </p>

                    <Link
                        className="profile-learning__link-action"
                        to="/recommended-plan"
                    >
                        <span>Ver plan recomendado</span>
                        <FiArrowRight aria-hidden="true" />
                    </Link>
                </article>

                <article className="profile-learning__side-card">
                    <div className="profile-learning__side-title">
                        <FiBarChart2 aria-hidden="true" />
                        <h3>Diagnóstico inicial</h3>
                    </div>

                    <div className="profile-learning__diagnostic-box">
                        <div className="profile-learning__diagnostic-column">
                            <span className="profile-learning__diagnostic-label">
                                Nivel detectado
                            </span>

                            <strong className="profile-learning__diagnostic-value">
                                {loading
                                    ? 'Consultando...'
                                    : failed('diagnostic')
                                        ? 'No disponible'
                                        : diagnosticLevel ?? 'Pendiente'}
                            </strong>
                        </div>

                        {typeof diagnosticScore === 'number' && (
                            <div className="profile-learning__diagnostic-column">
                                <span className="profile-learning__diagnostic-label">
                                    Puntuación obtenida
                                </span>

                                <strong className="profile-learning__diagnostic-value">
                                    {diagnosticScore}%
                                </strong>
                            </div>
                        )}
                    </div>

                    <Link
                        className="profile-learning__link-action"
                        to={
                            diagnosticCompleted
                                ? '/diagnostic/results'
                                : '/diagnostic'
                        }
                    >
                        <span>
                            {diagnosticCompleted
                                ? 'Ver resultados'
                                : 'Ir al diagnóstico'}
                        </span>

                        <FiArrowRight aria-hidden="true" />
                    </Link>
                </article>

                <article className="profile-learning__tip-card">
                    <img
                        src="/images/learn2code-mascot-laptop-transparent.png"
                        alt="Mascota de Learn2Code con laptop"
                        className="profile-learning__tip-mascot"
                    />

                    <div className="profile-learning__tip-content">
                        <h4>Tu aprendizaje es personalizado</h4>

                        <p>
                            Tus intereses y diagnóstico ayudan
                            a construir un plan de aprendizaje
                            adaptado a ti.
                        </p>
                    </div>
                </article>

                <article className="profile-learning__info-note">
                    <FiInfo aria-hidden="true" />

                    <p>
                        La ruta recomendada y la ruta elegida
                        son datos diferentes. Consultar este
                        perfil no modifica ninguna de ellas.
                    </p>
                </article>
            </aside>
        </section>
    )
}

import { useEffect, useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import {
    getCurrentLearningPlan,
    generateLearningPlan,
} from '../api/learning-paths.api.js';

import {
    FiArrowRight,
    FiBookOpen,
    FiCheckCircle,
    FiClock,
    FiCompass,
    FiFlag,
    FiTarget,
} from 'react-icons/fi';

import { getCurrentDiagnostic } from '../api/diagnostic.api.js';

import {
    getCurrentStudentOnboarding,
} from '../api/onboarding.api.js';

import { getAuthErrorMessage } from '../auth/auth-error-message.js';

import { useAuth } from '../auth/useAuth.js';

import { LearningSidebar } from '../components/LearningSidebar.jsx';

import { LearningTopbar } from '../components/LearningTopbar.jsx';

import './RecommendedPlanPage.css';

const ASSET_PATH = '/images/plan-recomendado';
const learningGoals = {
    career_preparation: 'Conseguir trabajo como desarrollador',
    professional_growth: 'Mejorar mis habilidades profesionales',
    build_product: 'Crear mis propios proyectos',
    personal_interest: 'Aprender por interés personal',
    programming_fundamentals: 'Aprender fundamentos de programación',
    web_development: 'Aprender desarrollo web',
    automation: 'Aprender automatización',
    academic_support: 'Reforzar mis estudios',
    other: 'Desarrollar nuevas habilidades',
};
const weeklyCommitments = {
    less_than_5: 'Menos de 5 horas',
    five_to_ten: '5 a 10 horas',
    ten_to_twenty: '10 a 20 horas',
    more_than_twenty: 'Más de 20 horas',
};
const specializationLabels = {
    frontend: 'Desarrollo Frontend',
    backend: 'Desarrollo Backend',
    fullstack: 'Desarrollo Full Stack',
    devops: 'DevOps',
};
export function RecommendedPlanPage() {
    const { accessToken, user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const [planData, setPlanData] = useState(null);
    const [planLoading, setPlanLoading] = useState(false);
    const [planError, setPlanError] = useState('');
    const [planReloadKey, setPlanReloadKey] = useState(0);
    useEffect(() => {
        let active = true;
        Promise.all([
            getCurrentDiagnostic(accessToken),
            getCurrentStudentOnboarding(accessToken),
        ])
            .then(([diagnostic, onboarding]) => {
                if (!active) {
                    return;
                }
                setData({ diagnostic, onboarding });
                setError('');
            })
            .catch((requestError) => {
                if (!active) {
                    return;
                }
                setError(getAuthErrorMessage(requestError));
            });
        return () => {
            active = false;
        };
    }, [accessToken, reloadKey]);
    const diagnostic = data?.diagnostic;
    const profile = data?.onboarding?.onboarding;
    const hasCompletedDiagnostic =
        diagnostic?.state === 'completed'
        && data?.onboarding?.state === 'completed';
    // El plan se genera automáticamente al llegar al paso 4.
    // Si ya existe, solo se consulta; no se vuelve a llamar a OpenAI.
    useEffect(() => {
        if (!hasCompletedDiagnostic || !accessToken) {
            return undefined;
        }
        let active = true;
        const loadPlan = async () => {
            setPlanLoading(true);
            setPlanError('');
            setPlanData(null);
            try {
                const current = await getCurrentLearningPlan(accessToken);
                const result = current.state === 'not_generated'
                    ? await generateLearningPlan(accessToken)
                    : current;
                if (!result.plan) {
                    throw new Error(
                        'No fue posible obtener la recomendación personalizada.',
                    );
                }
                if (active) {
                    setPlanData(result);
                }
            } catch (requestError) {
                if (active) {
                    setPlanError(
                        requestError?.message
                        ?? 'No se pudo preparar tu ruta personalizada.',
                    );
                }
            } finally {
                if (active) {
                    setPlanLoading(false);
                }
            }
        };
        loadPlan();
        return () => {
            active = false;
        };
    }, [accessToken, hasCompletedDiagnostic, planReloadKey]);
    const plan = planData?.plan;
    const specializationName = plan
        ? (specializationLabels[plan.specializationKey] ?? plan.title)
        : 'Preparando tu ruta personalizada...';

    const firstName =
        user?.fullName?.trim().split(/\s+/)[0]
        || 'Estudiante';
    const level =
        diagnostic?.result?.resultingDifficulty?.name
        || 'Pendiente';
    const language = profile?.language?.name
        || 'Programación';
    const goal =
        learningGoals[profile?.learningGoal]
        || 'Aprender programación';
    const weeklyTime =
        weeklyCommitments[profile?.weeklyTimeCommitment]
        || 'Por definir';
    return (
        <main className="onboarding-page recommended-plan-page">
            <LearningSidebar
                activeItem="home"
                mascotSrc={`${ASSET_PATH}/dragon-laptop-512.webp`}
                mascotAlt="Mascota de Learn2Code utilizando una laptop"
                messageTitle="¡Tu próxima aventura!"
                message="Cada paso te acercará a tus objetivos de aprendizaje."
            />
            <section className="onboarding-content">
                <LearningTopbar
                    activeStep={hasCompletedDiagnostic ? 4 : 2}
                    userName={firstName}
                />
                <div className="recommended-plan-content">
                    <header className="rp-heading">
                        <h1>
                            Tu plan recomendado
                            <span aria-hidden="true"> 🎉</span>
                        </h1>
                        <p>
                            Tu próximo paso se construirá
                            según tu diagnóstico, tus metas
                            y el tiempo que tienes disponible.
                        </p>
                    </header>
                    {!data && !error && (
                        <section className="rp-card">
                            <p role="status">
                                Consultando tu diagnóstico
                                y tus preferencias...
                            </p>
                        </section>
                    )}
                    {error && (
                        <section className="rp-card">
                            <p className="form-error" role="alert">
                                {error}
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setData(null);
                                    setError('');
                                    setReloadKey((value) => value + 1);
                                }}
                            >
                                Reintentar
                            </button>
                        </section>
                    )}
                    {data && !hasCompletedDiagnostic && (
                        <section className="rp-card rp-empty">
                            <FiTarget aria-hidden="true" />
                            <h2>
                                Primero necesitamos tu diagnóstico
                            </h2>
                            <p>
                                Cuando termines la evaluación,
                                podremos preparar una ruta
                                acorde con tus resultados.
                            </p>
                            <Link to="/diagnostic">
                                Ir al diagnóstico
                                <FiArrowRight aria-hidden="true" />
                            </Link>
                        </section>
                    )}
                    {hasCompletedDiagnostic && (
                        <>
                            <div className="rp-grid">
                                <div className="rp-main-column">
                                    <section className="rp-card rp-hero">
                                        <div className="rp-hero-intro">
                                            <div className="rp-hero-copy">
                                                <span className="rp-overline">
                                                    Tu ruta recomendada
                                                </span>
                                                <div className="rp-route-name">
                                                    <FiCompass
                                                        className="rp-route-placeholder-icon"
                                                        aria-hidden="true"
                                                    />
                                                    <h2>
                                                        {specializationName}
                                                    </h2>
                                                    <span className="rp-level">
                                                        {level}
                                                    </span>
                                                </div>
                                                <div className="rp-goal">
                                                    <FiTarget aria-hidden="true" />
                                                    <div>
                                                        <small>
                                                            Objetivo principal
                                                        </small>
                                                        <strong>{goal}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                            <img
                                                className="rp-hero-dragon"
                                                src={`${ASSET_PATH}/dragon-bienvenida-512.webp`}
                                                alt="Dragón de Learn2Code celebrando"
                                            />
                                        </div>
                                        <div className="rp-hero-metrics">
                                            <div>
                                                <FiClock aria-hidden="true" />
                                                <span>Dedicación semanal</span>
                                                <strong>{weeklyTime}</strong>
                                            </div>
                                            <div>
                                                <FiCheckCircle aria-hidden="true" />
                                                <span>Nivel diagnosticado</span>
                                                <strong>{level}</strong>
                                            </div>
                                            <div>
                                                <FiFlag aria-hidden="true" />
                                                <span>Preguntas evaluadas</span>
                                                <strong>
                                                    {diagnostic.assessment?.questionCount ?? 0}
                                                </strong>
                                            </div>
                                        </div>
                                        <div className="rp-explanation">
                                            <strong>
                                                ¿Por qué esta área es adecuada para ti?
                                            </strong>
                                            <p>
                                                {plan?.reason ?? (
                                                    planLoading
                                                        ? 'Analizando tus metas y resultados con IA...'
                                                        : 'La recomendación aún no está disponible.'
                                                )}
                                            </p>
                                        </div>
                                    </section>
                                    <section className="rp-topics">
                                        <h2>
                                            <FiTarget aria-hidden="true" />
                                            Etapas de tu ruta recomendada
                                        </h2>
                                        <p>
                                            Módulos ordenados según tu diagnóstico,
                                            intereses y dedicación semanal.
                                        </p>
                                        <div className="rp-topic-grid">
                                            {plan?.steps?.map((step, index) => (
                                                <article
                                                    className="rp-card rp-topic"
                                                    key={step.id ?? `step-${index + 1}`}
                                                >
                                                    <span className={`rp-topic-index rp-topic-index-${index + 1}`}>
                                                        {index + 1}
                                                    </span>
                                                    <h3>{step.title}</h3>
                                                    <p>{step.description}</p>
                                                </article>
                                            ))}
                                        </div>
                                        {!plan && (
                                            <p role="status">
                                                {planLoading
                                                    ? 'Generando módulos personalizados...'
                                                    : 'Los módulos estarán disponibles al cargar el plan.'}
                                            </p>
                                        )}
                                    </section>
                                    <section className="rp-card rp-upcoming">
                                        <h2>
                                            <FiBookOpen aria-hidden="true" />
                                            Tu primer módulo
                                        </h2>
                                        <div className="rp-upcoming-body">
                                            <img
                                                src={`${ASSET_PATH}/miniatura-portafolio.svg`}
                                                alt=""
                                            />
                                            <p>
                                                {plan?.steps?.[0]
                                                    ? `${plan.steps[0].title}: ${plan.steps[0].description}`
                                                    : 'Preparando la primera etapa de aprendizaje.'}
                                            </p>
                                        </div>
                                    </section>
                                </div>
                                <aside
                                    className="rp-side-column"
                                    aria-label="Resumen de tu plan"
                                >
                                    <section className="rp-card rp-summary">
                                        <h2>Resumen de tu plan</h2>
                                        <dl>
                                            <div>
                                                <dt>Especialización</dt>
                                                <dd>{plan ? specializationName : 'Preparando recomendación...'}</dd>
                                            </div>
                                            <div>
                                                <dt>Lenguaje de práctica</dt>
                                                <dd>{language}</dd>
                                            </div>
                                            <div>
                                                <dt>Nivel</dt>
                                                <dd>{level}</dd>
                                            </div>
                                            <div>
                                                <dt>Objetivo</dt>
                                                <dd>{goal}</dd>
                                            </div>
                                            <div>
                                                <dt>Dedicación semanal</dt>
                                                <dd>{weeklyTime}</dd>
                                            </div>
                                            <div>
                                                <dt>Evaluación</dt>
                                                <dd>
                                                    {diagnostic.result?.overallScore ?? 0}%
                                                </dd>
                                            </div>
                                        </dl>
                                    </section>
                                    <section className="rp-card rp-companion">
                                        <img
                                            src={`${ASSET_PATH}/dragon-laptop-512.webp`}
                                            alt="Mascota de Learn2Code"
                                        />
                                        <div>
                                            <h2>
                                                ¡Te acompañaré en cada paso!
                                            </h2>
                                            <p>
                                                Aprenderás a tu ritmo
                                                con práctica y proyectos.
                                            </p>
                                        </div>
                                    </section>
                                    <section className="rp-card rp-weekly">
                                        <h2>
                                            <FiClock aria-hidden="true" />
                                            Tu plan semanal
                                        </h2>
                                        <strong>{weeklyTime}</strong>
                                        <p>
                                            {plan
                                                ? `Duración estimada: ${plan.estimatedWeeks} semanas. Basada en la disponibilidad que elegiste.`
                                                : 'Calculando la duración personalizada de tu plan.'}
                                        </p>
                                    </section>
                                </aside>
                            </div>
                            <footer className="rp-confirm rp-card">
                                <div>
                                    <h2>
                                        {plan
                                            ? 'Tu recomendación está lista'
                                            : 'Preparando tu plan recomendado'}
                                    </h2>

                                    <p>
                                        {plan
                                            ? 'Esta es una propuesta personalizada. Podrás explorar otras especializaciones antes de elegir tu ruta de aprendizaje.'
                                            : 'Estamos analizando tus objetivos y los resultados de tu diagnóstico.'}
                                    </p>

                                    {planError && (
                                        <p className="form-error" role="alert">
                                            {planError}
                                        </p>
                                    )}
                                </div>

                                {plan && (
                                    <button
                                        type="button"
                                        onClick={() => navigate('/start-learning')}
                                    >
                                        Continuar a ¡A aprender!
                                        <FiArrowRight aria-hidden="true" />
                                    </button>
                                )}

                                {planError && !plan && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPlanReloadKey((value) => value + 1)
                                        }
                                    >
                                        Reintentar
                                    </button>
                                )}
                            </footer>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}


import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';

import {
    FiArrowRight,
    FiBookOpen,
    FiCheckCircle,
    FiClock,
    FiCompass,
    FiFlag,
    FiLayers,
    FiMap,
    FiTarget,
    FiTrendingUp,
    FiZap,
} from 'react-icons/fi';

import {
    getCurrentLearningPlan,
} from '../api/learning-paths.api.js';

import {
    getCurrentDiagnostic,
} from '../api/diagnostic.api.js';

import {
    getCurrentStudentOnboarding,
} from '../api/onboarding.api.js';

import { useAuth } from '../auth/useAuth.js';

import {
    LearningSidebar,
} from '../components/LearningSidebar.jsx';

import {
    LearningTopbar,
} from '../components/LearningTopbar.jsx';

import './StartLearningPage.css';

const IMAGE_ROOT = '/images/plan-recomendado';

const specializations = {
    frontend: {
        name: 'Desarrollo Frontend',
        description:
            'Construye interfaces y experiencias web interactivas.',
    },
    backend: {
        name: 'Desarrollo Backend',
        description:
            'Desarrolla APIs, servidores y bases de datos.',
    },
    fullstack: {
        name: 'Desarrollo Full Stack',
        description:
            'Aprende a desarrollar aplicaciones completas.',
    },
    devops: {
        name: 'DevOps',
        description:
            'Explora automatización, infraestructura y despliegues.',
    },
};

const weeklyTimeLabels = {
    less_than_5: 'Menos de 5 horas',
    five_to_ten: '5 a 10 horas',
    ten_to_twenty: '10 a 20 horas',
    more_than_twenty: 'Más de 20 horas',
};

export function StartLearningPage() {
    const { accessToken, user } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retryKey, setRetryKey] = useState(0);

    const [showAlternatives, setShowAlternatives] =
        useState(false);

    const firstName =
        user?.fullName?.trim().split(/\s+/)[0]
        || 'estudiante';

    useEffect(() => {
        if (showAlternatives) {
            document
                .getElementById('sl-alternatives')
                ?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
        }
    }, [showAlternatives]);

    useEffect(() => {
        let active = true;

        Promise.all([
            getCurrentLearningPlan(accessToken),
            getCurrentDiagnostic(accessToken),
            getCurrentStudentOnboarding(accessToken),
        ])
            .then(([recommendation, diagnostic, onboarding]) => {
                if (!active) {
                    return;
                }

                setData({
                    recommendation,
                    diagnostic,
                    onboarding,
                });

                setError('');
            })
            .catch((requestError) => {
                if (!active) {
                    return;
                }

                setError(
                    requestError?.message
                    ?? 'No fue posible consultar tus datos.',
                );
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [accessToken, retryKey]);

    const plan = data?.recommendation?.plan;

    const diagnostic = data?.diagnostic;

    const profile =
        data?.onboarding?.onboarding;

    const level =
        diagnostic?.result?.resultingDifficulty?.name
        ?? 'Por definir';

    const weeklyTime =
        weeklyTimeLabels[profile?.weeklyTimeCommitment]
        ?? 'Por definir';

    const suggestedRoute =
        specializations[plan?.specializationKey]?.name
        ?? plan?.title
        ?? 'Sin recomendación';

    const firstModule = plan?.steps?.[0];

    return (
        <main className="onboarding-page start-learning-page">

            <LearningSidebar
                activeItem="home"
                mascotSrc={`${IMAGE_ROOT}/dragon-laptop-512.webp`}
                mascotAlt="Dragón de Learn2Code con laptop"
                messageTitle="¡Tu aventura comienza!"
                message="Aprende a tu ritmo y descubre todo lo que puedes crear."
            />

            <section className="onboarding-content">

                <LearningTopbar
                    activeStep={5}
                    userName={firstName}
                />

                <div className="sl-content">

                    <header className="sl-heading">
                        <h1>
                            ¡Todo listo, {firstName}! Comienza a aprender
                            <span aria-hidden="true"> 🎉</span>
                        </h1>
                        <p>
                            Tu diagnóstico está completo y tienes una ruta
                            recomendada. Ahora comienza tu aventura
                            para convertirte en desarrollador.
                        </p>
                    </header>

                    {loading && (
                        <section className="sl-card">
                            <p role="status">
                                Preparando tu bienvenida...
                            </p>
                        </section>
                    )}

                    {!loading && error && (
                        <section className="sl-card">
                            <p role="alert">{error}</p>

                            <button
                                type="button"
                                className="sl-button sl-button-primary"
                                onClick={() => {
                                    setLoading(true);
                                    setError('');
                                    setRetryKey((value) => value + 1);
                                }}
                            >
                                Reintentar
                            </button>
                        </section>
                    )}

                    {!loading && !error && !plan && (
                        <section className="sl-card">
                            <h2>
                                Primero revisemos tu recomendación
                            </h2>

                            <p>
                                Para mostrar tu punto de partida
                                necesitamos tu plan recomendado.
                            </p>

                            <Link
                                className="sl-button sl-button-primary"
                                to="/recommended-plan"
                            >
                                Ver mi plan recomendado
                            </Link>
                        </section>
                    )}

                    {!loading && !error && plan && (
                        <>

                            {/* BIENVENIDA PRINCIPAL */}


                            {/* BIENVENIDA PRINCIPAL — DISEÑO DEL MOCKUP */}

                            <div className="sl-top-grid">

                                <section className="sl-card sl-mockup-hero">

                                    <div className="sl-mockup-hero-copy">

                                        <span className="sl-mockup-badge">
                                            🎉 ¡Bienvenido a Learn2Code!
                                        </span>

                                        <h2>
                                            Tu viaje comienza ahora
                                            <span aria-hidden="true"> 🚀</span>
                                        </h2>

                                        <p className="sl-mockup-intro">
                                            Hemos preparado una recomendación
                                            personalizada para que aprendas,
                                            construyas proyectos y avances
                                            hacia tus metas paso a paso.
                                        </p>

                                        <div className="sl-mockup-metrics">

                                            <div className="sl-mockup-metric">
                                                <FiCompass aria-hidden="true" />

                                                <span>
                                                    <small>Ruta sugerida</small>
                                                    <strong>{suggestedRoute}</strong>
                                                </span>
                                            </div>

                                            <div className="sl-mockup-metric">
                                                <FiTrendingUp aria-hidden="true" />

                                                <span>
                                                    <small>Nivel detectado</small>
                                                    <strong>{level}</strong>
                                                </span>
                                            </div>

                                            <div className="sl-mockup-metric">
                                                <FiBookOpen aria-hidden="true" />

                                                <span>
                                                    <small>Siguiente paso</small>
                                                    <strong>
                                                        {firstModule
                                                            ? 'Módulo 1'
                                                            : 'Elegir una ruta'}
                                                    </strong>
                                                </span>
                                            </div>

                                        </div>

                                        <ul className="sl-mockup-benefits">

                                            <li>
                                                <span aria-hidden="true">♧</span>
                                                Aprende con proyectos y
                                                experiencias prácticas.
                                            </li>

                                            <li>
                                                <span aria-hidden="true">🏆</span>
                                                Desarrolla nuevas habilidades
                                                y supera desafíos.
                                            </li>

                                            <li>
                                                <span aria-hidden="true">🎉</span>
                                                Descubre nuevas oportunidades
                                                mientras avanzas.
                                            </li>

                                        </ul>

                                    </div>

                                    <img
                                        className="sl-mockup-dragon"
                                        src={`${IMAGE_ROOT}/dragon-bienvenida-512.webp`}
                                        alt="Dragón de Learn2Code celebrando"
                                    />

                                </section>

                                {/* TARJETA TU PRIMER DÍA */}

                                <section className="sl-card sl-mockup-checklist">

                                    <header className="sl-mockup-checklist-heading">

                                        <FiFlag aria-hidden="true" />

                                        <div>
                                            <h2>Tu primer día</h2>

                                            <p>
                                                4 pasos para arrancar con todo
                                            </p>
                                        </div>

                                    </header>

                                    <ol className="sl-mockup-checks">

                                        <li>
                                            <span className="sl-mockup-step-number">
                                                1
                                            </span>

                                            <div>
                                                <strong>
                                                    Revisa tu ruta de aprendizaje
                                                </strong>

                                                <small>
                                                    Conoce tu plan y los módulos
                                                    que podrías estudiar.
                                                </small>
                                            </div>

                                            <span
                                                className="sl-mockup-check-circle"
                                                aria-hidden="true"
                                            />
                                        </li>

                                        <li>
                                            <span className="sl-mockup-step-number">
                                                2
                                            </span>

                                            <div>
                                                <strong>
                                                    Explora las especializaciones
                                                </strong>

                                                <small>
                                                    Compara las rutas disponibles
                                                    antes de elegir.
                                                </small>
                                            </div>

                                            <span
                                                className="sl-mockup-check-circle"
                                                aria-hidden="true"
                                            />
                                        </li>

                                        <li>
                                            <span className="sl-mockup-step-number">
                                                3
                                            </span>

                                            <div>
                                                <strong>
                                                    Elige tu ruta
                                                </strong>

                                                <small>
                                                    Decide qué especialización
                                                    quieres seguir.
                                                </small>
                                            </div>

                                            <span
                                                className="sl-mockup-check-circle"
                                                aria-hidden="true"
                                            />
                                        </li>

                                        <li>
                                            <span className="sl-mockup-step-number">
                                                4
                                            </span>

                                            <div>
                                                <strong>
                                                    Comienza tu primera lección
                                                </strong>

                                                <small>
                                                    Pon en práctica lo aprendido
                                                    cuando actives tu ruta.
                                                </small>
                                            </div>

                                            <span
                                                className="sl-mockup-check-circle"
                                                aria-hidden="true"
                                            />
                                        </li>

                                    </ol>

                                    <div className="sl-mockup-hint">
                                        <span aria-hidden="true">💡</span>

                                        <p>
                                            <strong>Consejo:</strong>
                                            {' '}
                                            Dedicar un poco de tiempo cada día
                                            marca la diferencia.
                                        </p>
                                    </div>

                                </section>

                            </div>

                            {/* PRIMER MÓDULO Y RUTAS */}


                            {/* SEGUNDA FILA: TRES TARJETAS */}

                            <div className="sl-feature-grid">

                                {/* 1. EMPIEZA AQUÍ */}

                                <section className="sl-card sl-lesson-card">

                                    <header className="sl-feature-heading">
                                        <FiZap aria-hidden="true" />

                                        <div>
                                            <h2>Empieza aquí</h2>
                                            <p>
                                                Tu primer paso en {suggestedRoute}
                                            </p>
                                        </div>
                                    </header>

                                    {firstModule ? (
                                        <>
                                            <div className="sl-lesson-content">

                                                <span className="sl-lesson-number">
                                                    1
                                                </span>

                                                <div className="sl-lesson-icon">
                                                    {plan.specializationKey === 'frontend' ? (
                                                        <img
                                                            src={`${IMAGE_ROOT}/tecnologia-javascript.svg`}
                                                            alt="JavaScript"
                                                        />
                                                    ) : (
                                                        <FiBookOpen aria-hidden="true" />
                                                    )}
                                                </div>

                                                <div className="sl-lesson-description">
                                                    <small>
                                                        Módulo 1 · Recomendado
                                                    </small>

                                                    <h3>{firstModule.title}</h3>

                                                    <p>
                                                        {firstModule.description}
                                                    </p>
                                                </div>

                                            </div>

                                            <div className="sl-lesson-details">

                                                <div>
                                                    <FiClock aria-hidden="true" />
                                                    <span>
                                                        <small>Ruta estimada</small>
                                                        <strong>
                                                            {plan.estimatedWeeks} semanas
                                                        </strong>
                                                    </span>
                                                </div>

                                                <div>
                                                    <FiTrendingUp aria-hidden="true" />
                                                    <span>
                                                        <small>Tu nivel</small>
                                                        <strong>{level}</strong>
                                                    </span>
                                                </div>

                                                <div>
                                                    <FiTarget aria-hidden="true" />
                                                    <span>
                                                        <small>Modalidad</small>
                                                        <strong>A tu ritmo</strong>
                                                    </span>
                                                </div>

                                            </div>

                                            <Link
                                                className="sl-lesson-button"
                                                to="/recommended-plan"
                                            >
                                                Revisar mi primera etapa
                                                <FiArrowRight aria-hidden="true" />
                                            </Link>
                                        </>
                                    ) : (
                                        <p>
                                            Tu plan todavía no tiene módulos disponibles.
                                        </p>
                                    )}

                                </section>

                                {/* 2. LO QUE PODRÁS EXPLORAR */}

                                <section className="sl-card sl-unlocks-card">

                                    <header className="sl-feature-heading">
                                        <FiLayers aria-hidden="true" />

                                        <div>
                                            <h2>Lo que podrás explorar</h2>
                                            <p>
                                                Herramientas para avanzar en tu aprendizaje
                                            </p>
                                        </div>
                                    </header>

                                    <div className="sl-unlock-list">

                                        <div className="sl-unlock-item">
                                            <span className="sl-unlock-icon orange">
                                                <FiBookOpen aria-hidden="true" />
                                            </span>

                                            <div>
                                                <strong>Módulos personalizados</strong>
                                                <small>
                                                    Contenidos según tu nivel y objetivos
                                                </small>
                                            </div>
                                        </div>

                                        <div className="sl-unlock-item">
                                            <span className="sl-unlock-icon blue">
                                                <FiZap aria-hidden="true" />
                                            </span>

                                            <div>
                                                <strong>Desafíos y ejercicios</strong>
                                                <small>
                                                    Pon a prueba tus conocimientos
                                                </small>
                                            </div>
                                        </div>

                                        <div className="sl-unlock-item">
                                            <span className="sl-unlock-icon green">
                                                <FiTarget aria-hidden="true" />
                                            </span>

                                            <div>
                                                <strong>Proyectos prácticos</strong>
                                                <small>
                                                    Aplica lo aprendido en situaciones reales
                                                </small>
                                            </div>
                                        </div>

                                        <div className="sl-unlock-item">
                                            <span className="sl-unlock-icon purple">
                                                <FiCompass aria-hidden="true" />
                                            </span>

                                            <div>
                                                <strong>Rutas de especialización</strong>
                                                <small>
                                                    Explora diferentes áreas de desarrollo
                                                </small>
                                            </div>
                                        </div>

                                        <div className="sl-unlock-item">
                                            <span className="sl-unlock-icon red">
                                                <FiCheckCircle aria-hidden="true" />
                                            </span>

                                            <div>
                                                <strong>Seguimiento de aprendizaje</strong>
                                                <small>
                                                    Consulta tus avances cuando comiences
                                                </small>
                                            </div>
                                        </div>

                                    </div>

                                </section>

                                {/* 3. TUS METAS INICIALES */}

                                <section className="sl-card sl-target-card">

                                    <header className="sl-feature-heading">
                                        <FiTarget aria-hidden="true" />

                                        <div>
                                            <h2>Tus metas iniciales</h2>
                                            <p>
                                                Define tu objetivo y seguimiento
                                            </p>
                                        </div>
                                    </header>

                                    <div className="sl-target-panel">

                                        <div className="sl-target-time">
                                            <FiClock aria-hidden="true" />

                                            <div>
                                                <small>
                                                    Disponibilidad semanal
                                                </small>

                                                <strong>{weeklyTime}</strong>
                                            </div>
                                        </div>

                                        <div className="sl-target-progress">

                                            <div className="sl-target-progress-label">
                                                <span>
                                                    Seguimiento de tu ruta
                                                </span>

                                                <strong>
                                                    Sin iniciar
                                                </strong>
                                            </div>

                                            <div
                                                className="sl-target-track"
                                                aria-hidden="true"
                                            >
                                                <div className="sl-target-fill" />
                                            </div>

                                            <small>
                                                Comenzará cuando elijas
                                                tu especialización.
                                            </small>

                                        </div>

                                        <div className="sl-target-notice">
                                            <FiTarget aria-hidden="true" />

                                            <span>
                                                Podrás ajustar tus metas
                                                durante tu aprendizaje.
                                            </span>
                                        </div>

                                        <Link
                                            className="sl-target-button"
                                            to="/dashboard"
                                        >
                                            Ir a mi dashboard
                                        </Link>

                                    </div>

                                </section>

                            </div>

                            {/* TERCERA FILA: ATAJOS Y DASHBOARD */}

                            <div className="sl-dashboard-grid">

                                {/* ATAJOS RECOMENDADOS */}

                                <section className="sl-card sl-shortcuts-card">

                                    <header className="sl-feature-heading">
                                        <FiZap aria-hidden="true" />

                                        <div>
                                            <h2>Atajos recomendados</h2>
                                            <p>
                                                Accesos rápidos para ti
                                            </p>
                                        </div>
                                    </header>

                                    <div className="sl-shortcut-tiles">

                                        <Link to="/recommended-plan">
                                            <span className="sl-tile-icon purple">
                                                <FiCompass aria-hidden="true" />
                                            </span>
                                            <strong>Mi ruta</strong>
                                            <small>Recomendada</small>
                                        </Link>

                                        <Link to="/dashboard">
                                            <span className="sl-tile-icon green">
                                                <FiTrendingUp aria-hidden="true" />
                                            </span>
                                            <strong>Mi progreso</strong>
                                        </Link>

                                        <Link to="/exercises">
                                            <span className="sl-tile-icon blue">
                                                <FiZap aria-hidden="true" />
                                            </span>
                                            <strong>Práctica</strong>
                                            <small>Ejercicios</small>
                                        </Link>

                                        <Link to="/profile">
                                            <span className="sl-tile-icon violet">
                                                <FiBookOpen aria-hidden="true" />
                                            </span>
                                            <strong>Mi perfil</strong>
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowAlternatives((value) => !value)
                                            }
                                        >
                                            <span className="sl-tile-icon red">
                                                <FiMap aria-hidden="true" />
                                            </span>
                                            <strong>Explorar</strong>
                                            <small>Otras rutas</small>
                                        </button>

                                    </div>

                                </section>

                                {/* VISTA PREVIA DEL DASHBOARD */}

                                <section className="sl-card sl-dashboard-card">

                                    <div className="sl-dashboard-copy">

                                        <header className="sl-feature-heading">
                                            <FiTrendingUp aria-hidden="true" />

                                            <div>
                                                <h2>Tu dashboard te espera</h2>
                                                <p>
                                                    Un adelanto de tu panel principal
                                                </p>
                                            </div>
                                        </header>

                                        <ul className="sl-dashboard-benefits">
                                            <li>
                                                <FiCheckCircle aria-hidden="true" />
                                                Consulta tus resultados
                                            </li>

                                            <li>
                                                <FiCheckCircle aria-hidden="true" />
                                                Sigue tu progreso de aprendizaje
                                            </li>

                                            <li>
                                                <FiCheckCircle aria-hidden="true" />
                                                Accede a tus ejercicios
                                            </li>

                                            <li>
                                                <FiCheckCircle aria-hidden="true" />
                                                Revisa tu recomendación
                                            </li>
                                        </ul>

                                        <Link
                                            className="sl-dashboard-button"
                                            to="/dashboard"
                                        >
                                            Ir a mi dashboard
                                            <FiArrowRight aria-hidden="true" />
                                        </Link>

                                    </div>


                                    <div
                                        className="sl-dashboard-miniature"
                                        aria-label="Vista previa de tu dashboard"
                                    >
                                        <div className="sl-mini-window">
                                            <span />
                                            <span />
                                            <span />
                                        </div>

                                        <div className="sl-mini-layout">

                                            <aside className="sl-mini-sidebar">
                                                <strong>L2C</strong>

                                                <FiTrendingUp aria-hidden="true" />
                                                <FiBookOpen aria-hidden="true" />
                                                <FiTarget aria-hidden="true" />
                                            </aside>

                                            <div className="sl-mini-dashboard">

                                                <div className="sl-mini-greeting">
                                                    <strong>
                                                        ¡Hola, {firstName}! 👋
                                                    </strong>

                                                    <small>
                                                        Tu punto de partida
                                                    </small>
                                                </div>

                                                <div className="sl-mini-panels">

                                                    <div className="sl-mini-score-panel">

                                                        <span>Tu diagnóstico</span>

                                                        <div
                                                            className="sl-mini-score-ring"
                                                            style={{
                                                                '--sl-score': `${Math.max(
                                                                    0,
                                                                    Math.min(
                                                                        100,
                                                                        Number(
                                                                            diagnostic?.result
                                                                                ?.overallScore ?? 0
                                                                        )
                                                                    )
                                                                )
                                                                    }%`,
                                                            }}
                                                        >
                                                            <span>
                                                                {diagnostic?.result
                                                                    ?.overallScore ?? 0}%
                                                            </span>
                                                        </div>

                                                    </div>

                                                    <div className="sl-mini-level-panel">

                                                        <span>Nivel detectado</span>

                                                        <strong>{level}</strong>

                                                        <span>Ruta recomendada</span>

                                                        <strong>{suggestedRoute}</strong>

                                                    </div>

                                                </div>

                                                <div className="sl-mini-next">
                                                    <FiBookOpen aria-hidden="true" />

                                                    <div>
                                                        <small>Primer módulo sugerido</small>

                                                        <strong>
                                                            {firstModule?.title
                                                                ?? 'Por definir'}
                                                        </strong>
                                                    </div>

                                                </div>

                                            </div>
                                        </div>
                                    </div>

                                </section>

                            </div>

                            {/* EXPLORACIÓN DE RUTAS */}

                            {showAlternatives && (
                                <section
                                    id="sl-alternatives"
                                    className="sl-card sl-alternatives"
                                >

                                    <h2>
                                        Especializaciones que puedes explorar
                                    </h2>

                                    <p>
                                        Conocerlas no modifica tu
                                        recomendación ni selecciona
                                        una ruta automáticamente.
                                    </p>

                                    <div className="sl-alternative-grid">

                                        {Object.entries(
                                            specializations,
                                        ).map(([key, item]) => (
                                            <article
                                                className="sl-alternative"
                                                key={key}
                                            >
                                                <FiCompass
                                                    aria-hidden="true"
                                                />

                                                <h3>{item.name}</h3>

                                                <p>{item.description}</p>

                                                {key ===
                                                    plan.specializationKey
                                                    && (
                                                        <span>
                                                            Recomendada por IA
                                                        </span>
                                                    )}
                                            </article>
                                        ))}

                                    </div>

                                    <p className="sl-alternatives-note">
                                        La selección y activación de una
                                        especialización se implementará
                                        en el apartado Rutas.
                                    </p>

                                </section>
                            )}

                            {/* CIERRE */}

                            {/* FRANJA INFERIOR DEL MOCKUP */}

                            <footer className="sl-footer sl-final-banner">

                                <div className="sl-final-mascot">
                                    <img
                                        src={`${IMAGE_ROOT}/dragon-bienvenida-512.webp`}
                                        alt="Mascota de Learn2Code celebrando"
                                    />
                                </div>

                                <div className="sl-final-message">

                                    <h2>
                                        ¡Es tu momento de empezar!
                                        <span aria-hidden="true"> 🚀</span>
                                    </h2>

                                    <p>
                                        Cada lección te acercará a tus metas.
                                        Explora las rutas y elige la aventura
                                        que quieres comenzar.
                                    </p>

                                </div>

                                <Link
                                    className="sl-final-button"
                                    to="/routes"
                                >
                                    <FiCompass aria-hidden="true" />

                                    Explorar rutas

                                    <FiArrowRight aria-hidden="true" />
                                </Link>

                            </footer>


                        </>
                    )}

                </div>
            </section>
        </main>
    );
}

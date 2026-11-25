
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
    FiAward,
    FiArrowRight,
    FiShield,
    FiCheckCircle,
    FiClock,
    FiLayers,
    FiPackage,
    FiStar,
} from 'react-icons/fi';

import {
    SiHtml5,
    SiJavascript,
    SiReact,
    SiNodedotjs,
    SiExpress,
    SiPostgresql,
    SiDocker,
    SiKubernetes,
    SiGithubactions,
} from 'react-icons/si';

import { getCurrentDiagnostic } from '../api/diagnostic.api.js';
import {
    getCurrentStudentOnboarding,
} from '../api/onboarding.api.js';

import { useAuth } from '../auth/useAuth.js';
import { getCurrentLearningPlan } from '../api/learning-paths.api.js';
import {
    getCurrentStudentRoute,
    selectStudentRoute,
} from '../api/student-routes.api.js';
import { LearningSidebar } from '../components/LearningSidebar.jsx';
import { ProfileTopbar } from '../components/ProfileTopbar.jsx';

import { useStudentStreak } from '../hooks/useStudentStreak.js';

import { specializations, routeVisualContent } from './route-specializations.js';

import './dashboard.css';
import './RoutesPage.css';

const IMAGE_ROOT = '/images/rutas';

const technologyBrands = {
    HTML: {
        Icon: SiHtml5,
        color: '#E34F26',
    },
    JavaScript: {
        Icon: SiJavascript,
        color: '#D4B900',
    },
    React: {
        Icon: SiReact,
        color: '#149ECA',
    },
    'Node.js': {
        Icon: SiNodedotjs,
        color: '#5FA04E',
    },
    Express: {
        Icon: SiExpress,
        color: '#111827',
    },
    PostgreSQL: {
        Icon: SiPostgresql,
        color: '#4169E1',
    },
    Docker: {
        Icon: SiDocker,
        color: '#2496ED',
    },
    Kubernetes: {
        Icon: SiKubernetes,
        color: '#326CE5',
    },
    'GitHub Actions': {
        Icon: SiGithubactions,
        color: '#2088FF',
    },
};



const routeFooterContent = {
    frontend: {
        Icon: FiStar,
        text: 'Para crear interfaces web interactivas',
    },
    backend: {
        Icon: FiLayers,
        text: 'Para explorar la lógica y las bases de datos',
    },
    fullstack: {
        Icon: FiPackage,
        text: 'Desarrollo de aplicaciones de extremo a extremo',
    },
    devops: {
        Icon: FiShield,
        text: 'Para aprender automatización y despliegue',
    },
};

const routeDisplayTitles = {
    frontend: 'Ruta Frontend',
    backend: 'Ruta Backend',
    fullstack: 'Ruta Full Stack',
    devops: 'Ruta DevOps',
};

const routeStageLabels = {
    frontend: [
        'Web',
        'React',
        'Estado',
        'Prácticas',
        'Proyecto',
    ],
    backend: [
        'Backend',
        'APIs Node',
        'Datos',
        'Seguridad',
        'Proyecto',
    ],
    fullstack: [
        'Frontend',
        'Backend',
        'Integrar',
        'Pruebas',
        'Proyecto',
    ],
    devops: [
        'DevOps',
        'Docker',
        'CI/CD',
        'Cloud',
        'Proyecto',
    ],
};



const learningGoalLabels = {
    career_preparation: 'Conseguir trabajo como desarrollador',
    professional_growth: 'Mejorar profesionalmente',
    build_product: 'Crear mis propios proyectos',
    personal_interest: 'Aprender por interés personal',
};

const getDiagnosticStrengths = (diagnostic) => {
    if (
        diagnostic?.state !== 'completed' ||
        !Array.isArray(diagnostic.questions)
    ) {
        return [];
    }

    const topics = new Map();

    for (const question of diagnostic.questions) {
        const name = question.topic?.name;
        const response = question.response;

        if (!name || response?.status !== 'evaluated') {
            continue;
        }

        const current = topics.get(name) ?? {
            name,
            total: 0,
            scoreSum: 0,
        };

        current.total += 1;

        const score = Number(response.score);
        current.scoreSum += Number.isFinite(score) ? score : 0;

        topics.set(name, current);
    }

    return [...topics.values()]
        .map((topic) => ({
            name: topic.name,
            percentage: Math.round(
                topic.scoreSum / topic.total,
            ),
        }))
        .filter((topic) => topic.percentage >= 70)
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 3);
};

export function RoutesPage() {
    const { accessToken, user, signOut } = useAuth();
    const navigate = useNavigate();

    const navigationStreak = useStudentStreak(accessToken);

    const [search, setSearch] = useState('');
    const [expandedRoute, setExpandedRoute] = useState(null);
    const [recommendedKey, setRecommendedKey] = useState(null);
    const [recommendedEstimatedWeeks, setRecommendedEstimatedWeeks] =
        useState(null);
    const [recommendationStatus, setRecommendationStatus] =
        useState('loading');
    const [retryCount, setRetryCount] = useState(0);

    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectionLoading, setSelectionLoading] = useState(true);
    const [selectionLoadError, setSelectionLoadError] = useState('');
    const [selectionRetryCount, setSelectionRetryCount] = useState(0);

    const [confirmingRouteKey, setConfirmingRouteKey] = useState(null);
    const [selectionSaving, setSelectionSaving] = useState(false);
    const [selectionActionError, setSelectionActionError] = useState('');
    const [selectionSuccess, setSelectionSuccess] = useState('');

    const [diagnosticData, setDiagnosticData] = useState(null);
    const [onboardingData, setOnboardingData] = useState(null);
    const [diagnosticStatus, setDiagnosticStatus] =
        useState('loading');
    const [onboardingStatus, setOnboardingStatus] =
        useState('loading');
    const [diagnosticRetryCount, setDiagnosticRetryCount] =
        useState(0);

    const firstName =
        user?.fullName?.trim().split(/\s+/)[0] || 'Estudiante';

    useEffect(() => {
        let active = true;

        if (!accessToken) {
            return undefined;
        }

        Promise.allSettled([
            getCurrentDiagnostic(accessToken),
            getCurrentStudentOnboarding(accessToken),
        ]).then(([diagnosticResult, onboardingResult]) => {
            if (!active) {
                return;
            }

            if (diagnosticResult.status === 'fulfilled') {
                setDiagnosticData(diagnosticResult.value);
                setDiagnosticStatus('success');
            } else {
                setDiagnosticData(null);
                setDiagnosticStatus('error');
            }

            if (onboardingResult.status === 'fulfilled') {
                setOnboardingData(onboardingResult.value);
                setOnboardingStatus('success');
            } else {
                setOnboardingData(null);
                setOnboardingStatus('error');
            }
        });

        return () => {
            active = false;
        };
    }, [accessToken, diagnosticRetryCount]);

    const diagnosticCompleted =
        diagnosticStatus === 'success' &&
        diagnosticData?.state === 'completed';

    const diagnosticStrengths = useMemo(
        () => getDiagnosticStrengths(diagnosticData),
        [diagnosticData],
    );

    const diagnosticLevel = diagnosticCompleted
        ? diagnosticData?.result?.resultingDifficulty?.name ??
        'No disponible'
        : 'Pendiente';

    const onboardingGoal =
        onboardingData?.onboarding?.learningGoal;

    const learningGoal = onboardingStatus === 'error'
        ? 'No disponible'
        : learningGoalLabels[onboardingGoal] ??
        'Sin objetivo registrado';

    useEffect(() => {
        let active = true;

        if (!accessToken) {
            return undefined;
        }

        getCurrentLearningPlan(accessToken)
            .then((response) => {
                if (!active) {
                    return;
                }

                const plan = response?.plan;

                setRecommendedKey(
                    plan?.specializationKey ?? null,
                );

                setRecommendedEstimatedWeeks(
                    Number.isInteger(plan?.estimatedWeeks) &&
                        plan.estimatedWeeks > 0
                        ? plan.estimatedWeeks
                        : null,
                );

                setRecommendationStatus('success');
            })
            .catch(() => {
                if (!active) {
                    return;
                }

                setRecommendedKey(null);
                setRecommendedEstimatedWeeks(null);
                setRecommendationStatus('error');
            });

        return () => {
            active = false;
        };
    }, [accessToken, retryCount]);

    useEffect(() => {
        let active = true;

        if (!accessToken) {
            return () => {
                active = false;
            };
        }

        getCurrentStudentRoute(accessToken)
            .then((response) => {
                if (!active) {
                    return;
                }

                setSelectedRoute(response?.selection ?? null);
                setSelectionLoadError('');
            })
            .catch((error) => {
                if (!active) {
                    return;
                }

                setSelectedRoute(null);
                setSelectionLoadError(
                    error?.message ??
                    'No fue posible consultar tu especialización elegida.',
                );
            })
            .finally(() => {
                if (active) {
                    setSelectionLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [accessToken, selectionRetryCount]);

    const filteredRoutes = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('es');

        if (!term) {
            return specializations;
        }

        return specializations.filter((route) => {
            const searchableText = [
                route.name,
                route.subtitle,
                route.description,
                ...route.technologies.map((tech) => tech.name),
            ]
                .join(' ')
                .toLocaleLowerCase('es');

            return searchableText.includes(term);
        });
    }, [search]);

    const handleConfirmRouteSelection = async (route) => {
        const selectableKeys = [
            'frontend',
            'backend',
            'fullstack',
            'devops',
        ];

        if (
            !accessToken ||
            selectionLoading ||
            selectionLoadError ||
            selectionSaving ||
            confirmingRouteKey !== route.key ||
            !selectableKeys.includes(route.key) ||
            selectedRoute?.specializationKey === route.key
        ) {
            return;
        }

        setSelectionSaving(true);
        setSelectionActionError('');
        setSelectionSuccess('');

        try {
            const response = await selectStudentRoute({
                accessToken,
                specializationKey: route.key,
            });

            if (
                response?.state !== 'selected' ||
                response?.selection?.specializationKey !== route.key
            ) {
                throw new Error(
                    'El servidor no confirmó la especialización seleccionada.',
                );
            }

            setSelectedRoute(response.selection);
            setConfirmingRouteKey(null);

            navigate(`/exercises/specializations/${route.key}`);
        } catch (error) {
            setSelectionActionError(
                error?.message ??
                'No fue posible guardar tu elección. Inténtalo nuevamente.',
            );
        } finally {
            setSelectionSaving(false);
        }
    };

    return (
        <main className="inicio-layout routes-page">
            <LearningSidebar
                variant="profile"
                activeItem="routes"
                streakDays={navigationStreak}
                mascotSrc={`${IMAGE_ROOT}/compartidos/dragon-laptop-512.webp`}
                mascotAlt="Dragón de Learn2Code con una laptop"
            />

            <section className="inicio-workspace">
                <ProfileTopbar
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Buscar rutas o tecnologías..."
                    streakDays={navigationStreak}
                    userName={user?.fullName?.trim() || firstName}
                    onLogout={signOut}
                    onOpenNotifications={() => {
                        navigate('/profile', {
                            state: {
                                openTab: 'notifications',
                            },
                        });
                    }}
                />

                <div className="routes-content">
                    <section className="routes-heading-layout">
                        <div className="routes-heading-copy">
                            <h1>
                                Selecciona tu ruta de aprendizaje
                            </h1>

                            <p>
                                Elige la ruta que mejor se alinee con tus
                                metas y comienza tu camino al éxito.
                            </p>
                        </div>

                        <aside
                            className="routes-assistant-card"
                            aria-label="Ayuda para elegir una ruta"
                        >
                            <img
                                className="routes-assistant-mascot"
                                src={`${IMAGE_ROOT}/compartidos/dragon-laptop-512.webp`}
                                alt=""
                                aria-hidden="true"
                            />

                            <div className="routes-assistant-copy">
                                <h2>
                                    ¿Necesitas ayuda para decidir?
                                </h2>

                                <p>
                                    Consulta la recomendación de Learn2Code
                                    basada en tus metas y diagnóstico.
                                </p>

                                <Link
                                    className="routes-assistant-link"
                                    to="/my-recommendation"
                                >
                                    <img
                                        src={`${IMAGE_ROOT}/compartidos/icono-asistente-rojo.svg`}
                                        alt=""
                                        aria-hidden="true"
                                    />
                                    Consultar mi recomendación
                                </Link>
                            </div>
                        </aside>
                    </section>

                    <section
                        className="routes-diagnostic"
                        aria-label="Resumen de tu diagnóstico"
                    >
                        <div className="routes-diagnostic-intro">
                            <div className="routes-diagnostic-title">
                                <FiStar aria-hidden="true" />

                                <h2>
                                    {diagnosticStatus === 'loading'
                                        ? 'Consultando tu diagnóstico'
                                        : diagnosticStatus === 'error'
                                            ? 'No pudimos consultar tu diagnóstico'
                                            : diagnosticCompleted
                                                ? 'Tu diagnóstico completado'
                                                : 'Tu diagnóstico está pendiente'}
                                </h2>
                            </div>

                            <p>
                                {diagnosticCompleted
                                    ? '¡Excelente! Ya puedes consultar tus resultados y explorar las especializaciones.'
                                    : diagnosticStatus === 'error'
                                        ? 'No fue posible recuperar tus resultados. Puedes reintentar la consulta.'
                                        : diagnosticStatus === 'loading'
                                            ? 'Estamos recuperando tus resultados.'
                                            : 'Completa tu diagnóstico para conocer tu nivel y fortalezas.'}
                            </p>

                            {diagnosticStatus === 'error' ? (
                                <button
                                    className="routes-diagnostic-link"
                                    type="button"
                                    onClick={() => {
                                        setDiagnosticStatus('loading');
                                        setOnboardingStatus('loading');
                                        setDiagnosticRetryCount(
                                            (count) => count + 1,
                                        );
                                    }}
                                >
                                    Reintentar consulta
                                </button>
                            ) : (
                                <Link
                                    className="routes-diagnostic-link"
                                    to={
                                        diagnosticCompleted
                                            ? '/diagnostic/results'
                                            : '/diagnostic'
                                    }
                                >
                                    {diagnosticCompleted
                                        ? 'Ver detalle del diagnóstico'
                                        : 'Ir al diagnóstico'}

                                    <FiArrowRight aria-hidden="true" />
                                </Link>
                            )}

                            <div className="routes-diagnostic-plan">
                                {recommendationStatus === 'error' ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRecommendationStatus('loading');
                                            setRetryCount(
                                                (count) => count + 1,
                                            );
                                        }}
                                    >
                                        Reintentar recomendación
                                    </button>
                                ) : (
                                    <Link to="/my-recommendation">
                                        Ver mi plan recomendado
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="routes-diagnostic-column">
                            <span>Nivel detectado</span>

                            <strong>
                                {diagnosticStatus === 'loading'
                                    ? 'Consultando...'
                                    : diagnosticStatus === 'error'
                                        ? 'No disponible'
                                        : diagnosticLevel}
                            </strong>

                            <p>
                                {diagnosticCompleted
                                    ? 'Nivel calculado según tus respuestas evaluadas.'
                                    : 'Se mostrará cuando completes el diagnóstico.'}
                            </p>
                        </div>

                        <div className="routes-diagnostic-column">
                            <span>Fortalezas</span>

                            {diagnosticStrengths.length > 0 &&
                                diagnosticCompleted ? (
                                <ul className="routes-diagnostic-strengths">
                                    {diagnosticStrengths.map((item) => (
                                        <li key={item.name}>
                                            <span aria-hidden="true">✓</span>
                                            {item.name}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>
                                    {diagnosticCompleted
                                        ? 'No se identificaron temas con 70% o más de desempeño.'
                                        : 'Disponibles después del diagnóstico.'}
                                </p>
                            )}
                        </div>

                        <div className="routes-diagnostic-column">
                            <span>Tu objetivo</span>

                            <strong>
                                {onboardingStatus === 'loading'
                                    ? 'Consultando...'
                                    : learningGoal}
                            </strong>

                            <p>
                                Objetivo registrado durante tu
                                configuración inicial.
                            </p>
                        </div>
                    </section>

                    <section
                        className="routes-explore"
                        aria-label="Rutas de aprendizaje disponibles"
                    >

                        {selectionLoading && (
                            <p
                                className="routes-selection-feedback"
                                role="status"
                            >
                                Consultando tu selección...
                            </p>
                        )}

                        {selectionLoadError && (
                            <div
                                className="routes-selection-feedback"
                                role="alert"
                            >
                                <span>{selectionLoadError}</span>

                                <button
                                    type="button"
                                    className="routes-secondary-button"
                                    onClick={() => {
                                        setSelectionLoading(true);
                                        setSelectionLoadError('');
                                        setSelectionRetryCount(
                                            (count) => count + 1,
                                        );
                                    }}
                                >
                                    Reintentar
                                </button>
                            </div>
                        )}

                        <div className="routes-grid">
                            {filteredRoutes.map((route) => {
                                const visualContent =
                                    routeVisualContent[route.key];

                                const footerContent =
                                    routeFooterContent[route.key];

                                const FooterIcon = footerContent.Icon;

                                const isExpanded =
                                    expandedRoute === route.key;
                                const isRecommended =
                                    recommendedKey === route.key;
                                const isSelected =
                                    selectedRoute?.specializationKey === route.key;

                                return (
                                    <article
                                        className={`routes-card${isRecommended ? ' is-recommended' : ''}`}
                                        data-route-key={route.key}
                                        key={route.key}
                                    >
                                        <div className="routes-card-top">
                                            <img
                                                className="routes-card-icon"
                                                src={`${IMAGE_ROOT}/seleccion/${route.icon}`}
                                                alt=""
                                                aria-hidden="true"
                                            />

                                            <img
                                                className="routes-card-mascot"
                                                src={`${IMAGE_ROOT}/compartidos/dragon-laptop-512.webp`}
                                                alt=""
                                                aria-hidden="true"
                                            />

                                            {(isRecommended || isSelected) && (
                                                <span className="routes-card-badge">
                                                    {isSelected ? (
                                                        <FiCheckCircle
                                                            aria-hidden="true"
                                                        />
                                                    ) : (
                                                        <FiStar
                                                            aria-hidden="true"
                                                        />
                                                    )}

                                                    {isRecommended && isSelected
                                                        ? 'Recomendada y elegida'
                                                        : isSelected
                                                            ? 'Tu ruta elegida'
                                                            : 'Recomendada para ti'}
                                                </span>
                                            )}
                                        </div>

                                        <h3>
                                            {routeDisplayTitles[route.key]}
                                        </h3>
                                        <p className="routes-card-description">
                                            {route.description}
                                        </p>

                                        <h4 className="routes-card-section-title">
                                            Tecnologías clave
                                        </h4>

                                        <div className="routes-card-tech">
                                            {route.technologies.map((tech) => {
                                                const brand =
                                                    technologyBrands[tech.name];

                                                const TechnologyIcon =
                                                    brand?.Icon;

                                                return (
                                                    <span
                                                        className="routes-tech"
                                                        key={tech.name}
                                                    >
                                                        {TechnologyIcon ? (
                                                            <TechnologyIcon
                                                                aria-hidden="true"
                                                                style={{
                                                                    color: brand.color,
                                                                }}
                                                            />
                                                        ) : (
                                                            <img
                                                                src={`${IMAGE_ROOT}/tecnologias/${tech.icon}`}
                                                                alt=""
                                                                aria-hidden="true"
                                                            />
                                                        )}

                                                        <span>{tech.name}</span>
                                                    </span>
                                                );
                                            })}
                                        </div>

                                        <section
                                            className="routes-card-statistics"
                                            aria-label={`Estadísticas de ${route.name}`}
                                        >
                                            <div className="routes-card-stat">
                                                <FiClock aria-hidden="true" />
                                                <span>Duración</span>

                                                <strong>
                                                    {isRecommended &&
                                                        recommendedEstimatedWeeks !== null
                                                        ? `${recommendedEstimatedWeeks} semanas`
                                                        : 'Por definir'}
                                                </strong>
                                            </div>

                                            <div className="routes-card-stat">
                                                <FiLayers aria-hidden="true" />
                                                <span>Módulos</span>
                                                <strong>Por definir</strong>
                                            </div>

                                            <div className="routes-card-stat">
                                                <FiPackage aria-hidden="true" />
                                                <span>Proyectos</span>
                                                <strong>Por definir</strong>
                                            </div>
                                        </section>

                                        <section
                                            className="routes-card-learning"
                                            aria-label={`Camino de aprendizaje de ${route.name}`}
                                        >
                                            <h4 className="routes-card-section-title">
                                                Tu camino de aprendizaje
                                            </h4>

                                            <div className="routes-card-roadmap">
                                                {visualContent.stages.map(
                                                    (stage, index) => (
                                                        <div
                                                            className="routes-roadmap-step"
                                                            key={stage}
                                                        >
                                                            <span
                                                                className={
                                                                    index === 0
                                                                        ? 'routes-roadmap-marker is-first'
                                                                        : 'routes-roadmap-marker'
                                                                }
                                                            >
                                                                {index === 4 ? (
                                                                    <FiStar
                                                                        aria-hidden="true"
                                                                    />
                                                                ) : (
                                                                    index + 1
                                                                )}
                                                            </span>

                                                            <small
                                                                title={stage}
                                                                aria-label={stage}
                                                            >
                                                                {routeStageLabels[route.key]?.[index] ?? stage}
                                                            </small>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </section>

                                        <section className="routes-card-insight">
                                            <strong>
                                                {visualContent.insightTitle}
                                            </strong>

                                            <p>{visualContent.insight}</p>
                                        </section>

                                        <div className="routes-card-actions">
                                            <Link
                                                className="routes-card-button routes-card-button--outline"
                                                to={`/routes/${route.key}`}
                                            >
                                                Ver ruta
                                                <FiArrowRight aria-hidden="true" />
                                            </Link>

                                            <button
                                                className="routes-card-button routes-card-button--select"
                                                type="button"
                                                disabled={
                                                    selectionLoading ||
                                                    Boolean(selectionLoadError) ||
                                                    selectionSaving ||
                                                    isSelected
                                                }
                                                onClick={() => {
                                                    setExpandedRoute(route.key);
                                                    setConfirmingRouteKey(route.key);
                                                    setSelectionActionError('');
                                                    setSelectionSuccess('');
                                                }}
                                            >
                                                {isSelected
                                                    ? 'Ruta seleccionada'
                                                    : selectedRoute
                                                        ? 'Cambiar selección'
                                                        : 'Seleccionar ruta'}
                                            </button>
                                        </div>

                                        <p className="routes-card-action-note">
                                            {isSelected
                                                ? 'Esta es tu especialización actual.'
                                                : 'Puedes explorar esta ruta sin activarla. Tu elección solo se guardará cuando la confirmes.'}
                                        </p>

                                        <div className="routes-card-subtitle">
                                            <FooterIcon aria-hidden="true" />

                                            <span>
                                                {footerContent.text}
                                            </span>
                                        </div>

                                        {isExpanded && (
                                            <div
                                                className="routes-card-details"
                                                id={`route-details-${route.key}`}
                                            >
                                                <strong>
                                                    ¿Qué puedes explorar?
                                                </strong>

                                                <p>{route.detail}</p>

                                                <small>
                                                    {isSelected
                                                        ? 'Esta especialización está guardada como tu ruta elegida.'
                                                        : 'Consultar una ruta no la selecciona automáticamente.'}
                                                </small>

                                                {selectionActionError &&
                                                    confirmingRouteKey === route.key && (
                                                        <p role="alert">
                                                            {selectionActionError}
                                                        </p>
                                                    )}

                                                {selectionSuccess && isSelected && (
                                                    <p role="status">
                                                        {selectionSuccess}
                                                    </p>
                                                )}

                                                {confirmingRouteKey === route.key && (
                                                    <div>
                                                        <p>
                                                            <strong>
                                                                ¿Confirmas tu elección?
                                                            </strong>
                                                        </p>

                                                        <p>
                                                            {selectedRoute
                                                                ? `¿Deseas cambiar tu especialización actual a ${route.name}?`
                                                                : `¿Quieres elegir ${route.name} como tu especialización?`}
                                                        </p>

                                                        <button
                                                            type="button"
                                                            className="routes-secondary-button"
                                                            disabled={selectionSaving}
                                                            onClick={() => {
                                                                setConfirmingRouteKey(null);
                                                                setSelectionActionError('');
                                                            }}
                                                        >
                                                            Cancelar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="routes-card-button"
                                                            disabled={selectionSaving}
                                                            aria-busy={selectionSaving}
                                                            onClick={() => {
                                                                handleConfirmRouteSelection(route);
                                                            }}
                                                        >
                                                            {selectionSaving
                                                                ? 'Guardando...'
                                                                : 'Confirmar elección'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>

                        {filteredRoutes.length === 0 && (
                            <div className="routes-empty">
                                No encontramos especializaciones con ese término.
                                Prueba con otra tecnología.
                            </div>
                        )}
                    </section>

                    <footer className="routes-footer">
                        <div className="routes-footer-benefits">
                            <FiAward aria-hidden="true" />

                            <div>
                                <strong>Todas las rutas incluyen</strong>

                                <p>
                                    Tecnologías clave
                                    <span aria-hidden="true"> • </span>
                                    Actividades prácticas
                                    <span aria-hidden="true"> • </span>
                                    Camino de aprendizaje
                                </p>
                            </div>
                        </div>

                        <div className="routes-footer-note">
                            <FiShield aria-hidden="true" />

                            <p>
                                Puedes cambiar de especialización.
                                Tu nueva elección se guardará cuando
                                la confirmes.
                            </p>
                        </div>
                    </footer>
                </div>
            </section >
        </main >
    );
}

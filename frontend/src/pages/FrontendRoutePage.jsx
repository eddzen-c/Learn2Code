
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
    FiArrowLeft,
    FiArrowRight,
    FiBookOpen,
    FiCheckCircle,
    FiCode,
    FiCompass,
    FiLayers,
    FiStar,
    FiTarget,
} from 'react-icons/fi';

import { useAuth } from '../auth/useAuth.js';
import { getCurrentLearningPlan } from '../api/learning-paths.api.js';
import {
    getCurrentStudentRoute,
    selectStudentRoute,
} from '../api/student-routes.api.js';
import { LearningSidebar } from '../components/LearningSidebar.jsx';
import { ProfileTopbar } from '../components/ProfileTopbar.jsx';
import { useStudentStreak } from '../hooks/useStudentStreak.js';

import './dashboard.css';
import './FrontendRoutePage.css';

const ASSETS = '/images/rutas';
const FRONTEND_ASSETS = `${ASSETS}/frontend`;

const technologies = [
    { name: 'HTML', image: 'tecnologia-html.svg' },
    { name: 'CSS', image: 'tecnologia-css.svg' },
    { name: 'JavaScript', image: 'tecnologia-javascript.svg' },
    { name: 'React', image: 'tecnologia-react.svg' },
];

const learningAreas = [
    {
        title: 'Fundamentos web',
        description:
            'Estructura de páginas, HTML semántico y estilos con CSS.',
    },
    {
        title: 'Interactividad con JavaScript',
        description:
            'Lógica, eventos y manipulación de elementos del navegador.',
    },
    {
        title: 'Interfaces con React',
        description:
            'Componentes reutilizables, estado e interfaces dinámicas.',
    },
    {
        title: 'Proyectos y publicación',
        description:
            'Integración de conocimientos y publicación de proyectos.',
    },
];

const skills = [
    'Estructurar páginas web con HTML.',
    'Aplicar estilos y diseños responsivos con CSS.',
    'Crear interacciones utilizando JavaScript.',
    'Desarrollar componentes reutilizables con React.',
    'Comprender el consumo de APIs.',
    'Organizar y presentar proyectos personales.',
];

const projects = [
    {
        title: 'Portafolio personal',
        description:
            'Una página para presentar tus proyectos y habilidades.',
        image: 'miniatura-portafolio-256.webp',
    },
    {
        title: 'Interfaz de tienda',
        description:
            'Una experiencia visual para explorar productos.',
        image: 'miniatura-tienda-256.webp',
    },
    {
        title: 'Panel de información',
        description:
            'Una interfaz que organiza datos mediante tarjetas.',
        image: 'miniatura-dashboard-256.webp',
    },
];

const tabs = [
    { key: 'overview', title: 'Descripción general' },
    { key: 'contents', title: 'Contenidos' },
    { key: 'projects', title: 'Proyectos' },
    { key: 'skills', title: 'Habilidades' },
];

const normalizeSearchText = (value) =>
    String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es')
        .trim();

export function FrontendRoutePage() {
    const { accessToken, user, signOut } = useAuth();
    const navigate = useNavigate();

    const navigationStreak = useStudentStreak(accessToken);

    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [planResponse, setPlanResponse] = useState(null);
    const [loadingPlan, setLoadingPlan] = useState(true);
    const [planError, setPlanError] = useState('');
    const [selection, setSelection] = useState(null);
    const [selectionLoading, setSelectionLoading] = useState(true);
    const [selectionLoadError, setSelectionLoadError] = useState('');
    const [selectionActionError, setSelectionActionError] = useState('');
    const [selectionSuccess, setSelectionSuccess] = useState('');
    const [selectionSaving, setSelectionSaving] = useState(false);
    const [confirmingSelection, setConfirmingSelection] = useState(false);

    useEffect(() => {
        if (!accessToken) {
            return undefined;
        }

        let active = true;

        getCurrentLearningPlan(accessToken)
            .then((response) => {
                if (!active) return;

                setPlanResponse(response);
                setPlanError('');
            })
            .catch((error) => {
                if (!active) return;

                setPlanError(
                    error?.message ||
                    'No se pudo consultar tu recomendación.',
                );
            })
            .finally(() => {
                if (active) setLoadingPlan(false);
            });

        return () => {
            active = false;
        };
    }, [accessToken]);

    useEffect(() => {
        if (!accessToken) {
            return undefined;
        }

        let active = true;

        getCurrentStudentRoute(accessToken)
            .then((response) => {
                if (!active) return;

                setSelection(response?.selection ?? null);
                setSelectionLoadError('');
            })
            .catch((error) => {
                if (!active) return;

                setSelectionLoadError(
                    error?.message ??
                    'No fue posible consultar tu ruta elegida.',
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
    }, [accessToken]);

    const plan = planResponse?.plan;
    const hasSelectedFrontend =
        selection?.specializationKey === 'frontend';

    const selectedRouteNames = {
        frontend: 'Frontend',
        backend: 'Backend',
        fullstack: 'Full Stack',
        devops: 'DevOps',
    };

    const selectedRouteName =
        selectedRouteNames[selection?.specializationKey] ?? null;

    const handleConfirmSelection = async () => {
        if (
            !accessToken ||
            selectionLoading ||
            selectionSaving ||
            selectionLoadError ||
            hasSelectedFrontend
        ) {
            return;
        }

        setSelectionSaving(true);
        setSelectionActionError('');
        setSelectionSuccess('');

        try {
            const response = await selectStudentRoute({
                accessToken,
                specializationKey: 'frontend',
            });

            if (
                response?.state !== 'selected' ||
                response?.selection?.specializationKey !== 'frontend'
            ) {
                throw new Error(
                    'El servidor no confirmó la selección de Frontend.',
                );
            }

            setSelection(response.selection);
            setConfirmingSelection(false);
            navigate('/exercises/specializations/frontend');
        } catch (error) {
            setSelectionActionError(
                error?.message ??
                'No fue posible guardar tu elección.',
            );
        } finally {
            setSelectionSaving(false);
        }
    };
    const isRecommended =
        plan?.specializationKey === 'frontend';

    const personalizedSteps =
        isRecommended && Array.isArray(plan?.steps)
            ? plan.steps
            : [];

    const displayedSteps = personalizedSteps.length
        ? personalizedSteps
        : learningAreas;

    const searchableContent = [
        ...technologies.map((technology) => ({
            id: `technology-${technology.name}`,
            title: technology.name,
            description: 'Tecnología de la ruta Frontend',
            tab: 'overview',
        })),

        ...displayedSteps.map((step, index) => ({
            id: `step-${index}`,
            title: step.title ?? `Etapa ${index + 1}`,
            description: step.description ?? '',
            tab: 'contents',
        })),

        ...projects.map((project) => ({
            id: `project-${project.title}`,
            title: project.title,
            description: project.description,
            tab: 'projects',
        })),

        ...skills.map((skill, index) => ({
            id: `skill-${index}`,
            title: skill,
            description: 'Habilidad de Frontend',
            tab: 'skills',
        })),

        ...tabs.map((tab) => ({
            id: `tab-${tab.key}`,
            title: tab.title,
            description: 'Sección de la especialización',
            tab: tab.key,
        })),
    ];

    const normalizedSearch = normalizeSearchText(search);

    const searchResults = normalizedSearch
        ? searchableContent
            .filter((item) =>
                normalizeSearchText(
                    `${item.title} ${item.description}`,
                ).includes(normalizedSearch),
            )
            .slice(0, 8)
        : [];

    const openSearchResult = (tab) => {
        setActiveTab(tab);
        setSearch('');

        document
            .querySelector('.frontend-route-page .fr-tabs')
            ?.scrollIntoView?.({
                behavior: 'smooth',
                block: 'start',
            });
    };

    const estimatedWeeks =
        isRecommended &&
            Number.isFinite(Number(plan?.estimatedWeeks)) &&
            Number(plan.estimatedWeeks) > 0
            ? `${plan.estimatedWeeks} semanas`
            : 'Por definir';

    return (
        <main className="inicio-layout frontend-route-page">
            <LearningSidebar
                variant="profile"
                activeItem="routes"
                streakDays={navigationStreak}
                mascotSrc={`${ASSETS}/compartidos/dragon-laptop-512.webp`}
                mascotAlt="Mascota de Learn2Code con laptop"
                messageTitle="Tu camino, tu ritmo"
                message="Descubre qué puedes aprender y elige cuando estés listo."
            />

            <section className="inicio-workspace">
                <ProfileTopbar
                    userName={user?.fullName?.trim() || 'Estudiante'}
                    onLogout={signOut}
                    onOpenNotifications={() => {
                        navigate('/profile', {
                            state: {
                                openTab: 'notifications',
                            },
                        });
                    }}
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Buscar en la ruta Frontend..."
                    streakDays={navigationStreak}
                />

                <div className="fr-content">
                    {normalizedSearch && (
                        <section
                            className="fr-search-results"
                            aria-label="Resultados de búsqueda en Frontend"
                        >
                            <div className="fr-search-results-heading">
                                <strong>
                                    Resultados en Frontend
                                </strong>
                                <span>
                                    {searchResults.length} encontrados
                                </span>
                            </div>

                            {searchResults.length > 0 ? (
                                <div className="fr-search-results-list">
                                    {searchResults.map((result) => (
                                        <button
                                            key={result.id}
                                            type="button"
                                            onClick={() => {
                                                openSearchResult(result.tab);
                                            }}
                                        >
                                            <span>
                                                <strong>
                                                    {result.title}
                                                </strong>
                                                <small>
                                                    {result.description}
                                                </small>
                                            </span>
                                            <FiArrowRight
                                                aria-hidden="true"
                                            />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p role="status">
                                    No encontramos coincidencias
                                    en esta especialización.
                                </p>
                            )}
                        </section>
                    )}
                    <Link className="fr-back" to="/routes">
                        <FiArrowLeft aria-hidden="true" />
                        Volver a todas las rutas
                    </Link>

                    <section className="fr-intro">
                        <div className="fr-intro-copy">
                            <div className="fr-heading">
                                <img
                                    src={`${ASSETS}/seleccion/ruta-frontend.svg`}
                                    alt=""
                                    aria-hidden="true"
                                />

                                <div>
                                    <h1>Ruta Frontend</h1>
                                </div>
                            </div>

                            <p className="fr-lead">
                                Aprende a construir experiencias web
                                modernas e interactivas utilizando HTML,
                                CSS, JavaScript y React.
                            </p>

                            <p>
                                Explora cómo se crean las interfaces,
                                cómo responden a las acciones del usuario
                                y cómo se organizan las aplicaciones web.
                            </p>

                            <div className="fr-highlights">
                                <span className="fr-highlight fr-highlight--green">
                                    <span aria-hidden="true">✓</span>
                                    Ideal para comenzar
                                </span>

                                <span className="fr-highlight fr-highlight--purple">
                                    <span aria-hidden="true">✦</span>
                                    Interfaces interactivas
                                </span>

                                <span className="fr-highlight fr-highlight--orange">
                                    <span aria-hidden="true">★</span>
                                    Proyectos de ejemplo
                                </span>
                            </div>

                            {isRecommended && (
                                <div className="fr-recommended">
                                    <FiStar aria-hidden="true" />
                                    Recomendada para ti según tu
                                    diagnóstico y tus intereses
                                </div>
                            )}

                            <div className="fr-intro-actions">
                                {hasSelectedFrontend ? (
                                    <Link
                                        to="/exercises/specializations/frontend"
                                        className="fr-primary-link fr-primary-link--selected"
                                    >
                                        <FiCompass aria-hidden="true" />
                                        Comenzar ruta
                                    </Link>
                                ) : (
                                    <a
                                        className="fr-primary-link"
                                        href="#frontend-confirmar-ruta"
                                    >
                                        <FiCompass aria-hidden="true" />
                                        {selectedRouteName
                                            ? 'Cambiar a Frontend'
                                            : 'Comenzar ruta'}
                                    </a>
                                )}

                                <Link
                                    className="fr-outline-link"
                                    to="/routes"
                                >
                                    Dejar para después
                                </Link>
                            </div>
                        </div>

                        <img
                            className="fr-illustration"
                            src="/images/rutas/detalles/frontend/ilustracion-frontend-original.webp"
                            alt="Ilustración de programación Frontend"
                        />

                        <aside className="fr-progress-card">
                            <h2>Tu progreso en esta ruta</h2>


                            <div className="fr-progress-empty">
                                <div
                                    className="fr-progress-ring"
                                    aria-hidden="true"
                                >
                                    <span>—</span>
                                </div>

                                <div className="fr-progress-state">
                                    <strong>
                                        {selectionLoading
                                            ? 'Consultando tu elección...'
                                            : selectionLoadError
                                                ? 'Estado no disponible'
                                                : hasSelectedFrontend
                                                    ? 'Frontend elegida'
                                                    : selectedRouteName
                                                        ? `Actualmente elegiste ${selectedRouteName}`
                                                        : 'Aún no has elegido una ruta'}
                                    </strong>

                                    <p>
                                        {hasSelectedFrontend
                                            ? 'Tu elección está guardada. Todavía no hay progreso académico registrado.'
                                            : selectionLoadError
                                                ? 'No se pudo recuperar tu selección desde el servidor.'
                                                : 'Puedes explorar esta especialización sin cambiar tu elección.'}
                                    </p>
                                </div>
                            </div>

                            <div className="fr-progress-metrics">
                                <div className="fr-progress-line">
                                    <span>Duración estimada</span>
                                    <strong>{estimatedWeeks}</strong>
                                </div>

                                <div className="fr-progress-line">
                                    <span>Módulos</span>
                                    <strong>Por definir</strong>
                                </div>

                                <div className="fr-progress-line">
                                    <span>Proyectos</span>
                                    <strong>Por definir</strong>
                                </div>

                                <div className="fr-progress-line">
                                    <span>Nivel</span>
                                    <strong>Por definir</strong>
                                </div>

                                <div className="fr-progress-line">
                                    <span>Última actividad</span>
                                    <strong>No disponible</strong>
                                </div>
                            </div>

                        </aside>
                    </section>

                                        <section
                        className="fr-summary"
                        aria-label="Resumen de la especialización"
                    >
                        <div className="fr-summary-technologies">
                            <span className="fr-summary-label">
                                Tecnologías clave
                            </span>

                            <div className="fr-summary-icons">
                                {technologies.map((tech) => (
                                    <div
                                        className="fr-summary-technology"
                                        key={tech.name}
                                    >
                                        <img
                                            src={`${ASSETS}/tecnologias/${tech.image}`}
                                            alt=""
                                            aria-hidden="true"
                                        />
                                        <span>{tech.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="fr-summary-stat">
                            <span>Duración estimada</span>
                            <strong>{estimatedWeeks}</strong>
                        </div>

                        <div className="fr-summary-stat">
                            <span>Módulos</span>
                            <strong>Por definir</strong>
                        </div>

                        <div className="fr-summary-stat">
                            <span>Proyectos</span>
                            <strong>Por definir</strong>
                        </div>

                        <div className="fr-summary-stat">
                            <span>Nivel</span>
                            <strong>Por definir</strong>
                        </div>
                    </section>

                    {loadingPlan && (
                        <p className="fr-api-note" role="status">
                            Consultando tu recomendación personalizada...
                        </p>
                    )}

                    {!loadingPlan && planError && (
                        <p className="fr-api-note" role="alert">
                            {planError}
                            {' '}Puedes explorar la ruta sin este dato.
                        </p>
                    )}

                                        <div className="fr-main-grid">
                        <div className="fr-main-left">
                            <nav
                                className="fr-tabs"
                                aria-label="Información de la ruta"
                            >
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        className={
                                            activeTab === tab.key
                                                ? 'is-active'
                                                : ''
                                        }
                                        aria-current={
                                            activeTab === tab.key
                                                ? 'page'
                                                : undefined
                                        }
                                        onClick={() => {
                                            setActiveTab(tab.key);
                                        }}
                                    >
                                        {tab.title}
                                    </button>
                                ))}
                            </nav>

                            <section className="fr-main-panel">

                            {activeTab === 'overview' && (
    <div className="fr-overview">
        <div className="route-detail-learning-inner">
            <div className="route-detail-knowledge">
                <h2>¿Qué aprenderás?</h2>

                <p>
                    Tecnologías y conceptos principales
                    de esta especialización.
                </p>

                <ul className="route-detail-knowledge-list">
                    {skills.map((skill) => (
                        <li key={skill}>
                            <FiCheckCircle aria-hidden="true" />
                            <span>{skill}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="route-detail-roadmap">
                <h2>
                    {personalizedSteps.length
                        ? 'Pasos de tu plan recomendado'
                        : 'Ruta de aprendizaje'}
                </h2>

                <p className="route-detail-roadmap-kicker">
                    Tu camino de aprendizaje
                </p>

                <p className="route-detail-roadmap-description">
                    {personalizedSteps.length
                        ? 'Etapas de tu recomendación personalizada.'
                        : 'Etapas orientativas de esta especialización.'}
                </p>

                <ol className="route-detail-roadmap-list">
                    {displayedSteps.map((step, index) => {
                        const StageIcon = [
                            FiCode,
                            FiLayers,
                            FiTarget,
                            FiBookOpen,
                        ][index % 4];

                        return (
                            <li
                                className="route-detail-roadmap-card"
                                key={step.id || step.title}
                            >
                                <span className="route-detail-roadmap-number">
                                    {index + 1}
                                </span>

                                <div className="route-detail-roadmap-item">
                                    <span className="route-detail-roadmap-icon">
                                        <StageIcon aria-hidden="true" />
                                    </span>

                                    <div className="route-detail-roadmap-item-copy">
                                        <strong>
                                            {step.title}
                                        </strong>

                                        <span>
                                            {step.description}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </div>

        <p className="route-detail-disclaimer">
            {personalizedSteps.length
                ? 'Estos pasos provienen de tu recomendación personalizada; todavía no son lecciones iniciadas.'
                : 'Los módulos, ejercicios y proyectos definitivos dependerán del plan disponible para esta especialización.'}
        </p>
    </div>
)}

                            {activeTab === 'contents' && (
                                <div className="fr-tab-body">
                                    <h2>Contenidos que puedes explorar</h2>
                                    <p>
                                        Una vista introductoria de los temas
                                        relacionados con el desarrollo Frontend.
                                    </p>

                                    <div className="fr-roadmap">
                                        {displayedSteps.map((step, index) => (
                                            <article
                                                key={step.id || step.title}
                                            >
                                                <span className="fr-step-number">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <strong>
                                                        {step.title}
                                                    </strong>
                                                    <p>
                                                        {step.description}
                                                    </p>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'projects' && (
                                <div className="fr-tab-body">
                                    <h2>Ideas de proyectos</h2>
                                    <p>
                                        Estos son ejemplos de lo que podrías
                                        construir. No representan proyectos
                                        asignados ni completados.
                                    </p>

                                    <div className="fr-project-list">
                                        {projects.map((project) => (
                                            <article key={project.title}>
                                                <img
                                                    src={`${FRONTEND_ASSETS}/${project.image}`}
                                                    alt=""
                                                />
                                                <div>
                                                    <strong>
                                                        {project.title}
                                                    </strong>
                                                    <p>
                                                        {project.description}
                                                    </p>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'skills' && (
                                <div className="fr-tab-body">
                                    <h2>Habilidades por desarrollar</h2>
                                    <p>
                                        Conocimientos que podrías fortalecer
                                        a través del estudio de Frontend.
                                    </p>

                                    <ul className="fr-check-list">
                                        {skills.map((skill) => (
                                            <li key={skill}>
                                                <FiCheckCircle
                                                    aria-hidden="true"
                                                />
                                                {skill}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            </section>
                        </div>

                        <aside className="fr-projects-panel">
    <h2>Proyectos que podrías construir</h2>

    <p className="route-detail-projects-intro">
        Ejemplos ilustrativos. Su disponibilidad
        dependerá de los contenidos de la plataforma.
    </p>

    <div className="route-detail-project-list">
        {projects.map((project) => (
            <article
                className="route-detail-project-card"
                key={project.title}
            >
                <img
                    src={`${FRONTEND_ASSETS}/${project.image}`}
                    alt={`Ejemplo ilustrativo de ${project.title}`}
                    loading="lazy"
                />

                <div className="route-detail-project-card-content">
                    <strong>{project.title}</strong>
                    <p>{project.description}</p>
                </div>
            </article>
        ))}
    </div>

    <section className="route-detail-outcomes">
        <h3>¿Por qué explorar Frontend?</h3>

        <p>
            Podrás comprender cómo se diseñan y
            construyen las interfaces que utilizamos
            a diario.
        </p>
    </section>
</aside>
                    </div>

                    <footer
                        id="frontend-confirmar-ruta"
                        className="fr-footer"
                    >
                        <img
                            src={`${ASSETS}/compartidos/dragon-laptop-512.webp`}
                            alt=""
                            aria-hidden="true"
                        />

                        <div>
                            <strong>
                                ¡Estás más cerca de comenzar!
                            </strong>
                            <p>
                                Explora Desarrollo Frontend y descubre
                                todo lo que puedes aprender. Si esta
                                especialización es para ti, puedes
                                elegirla y confirmar tu decisión.
                                Learn2Code guardará tu elección.
                            </p>
                        </div>

                        <div className="fr-selection-actions">
                            {selectionLoadError && (
                                <p className="fr-selection-error" role="alert">
                                    {selectionLoadError}
                                    {' '}Actualiza la página para volver a consultar.
                                </p>
                            )}

                            {selectionActionError && (
                                <p className="fr-selection-error" role="alert">
                                    {selectionActionError}
                                </p>
                            )}

                            {selectionSuccess && (
                                <p className="fr-selection-success" role="status">
                                    {selectionSuccess}
                                </p>
                            )}

                            {!confirmingSelection ? (
                                <button
                                    className="fr-select-button"
                                    type="button"
                                    disabled={
                                        selectionLoading ||
                                        Boolean(selectionLoadError) ||
                                        selectionSaving ||
                                        hasSelectedFrontend
                                    }
                                    onClick={() => {
                                        setSelectionActionError('');
                                        setSelectionSuccess('');
                                        setConfirmingSelection(true);
                                    }}
                                >
                                    {hasSelectedFrontend
                                        ? 'Frontend elegida'
                                        : selectedRouteName
                                            ? 'Cambiar a Frontend'
                                            : 'Elegir Frontend'}

                                    <FiArrowRight aria-hidden="true" />
                                </button>
                            ) : (
                                <div className="fr-confirmation">
                                    <strong>
                                        ¿Confirmas tu elección?
                                    </strong>

                                    <p>
                                        {selectedRouteName
                                            ? `Actualmente tienes elegida la ruta ${selectedRouteName}. ¿Deseas cambiarla a Frontend?`
                                            : '¿Quieres elegir Desarrollo Frontend como tu ruta de aprendizaje?'}
                                    </p>

                                    <div className="fr-confirmation-buttons">
                                        <button
                                            className="fr-cancel-button"
                                            type="button"
                                            disabled={selectionSaving}
                                            onClick={() => {
                                                setConfirmingSelection(false);
                                            }}
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            className="fr-select-button"
                                            type="button"
                                            disabled={selectionSaving}
                                            onClick={handleConfirmSelection}
                                        >
                                            {selectionSaving
                                                ? 'Guardando...'
                                                : 'Confirmar elección'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </footer>
                </div>
            </section>
        </main>
    );
}

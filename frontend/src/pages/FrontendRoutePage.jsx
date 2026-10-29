
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
    FiArrowLeft,
    FiArrowRight,
    FiBookOpen,
    FiCheckCircle,
    FiClock,
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

export function FrontendRoutePage() {
    const { accessToken, user } = useAuth();

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

    const firstName =
        user?.fullName?.trim().split(/\s+/)[0] || 'Estudiante';

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
            setSelectionSuccess(
                '¡Frontend se guardó como tu ruta elegida!',
            );
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

    const estimatedWeeks =
        isRecommended &&
            Number.isFinite(Number(plan?.estimatedWeeks)) &&
            Number(plan.estimatedWeeks) > 0
            ? `${plan.estimatedWeeks} semanas`
            : 'Por definir';

    return (
        <main className="onboarding-page frontend-route-page">
            <LearningSidebar
                activeItem="routes"
                mascotSrc={`${ASSETS}/compartidos/dragon-laptop-512.webp`}
                mascotAlt="Mascota de Learn2Code con laptop"
                messageTitle="Tu camino, tu ritmo"
                message="Descubre qué puedes aprender y elige cuando estés listo."
            />

            <section className="onboarding-content">
                <header className="fr-topbar">
                    <div className="fr-topbar-title">
                        <FiCompass aria-hidden="true" />
                        <strong>Rutas de aprendizaje</strong>
                    </div>

                    <div className="fr-account">
                        <span aria-hidden="true">
                            {firstName.charAt(0).toUpperCase()}
                        </span>
                        <div>
                            <strong>{firstName}</strong>
                            <small>Estudiante</small>
                        </div>
                    </div>
                </header>

                <div className="fr-content">
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
                                    <span className="fr-eyebrow">
                                        ESPECIALIZACIÓN
                                    </span>
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

                            <div className="fr-tech-row">
                                {technologies.map((tech) => (
                                    <span key={tech.name}>
                                        <img
                                            src={`${ASSETS}/tecnologias/${tech.image}`}
                                            alt=""
                                            aria-hidden="true"
                                        />
                                        {tech.name}
                                    </span>
                                ))}
                            </div>

                            {isRecommended && (
                                <div className="fr-recommended">
                                    <FiStar aria-hidden="true" />
                                    Recomendada para ti según tu
                                    diagnóstico y tus intereses
                                </div>
                            )}

                            <div className="fr-intro-actions">
                                <Link
                                    className="fr-primary-link"
                                    to="/routes"
                                >
                                    <FiCompass aria-hidden="true" />
                                    Explorar las rutas
                                </Link>

                                <Link
                                    className="fr-outline-link"
                                    to="/recommended-plan"
                                >
                                    Ver mi plan recomendado
                                </Link>
                            </div>
                        </div>

                        <img
                            className="fr-illustration"
                            src={`${FRONTEND_ASSETS}/ilustracion-ruta-frontend-768.webp`}
                            alt="Ilustración de programación Frontend"
                        />

                        <aside className="fr-progress-card">
                            <h2>Tu progreso en esta ruta</h2>

                            <div className="fr-progress-empty">
                                <FiCompass aria-hidden="true" />

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
                                        ? 'Tu elección está guardada. Todavía no hay actividades ni progreso académico registrado en esta ruta.'
                                        : selectionLoadError
                                            ? 'No se pudo recuperar tu selección desde el servidor.'
                                            : 'Explorar esta página no cambia tu ruta. Puedes elegirla cuando estés listo.'}
                                </p>
                            </div>

                            <div className="fr-progress-line">
                                <FiClock aria-hidden="true" />
                                <span>Actividad registrada</span>
                                <strong>No disponible</strong>
                            </div>

                            <div className="fr-progress-line">
                                <FiTarget aria-hidden="true" />
                                <span>Selección</span>
                                <strong>
                                    {selectionLoading
                                        ? 'Consultando'
                                        : selectionLoadError
                                            ? 'No disponible'
                                            : hasSelectedFrontend
                                                ? 'Frontend'
                                                : selectedRouteName ?? 'Pendiente'}
                                </strong>
                            </div>
                        </aside>
                    </section>

                    <section
                        className="fr-summary"
                        aria-label="Información de Frontend"
                    >
                        <div>
                            <FiClock aria-hidden="true" />
                            <span>Duración estimada</span>
                            <strong>{estimatedWeeks}</strong>
                            <small>
                                {isRecommended
                                    ? 'Estimación de tu plan IA'
                                    : 'Según tu futuro plan'}
                            </small>
                        </div>

                        <div>
                            <FiLayers aria-hidden="true" />
                            <span>Plan personalizado</span>
                            <strong>
                                {personalizedSteps.length
                                    ? `${personalizedSteps.length} pasos`
                                    : 'Por definir'}
                            </strong>
                            <small>
                                {personalizedSteps.length
                                    ? 'Pasos recomendados por IA'
                                    : 'No generado para Frontend'}
                            </small>
                        </div>

                        <div>
                            <FiCode aria-hidden="true" />
                            <span>Tecnologías</span>
                            <strong>HTML, CSS, JS y React</strong>
                            <small>Áreas de exploración</small>
                        </div>

                        <div>
                            <FiBookOpen aria-hidden="true" />
                            <span>Estado de la ruta</span>

                            <strong>
                                {selectionLoading
                                    ? 'Consultando...'
                                    : selectionLoadError
                                        ? 'No disponible'
                                        : hasSelectedFrontend
                                            ? 'Elegida'
                                            : 'Sin elegir'}
                            </strong>

                            <small>
                                {hasSelectedFrontend
                                    ? 'Elección guardada en PostgreSQL'
                                    : 'La elección será explícita'}
                            </small>
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
                        <section className="fr-main-panel">
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

                            {activeTab === 'overview' && (
                                <div className="fr-overview">
                                    <div>
                                        <h2>¿Qué aprenderás?</h2>

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

                                        <div className="fr-hint">
                                            <strong>
                                                ¿Por qué explorar Frontend?
                                            </strong>
                                            <p>
                                                Podrás comprender cómo se
                                                diseñan y construyen las
                                                interfaces que utilizamos
                                                a diario.
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h2>
                                            {personalizedSteps.length
                                                ? 'Pasos de tu plan recomendado'
                                                : 'Áreas que puedes explorar'}
                                        </h2>

                                        <div className="fr-roadmap">
                                            {displayedSteps.map(
                                                (step, index) => (
                                                    <article
                                                        key={
                                                            step.id ||
                                                            step.title
                                                        }
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
                                                ),
                                            )}
                                        </div>

                                        <p className="fr-disclaimer">
                                            {personalizedSteps.length
                                                ? 'Estos pasos provienen de tu recomendación de OpenAI; todavía no son lecciones iniciadas.'
                                                : 'Estas áreas son ejemplos orientativos, no módulos asignados ni progreso registrado.'}
                                        </p>
                                    </div>
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

                        <aside className="fr-projects-panel">
                            <div className="fr-projects-heading">
                                <h2>Proyectos que podrías construir</h2>
                                <span>Ejemplos</span>
                            </div>

                            <div className="fr-project-list">
                                {projects.map((project) => (
                                    <article key={project.title}>
                                        <img
                                            src={`${FRONTEND_ASSETS}/${project.image}`}
                                            alt=""
                                        />

                                        <div>
                                            <strong>{project.title}</strong>
                                            <p>{project.description}</p>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <div className="fr-projects-footnote">
                                Los proyectos definitivos dependerán de
                                los contenidos disponibles en la plataforma.
                            </div>
                        </aside>
                    </div>

                    <footer className="fr-footer">
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
                                Ya puedes conocer Frontend. La selección
                                se habilitará al integrar el registro de
                                especializaciones en PostgreSQL.
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

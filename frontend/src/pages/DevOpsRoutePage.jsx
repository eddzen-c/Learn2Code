
import { useEffect, useState } from 'react';
import {
    Link,
    useNavigate,
} from 'react-router-dom';
import {
    FiArrowLeft,
    FiArrowRight,
    FiCheckCircle,
    FiStar,
    FiBox,
    FiServer,
    FiCloud,
    FiGitBranch,
} from 'react-icons/fi';

import {
    SiDocker,
    SiKubernetes,
} from 'react-icons/si';

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
import './DevOpsRoutePage.css';

const IMAGE_ROOT = '/images/rutas';

const devopsMockup = {
    description:
        'Aprende a desplegar, automatizar y escalar aplicaciones.',
    IllustrationIcon: FiCloud,
    technologies: [
        { label: 'Docker', Icon: SiDocker, color: '#2496ed' },
        { label: 'Kubernetes', Icon: SiKubernetes, color: '#326ce5' },
        { label: 'AWS', Icon: FiCloud, color: '#ef9500' },
    ],
    stageVisuals: [
        { Icon: FiServer, color: '#f1192b' },
        { Icon: SiDocker, color: '#2496ed' },
        { Icon: FiGitBranch, color: '#8744d8' },
        { Icon: FiCloud, color: '#ef9500' },
        { Icon: FiBox, color: '#3283d8' },
    ],
    stageDescriptions: [
        'Conceptos de infraestructura, automatización y operaciones.',
        'Creación y administración de contenedores con Docker.',
        'Automatización de pruebas y despliegues mediante GitHub Actions.',
        'Fundamentos de infraestructura y servicios en AWS.',
        'Aplicación práctica de los conceptos de esta especialización.',
    ],
    projectExamples: [
        {
            title: 'Pipeline de CI/CD',
            description:
                'Ejemplo de automatización de pruebas y despliegues mediante GitHub Actions.',
            image: 'miniatura-pipeline-512.webp',
        },
        {
            title: 'API en contenedores',
            description:
                'Ejemplo de preparación y despliegue de una API utilizando Docker.',
            image: 'miniatura-api-productos-512.webp',
        },
        {
            title: 'Panel de información',
            description:
                'Ejemplo de visualización de información sobre servicios y despliegues.',
            image: 'miniatura-dashboard-512.webp',
        },
    ],
};

const normalizeText = (value) =>
    String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es')
        .trim();

export function DevOpsRoutePage() {
    const specializationKey = 'devops';
    const { accessToken, user, signOut } = useAuth();
    const navigate = useNavigate();

    const route = specializations.find(
        (item) => item.key === specializationKey
    );
    const visualContent = routeVisualContent[specializationKey];

    const streakDays = useStudentStreak(accessToken);

    const [search, setSearch] = useState('');
    const [selection, setSelection] = useState(null);
    const [selectionLoading, setSelectionLoading] = useState(true);
    const [selectionError, setSelectionError] = useState('');
    const [selectionSaving, setSelectionSaving] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [actionError, setActionError] = useState('');
    const [success, setSuccess] = useState('');
    const [plan, setPlan] = useState(null);

    useEffect(() => {
        if (!accessToken || !route) return undefined;

        let active = true;

        getCurrentStudentRoute(accessToken)
            .then((response) => {
                if (!active) return;
                setSelection(response?.selection ?? null);
                setSelectionError('');
            })
            .catch((error) => {
                if (!active) return;
                setSelectionError(
                    error?.message ||
                    'No se pudo consultar tu ruta elegida.'
                );
            })
            .finally(() => {
                if (active) setSelectionLoading(false);
            });

        return () => {
            active = false;
        };
    }, [accessToken, route]);

    useEffect(() => {
        if (!accessToken || !route) return undefined;

        let active = true;

        getCurrentLearningPlan(accessToken)
            .then((response) => {
                if (active) setPlan(response?.plan ?? null);
            })
            .catch(() => {
                if (active) setPlan(null);
            });

        return () => {
            active = false;
        };
    }, [accessToken, route]);

    const handleConfirm = async () => {
        if (
            !route ||
            !accessToken ||
            selectionLoading ||
            selectionError ||
            selectionSaving
        ) {
            return;
        }

        setSelectionSaving(true);
        setActionError('');
        setSuccess('');

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
                    'El servidor no confirmó la selección.'
                );
            }

            setSelection(response.selection);
            setConfirming(false);
            navigate(`/exercises/specializations/${specializationKey}`);
        } catch (error) {
            setActionError(
                error?.message ||
                'No fue posible guardar la especialización.'
            );
        } finally {
            setSelectionSaving(false);
        }
    };

    if (!route || !visualContent) {
        return (
            <main className="fr-content">
                <h1>Especialización no encontrada</h1>
                <Link to="/routes">
                    Volver al catálogo de rutas
                </Link>
            </main>
        );
    }

    const mockup = devopsMockup;

    const isSelected =
        selection?.specializationKey === route.key;

    const isRecommended =
        plan?.specializationKey === route.key;

    const title = `Ruta ${route.name.replace(
        /^Desarrollo\s+/,
        ''
    )}`;

    const searchItems = [
        ...route.technologies.map((technology) => ({
            title: technology.name,
            category: 'Tecnología',
        })),
        ...visualContent.stages.map((stage) => ({
            title: stage,
            category: 'Etapa de aprendizaje',
        })),
    ];

    const normalizedSearch = normalizeText(search);

    const searchResults = normalizedSearch
        ? searchItems.filter((item) =>
            normalizeText(item.title).includes(normalizedSearch)
        )
        : [];

    return (
        <main className={`inicio-layout route-detail route-detail--${route.key}`}>
            <LearningSidebar
                variant="profile"
                activeItem="routes"
                streakDays={streakDays}
                mascotSrc={`${IMAGE_ROOT}/compartidos/dragon-laptop-512.webp`}
                mascotAlt="Dragón de Learn2Code"
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
                    streakDays={streakDays}
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder={`Buscar en ${title}...`}
                />

                <div className="fr-content">
                    {normalizedSearch && (
                        <section
                            className="fr-search-results"
                            aria-label="Resultados de búsqueda"
                        >
                            <div className="fr-search-results-heading">
                                <strong>Resultados en {title}</strong>
                                <span>
                                    {searchResults.length} encontrados
                                </span>
                            </div>

                            {searchResults.length ? (
                                <div className="fr-search-results-list">
                                    {searchResults.map((item) => (
                                        <a
                                            key={`${item.category}-${item.title}`}
                                            href="#route-contents"
                                        >
                                            <strong>{item.title}</strong>
                                            <small>{item.category}</small>
                                        </a>
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

                    <section
                        className="route-detail-hero"
                        aria-labelledby="route-detail-title"
                    >
                        <div className="route-detail-hero-copy">
                            <div className="route-detail-heading">
                                <span
                                    className="route-detail-heading-icon"
                                    aria-hidden="true"
                                >
                                    <mockup.IllustrationIcon />
                                </span>

                                <h1 id="route-detail-title">
                                    {title}
                                </h1>
                            </div>

                            <p className="route-detail-description">
                                {mockup.description}
                            </p>

                            <p className="route-detail-context">
                                {route.detail}
                            </p>

                            <div
                                className="route-detail-highlights"
                                aria-label="Tecnologías destacadas"
                            >
                                {mockup.technologies
                                    .slice(0, 3)
                                    .map(({ label }) => (
                                        <span key={label}>
                                            <FiCheckCircle
                                                aria-hidden="true"
                                            />
                                            {label}
                                        </span>
                                    ))}
                            </div>

                            {isRecommended && (
                                <p className="route-detail-recommended">
                                    <FiStar aria-hidden="true" />
                                    Recomendada para ti
                                </p>
                            )}

                            <div className="route-detail-buttons">
                                <button
                                    type="button"
                                    className="route-detail-start"
                                    disabled={
                                        selectionLoading ||
                                        Boolean(selectionError) ||
                                        selectionSaving
                                    }
                                    onClick={() => {
                                        if (isSelected) {
                                            navigate(`/exercises/specializations/${specializationKey}`);
                                            return;
                                        }

                                        setConfirming(true);
                                        setActionError('');
                                        setSuccess('');

                                        document
                                            .getElementById('route-choice')
                                            ?.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'center',
                                            });
                                    }}
                                >
                                    Comenzar esta ruta
                                </button>

                                <a
                                    className="route-detail-plan"
                                    href="#route-contents"
                                >
                                    Ver plan completo
                                </a>
                            </div>

                            {isSelected && (
                                <p
                                    className="route-detail-selected"
                                    role="status"
                                >
                                    <FiCheckCircle aria-hidden="true" />
                                    Esta es tu ruta seleccionada
                                </p>
                            )}
                        </div>

                        <div className="route-detail-hero-art">
                            <img
                                className="route-detail-hero-composite"
                                src={`${IMAGE_ROOT}/detalles/devops/ilustracion-devops-original.webp`}
                                alt="Ilustración de DevOps con Docker, Kubernetes, automatización, nube y la mascota de Learn2Code"
                            />
                        </div>

                        <aside
                            className="route-detail-progress"
                            aria-label="Progreso de la especialización"
                        >
                            <h2>Tu progreso en esta ruta</h2>

                            <div className="route-detail-progress-summary">
                                <div
                                    className="route-detail-progress-ring"
                                    aria-label="Progreso aún no disponible"
                                >
                                    <strong>—</strong>
                                </div>

                                <div className="route-detail-progress-state">
                                    <strong>
                                        {selectionLoading
                                            ? 'Consultando...'
                                            : selectionError
                                                ? 'No disponible'
                                                : isSelected
                                                    ? 'Ruta seleccionada'
                                                    : 'Sin seleccionar'}
                                    </strong>

                                    <a href="#route-contents">
                                        Ver detalle
                                    </a>
                                </div>
                            </div>

                            <div className="route-detail-progress-metrics">
                                <div>
                                    <span>Duración estimada</span>
                                    <strong>
                                        {isRecommended &&
                                            Number.isInteger(plan?.estimatedWeeks) &&
                                            plan.estimatedWeeks > 0
                                            ? `${plan.estimatedWeeks} semanas`
                                            : 'Por definir'}
                                    </strong>
                                </div>

                                <div>
                                    <span>Módulos</span>
                                    <strong>Por definir</strong>
                                </div>

                                <div>
                                    <span>Proyectos</span>
                                    <strong>Por definir</strong>
                                </div>

                                <div>
                                    <span>Nivel</span>
                                    <strong>Por definir</strong>
                                </div>

                                <div>
                                    <span>Última actividad</span>
                                    <strong>No disponible</strong>
                                </div>
                            </div>
                        </aside>
                    </section>

                    <section
                        className="route-detail-summary"
                        aria-label="Resumen de la especialización"
                    >
                        <div className="route-detail-summary-technologies">
                            <span className="route-detail-summary-label">
                                Tecnologías clave
                            </span>

                            <div className="route-detail-summary-icons">
                                {mockup.technologies.map(
                                    ({ label, Icon, color }) => (
                                        <div
                                            className="route-detail-summary-technology"
                                            key={label}
                                        >
                                            <Icon
                                                aria-hidden="true"
                                                style={{ color }}
                                            />
                                            <span>{label}</span>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>

                        <div className="route-detail-summary-stat">
                            <span>Duración estimada</span>
                            <strong>
                                {isRecommended &&
                                    Number.isInteger(plan?.estimatedWeeks) &&
                                    plan.estimatedWeeks > 0
                                    ? `${plan.estimatedWeeks} semanas`
                                    : 'Por definir'}
                            </strong>
                        </div>

                        <div className="route-detail-summary-stat">
                            <span>Módulos</span>
                            <strong>Por definir</strong>
                        </div>

                        <div className="route-detail-summary-stat">
                            <span>Proyectos</span>
                            <strong>Por definir</strong>
                        </div>

                        <div className="route-detail-summary-stat">
                            <span>Nivel</span>
                            <strong>Por definir</strong>
                        </div>
                    </section>

                    <div
                        className="route-detail-content"
                        id="route-contents"
                    >
                        <nav
                            className="route-detail-section-nav"
                            aria-label="Secciones de la especialización"
                        >
                            <a href="#route-overview">
                                Descripción general
                            </a>
                            <a href="#route-roadmap">
                                Etapas
                            </a>
                            <a href="#route-projects">
                                Proyectos
                            </a>
                            <a href="#route-outcomes">
                                Habilidades
                            </a>
                        </nav>

                        <div className="route-detail-lower-grid">
                            <section
                                className="route-detail-learning-panel"
                                id="route-overview"
                            >
                                <div className="route-detail-learning-inner">
                                    <div className="route-detail-knowledge">
                                        <h2>¿Qué aprenderás?</h2>

                                        <p>
                                            Tecnologías y conceptos
                                            principales de esta
                                            especialización.
                                        </p>

                                        <ul className="route-detail-knowledge-list">
                                            {mockup.technologies.map(
                                                ({ label }) => (
                                                    <li key={label}>
                                                        <FiCheckCircle
                                                            aria-hidden="true"
                                                        />
                                                        <span>{label}</span>
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>

                                    <div
                                        className="route-detail-roadmap"
                                        id="route-roadmap"
                                    >
                                        <h2>Ruta de aprendizaje</h2>

                                        <p className="route-detail-roadmap-kicker">
                                            Tu camino de aprendizaje
                                        </p>

                                        <p className="route-detail-roadmap-description">
                                            Etapas orientativas de esta
                                            especialización.
                                        </p>

                                        <ol className="route-detail-roadmap-list">
                                            {visualContent.stages.map(
                                                (stage, index) => {
                                                    const stageVisual =
                                                        mockup.stageVisuals?.[index] ??
                                                        mockup.technologies[index];

                                                    const StageIcon =
                                                        stageVisual?.Icon ?? FiBox;

                                                    const stageColor =
                                                        stageVisual?.color ?? '#ef192c';

                                                    return (
                                                        <li
                                                            className="route-detail-roadmap-card"
                                                            key={stage}
                                                        >
                                                            <span className="route-detail-roadmap-number">
                                                                {index + 1}
                                                            </span>

                                                            <div className="route-detail-roadmap-item">
                                                                <span className="route-detail-roadmap-icon">
                                                                    <StageIcon
                                                                        aria-hidden="true"
                                                                        style={{
                                                                            color: stageColor,
                                                                        }}
                                                                    />
                                                                </span>

                                                                <div className="route-detail-roadmap-item-copy">
                                                                    <strong>
                                                                        {stage}
                                                                    </strong>

                                                                    <span>
                                                                        {mockup.stageDescriptions?.[index] ??
                                                                            'Contenido detallado por definir'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    );
                                                },
                                            )}
                                        </ol>
                                    </div>
                                </div>

                                <p className="route-detail-disclaimer">
                                    Los módulos, ejercicios y proyectos
                                    definitivos dependerán del plan
                                    disponible para esta especialización.
                                </p>
                            </section>

                            <aside
                                className="route-detail-projects-panel"
                                id="route-projects"
                            >
                                <h2>
                                    {mockup.projectExamples
                                        ? 'Proyectos que podrías construir'
                                        : 'Proyectos que construirás'}
                                </h2>

                                {mockup.projectExamples ? (
                                    <>
                                        <p className="route-detail-projects-intro">
                                            Ejemplos ilustrativos. Su disponibilidad
                                            dependerá de los contenidos de la plataforma.
                                        </p>

                                        <div className="route-detail-project-list">
                                            {mockup.projectExamples.map((project) => (
                                                <article
                                                    className="route-detail-project-card"
                                                    key={project.title}
                                                >
                                                    <img
                                                        src={`${IMAGE_ROOT}/detalles/${route.key}/proyectos/${project.image}`}
                                                        alt={`Ejemplo ilustrativo de ${project.title}`}
                                                        loading="lazy"
                                                    />

                                                    <div className="route-detail-project-card-content">
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
                                    </>
                                ) : (
                                    <div className="route-detail-projects-placeholder">
                                        <FiBox aria-hidden="true" />

                                        <strong>
                                            Proyectos por definir
                                        </strong>

                                        <p>
                                            Los proyectos disponibles se
                                            mostrarán cuando estén asociados
                                            al plan de esta especialización.
                                        </p>
                                    </div>
                                )}

                                <section
                                    className="route-detail-outcomes"
                                    id="route-outcomes"
                                >
                                    <h3>
                                        {visualContent.insightTitle}
                                    </h3>

                                    <p>{visualContent.insight}</p>
                                </section>
                            </aside>
                        </div>
                    </div>

                    <footer className="fr-footer" id="route-choice">
                        <div>
                            <strong>
                                {isSelected
                                    ? 'Tu especialización actual'
                                    : '¿Quieres elegir esta ruta?'}
                            </strong>
                            <p>
                                La elección solo se guardará cuando
                                confirmes el cambio.
                            </p>
                        </div>

                        <div className="fr-selection-actions">
                            {selectionError && (
                                <p role="alert">{selectionError}</p>
                            )}
                            {actionError && (
                                <p role="alert">{actionError}</p>
                            )}
                            {success && (
                                <p role="status">
                                    <FiCheckCircle aria-hidden="true" />
                                    {' '}{success}
                                </p>
                            )}

                            <button
                                type="button"
                                className="fr-select-button"
                                disabled={
                                    isSelected ||
                                    selectionLoading ||
                                    Boolean(selectionError) ||
                                    selectionSaving
                                }
                                onClick={() => {
                                    setConfirming(true);
                                    setActionError('');
                                    setSuccess('');
                                }}
                            >
                                {isSelected
                                    ? 'Ruta seleccionada'
                                    : 'Seleccionar esta ruta'}
                                <FiArrowRight aria-hidden="true" />
                            </button>

                            {confirming && !isSelected && (
                                <div className="fr-confirmation">
                                    <p>¿Confirmas tu elección?</p>
                                    <p>
                                        ¿Deseas guardar {route.name}
                                        {' '}como tu especialización?
                                    </p>

                                    <div className="fr-confirmation-buttons">
                                        <button
                                            type="button"
                                            className="fr-cancel-button"
                                            disabled={selectionSaving}
                                            onClick={() => {
                                                setConfirming(false);
                                                setActionError('');
                                            }}
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            type="button"
                                            className="fr-select-button"
                                            disabled={selectionSaving}
                                            aria-busy={selectionSaving}
                                            onClick={handleConfirm}
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

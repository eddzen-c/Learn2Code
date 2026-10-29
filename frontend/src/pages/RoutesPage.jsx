
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
    FiArrowRight,
    FiChevronDown,
    FiChevronUp,
    FiCompass,
    FiSearch,
    FiStar,
} from 'react-icons/fi';

import { useAuth } from '../auth/useAuth.js';
import { getCurrentLearningPlan } from '../api/learning-paths.api.js';
import { LearningSidebar } from '../components/LearningSidebar.jsx';

import './RoutesPage.css';

const IMAGE_ROOT = '/images/rutas';

const specializations = [
    {
        key: 'frontend',
        name: 'Desarrollo Frontend',
        subtitle: 'Da vida a las interfaces',
        description:
            'Aprende a construir sitios y aplicaciones web atractivas, ' +
            'accesibles e interactivas.',
        icon: 'ruta-frontend.svg',
        technologies: [
            { name: 'HTML', icon: 'tecnologia-html.svg' },
            { name: 'CSS', icon: 'tecnologia-css.svg' },
            { name: 'JavaScript', icon: 'tecnologia-javascript.svg' },
            { name: 'React', icon: 'tecnologia-react.svg' },
        ],
        detail:
            'Explora la estructura de una página, los estilos, ' +
            'la interacción y la creación de componentes reutilizables.',
    },
    {
        key: 'backend',
        name: 'Desarrollo Backend',
        subtitle: 'Construye lo que sucede detrás',
        description:
            'Descubre cómo funcionan los servidores, las APIs, ' +
            'la lógica de negocio y las bases de datos.',
        icon: 'ruta-backend.svg',
        technologies: [
            { name: 'Node.js', icon: 'tecnologia-node.svg' },
            { name: 'Express', icon: 'tecnologia-express.svg' },
            { name: 'PostgreSQL', icon: 'tecnologia-postgresql.svg' },
            { name: 'APIs', icon: 'tecnologia-api.svg' },
        ],
        detail:
            'Conoce cómo procesar solicitudes, organizar servicios, ' +
            'persistir información y conectar aplicaciones.',
    },
    {
        key: 'fullstack',
        name: 'Desarrollo Full Stack',
        subtitle: 'Conecta todas las piezas',
        description:
            'Combina interfaces, servidores y bases de datos ' +
            'para desarrollar aplicaciones completas.',
        icon: 'ruta-full-stack.svg',
        technologies: [
            { name: 'React', icon: 'tecnologia-react.svg' },
            { name: 'Node.js', icon: 'tecnologia-node.svg' },
            { name: 'JavaScript', icon: 'tecnologia-javascript.svg' },
            { name: 'PostgreSQL', icon: 'tecnologia-postgresql.svg' },
        ],
        detail:
            'Comprende el recorrido de la información desde la ' +
            'interfaz hasta el servidor y la base de datos.',
    },
    {
        key: 'devops',
        name: 'DevOps',
        subtitle: 'Automatiza y despliega',
        description:
            'Explora las herramientas para preparar, automatizar ' +
            'y desplegar aplicaciones de software.',
        icon: 'ruta-devops.svg',
        technologies: [
            { name: 'Docker', icon: 'tecnologia-docker.svg' },
            { name: 'Kubernetes', icon: 'tecnologia-kubernetes.svg' },
            { name: 'AWS', icon: 'tecnologia-aws.svg' },
            { name: 'GitHub Actions', icon: 'tecnologia-acciones.svg' },
        ],
        detail:
            'Conoce los fundamentos de contenedores, integración ' +
            'continua, automatización e infraestructura.',
    },
];

export function RoutesPage() {
    const { accessToken, user } = useAuth();

    const [search, setSearch] = useState('');
    const [expandedRoute, setExpandedRoute] = useState(null);
    const [recommendedKey, setRecommendedKey] = useState(null);
    const [recommendationStatus, setRecommendationStatus] =
        useState('loading');
    const [retryCount, setRetryCount] = useState(0);

    const firstName =
        user?.fullName?.trim().split(/\s+/)[0] || 'Estudiante';

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

                setRecommendedKey(
                    response?.plan?.specializationKey ?? null,
                );
                setRecommendationStatus('success');
            })
            .catch(() => {
                if (!active) {
                    return;
                }

                setRecommendedKey(null);
                setRecommendationStatus('error');
            });

        return () => {
            active = false;
        };
    }, [accessToken, retryCount]);

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

    return (
        <main className="onboarding-page routes-page">
            <LearningSidebar
                activeItem="routes"
                mascotSrc={`${IMAGE_ROOT}/compartidos/dragon-laptop-512.webp`}
                mascotAlt="Dragón de Learn2Code con una laptop"
                messageTitle="¡Descubre tu camino!"
                message="Explora las especializaciones y elige la que más te inspire."
            />

            <section className="onboarding-content">
                <header className="routes-topbar">
                    <div className="routes-topbar-title">
                        <FiCompass aria-hidden="true" />
                        <span>Explorar rutas de aprendizaje</span>
                    </div>

                    <div className="routes-user">
                        <span className="routes-user-avatar" aria-hidden="true">
                            {firstName.charAt(0).toUpperCase()}
                        </span>

                        <div>
                            <strong>{firstName}</strong>
                            <small>Estudiante</small>
                        </div>
                    </div>
                </header>

                <div className="routes-content">
                    <section className="routes-hero">
                        <div className="routes-hero-copy">
                            <span className="routes-eyebrow">
                                <FiCompass aria-hidden="true" />
                                TU PRÓXIMA AVENTURA
                            </span>

                            <h1>Elige tu camino para aprender</h1>

                            <p>
                                Cada desarrollador tiene una historia diferente.
                                Explora las especializaciones de Learn2Code
                                y descubre cuál se adapta mejor a tus intereses
                                y objetivos.
                            </p>

                            <p className="routes-hero-note">
                                Puedes explorar todas las opciones antes de
                                elegir. Consultar una ruta no la activa.
                            </p>
                        </div>

                        <img
                            className="routes-hero-dragon"
                            src={`${IMAGE_ROOT}/compartidos/dragon-laptop-512.webp`}
                            alt="Mascota de Learn2Code preparada para aprender"
                        />
                    </section>

                    <section
                        className="routes-recommendation"
                        aria-label="Recomendación personalizada"
                    >
                        <div className="routes-recommendation-icon">
                            <FiStar aria-hidden="true" />
                        </div>

                        <div className="routes-recommendation-copy">
                            <strong>Tu recomendación personalizada</strong>

                            {recommendationStatus === 'loading' && (
                                <p role="status">
                                    Consultando tu plan recomendado...
                                </p>
                            )}

                            {recommendationStatus === 'success' && (
                                <p>
                                    {recommendedKey
                                        ? 'Hemos señalado la especialización recomendada según tu diagnóstico y tus intereses.'
                                        : 'Aún no tienes una recomendación disponible. Puedes explorar las cuatro opciones.'}
                                </p>
                            )}

                            {recommendationStatus === 'error' && (
                                <p role="alert">
                                    No fue posible consultar tu recomendación.
                                    Puedes explorar las rutas de todos modos.
                                </p>
                            )}
                        </div>

                        {recommendationStatus === 'error' ? (
                            <button
                                className="routes-secondary-button"
                                type="button"
                                onClick={() => {
                                    setRecommendationStatus('loading');
                                    setRetryCount((count) => count + 1);
                                }}
                            >
                                Reintentar
                            </button>
                        ) : (
                            <Link
                                className="routes-secondary-button"
                                to="/recommended-plan"
                            >
                                Ver mi plan
                            </Link>
                        )}
                    </section>

                    <section
                        className="routes-explore"
                        aria-labelledby="routes-explore-title"
                    >
                        <div className="routes-section-heading">
                            <div>
                                <h2 id="routes-explore-title">
                                    Explora las especializaciones
                                </h2>
                                <p>
                                    Conoce las tecnologías y descubre qué
                                    puedes aprender en cada camino.
                                </p>
                            </div>

                            <label className="routes-search">
                                <FiSearch aria-hidden="true" />
                                <input
                                    type="search"
                                    aria-label="Buscar especializaciones"
                                    placeholder="Buscar rutas o tecnologías..."
                                    value={search}
                                    onChange={(event) => {
                                        setSearch(event.target.value);
                                    }}
                                />
                            </label>
                        </div>

                        <div className="routes-grid">
                            {filteredRoutes.map((route) => {
                                const isExpanded =
                                    expandedRoute === route.key;
                                const isRecommended =
                                    recommendedKey === route.key;

                                return (
                                    <article
                                        className={`routes-card${isRecommended ? ' is-recommended' : ''}`}
                                        key={route.key}
                                    >
                                        <div className="routes-card-top">
                                            <img
                                                className="routes-card-icon"
                                                src={`${IMAGE_ROOT}/seleccion/${route.icon}`}
                                                alt=""
                                                aria-hidden="true"
                                            />

                                            {isRecommended && (
                                                <span className="routes-card-badge">
                                                    <FiStar aria-hidden="true" />
                                                    Recomendada para ti
                                                </span>
                                            )}
                                        </div>

                                        <span className="routes-card-subtitle">
                                            {route.subtitle}
                                        </span>

                                        <h3>{route.name}</h3>
                                        <p className="routes-card-description">
                                            {route.description}
                                        </p>

                                        <div className="routes-card-tech">
                                            {route.technologies.map((tech) => (
                                                <span
                                                    className="routes-tech"
                                                    key={tech.name}
                                                >
                                                    <img
                                                        src={`${IMAGE_ROOT}/tecnologias/${tech.icon}`}
                                                        alt=""
                                                        aria-hidden="true"
                                                    />
                                                    {tech.name}
                                                </span>
                                            ))}
                                        </div>

                                        {route.key === 'frontend' ? (
                                            <Link
                                                className="routes-card-button"
                                                to="/routes/frontend"
                                            >
                                                Ver detalles de la ruta
                                                <FiArrowRight aria-hidden="true" />
                                            </Link>
                                        ) : (
                                            <button
                                                className="routes-card-button"
                                                type="button"
                                                aria-expanded={isExpanded}
                                                aria-controls={`route-details-${route.key}`}
                                                onClick={() => {
                                                    setExpandedRoute(
                                                        isExpanded ? null : route.key,
                                                    );
                                                }}
                                            >
                                                {isExpanded
                                                    ? 'Ocultar información'
                                                    : 'Conocer esta ruta'}

                                                {isExpanded ? (
                                                    <FiChevronUp aria-hidden="true" />
                                                ) : (
                                                    <FiChevronDown aria-hidden="true" />
                                                )}
                                            </button>
                                        )}

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
                                                    Esto es una vista informativa.
                                                    No has seleccionado una ruta.
                                                </small>
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
                        <div>
                            <strong>
                                Tu futuro comienza con una elección
                            </strong>
                            <p>
                                Explora a tu ritmo. La selección definitiva
                                estará disponible en el detalle de cada ruta.
                            </p>
                        </div>

                        <Link to="/recommended-plan">
                            Revisar mi recomendación
                            <FiArrowRight aria-hidden="true" />
                        </Link>
                    </footer>
                </div>
            </section>
        </main>
    );
}

import {
    useState,
} from 'react'

import {
    Link,

} from 'react-router-dom';

import {
    FiArrowRight,
    //FiAward,
    FiCode,
    FiGitBranch,
    FiLayers,
    FiMenu,
    FiServer,
    FiUsers,
    FiX,
    FiPlay,
    FiTarget,
    FiDatabase,
    FiFolder,
    FiCheckCircle,
    FiMessageCircle,
    FiStar,
    FiUser,
} from 'react-icons/fi';

import './landing-page.css'

const imageRoot =
    '/images/Learn2Code_Dragones_Responsive'

const navigation = [
    ['caracteristicas', 'Características'],
    ['rutas', 'Rutas'],
    ['cursos', 'Cursos'],
    ['precios', 'Precios'],
    ['comunidad', 'Comunidad'],
]

const features = [
    {
        Icon: FiTarget,
        title: 'Diagnóstico inicial',
        description:
            'Identifica tus bases y los temas que necesitas reforzar.',
    },
    {
        Icon: FiLayers,
        title: 'Tu profesor IA',
        description:
            'Propuesta de acompañamiento con explicaciones, ejemplos y pistas.',
    },
    {
        Icon: FiCode,
        title: 'Práctica adaptativa',
        description:
            'Trabaja ejercicios personalizados según tu nivel y progreso.',
    },
]

const learningPaths = [
    {
        name: 'Frontend',
        Icon: FiCode,
        tone: 'red',
        description:
            'Interfaces, componentes y experiencias para la web.',
        technologies: [
            'HTML',
            'CSS',
            'JavaScript',
            'React',
        ],
        showDragon: true,
    },
    {
        name: 'Backend',
        Icon: FiServer,
        tone: 'green',
        description:
            'Lógica del servidor, bases de datos y APIs.',
        technologies: [
            'Node.js',
            'Express',
            'PostgreSQL',
        ],
    },
    {
        name: 'Full Stack',
        Icon: FiLayers,
        tone: 'purple',
        description:
            'Conecta interfaces y servicios en una misma aplicación.',
        technologies: [
            'React',
            'Node.js',
            'PostgreSQL',
        ],
    },
    {
        name: 'DevOps',
        Icon: FiGitBranch,
        tone: 'neutral',
        description:
            'Entornos, automatización y despliegue de aplicaciones.',
        technologies: [
            'Git',
            'Docker',
            'CI/CD',
        ],
    },
]

const routeOutlines = {
    Frontend: [
        'Estructura de páginas con HTML',
        'Diseño adaptable con CSS',
        'Interactividad con JavaScript',
        'Introducción a componentes con React',
    ],
    Backend: [
        'Fundamentos de Node.js',
        'Creación de APIs con Express',
        'Consultas y relaciones en PostgreSQL',
        'Autenticación y validación de datos',
    ],
    'Full Stack': [
        'Interfaces con React',
        'Servicios con Node.js y Express',
        'Integración entre frontend y backend',
        'Persistencia con PostgreSQL',
    ],
    DevOps: [
        'Control de versiones con Git',
        'Entornos reproducibles con Docker',
        'Introducción a integración continua',
        'Preparación del despliegue',
    ],
}

const courseCatalog = [
    {
        id: 'javascript-dom',
        title: 'JavaScript y DOM',
        symbol: 'JS',
        tone: 'javascript',
        Icon: FiCode,
        description:
            'Conecta los fundamentos de JavaScript con los elementos de una página.',
        preview: [
            'const titulo = document.querySelector("h1");',
            'titulo.textContent = "Hola, mundo";',
            'titulo.style.color = "#ff1236";',
        ].join('\n'),
        topics: [
            'Selección de elementos',
            'Eventos y respuestas a interacciones',
            'Cambios de contenido y estilos',
            'Proyecto propuesto: página interactiva',
        ],
    },
    {
        id: 'react-componentes',
        title: 'React: componentes y estado',
        symbol: 'React',
        tone: 'react',
        Icon: FiLayers,
        description:
            'Explora componentes, propiedades y estado para crear interfaces.',
        preview: [
            'const [tareas, setTareas] = useState([]);',
            '',
            'function agregarTarea(nuevaTarea) {',
            '  setTareas([...tareas, nuevaTarea]);',
            '}',
        ].join('\n'),
        topics: [
            'Componentes y propiedades',
            'Estado e interacciones',
            'Listas y formularios',
            'Proyecto propuesto: lista de tareas',
        ],
    },
    {
        id: 'postgresql',
        title: 'Bases de datos con PostgreSQL',
        symbol: 'SQL',
        tone: 'postgres',
        Icon: FiDatabase,
        description:
            'Conoce cómo organizar, consultar y relacionar datos de una aplicación.',
        preview: [
            'SELECT nombre, email',
            'FROM usuarios',
            'WHERE activo = true',
            'ORDER BY nombre;',
        ].join('\n'),
        topics: [
            'Tablas y tipos de datos',
            'Consultas y filtros',
            'Relaciones y restricciones',
            'Proyecto propuesto: catálogo de datos',
        ],
    },
]

function LandingDragon({
    variant = 'principal',
}) {
    const isFrontend =
        variant === 'frontend'

    const directory = isFrontend
        ? '02-Dragon-tarjeta-frontend'
        : '01-Dragon-principal'

    const filename = isFrontend
        ? 'dragon-frontend'
        : 'dragon-principal'

    const sourceRoot =
        `${imageRoot}/${directory}`

    return (
        <picture>
            <source
                sizes={
                    isFrontend
                        ? '140px'
                        : '(max-width: 700px) 88vw, 560px'
                }
                srcSet={[
                    `${sourceRoot}/WebP/${filename}-384.webp 384w`,
                    `${sourceRoot}/WebP/${filename}-512.webp 512w`,
                    `${sourceRoot}/WebP/${filename}-768.webp 768w`,
                    `${sourceRoot}/WebP/${filename}-1024.webp 1024w`,
                ].join(', ')}
                type="image/webp"
            />

            <img
                alt={
                    isFrontend
                        ? ''
                        : 'Dragón de Learn2Code programando con su laptop'
                }
                className={
                    isFrontend
                        ? 'l2c-card-dragon'
                        : 'l2c-hero-dragon'
                }
                height="512"
                loading={
                    isFrontend
                        ? 'lazy'
                        : 'eager'
                }
                src={
                    `${sourceRoot}/PNG/${filename}-512.png`
                }
                width="512"
            />
        </picture>
    )
}

export function LandingPage() {
    const [menuOpen, setMenuOpen] =
        useState(false)

    const [editorTab, setEditorTab] =
        useState('html')

    const [exampleExecuted, setExampleExecuted] =
        useState(false)

    const exampleCode =
        editorTab === 'html'
            ? '<h1>Hola, mundo</h1>'
            : [
                'h1 {',
                '  color: #171b24;',
                '  font-family: sans-serif;',
                '}',
            ].join('\n')

    const closeMenu = () => {
        setMenuOpen(false)
    }

    return (
        <div className="l2c-landing">
            <a
                className="l2c-skip"
                href="#landing-main"
            >
                Saltar al contenido
            </a>

            <header className="l2c-header">
                <div className="l2c-container l2c-navigation">
                    <Link
                        aria-label="Learn2Code, inicio"
                        className="l2c-brand"
                        onClick={closeMenu}
                        to="/"
                    >
                        <img
                            alt=""
                            height="42"
                            src={
                                `${imageRoot}/03-Isotipo-oficial/PNG/isotipo-oficial-96.png`
                            }
                            width="42"
                        />

                        <span>
                            Learn<span>2</span>Code
                        </span>
                    </Link>

                    <button
                        aria-controls="landing-navigation"
                        aria-expanded={menuOpen}
                        aria-label={
                            menuOpen
                                ? 'Cerrar menú'
                                : 'Abrir menú'
                        }
                        className="l2c-menu-toggle"
                        onClick={() => {
                            setMenuOpen(!menuOpen)
                        }}
                        type="button"
                    >
                        {
                            menuOpen
                                ? <FiX aria-hidden="true" />
                                : <FiMenu aria-hidden="true" />
                        }
                    </button>

                    <nav
                        aria-label="Navegación de la landing"
                        className={
                            `l2c-nav${menuOpen ? ' is-open' : ''}`
                        }
                        id="landing-navigation"
                    >
                        {
                            navigation.map(([id, label]) => (
                                <a
                                    href={`#${id}`}
                                    key={id}
                                    onClick={closeMenu}
                                >
                                    {label}
                                </a>
                            ))
                        }

                        <div className="l2c-mobile-auth">
                            <Link
                                onClick={closeMenu}
                                to="/login"
                            >
                                Iniciar sesión
                            </Link>

                            <Link
                                onClick={closeMenu}
                                to="/register"
                            >
                                Crear cuenta
                            </Link>
                        </div>
                    </nav>

                    <div className="l2c-auth-actions">
                        <Link
                            className="l2c-button l2c-button-outline"
                            to="/login"
                        >
                            Iniciar sesión
                        </Link>

                        <Link
                            className="l2c-button"
                            to="/register"
                        >
                            Crear cuenta
                        </Link>
                    </div>
                </div>
            </header>

            <main id="landing-main">
                <section
                    aria-labelledby="landing-title"
                    className="l2c-dark-cover"
                >
                    <div className="l2c-container l2c-hero">
                        <div className="l2c-hero-copy">
                            <p className="l2c-pill">
                                <FiLayers aria-hidden="true" />

                                Aprendizaje de programación con IA
                            </p>

                            <h1 id="landing-title">
                                Aprende programación.
                                <br />
                                Construye{' '}
                                <span>tu futuro.</span>
                            </h1>

                            <p className="l2c-hero-description">
                                Conoce tu nivel, encuentra tu
                                siguiente reto y practica a tu ritmo.
                            </p>

                            <div className="l2c-hero-actions">
                                <Link
                                    className="l2c-button"
                                    to="/register"
                                >
                                    Crear mi cuenta

                                    <FiArrowRight aria-hidden="true" />
                                </Link>

                                <a
                                    className="l2c-button l2c-button-outline"
                                    href="#rutas"
                                >
                                    Ver rutas
                                </a>
                            </div>

                            <ul className="l2c-hero-benefits">
                                <li>
                                    <span
                                        aria-hidden="true"
                                        className="l2c-benefit-check"
                                    >
                                        ✓
                                    </span>

                                    Desde la web
                                </li>

                                <li>
                                    <span
                                        aria-hidden="true"
                                        className="l2c-benefit-check"
                                    >
                                        ✓
                                    </span>

                                    Práctica personalizada
                                </li>

                                <li>
                                    <span
                                        aria-hidden="true"
                                        className="l2c-benefit-check"
                                    >
                                        ✓
                                    </span>

                                    A tu ritmo
                                </li>
                            </ul>
                        </div>

                        <div className="l2c-hero-art">
                            <div
                                aria-hidden="true"
                                className="l2c-art-grid"
                            />

                            <aside
                                aria-label="Vista previa del profesor IA"
                                className="l2c-teacher-preview"
                            >
                                <header>
                                    <span className="l2c-teacher-icon">
                                        <FiUsers aria-hidden="true" />
                                    </span>

                                    <div>
                                        <strong>
                                            Profesor IA
                                        </strong>

                                        <small>
                                            Función propuesta
                                        </small>
                                    </div>
                                </header>

                                <p>
                                    ¿Probamos con un ejemplo
                                    más sencillo?
                                </p>

                                <div
                                    aria-label="Tipos de ayuda previstos"
                                    className="l2c-teacher-tools"
                                >
                                    <span>Explicación</span>
                                    <span>Pista</span>
                                    <span>Nuevo reto</span>
                                </div>
                            </aside>

                            <div
                                aria-hidden="true"
                                className="l2c-floating-code l2c-floating-code-left"
                            >
                                {'{ }'}
                            </div>

                            <div
                                aria-hidden="true"
                                className="l2c-floating-code l2c-floating-code-right"
                            >
                                <FiCode />
                            </div>

                            <LandingDragon />
                        </div>
                    </div>
                </section>

                <div className="l2c-light-content">
                    <section
                        aria-labelledby="features-title"
                        className="l2c-container l2c-feature-section"
                        id="caracteristicas"
                    >
                        <div className="l2c-section-heading l2c-heading-left">
                            <p className="l2c-kicker">
                                CARACTERÍSTICAS
                            </p>

                            <h2 id="features-title">
                                Un camino pensado para ti
                            </h2>

                            <p>
                                Diagnóstico y práctica que dan
                                contexto a tu aprendizaje.
                            </p>
                        </div>

                        <div className="l2c-features-grid">
                            {
                                features.map(({
                                    Icon,
                                    title,
                                    description,
                                }) => (
                                    <article key={title}>
                                        <div className="l2c-feature-icon">
                                            <Icon aria-hidden="true" />
                                        </div>

                                        <div>
                                            <h3>{title}</h3>

                                            <p>{description}</p>
                                        </div>
                                    </article>
                                ))
                            }
                        </div>

                        <div className="l2c-editor-showcase">
                            <div className="l2c-editor-window">
                                <div className="l2c-editor-toolbar">
                                    <div
                                        aria-label="Archivos del ejemplo"
                                        className="l2c-editor-tabs"
                                        role="tablist"
                                    >
                                        <button
                                            aria-controls="landing-editor-panel"
                                            aria-selected={editorTab === 'html'}
                                            id="landing-html-tab"
                                            onClick={() => {
                                                setEditorTab('html')
                                            }}
                                            role="tab"
                                            type="button"
                                        >
                                            index.html
                                        </button>

                                        <button
                                            aria-controls="landing-editor-panel"
                                            aria-selected={editorTab === 'css'}
                                            id="landing-css-tab"
                                            onClick={() => {
                                                setEditorTab('css')
                                            }}
                                            role="tab"
                                            type="button"
                                        >
                                            styles.css
                                        </button>
                                    </div>

                                    <button
                                        className="l2c-example-run"
                                        onClick={() => {
                                            setExampleExecuted(true)
                                        }}
                                        type="button"
                                    >
                                        <FiPlay aria-hidden="true" />

                                        Ejecutar ejemplo
                                    </button>
                                </div>

                                <div className="l2c-editor-body">
                                    <div
                                        aria-labelledby={
                                            editorTab === 'html'
                                                ? 'landing-html-tab'
                                                : 'landing-css-tab'
                                        }
                                        className="l2c-editor-source"
                                        id="landing-editor-panel"
                                        role="tabpanel"
                                        tabIndex={0}
                                    >
                                        <pre>
                                            <code>{exampleCode}</code>
                                        </pre>
                                    </div>

                                    <div className="l2c-example-browser">
                                        <div
                                            aria-hidden="true"
                                            className="l2c-example-browser-bar"
                                        >
                                            <span />
                                            <span />
                                            <span />
                                        </div>

                                        <div
                                            aria-live="polite"
                                            className="l2c-example-output"
                                            role="status"
                                        >
                                            {
                                                exampleExecuted
                                                    ? (
                                                        <strong>
                                                            Hola, mundo
                                                        </strong>
                                                    )
                                                    : (
                                                        <p>
                                                            Ejecuta el ejemplo para
                                                            mostrar su resultado.
                                                        </p>
                                                    )
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="l2c-editor-explanation">
                                <p className="l2c-kicker">
                                    DEL CÓDIGO AL RESULTADO
                                </p>

                                <h3>
                                    Escribe, ejecuta y comprende
                                </h3>

                                <p>
                                    Explora cómo una línea de HTML
                                    se convierte en contenido visible.
                                </p>

                                <ul>
                                    <li>
                                        <span aria-hidden="true">✓</span>

                                        Código y resultado en un mismo lugar
                                    </li>

                                    <li>
                                        <span aria-hidden="true">✓</span>

                                        Conceptos pequeños y claros
                                    </li>

                                    <li>
                                        <span aria-hidden="true">✓</span>

                                        Aprende paso a paso
                                    </li>
                                </ul>

                                <small>
                                    Demostración fija de HTML y CSS.
                                    No ejecuta código del estudiante.
                                </small>
                            </div>
                        </div>
                    </section>

                    <section
                        aria-labelledby="routes-title"
                        className="l2c-container l2c-section l2c-routes-section"
                        id="rutas"
                    >
                        <div className="l2c-section-heading l2c-heading-left">
                            <p className="l2c-kicker">
                                RUTAS
                            </p>

                            <h2 id="routes-title">
                                Elige hacia dónde quieres crecer
                            </h2>

                            <p>
                                Conoce las especialidades propuestas
                                y los temas que contempla cada camino.
                            </p>
                        </div>

                        <div className="l2c-route-grid">
                            {
                                learningPaths.map(({
                                    name,
                                    Icon,
                                    tone,
                                    description,
                                    technologies,
                                    showDragon,
                                }) => (
                                    <article
                                        className={
                                            `l2c-route-card l2c-tone-${tone}`
                                        }
                                        key={name}
                                    >
                                        <div className="l2c-route-card-top">
                                            <span className="l2c-route-icon">
                                                <Icon aria-hidden="true" />
                                            </span>

                                            {
                                                showDragon && (
                                                    <div className="l2c-route-dragon">
                                                        <LandingDragon
                                                            variant="frontend"
                                                        />
                                                    </div>
                                                )
                                            }
                                        </div>

                                        <h3>Ruta {name}</h3>

                                        <p>{description}</p>

                                        <ul
                                            aria-label={
                                                `Tecnologías propuestas para ${name}`
                                            }
                                            className="l2c-tech-tags"
                                        >
                                            {
                                                technologies.map(
                                                    (technology) => (
                                                        <li key={technology}>
                                                            {technology}
                                                        </li>
                                                    ),
                                                )
                                            }
                                        </ul>

                                        <div className="l2c-route-projects">
                                            <FiFolder aria-hidden="true" />

                                            Proyectos previstos
                                        </div>

                                        <details className="l2c-route-details">
                                            <summary>
                                                Ver ruta

                                                <FiArrowRight aria-hidden="true" />
                                            </summary>

                                            <div className="l2c-route-outline">
                                                <span>
                                                    Temario propuesto
                                                </span>

                                                <ol>
                                                    {
                                                        routeOutlines[name].map(
                                                            (topic) => (
                                                                <li key={topic}>
                                                                    {topic}
                                                                </li>
                                                            ),
                                                        )
                                                    }
                                                </ol>

                                                <p>
                                                    Ruta en preparación.
                                                </p>
                                            </div>
                                        </details>
                                    </article>
                                ))
                            }
                        </div>
                    </section>

                    <section
                        aria-labelledby="courses-title"
                        className="l2c-container l2c-section l2c-catalog-section"
                        id="cursos"
                    >
                        <div className="l2c-catalog-heading">
                            <div className="l2c-section-heading l2c-heading-left">
                                <p className="l2c-kicker">
                                    CURSOS
                                </p>

                                <h2 id="courses-title">
                                    Aprende una habilidad.
                                    Ponla en práctica.
                                </h2>

                                <p>
                                    Propuesta de cursos que conectan
                                    conceptos con ejercicios y proyectos.
                                </p>
                            </div>

                            <a
                                className="l2c-explore-link"
                                href="#landing-course-list"
                            >
                                Explorar cursos

                                <FiArrowRight aria-hidden="true" />
                            </a>
                        </div>

                        <div
                            className="l2c-catalog-grid"
                            id="landing-course-list"
                        >
                            {
                                courseCatalog.map(({
                                    id,
                                    title,
                                    symbol,
                                    tone,
                                    Icon,
                                    description,
                                    preview,
                                    topics,
                                }) => (
                                    <article
                                        className={
                                            `l2c-catalog-card l2c-course-${tone}`
                                        }
                                        key={id}
                                    >
                                        <div className="l2c-catalog-card-heading">
                                            <span
                                                aria-hidden="true"
                                                className="l2c-catalog-symbol"
                                            >
                                                {
                                                    symbol === 'JS'
                                                        ? symbol
                                                        : <Icon />
                                                }
                                            </span>

                                            <div>
                                                <h3>{title}</h3>

                                                <span className="l2c-course-label">
                                                    Curso propuesto
                                                </span>
                                            </div>
                                        </div>

                                        <p className="l2c-catalog-description">
                                            {description}
                                        </p>

                                        <div className="l2c-course-preview">
                                            <span>
                                                Ejemplo ilustrativo
                                            </span>

                                            <pre>
                                                <code>{preview}</code>
                                            </pre>
                                        </div>

                                        <details className="l2c-course-details">
                                            <summary>
                                                Ver curso

                                                <FiArrowRight aria-hidden="true" />
                                            </summary>

                                            <div className="l2c-course-outline">
                                                <strong>
                                                    Contenido previsto
                                                </strong>

                                                <ul>
                                                    {
                                                        topics.map((topic) => (
                                                            <li key={topic}>
                                                                {topic}
                                                            </li>
                                                        ))
                                                    }
                                                </ul>

                                                <p>
                                                    ......
                                                </p>
                                            </div>
                                        </details>
                                    </article>
                                ))
                            }
                        </div>
                    </section>

                    <section
                        aria-labelledby="pricing-title"
                        className="l2c-container l2c-section l2c-plans-section"
                        id="precios"
                    >
                        <div className="l2c-section-heading l2c-heading-left">
                            <p className="l2c-kicker">
                                PRECIOS
                            </p>

                            <h2 id="pricing-title">
                                Empieza a tu ritmo
                            </h2>

                            <p>
                                Propuesta de planes para acompañar
                                distintas etapas del aprendizaje.
                                Sus condiciones todavía están
                                en definición.
                            </p>
                        </div>

                        <div className="l2c-plans-grid">
                            <article className="l2c-plan-card">
                                <div className="l2c-plan-heading">
                                    <span className="l2c-plan-icon">
                                        <FiUser aria-hidden="true" />
                                    </span>

                                    <div>
                                        <span className="l2c-plan-status">
                                            Plan propuesto
                                        </span>

                                        <h3>Gratis</h3>

                                        <p>
                                            Para explorar y dar tus
                                            primeros pasos.
                                        </p>
                                    </div>
                                </div>

                                <ul className="l2c-plan-benefits">
                                    {
                                        [
                                            'Diagnóstico inicial',
                                            'Práctica de introducción',
                                            'Contenido de fundamentos',
                                            'Acceso inicial a la comunidad',
                                        ].map((benefit) => (
                                            <li key={benefit}>
                                                <FiCheckCircle aria-hidden="true" />

                                                {benefit}
                                            </li>
                                        ))
                                    }
                                </ul>

                                <Link
                                    className="l2c-plan-action"
                                    to="/register"
                                >
                                    Crear cuenta

                                    <FiArrowRight aria-hidden="true" />
                                </Link>
                            </article>

                            <article className="l2c-plan-card l2c-plan-pro">
                                <span className="l2c-plan-badge">
                                    Aprendizaje continuo
                                </span>

                                <div className="l2c-plan-heading">
                                    <span className="l2c-plan-icon">
                                        <FiStar aria-hidden="true" />
                                    </span>

                                    <div>
                                        <span className="l2c-plan-status">
                                            Plan propuesto
                                        </span>

                                        <h3>Pro</h3>

                                        <p>
                                            Para profundizar y construir
                                            con más acompañamiento.
                                        </p>
                                    </div>
                                </div>

                                <ul className="l2c-plan-benefits">
                                    {
                                        [
                                            'Mayor acceso al profesor IA',
                                            'Más práctica adaptativa',
                                            'Proyectos para tu portafolio',
                                            'Seguimiento del progreso',
                                        ].map((benefit) => (
                                            <li key={benefit}>
                                                <FiCheckCircle aria-hidden="true" />

                                                {benefit}
                                            </li>
                                        ))
                                    }
                                </ul>

                                <details className="l2c-pro-information">
                                    <summary className="l2c-plan-action">
                                        Conocer Pro

                                        <FiArrowRight aria-hidden="true" />
                                    </summary>

                                    <p>
                                        Pro forma parte de la propuesta
                                        de crecimiento. El precio,
                                        los límites y la fecha de
                                        disponibilidad todavía no
                                        están definidos.
                                    </p>
                                </details>
                            </article>
                        </div>

                        <p className="l2c-plans-note">
                            Las funciones listadas describen
                            una propuesta comercial. Crear
                            una cuenta no contrata un plan.
                        </p>
                    </section>

                    <section
                        aria-labelledby="community-title"
                        className="l2c-container l2c-section l2c-community-section"
                        id="comunidad"
                    >
                        <div className="l2c-section-heading l2c-heading-left">
                            <p className="l2c-kicker">
                                COMUNIDAD
                            </p>

                            <h2 id="community-title">
                                Crece con una comunidad
                                que también aprende
                            </h2>

                            <p>
                                Un espacio previsto para compartir
                                avances, preguntar y descubrir
                                otras formas de resolver.
                            </p>
                        </div>

                        <div className="l2c-community-layout">
                            <div className="l2c-community-examples">
                                <article className="l2c-discussion-card">
                                    <div className="l2c-discussion-heading">
                                        <span
                                            aria-hidden="true"
                                            className="l2c-discussion-avatar"
                                        >
                                            JS
                                        </span>

                                        <div>
                                            <span>Ejemplo de conversación</span>

                                            <h3>
                                                ¿Cómo puedo mejorar mi código?
                                            </h3>
                                        </div>
                                    </div>

                                    <p>
                                        Compartir una solución y explicar
                                        cómo funciona puede ayudarte a
                                        descubrir otras maneras de resolver.
                                    </p>

                                    <span className="l2c-discussion-topic">
                                        JavaScript · Aprender en conjunto
                                    </span>
                                </article>

                                <article className="l2c-discussion-card">
                                    <div className="l2c-discussion-heading">
                                        <span
                                            aria-hidden="true"
                                            className="l2c-discussion-avatar l2c-avatar-project"
                                        >
                                            UI
                                        </span>

                                        <div>
                                            <span>Ejemplo de proyecto</span>

                                            <h3>
                                                Mi primera lista de tareas
                                            </h3>
                                        </div>
                                    </div>

                                    <p>
                                        Un proyecto pequeño puede conectar
                                        componentes, estado e interacciones
                                        en una misma experiencia.
                                    </p>

                                    <div
                                        aria-hidden="true"
                                        className="l2c-task-preview"
                                    >
                                        <span>✓ Aprender componentes</span>
                                        <span>□ Agregar una tarea</span>
                                        <span>□ Guardar mis avances</span>
                                    </div>

                                    <span className="l2c-discussion-topic">
                                        React · Construir y compartir
                                    </span>
                                </article>
                            </div>

                            <aside className="l2c-community-invitation">
                                <ul>
                                    <li>
                                        <FiMessageCircle aria-hidden="true" />

                                        Pregunta con confianza
                                    </li>

                                    <li>
                                        <FiUsers aria-hidden="true" />

                                        Comparte tus proyectos
                                    </li>

                                    <li>
                                        <FiCode aria-hidden="true" />

                                        Aprende de otras soluciones
                                    </li>
                                </ul>

                                <a
                                    className="l2c-button"
                                    href="https://github.com/eddzen-c/Learn2Code"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    Conocer el proyecto

                                    <FiArrowRight aria-hidden="true" />
                                </a>

                                <small>
                                    Comunidad en preparación.
                                </small>
                            </aside>

                            <div
                                aria-hidden="true"
                                className="l2c-community-mascot"
                            >
                                <LandingDragon variant="frontend" />
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="l2c-footer">
                <div className="l2c-container">
                    <Link
                        aria-label="Learn2Code, inicio"
                        className="l2c-brand"
                        to="/"
                    >
                        <img
                            alt=""
                            height="40"
                            src={
                                `${imageRoot}/04-Logo-oficial/PNG/logo-oficial-128.png`
                            }
                            width="60"
                        />

                        <span>
                            Learn<span>2</span>Code
                        </span>
                    </Link>

                    <p>
                        Aprende, practica y construye.
                    </p>

                    <nav aria-label="Enlaces del pie de página">
                        <a href="#caracteristicas">
                            Características
                        </a>

                        <a href="#cursos">
                            Cursos
                        </a>

                        <a href="#comunidad">
                            Comunidad
                        </a>
                    </nav>

                    <span className="l2c-footer-status">
                        Proyecto universitario · 2026
                    </span>
                </div>
            </footer>
        </div>
    )
}
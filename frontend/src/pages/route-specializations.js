// Datos compartidos del catálogo y las páginas individuales.

export const specializations = [
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
            { name: 'MongoDB', icon: 'tecnologia-mongodb.svg' },
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
            { name: 'TypeScript', icon: 'tecnologia-typescript.svg' },
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

export const routeVisualContent = {
    frontend: {
        stages: [
            'Fundamentos Web',
            'UI con React',
            'Estado y Rutas',
            'Buenas Prácticas',
            'Proyecto Final',
        ],
        insightTitle: '¿Por qué aprender Frontend?',
        insight:
            'Aprenderás a crear interfaces interactivas, ' +
            'accesibles y atractivas utilizando tecnologías web.',
    },
    backend: {
        stages: [
            'Fundamentos Backend',
            'APIs con Node.js',
            'Bases de Datos',
            'Autenticación y Seguridad',
            'Proyecto Final',
        ],
        insightTitle: '¿Qué lograrás?',
        insight:
            'Podrás construir servicios y APIs, trabajar ' +
            'con bases de datos y comprender la seguridad ' +
            'de las aplicaciones.',
    },
    fullstack: {
        stages: [
            'Frontend Avanzado',
            'Backend con Node.js',
            'Integración Full Stack',
            'Testing y Despliegue',
            'Proyecto Final',
        ],
        insightTitle: '¿Por qué elegir esta ruta?',
        insight:
            'Aprenderás a conectar las distintas partes ' +
            'de una aplicación, desde su interfaz hasta ' +
            'el servidor y la base de datos.',
    },
    devops: {
        stages: [
            'Fundamentos DevOps',
            'Contenedores con Docker',
            'CI/CD con GitHub Actions',
            'Cloud con AWS',
            'Proyecto Final',
        ],
        insightTitle: '¿Qué conseguirás?',
        insight:
            'Conocerás herramientas para automatizar, ' +
            'desplegar y supervisar aplicaciones en ' +
            'diferentes entornos.',
    },
};

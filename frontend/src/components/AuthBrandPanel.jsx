
import { Link } from 'react-router-dom'
import {
    FiActivity,
    FiAward,
    FiCode,
    FiShield,
    FiUsers,
} from 'react-icons/fi'

const DRAGON_IMAGE =
    '/images/Learn2Code_Dragones_Responsive/02-Dragon-tarjeta-frontend/WebP/dragon-frontend-512.webp'

const REGISTER_DRAGON_IMAGE =
    '/images/dragon-registro-512.webp'

const loginFeatures = [
    {
        icon: FiCode,
        title: 'Rutas guiadas',
        description: 'Paso a paso',
    },
    {
        icon: FiAward,
        title: 'Proyectos reales',
        description: 'Aplica lo aprendido',
    },
    {
        icon: FiActivity,
        title: 'Progreso claro',
        description: 'Mide tu avance',
    },
    {
        icon: FiUsers,
        title: 'Comunidad activa',
        description: 'Aprende acompañado',
    },
]

const registerFeatures = [
    {
        icon: FiCode,
        title: 'Rutas de aprendizaje prácticas',
        description: 'Aprende tecnologías modernas con proyectos reales.',
    },
    {
        icon: FiActivity,
        title: 'Progreso claro y medible',
        description: 'Sigue tu avance y alcanza tus objetivos paso a paso.',
    },
    {
        icon: FiUsers,
        title: 'Comunidad activa',
        description: 'Conecta, comparte y crece junto a otros estudiantes.',
    },
]

export function AuthBrandPanel({ mode = 'login' }) {
    const isRegister = mode === 'register'
    const features = isRegister ? registerFeatures : loginFeatures

    return (
        <aside className={`auth-brand-panel auth-brand-panel--${mode}`}>
            <Link className="auth-brand-logo" to="/">
                <span className="auth-brand-symbol">{'{<>}'}</span>
                <span>
                    Learn<span className="auth-accent">2</span>Code
                </span>
            </Link>

            <div className="auth-brand-content">
                {isRegister ? (
                    <>
                        <h2 className="auth-brand-heading">
                            Tu viaje como
                            <br />
                            <span className="auth-accent">desarrollador</span>
                            <br />
                            empieza aquí 🚀
                        </h2>

                        <p className="auth-brand-description">
                            Únete a miles de estudiantes que ya están
                            aprendiendo, construyendo y logrando sus metas con{' '}
                            <span className="auth-accent">Learn2Code.</span>
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className="auth-brand-heading">
                            Aprende. Programa.
                            <span className="auth-accent"> Construye tu futuro.</span>
                        </h2>
                        <p className="auth-brand-description">
                            Domina las tecnologías más demandadas y lleva
                            tus habilidades al siguiente nivel.
                        </p>
                    </>
                )}
            </div>

            <div className="auth-brand-dragon">
                <img
                    src={isRegister ? REGISTER_DRAGON_IMAGE : DRAGON_IMAGE}
                    alt="Dragón de Learn2Code programando en una laptop"
                />
            </div>

            <div className="auth-brand-features">
                {features.map(({ icon: Icon, title, description }) => (
                    <div className="auth-brand-feature" key={title}>
                        <Icon aria-hidden="true" />
                        <strong>{title}</strong>
                        <span>{description}</span>
                    </div>
                ))}
            </div>

            {isRegister && (
                <div className="auth-brand-security">
                    <FiShield aria-hidden="true" />
                    <div>
                        <strong>Tu seguridad es nuestra prioridad</strong>
                        <p>Protegemos tu información personal.</p>
                    </div>
                </div>
            )}
        </aside>
    )
}
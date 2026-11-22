
import { Link } from 'react-router-dom'
import { FiShield } from 'react-icons/fi'

const IMAGE_ROOT = '/images/auth-flow'

export function AuthFlowBrandPanel({ mode = 'recovery' }) {
    const isVerification = mode === 'verification'

    const dragonImage = isVerification
        ? 'dragon-verificar-correo-1024.webp'
        : 'dragon-recuperar-contrasena-1024.webp'

    const detailImage = isVerification
        ? 'detalle-correo-confirmado-512.webp'
        : 'detalle-llave-y-codigo-512.webp'

    return (
        <aside className="auth-flow__brand">
            <Link
                className="auth-flow__logo"
                to="/"
                aria-label="Learn2Code - Inicio"
            >
                <img
                    className="auth-flow__isotype"
                    src={`${IMAGE_ROOT}/isotipo-oficial-256.webp`}
                    alt=""
                    aria-hidden="true"
                />

                <span className="auth-flow__brand-name">
                    Learn<span>2</span>Code
                </span>
            </Link>


            <div className="auth-flow__brand-intro">
                {isVerification ? (
                    <>
                        <h2>
                            Un paso más.
                            <span>Tu camino está por comenzar.</span>
                        </h2>
                        <p>
                            Confirma tu correo y empieza a aprender con
                            Learn2Code.
                        </p>
                    </>
                ) : (
                    <>
                        <h2>
                            Recupera el acceso.
                            <span>Retoma tu aprendizaje.</span>
                        </h2>
                        <p>
                            Tus rutas, cursos y proyectos te esperan.
                        </p>
                    </>
                )}
            </div>

            <div className="auth-flow__illustration">
                <img
                    className="auth-flow__dragon"
                    src={`${IMAGE_ROOT}/${dragonImage}`}
                    alt={
                        isVerification
                            ? 'Dragón de Learn2Code verificando un correo'
                            : 'Dragón de Learn2Code recuperando el acceso'
                    }
                />

                <img
                    className="auth-flow__illustration-detail"
                    src={`${IMAGE_ROOT}/${detailImage}`}
                    alt=""
                    aria-hidden="true"
                />
            </div>

            <div className="auth-flow__security">
                <div className="auth-flow__security-icon">
                    <FiShield aria-hidden="true" />
                </div>

                <div>
                    <strong>
                        {isVerification
                            ? 'Tu cuenta, lista para empezar'
                            : 'Recupera tu cuenta de forma segura'}
                    </strong>

                    <p>
                        {isVerification
                            ? 'Verifica tu correo para continuar.'
                            : 'Te enviaremos un enlace a tu correo electrónico.'}
                    </p>
                </div>
            </div>
        </aside>
    )
}

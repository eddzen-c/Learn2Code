import './NotFoundPage.css'
import {
    Link,
    useNavigate,
} from 'react-router-dom'

import {
    FiArrowLeft,
    FiHome,
    FiLink2,
} from 'react-icons/fi'

export function NotFoundPage() {
    const navigate = useNavigate()

    const handleGoBack = () => {
        const hasPreviousPage =
            window.history.state?.idx > 0

        if (hasPreviousPage) {
            navigate(-1)
            return
        }

        navigate('/')
    }

    return (
        <main className="l2c-not-found">

            {/* Sección izquierda: ilustración */}
            <section
                className="l2c-not-found__visual"
                aria-label="Ilustración de página no encontrada"
            >
                <div className="l2c-not-found__brand">
                    Learn<span>2</span>Code
                </div>

                <div className="l2c-not-found__artwork">
                    <span className="l2c-not-found__number">
                        404
                    </span>

                    {/* Aquí colocaremos el dragón
                        original del ZIP */}
                </div>

                <p className="l2c-not-found__slogan">
                    Tu próxima línea de código te espera.
                </p>
            </section>

            {/* Sección derecha: información */}
            <section className="l2c-not-found__content">

                <div className="l2c-not-found__error-icon">
                    <FiLink2 aria-hidden="true" />
                </div>

                <p className="l2c-not-found__eyebrow">
                    ERROR 404
                </p>

                <h1>Página no encontrada</h1>

                <p className="l2c-not-found__description">
                    La página que buscas no existe
                    o cambió de dirección.
                </p>

                <p className="l2c-not-found__instructions">
                    Revisa la dirección o vuelve al inicio
                    para seguir aprendiendo.
                </p>

                <div className="l2c-not-found__actions">

                    <Link
                        className="l2c-not-found__home-button"
                        to="/"
                    >
                        <FiHome aria-hidden="true" />
                        Volver al inicio
                    </Link>

                    <button
                        className="l2c-not-found__back-button"
                        onClick={handleGoBack}
                        type="button"
                    >
                        <FiArrowLeft aria-hidden="true" />
                        Volver atrás
                    </button>

                </div>

                <footer className="l2c-not-found__footer">
                    <p>
                        ¿Necesitas ayuda? Revisa la
                        dirección e inténtalo nuevamente.
                    </p>

                    <small>
                        © 2026 Learn2Code
                    </small>
                </footer>

            </section>
        </main>
    )
}


import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    FiArrowLeft,
    FiArrowRight,
    FiInfo,
    FiMail,
} from 'react-icons/fi'

import { requestPasswordReset } from '../api/auth.api.js'
import { getAuthErrorMessage } from '../auth/auth-error-message.js'
import { AuthFlowBrandPanel } from '../components/AuthFlowBrandPanel.jsx'

import './AuthFlow.css'

const IMAGE_ROOT = '/images/auth-flow'

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [requestCompleted, setRequestCompleted] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setErrorMessage('')
        setIsSubmitting(true)

        try {
            await requestPasswordReset(email.trim())
            setRequestCompleted(true)
        } catch (error) {
            setErrorMessage(getAuthErrorMessage(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="auth-flow auth-flow--recovery">
            <AuthFlowBrandPanel mode="recovery" />

            <section className="auth-flow__right">
                <Link className="auth-flow__back" to="/login">
                    <FiArrowLeft aria-hidden="true" />
                    <span>Volver a iniciar sesión</span>
                </Link>

                <div className="auth-flow__form-area">
                    <img
                        className="auth-flow__main-icon"
                        src={`${IMAGE_ROOT}/icono-principal-llave-240.webp`}
                        alt=""
                        aria-hidden="true"
                    />

                    {requestCompleted ? (
                        <div className="auth-flow__success" role="status">
                            <h1>Revisa tu correo</h1>

                            <p className="auth-flow__description">
                                Si existe una cuenta asociada, recibirás las
                                instrucciones para restablecer tu contraseña.
                            </p>

                            <div className="auth-flow__notice">
                                <FiInfo aria-hidden="true" />
                                <span>
                                    Revisa también tu carpeta de spam o correo
                                    no deseado.
                                </span>
                            </div>

                            <Link
                                className="auth-flow__primary"
                                to="/login"
                            >
                                Volver a iniciar sesión
                                <FiArrowRight aria-hidden="true" />
                            </Link>
                        </div>
                    ) : (
                        <>
                            <header className="auth-flow__form-header">
                                <h1>Recupera tu contraseña</h1>

                                <p className="auth-flow__description">
                                    Ingresa el correo de tu cuenta y te
                                    enviaremos un enlace para crear una nueva
                                    contraseña.
                                </p>
                            </header>

                            <form
                                className="auth-flow__form"
                                onSubmit={handleSubmit}
                            >
                                <label htmlFor="recovery-email">
                                    Correo electrónico
                                </label>

                                <div className="auth-flow__input">
                                    <FiMail aria-hidden="true" />

                                    <input
                                        autoComplete="email"
                                        id="recovery-email"
                                        type="email"
                                        placeholder="tu@correo.com"
                                        required
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                    />
                                </div>

                                {errorMessage && (
                                    <p
                                        className="auth-flow__error"
                                        role="alert"
                                    >
                                        {errorMessage}
                                    </p>
                                )}

                                <button
                                    className="auth-flow__primary"
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    <span>
                                        {isSubmitting
                                            ? 'Enviando enlace...'
                                            : 'Enviar enlace de recuperación'}
                                    </span>
                                    <FiArrowRight aria-hidden="true" />
                                </button>
                            </form>

                            <div className="auth-flow__notice">
                                <FiInfo aria-hidden="true" />
                                <span>
                                    Si existe una cuenta asociada, recibirás
                                    las instrucciones por correo.
                                </span>
                            </div>

                            <div className="auth-flow__bottom-link">
                                ¿Ya recuerdas tu contraseña?{' '}
                                <Link to="/login">
                                    Iniciar sesión
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                <footer className="auth-flow__copyright">
                    © 2026 Learn2Code
                </footer>
            </section>
        </main>
    )
}

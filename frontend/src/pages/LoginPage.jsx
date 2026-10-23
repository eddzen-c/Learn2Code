
import { useState } from 'react'
import {
    Link,
    useLocation,
    useNavigate,
} from 'react-router-dom'
import {
    FiBriefcase,
    FiEye,
    FiEyeOff,
    FiGithub,
    FiLock,
    FiMail,
    FiUser,
} from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'

import { AuthBrandPanel } from '../components/AuthBrandPanel.jsx'
import { getAuthErrorMessage } from '../auth/auth-error-message.js'
import { useAuth } from '../auth/useAuth.js'

import './AuthMockup.css'

export function LoginPage() {
    const { signIn } = useAuth()

    const location = useLocation()
    const navigate = useNavigate()

    const [form, setForm] = useState({
        email: '',
        password: '',
    })

    const [errorMessage, setErrorMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleChange = (event) => {
        const { name, value } = event.target

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        setErrorMessage('')
        setIsSubmitting(true)

        try {
            const result = await signIn(form)

            if (!result.user.emailVerified) {
                navigate('/verify-email', {
                    replace: true,
                })
                return
            }

            const requestedDestination = location.state?.from

            const destination =
                typeof requestedDestination === 'string' &&
                    requestedDestination.startsWith('/')
                    ? requestedDestination
                    : '/'

            navigate(destination, {
                replace: true,
            })
        } catch (error) {
            setErrorMessage(getAuthErrorMessage(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="auth-mockup auth-mockup--login">
            {/* PANEL IZQUIERDO: MARCA Y MASCOTA */}
            <AuthBrandPanel mode="login" />

            {/* PANEL DERECHO: FORMULARIO */}
            <section className="auth-mockup__form-panel">
                <div className="auth-mockup__form-content">

                    <header className="auth-form-header">
                        <h1>Iniciar sesión</h1>
                        <p>
                            Ingresa a tu cuenta para continuar aprendiendo.
                        </p>
                    </header>

                    {/* TIPO DE ACCESO */}
                    <div
                        className="auth-account-types"
                        aria-label="Tipo de cuenta"
                    >
                        <div className="auth-account-tab is-active">
                            <FiUser aria-hidden="true" />
                            <span>Estudiante</span>
                        </div>

                        <div
                            className="auth-account-tab is-unavailable"
                            title="Acceso para empresas próximamente"
                        >
                            <FiBriefcase aria-hidden="true" />
                            <span>Empresa / Institución</span>
                        </div>
                    </div>

                    {/* FORMULARIO REAL DE AUTENTICACIÓN */}
                    <form
                        className="auth-mockup-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="auth-field">
                            <label htmlFor="login-email">
                                Correo electrónico
                            </label>

                            <div className="auth-input-wrapper">
                                <FiMail aria-hidden="true" />

                                <input
                                    autoComplete="email"
                                    id="login-email"
                                    name="email"
                                    onChange={handleChange}
                                    placeholder="tu@correo.com"
                                    required
                                    type="email"
                                    value={form.email}
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="login-password">
                                Contraseña
                            </label>

                            <div className="auth-input-wrapper">
                                <FiLock aria-hidden="true" />

                                <input
                                    autoComplete="current-password"
                                    id="login-password"
                                    name="password"
                                    onChange={handleChange}
                                    placeholder="Ingresa tu contraseña"
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                />

                                <button
                                    aria-label={
                                        showPassword
                                            ? 'Ocultar contraseña'
                                            : 'Mostrar contraseña'
                                    }
                                    aria-pressed={showPassword}
                                    className="auth-password-toggle"
                                    onClick={() => setShowPassword((current) => !current)}
                                    type="button"
                                >
                                    {showPassword ? (
                                        <FiEyeOff aria-hidden="true" />
                                    ) : (
                                        <FiEye aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="auth-form-help">
                            <Link to="/forgot-password">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        {errorMessage && (
                            <p className="auth-form-error" role="alert">
                                {errorMessage}
                            </p>
                        )}

                        <button
                            className="auth-primary-button"
                            disabled={isSubmitting}
                            type="submit"
                        >
                            {isSubmitting
                                ? 'Iniciando sesión...'
                                : 'Iniciar sesión'}
                        </button>
                    </form>

                    {/* OPCIONES DE ACCESO FUTURAS */}
                    <div className="auth-social-divider">
                        <span>o continúa con</span>
                    </div>

                    <div className="auth-social-options">
                        <button
                            className="auth-social-button"
                            disabled
                            title="Próximamente"
                            type="button"
                        >
                            <FcGoogle aria-hidden="true" />
                            <span>Continuar con Google</span>
                            <small>Próximamente</small>
                        </button>

                        <button
                            className="auth-social-button"
                            disabled
                            title="Próximamente"
                            type="button"
                        >
                            <FiGithub aria-hidden="true" />
                            <span>Continuar con GitHub</span>
                            <small>Próximamente</small>
                        </button>
                    </div>

                    <p className="auth-form-footer">
                        ¿No tienes una cuenta?{' '}
                        <Link to="/register">
                            Crear cuenta
                        </Link>
                    </p>

                </div>
            </section>
        </main>
    )
}

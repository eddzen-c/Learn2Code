import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getAuthErrorMessage } from '../auth/auth-error-message.js'
import { useAuth } from '../auth/useAuth.js'
import './Login.css'

export function LoginPage() {
    // =========================================================================
    // LÓGICA DE AUTENTICACIÓN Y ESTADOS (SIN CAMBIOS - SE MANTIENE FUNCIONAL)
    // =========================================================================
    const { signIn } = useAuth()

    const location = useLocation()
    const navigate = useNavigate()

    const [form, setForm] = useState({
        email: '',
        password: '',
    })

    const [errorMessage, setErrorMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Manejador genérico para capturar cambios en los inputs
    const handleChange = (event) => {
        const { name, value } = event.target

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }))
    }

    // Manejador del envío del formulario
    const handleSubmit = async (event) => {
        event.preventDefault()

        setErrorMessage('')
        setIsSubmitting(true)

        try {
            await signIn(form)

            const requestedDestination = location.state?.from

            const destination =
                typeof requestedDestination === 'string'
                    && requestedDestination.startsWith('/')
                    ? requestedDestination
                    : '/dashboard'

            navigate(destination, {
                replace: true,
            })
        } catch (error) {
            setErrorMessage(
                getAuthErrorMessage(error),
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    // =========================================================================
    // ESTRUCTURA VISUAL Y MOCKUP
    // =========================================================================
    return (
        /* Contenedor principal de pantalla completa (Mapeado a Login.css) */
        <main className="login-page-container">
            
            {/* PANEL IZQUIERDO: Formulario de autenticación e interfaz principal */}
            <div className="login-left-panel">
                <div className="login-form-wrapper">
                    
                    {/* Logotipo de la marca (Learn2Code) */}
                    <div className="login-brand">
                        <span className="login-brand-icon">{`{<>}`}</span> Learn2Code
                    </div>

                    {/* Títulos principales */}
                    <h1 className="login-title">Iniciar sesión</h1>
                    <p className="login-subtitle">
                        Bienvenido de nuevo. Continúa aprendiendo.
                    </p>

                    {/* Formulario vinculado a handleSubmit */}
                    <form className="login-form" onSubmit={handleSubmit}>
                        
                        {/* Campo de entrada: Correo electrónico */}
                        <div className="input-group">
                            <label htmlFor="login-email">
                                Correo electrónico
                            </label>
                            <div className="input-field-wrapper">
                                <span className="input-icon">✉</span>
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

                        {/* Campo de entrada: Contraseña */}
                        <div className="input-group">
                            <label htmlFor="login-password">
                                Contraseña
                            </label>
                            <div className="input-field-wrapper">
                                <span className="input-icon">🔒</span>
                                <input
                                    autoComplete="current-password"
                                    id="login-password"
                                    name="password"
                                    onChange={handleChange}
                                    placeholder="Ingresa tu contraseña"
                                    required
                                    type="password"
                                    value={form.password}
                                />
                            </div>
                        </div>

                        {/* Renderizado condicional de mensajes de error de autenticación */}
                        {errorMessage && (
                            <p className="form-error" role="alert">
                                {errorMessage}
                            </p>
                        )}

                        {/* Opciones adicionales de UI (Recordarme y Recuperar contraseña) */}
                        <div className="login-options">
                            <label className="remember-me">
                                <input type="checkbox" /> Recordarme
                            </label>
                            <a href="#forgot" className="forgot-password" >
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>

                        {/* Botón de envío principal */}
                        <button
                            className="btn-submit-login"
                            disabled={isSubmitting}
                            type="submit"
                        >
                            {isSubmitting
                                ? 'Iniciando sesión...'
                                : 'Iniciar sesión'}
                        </button>
                    </form>


                   

                    {/* Enlace para redirección al registro de usuarios */}
                    <p className="login-footer-text">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register">
                            Crear cuenta
                        </Link>
                    </p>
                </div>
            </div>

            {/* IMAGEN */}
            <div className="login-right-panel">
                <img
                     src="/images/login.jpg"
                    alt="Ilustración de aprendizaje"
                    className="illustration-img"
                />
            </div>
        </main>
    )
}
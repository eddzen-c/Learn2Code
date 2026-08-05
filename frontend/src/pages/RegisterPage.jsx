import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import './Register.css' // Archivo CSS 

export function RegisterPage() {
    // =========================================================================
    // LÓGICA DE REGISTRO, ESTADOS Y NAVEGACIÓN (INTEGRIDAD 100% FUNCIONAL)
    // =========================================================================
    const { signUp } = useAuth()
    const navigate = useNavigate()

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    })

    const [errorMessage, setErrorMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // capturar y actualizar cambios en los inputs
    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }))
    }

    // formulario con validaciones de seguridad
    const handleSubmit = async (event) => {
        event.preventDefault()
        setErrorMessage('')

        // verificar coincidencia de contraseñas antes de enviar
        if (form.password !== form.confirmPassword) {
            setErrorMessage('Las contraseñas no coinciden.')
            return
        }

        setIsSubmitting(true)

        try {
            // Ejecución del servicio de registro autenticado con la estructura requerida por el backend
            await signUp({
                fullName: form.fullName,
                email: form.email,
                password: form.password,
            })

            // Redirección al flujo de verificación de correo electrónico
            navigate('/verify-email', {
                replace: true,
            })
        } catch (error) {
            // Manejo de errores de conexión o del servidor
            setErrorMessage('No fue posible conectar con el servidor.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        /* Contenedor general que centra la tarjeta con márgenes laterales */
        <main className="login-page-container">
            
            {/*  TARJETA*/}
            <div className="login-card-wrapper">
                
                {/* Formulario de Registro y Accesos */}
                <div className="login-left-panel">
                    <div className="login-form-wrapper">
                        
                        {/* Logotipo de la marca */}
                        <div className="login-brand">
                            <span className="login-brand-icon">{`[<>]`}</span> Learn2Code
                        </div>

                        {/* Encabezados de la vista */}
                        <h1 className="login-title">Crear cuenta</h1>
                        <p className="login-subtitle">
                            Únete a miles de estudiantes y comienza tu viaje.
                        </p>

                        {/* Formulario vinculado a handleSubmit */}
                        <form className="login-form" onSubmit={handleSubmit}>
                            
                            {/* Input: Nombre completo */}
                            <div className="input-group">
                                <label htmlFor="register-name">Nombre completo</label>
                                <div className="input-field-wrapper">
                                    <span className="input-icon">👤</span>
                                    <input
                                        id="register-name"
                                        name="fullName"
                                        onChange={handleChange}
                                        placeholder="Ej. Ana García"
                                        required
                                        type="text"
                                        value={form.fullName}
                                    />
                                </div>
                            </div>

                            {/* Input: Correo electrónico */}
                            <div className="input-group">
                                <label htmlFor="register-email">Correo electrónico</label>
                                <div className="input-field-wrapper">
                                    <span className="input-icon">✉</span>
                                    <input
                                        autoComplete="email"
                                        id="register-email"
                                        name="email"
                                        onChange={handleChange}
                                        placeholder="tu@correo.com"
                                        required
                                        type="email"
                                        value={form.email}
                                    />
                                </div>
                            </div>

                            {/* Input: Contraseña */}
                            <div className="input-group">
                                <label htmlFor="register-password">Contraseña</label>
                                <div className="input-field-wrapper">
                                    <span className="input-icon">🔒</span>
                                    <input
                                        autoComplete="new-password"
                                        id="register-password"
                                        name="password"
                                        onChange={handleChange}
                                        placeholder="Crea una contraseña"
                                        required
                                        type="password"
                                        value={form.password}
                                    />
                                </div>
                            </div>

                            {/* Input: Confirmar contraseña */}
                            <div className="input-group">
                                <label htmlFor="register-confirm">Confirmar contraseña</label>
                                <div className="input-field-wrapper">
                                    <span className="input-icon">🔒</span>
                                    <input
                                        autoComplete="new-password"
                                        id="register-confirm"
                                        name="confirmPassword"
                                        onChange={handleChange}
                                        placeholder="Confirma tu contraseña"
                                        required
                                        type="password"
                                        value={form.confirmPassword}
                                    />
                                </div>
                            </div>

                            {/* Mensaje de error condicional */}
                            {errorMessage && (
                                <p className="form-error" role="alert">
                                    {errorMessage}
                                </p>
                            )}

                            {/* TERMINOS Y POLITICAS DE PRIVACIDAD */}
                            <div className="login-options">
                                <label className="remember-me">
                                    <input type="checkbox" required /> Acepto los Términos y la Política
                                </label>
                            </div>

                            {/* Botón principal de envío (Cambia de texto durante el proceso) */}
                            <button
                                className="btn-submit-login"
                                disabled={isSubmitting}
                                type="submit"
                            >
                                {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
                            </button>
                        </form>

                        {/* Enlace de navegación hacia el login */}
                        <p className="login-footer-text">
                            ¿Ya tienes cuenta?{' '}
                            <Link to="/login">
                                Iniciar sesión
                            </Link>
                        </p>
                    </div>
                </div>

                {/* PANEL DERECHO: Ilustración gráfica del Mockup de Registro */}
                <div className="login-right-panel">
                    <img
                        src="/images/registro.jpg"
                        alt="Ilustración de registro"
                        className="illustration-img"
                    />
                </div>

            </div>
        </main>
    )
}
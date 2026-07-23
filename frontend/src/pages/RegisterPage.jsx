import {
    useState,
} from 'react'

import {
    Link,
    useNavigate,
} from 'react-router-dom'

import {
    getAuthErrorMessage,
} from '../auth/auth-error-message.js'

import {
    useAuth,
} from '../auth/useAuth.js'

export function RegisterPage() {
    const {
        signUp,
    } = useAuth()

    const navigate = useNavigate()

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        passwordConfirmation: '',
    })

    const [errorMessage, setErrorMessage] =
        useState('')

    const [isSubmitting, setIsSubmitting] =
        useState(false)

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        setErrorMessage('')

        if (
            form.password
            !== form.passwordConfirmation
        ) {
            setErrorMessage(
                'Las contraseñas no coinciden.',
            )

            return
        }

        setIsSubmitting(true)

        try {
            await signUp({
                fullName: form.fullName,
                email: form.email,
                password: form.password,
            })

            navigate('/dashboard', {
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

    return (
        <main className="auth-page">
            <section className="auth-card">
                <header className="auth-header">
                    <p className="eyebrow">
                        Learn2Code
                    </p>

                    <h1>Crear una cuenta</h1>

                    <p>
                        Empieza tu ruta de aprendizaje.
                    </p>
                </header>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    <label htmlFor="register-name">
                        Nombre completo
                    </label>

                    <input
                        autoComplete="name"
                        id="register-name"
                        name="fullName"
                        onChange={handleChange}
                        required
                        type="text"
                        value={form.fullName}
                    />

                    <label htmlFor="register-email">
                        Correo electrónico
                    </label>

                    <input
                        autoComplete="email"
                        id="register-email"
                        name="email"
                        onChange={handleChange}
                        required
                        type="email"
                        value={form.email}
                    />

                    <label htmlFor="register-password">
                        Contraseña
                    </label>

                    <input
                        autoComplete="new-password"
                        id="register-password"
                        minLength="8"
                        name="password"
                        onChange={handleChange}
                        required
                        type="password"
                        value={form.password}
                    />

                    <p className="field-hint">
                        Usa al menos 8 caracteres.
                    </p>

                    <label htmlFor="register-confirmation">
                        Confirmar contraseña
                    </label>

                    <input
                        autoComplete="new-password"
                        id="register-confirmation"
                        minLength="8"
                        name="passwordConfirmation"
                        onChange={handleChange}
                        required
                        type="password"
                        value={form.passwordConfirmation}
                    />

                    {errorMessage && (
                        <p
                            className="form-error"
                            role="alert"
                        >
                            {errorMessage}
                        </p>
                    )}

                    <button
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {isSubmitting
                            ? 'Creando cuenta...'
                            : 'Crear cuenta'}
                    </button>
                </form>

                <p className="auth-switch">
                    ¿Ya tienes una cuenta?{' '}

                    <Link to="/login">
                        Inicia sesión
                    </Link>
                </p>
            </section>
        </main>
    )
}
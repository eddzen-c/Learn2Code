import {
    useState,
} from 'react'

import {
    Link,
    useLocation,
    useNavigate,
} from 'react-router-dom'

import {
    getAuthErrorMessage,
} from '../auth/auth-error-message.js'

import {
    useAuth,
} from '../auth/useAuth.js'

export function LoginPage() {
    const {
        signIn,
    } = useAuth()

    const location = useLocation()
    const navigate = useNavigate()

    const [form, setForm] = useState({
        email: '',
        password: '',
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
        setIsSubmitting(true)

        try {
            await signIn(form)

            const requestedDestination =
                location.state?.from

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

    return (
        <main className="auth-page">
            <section className="auth-card">
                <header className="auth-header">
                    <p className="eyebrow">
                        Learn2Code
                    </p>

                    <h1>Iniciar sesión</h1>

                    <p>
                        Continúa aprendiendo programación
                        a tu ritmo.
                    </p>
                </header>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    <label htmlFor="login-email">
                        Correo electrónico
                    </label>

                    <input
                        autoComplete="email"
                        id="login-email"
                        name="email"
                        onChange={handleChange}
                        required
                        type="email"
                        value={form.email}
                    />

                    <label htmlFor="login-password">
                        Contraseña
                    </label>

                    <input
                        autoComplete="current-password"
                        id="login-password"
                        name="password"
                        onChange={handleChange}
                        required
                        type="password"
                        value={form.password}
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
                            ? 'Iniciando sesión...'
                            : 'Iniciar sesión'}
                    </button>
                </form>

                <p className="auth-switch">
                    ¿Todavía no tienes cuenta?{' '}

                    <Link to="/register">
                        Regístrate
                    </Link>
                </p>
            </section>
        </main>
    )
}
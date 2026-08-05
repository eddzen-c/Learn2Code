import {
    useState,
} from 'react'

import {
    Link,
} from 'react-router-dom'

import {
    requestPasswordReset,
} from '../api/auth.api.js'

import {
    getAuthErrorMessage,
} from '../auth/auth-error-message.js'

export function ForgotPasswordPage() {
    const [email, setEmail] =
        useState('')

    const [errorMessage, setErrorMessage] =
        useState('')

    const [isSubmitting, setIsSubmitting] =
        useState(false)

    const [requestCompleted, setRequestCompleted] =
        useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()

        setErrorMessage('')
        setIsSubmitting(true)

        try {
            await requestPasswordReset(email)

            setRequestCompleted(true)
        } catch (error) {
            setErrorMessage(
                getAuthErrorMessage(error),
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (requestCompleted) {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <header className="auth-header">
                        <p className="eyebrow">
                            Learn2Code
                        </p>

                        <h1>Revisa tu correo</h1>

                        <p>
                            Si existe una cuenta asociada,
                            recibirás las instrucciones para
                            restablecer tu contraseña.
                        </p>
                    </header>

                    <p className="auth-switch">
                        <Link to="/login">
                            Volver a iniciar sesión
                        </Link>
                    </p>
                </section>
            </main>
        )
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <header className="auth-header">
                    <p className="eyebrow">
                        Learn2Code
                    </p>

                    <h1>Recuperar contraseña</h1>

                    <p>
                        Ingresa tu correo y te enviaremos
                        las instrucciones de recuperación.
                    </p>
                </header>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    <label htmlFor="recovery-email">
                        Correo electrónico
                    </label>

                    <input
                        autoComplete="email"
                        id="recovery-email"
                        onChange={(event) => {
                            setEmail(
                                event.target.value,
                            )
                        }}
                        required
                        type="email"
                        value={email}
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
                            ? 'Enviando instrucciones...'
                            : 'Enviar instrucciones'}
                    </button>
                </form>

                <p className="auth-switch">
                    <Link to="/login">
                        Volver a iniciar sesión
                    </Link>
                </p>
            </section>
        </main>
    )
}
import {
    useState,
} from 'react'

import {
    Link,
    useSearchParams,
} from 'react-router-dom'

import {
    resetPassword,
} from '../api/auth.api.js'

import {
    getAuthErrorMessage,
} from '../auth/auth-error-message.js'

export function ResetPasswordPage() {
    const [searchParams] =
        useSearchParams()

    const token =
        searchParams.get('token') ?? ''

    const [form, setForm] =
        useState({
            newPassword: '',
            passwordConfirmation: '',
        })

    const [errorMessage, setErrorMessage] =
        useState('')

    const [isSubmitting, setIsSubmitting] =
        useState(false)

    const [resetCompleted, setResetCompleted] =
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
            form.newPassword
            !== form.passwordConfirmation
        ) {
            setErrorMessage(
                'Las contraseñas no coinciden.',
            )

            return
        }

        setIsSubmitting(true)

        try {
            await resetPassword({
                token,
                newPassword:
                    form.newPassword,
            })

            setResetCompleted(true)
        } catch (error) {
            setErrorMessage(
                getAuthErrorMessage(error),
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!token) {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <header className="auth-header">
                        <p className="eyebrow">
                            Learn2Code
                        </p>

                        <h1>Enlace no válido</h1>

                        <p>
                            El enlace de recuperación no
                            contiene un token válido.
                        </p>
                    </header>

                    <p className="auth-switch">
                        <Link to="/forgot-password">
                            Solicitar otro enlace
                        </Link>
                    </p>
                </section>
            </main>
        )
    }

    if (resetCompleted) {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <header className="auth-header">
                        <p className="eyebrow">
                            Learn2Code
                        </p>

                        <h1>Contraseña actualizada</h1>

                        <p>
                            Ya puedes iniciar sesión con
                            tu nueva contraseña.
                        </p>
                    </header>

                    <p className="auth-switch">
                        <Link to="/login">
                            Iniciar sesión
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

                    <h1>Restablecer contraseña</h1>

                    <p>
                        Crea una nueva contraseña segura
                        para tu cuenta.
                    </p>
                </header>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    <label htmlFor="reset-password">
                        Nueva contraseña
                    </label>

                    <input
                        autoComplete="new-password"
                        id="reset-password"
                        minLength="8"
                        name="newPassword"
                        onChange={handleChange}
                        required
                        type="password"
                        value={form.newPassword}
                    />

                    <label htmlFor="reset-confirmation">
                        Confirmar nueva contraseña
                    </label>

                    <input
                        autoComplete="new-password"
                        id="reset-confirmation"
                        minLength="8"
                        name="passwordConfirmation"
                        onChange={handleChange}
                        required
                        type="password"
                        value={
                            form.passwordConfirmation
                        }
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
                            ? 'Actualizando contraseña...'
                            : 'Guardar nueva contraseña'}
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
import {
    useEffect,
    useRef,
    useState,
} from 'react'

import {
    Link,
    useSearchParams,
} from 'react-router-dom'

import {
    confirmEmailVerification,
    requestEmailVerification,
} from '../api/auth.api.js'

import {
    getAuthErrorMessage,
} from '../auth/auth-error-message.js'

import {
    useAuth,
} from '../auth/useAuth.js'

import {
    FullPageLoader,
} from '../components/FullPageLoader.jsx'

export function VerifyEmailPage() {
    const [searchParams] =
        useSearchParams()

    const token =
        searchParams.get('token') ?? ''

    const {
        accessToken,
        isAuthenticated,
        isLoading,
        loadProfile,
        user,
    } = useAuth()

    const confirmationStarted =
        useRef(false)

    const profileRefreshStarted =
        useRef(false)

    const [confirmationState, setConfirmationState] =
        useState(
            token
                ? 'confirming'
                : 'pending',
        )

    const [confirmationError, setConfirmationError] =
        useState('')

    const [resendState, setResendState] =
        useState('idle')

    const [resendError, setResendError] =
        useState('')

    useEffect(() => {
        if (
            !token
            || confirmationStarted.current
        ) {
            return
        }

        confirmationStarted.current = true

        confirmEmailVerification(token)
            .then(() => {
                setConfirmationState(
                    'verified',
                )
            })
            .catch((error) => {
                setConfirmationError(
                    getAuthErrorMessage(error),
                )

                setConfirmationState(
                    'failed',
                )
            })
    }, [token])

    useEffect(() => {
        if (
            confirmationState !== 'verified'
            || !isAuthenticated
            || profileRefreshStarted.current
        ) {
            return
        }

        profileRefreshStarted.current = true

        loadProfile()
            .catch(() => undefined)
    }, [
        confirmationState,
        isAuthenticated,
        loadProfile,
    ])

    const handleResend = async () => {
        if (!accessToken) {
            return
        }

        setResendError('')
        setResendState('sending')

        try {
            await requestEmailVerification(
                accessToken,
            )

            setResendState('sent')
        } catch (error) {
            setResendError(
                getAuthErrorMessage(error),
            )

            setResendState('idle')
        }
    }

    if (token && confirmationState === 'confirming') {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <header className="auth-header">
                        <p className="eyebrow">
                            Learn2Code
                        </p>

                        <h1>Verificando correo</h1>

                        <p>
                            Estamos confirmando tu cuenta.
                        </p>
                    </header>
                </section>
            </main>
        )
    }

    if (token && confirmationState === 'verified') {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <header className="auth-header">
                        <p className="eyebrow">
                            Learn2Code
                        </p>

                        <h1>Correo verificado</h1>

                        <p>
                            Tu cuenta fue confirmada
                            correctamente.
                        </p>
                    </header>

                    <p className="auth-switch">
                        <Link
                            to={
                                isAuthenticated
                                    ? '/diagnostic'
                                    : '/login'
                            }
                        >
                            Continuar
                        </Link>
                    </p>
                </section>
            </main>
        )
    }

    if (token && confirmationState === 'failed') {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <header className="auth-header">
                        <p className="eyebrow">
                            Learn2Code
                        </p>

                        <h1>
                            No pudimos verificar el correo
                        </h1>
                    </header>

                    <p
                        className="form-error"
                        role="alert"
                    >
                        {confirmationError}
                    </p>

                    <p className="auth-switch">
                        <Link
                            to={
                                isAuthenticated
                                    ? '/verify-email'
                                    : '/login'
                            }
                        >
                            Solicitar otro enlace
                        </Link>
                    </p>
                </section>
            </main>
        )
    }

    if (isLoading) {
        return <FullPageLoader />
    }

    if (!isAuthenticated) {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <header className="auth-header">
                        <p className="eyebrow">
                            Learn2Code
                        </p>

                        <h1>Verifica tu correo</h1>

                        <p>
                            Inicia sesión para solicitar
                            otro mensaje de verificación.
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

                    <h1>Verifica tu correo</h1>

                    <p>
                        Enviamos un enlace de verificación
                        a {user?.email}.
                    </p>
                </header>

                {resendState === 'sent' && (
                    <p role="status">
                        El mensaje fue enviado nuevamente.
                    </p>
                )}

                {resendError && (
                    <p
                        className="form-error"
                        role="alert"
                    >
                        {resendError}
                    </p>
                )}

                <button
                    disabled={
                        resendState === 'sending'
                    }
                    onClick={handleResend}
                    type="button"
                >
                    {resendState === 'sending'
                        ? 'Enviando mensaje...'
                        : 'Reenviar correo'}
                </button>

                <p className="auth-switch">
                    <Link to="/onboarding">
                        Ir al panel
                    </Link>
                </p>
            </section>
        </main>
    )
}
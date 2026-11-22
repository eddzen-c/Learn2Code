
import {
    useEffect,
    useRef,
    useState,
} from 'react'

import {
    Link,
    useLocation,
    useNavigate,
} from 'react-router-dom'

import {
    FiArrowLeft,
    FiArrowRight,
    FiClock,
    FiInfo,
} from 'react-icons/fi'

import {
    confirmEmailVerificationCode,
    requestEmailVerificationCode,
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

import {
    AuthFlowBrandPanel,
} from '../components/AuthFlowBrandPanel.jsx'

import './verifyEmailPage.css'
import './AuthFlow.css'
import './VerifyEmailMockup.css'

const EMPTY_CODE = ['', '', '', '', '', '']

export function VerifyEmailPage() {
    const navigate = useNavigate()

    const location = useLocation()

    const initialVerification =
        location.state?.emailVerification ?? null

    const initialCodeSent =
        initialVerification?.requested === true

    const {
        accessToken,
        isAuthenticated,
        isLoading,
        loadProfile,
        signOut,
        user,
    } = useAuth()

    const digitRefs = useRef([])

    const [digits, setDigits] = useState(EMPTY_CODE)

    const [resendState, setResendState] = useState(
        initialCodeSent ? 'sent' : 'idle',
    )

    const [deliverySimulated, setDeliverySimulated] = useState(
        initialVerification?.delivery?.simulated === true,
    )

    const [resendError, setResendError] = useState('')
    const [codeError, setCodeError] = useState('')
    const [isConfirmingCode, setIsConfirmingCode] =
        useState(false)
    const [codeVerified, setCodeVerified] = useState(false)

    const [secondsRemaining, setSecondsRemaining] = useState(
        initialCodeSent ? 60 : 0,
    )

    // Temporizador visual. El servidor aplica el límite real.
    useEffect(() => {
        if (secondsRemaining <= 0) {
            return undefined
        }

        const timeout = window.setTimeout(() => {
            setSecondsRemaining((seconds) =>
                Math.max(0, seconds - 1),
            )
        }, 1000)

        return () => window.clearTimeout(timeout)
    }, [secondsRemaining])

    const updateDigit = (index, rawValue) => {
        const clean = rawValue.replace(/\D/g, '')

        if (clean.length > 1) {
            const next = [...digits]

            for (
                let position = 0;
                position < clean.length
                && index + position < 6;
                position++
            ) {
                next[index + position] = clean[position]
            }

            setDigits(next)

            digitRefs.current[
                Math.min(index + clean.length, 5)
            ]?.focus()

            return
        }

        const next = [...digits]
        next[index] = clean.slice(-1)
        setDigits(next)
        setCodeError('')

        if (clean && index < 5) {
            digitRefs.current[index + 1]?.focus()
        }
    }

    const handlePaste = (event, index) => {
        const value = event.clipboardData
            .getData('text')
            .replace(/\D/g, '')
            .slice(0, 6 - index)

        if (!value) {
            return
        }

        event.preventDefault()
        updateDigit(index, value)
    }

    const handleKeyDown = (event, index) => {
        if (
            event.key === 'Backspace'
            && !digits[index]
            && index > 0
        ) {
            digitRefs.current[index - 1]?.focus()
        }

        if (
            event.key === 'ArrowLeft'
            && index > 0
        ) {
            digitRefs.current[index - 1]?.focus()
        }

        if (
            event.key === 'ArrowRight'
            && index < 5
        ) {
            digitRefs.current[index + 1]?.focus()
        }
    }

    const handleResend = async () => {
        if (
            !accessToken
            || resendState === 'sending'
            || secondsRemaining > 0
        ) {
            return
        }

        setDeliverySimulated(false)
        setResendError('')
        setResendState('sending')

        try {
            const result =
                await requestEmailVerificationCode(
                    accessToken,
                )

            setDeliverySimulated(result.delivery?.simulated === true)

            if (result.alreadyVerified) {
                setCodeVerified(true)
                loadProfile().catch(() => undefined)
                return
            }

            setResendState('sent')
            setSecondsRemaining(60)
            setDigits([...EMPTY_CODE])
        } catch (error) {
            setResendError(
                getAuthErrorMessage(error),
            )
            setResendState('idle')
        }
    }

    const handleConfirmCode = async (event) => {
        event.preventDefault()

        const code = digits.join('')

        if (
            code.length !== 6
            || !accessToken
            || isConfirmingCode
        ) {
            return
        }

        setCodeError('')
        setIsConfirmingCode(true)

        try {
            await confirmEmailVerificationCode({
                accessToken,
                code,
            })

            setCodeVerified(true)
            loadProfile().catch(() => undefined)
        } catch (error) {
            setCodeError(
                getAuthErrorMessage(error),
            )
        } finally {
            setIsConfirmingCode(false)
        }
    }

    const handleBackToRegister = async () => {
        if (signOut) {
            await signOut()
        }

        navigate('/register', { replace: true })
    }

    if (isLoading) {
        return <FullPageLoader />
    }


    if (!isAuthenticated) {
        return (
            <main className="auth-flow auth-flow--verification">
                <AuthFlowBrandPanel mode="verification" />

                <section className="auth-verify__right">
                    <Link
                        className="auth-verify__back"
                        to="/register"
                    >
                        <FiArrowLeft aria-hidden="true" />
                        Volver al registro
                    </Link>

                    <div className="auth-verify__content">
                        <img
                            className="auth-verify__icon"
                            src="/images/auth-flow/icono-principal-correo-confirmado-240.webp"
                            alt=""
                            aria-hidden="true"
                        />

                        <h1>Verifica tu correo</h1>

                        <p className="auth-verify__intro">
                            Para proteger tu cuenta,
                            inicia sesión y confirma tu
                            correo con un código de seis dígitos.
                        </p>

                        <Link
                            className="auth-verify__primary"
                            to="/login"
                        >
                            Iniciar sesión
                            <FiArrowRight aria-hidden="true" />
                        </Link>

                        <div className="auth-verify__notice">
                            <FiInfo aria-hidden="true" />
                            <span>
                                Después de iniciar sesión,
                                podrás solicitar tu código
                                de verificación.
                            </span>
                        </div>
                    </div>

                    <p className="auth-verify__copyright">
                        © 2026 Learn2Code
                    </p>
                </section>
            </main>
        )
    }


    return (
        <main className="auth-flow auth-flow--verification">
            <AuthFlowBrandPanel mode="verification" />

            <section className="auth-verify__right">
                <button
                    className="auth-verify__back"
                    onClick={handleBackToRegister}
                    type="button"
                >
                    <FiArrowLeft aria-hidden="true" />
                    Salir y volver al registro
                </button>

                <div className="auth-verify__content">
                    <img
                        className="auth-verify__icon"
                        src="/images/auth-flow/icono-principal-correo-confirmado-240.webp"
                        alt=""
                        aria-hidden="true"
                    />

                    {codeVerified || user?.emailVerified ? (
                        <div className="auth-verify__completed">
                            <h1>Correo verificado</h1>
                            <p>
                                Tu cuenta está lista para comenzar
                                tu aprendizaje en Learn2Code.
                            </p>

                            <Link
                                className="auth-verify__primary"
                                to="/onboarding"
                            >
                                Continuar
                                <FiArrowRight aria-hidden="true" />
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h1>Verifica tu correo</h1>

                            <p className="auth-verify__intro">
                                {resendState === 'sent' && !deliverySimulated
                                    ? 'Enviamos un código de 6 dígitos a'
                                    : 'Solicita un código de 6 dígitos para verificar'}
                                {' '}
                                <strong>{user?.email}</strong>
                            </p>

                            <form onSubmit={handleConfirmCode}>
                                <label
                                    className="auth-verify__label"
                                    htmlFor="verification-digit-0"
                                >
                                    Código de verificación
                                </label>

                                <div className="auth-verify__digits">
                                    {digits.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(element) => {
                                                digitRefs.current[index] =
                                                    element
                                            }}
                                            aria-label={`Dígito ${index + 1}`}
                                            autoComplete={
                                                index === 0
                                                    ? 'one-time-code'
                                                    : 'off'
                                            }
                                            id={`verification-digit-${index}`}
                                            inputMode="numeric"
                                            maxLength={6}
                                            onChange={(event) =>
                                                updateDigit(
                                                    index,
                                                    event.target.value,
                                                )
                                            }
                                            onKeyDown={(event) =>
                                                handleKeyDown(event, index)
                                            }
                                            onPaste={(event) =>
                                                handlePaste(event, index)
                                            }
                                            pattern="[0-9]*"
                                            type="text"
                                            value={digit}
                                        />
                                    ))}
                                </div>

                                <p className="auth-verify__expiration">
                                    El código vence en 10 minutos.
                                </p>

                                {codeError && (
                                    <p
                                        className="auth-verify__error"
                                        role="alert"
                                    >
                                        {codeError}
                                    </p>
                                )}

                                <button
                                    className="auth-verify__primary"
                                    disabled={
                                        digits.some((digit) => !digit)
                                        || isConfirmingCode
                                    }
                                    type="submit"
                                >
                                    {isConfirmingCode
                                        ? 'Verificando...'
                                        : 'Verificar correo'}

                                    <FiArrowRight aria-hidden="true" />
                                </button>
                            </form>

                            <div className="auth-verify__resend">
                                <FiClock aria-hidden="true" />

                                <span>
                                    ¿No recibiste el código?
                                </span>

                                <button
                                    disabled={
                                        resendState === 'sending'
                                        || secondsRemaining > 0
                                    }
                                    onClick={handleResend}
                                    type="button"
                                >
                                    {resendState === 'sending'
                                        ? 'Enviando...'
                                        : secondsRemaining > 0
                                            ? `Reenviar en 00:${String(secondsRemaining).padStart(2, '0')}`
                                            : resendState === 'sent'
                                                ? 'Reenviar código'
                                                : 'Enviar código'}
                                </button>
                            </div>

                            {resendState === 'sent' && (
                                <p
                                    className="auth-verify__status"
                                    role="status"
                                >
                                    {deliverySimulated
                                        ? 'Modo de prueba: el código se generó, pero no se envió ningún correo.'
                                        : 'El código fue enviado a tu correo.'}
                                </p>
                            )}

                            {resendError && (
                                <p
                                    className="auth-verify__error"
                                    role="alert"
                                >
                                    {resendError}
                                </p>
                            )}

                            <div className="auth-verify__notice">
                                <FiInfo aria-hidden="true" />
                                <span>
                                    Revisa también tu carpeta de
                                    spam o correo no deseado.
                                </span>
                            </div>
                        </>
                    )}
                </div>

                <p className="auth-verify__copyright">
                    © 2026 Learn2Code
                </p>
            </section>
        </main>
    )
}

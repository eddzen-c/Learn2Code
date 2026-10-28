
import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiArrowRight,
  FiBriefcase,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiGithub,
  FiLock,
  FiMail,
  FiShield,
  FiUser,
  FiUserPlus,
} from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'

import { AuthContext } from '../auth/auth-context.js'
import { AuthBrandPanel } from '../components/AuthBrandPanel.jsx'
import { getAuthErrorMessage } from '../auth/auth-error-message.js'

import './AuthMockup.css'

export default function RegisterPage() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordRequirements = [
    {
      label: 'Al menos 8 caracteres',
      met: password.length >= 8,
    },
    {
      label: 'Una mayúscula',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'Un número',
      met: /[0-9]/.test(password),
    },
    {
      label: 'Un carácter especial',
      met: /[^A-Za-z0-9]/.test(password),
    },
  ]

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    if (!passwordRequirements.every((requirement) => requirement.met)) {
      setErrorMessage(
        'La contraseña no cumple todos los requisitos de seguridad.'
      )
      return
    }

    if (!termsAccepted) {
      setErrorMessage('Debes aceptar los términos para continuar.')
      return
    }

    setIsSubmitting(true)

    try {
      const completeName = `${fullName.trim()} ${lastName.trim()}`.trim()


      const registration = await auth.signUp({
        fullName: completeName,
        email: email.trim(),
        password,
      })

      navigate('/verify-email', {
        replace: true,
        state: {
          email: email.trim(),
          emailVerification: registration.emailVerification,
        },
      })

    } catch (error) {
      setErrorMessage(
        getAuthErrorMessage(error) ||
        'No fue posible crear tu cuenta.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-mockup auth-mockup--register">
      <AuthBrandPanel mode="register" />

      <section className="auth-mockup__form-panel">
        <div className="auth-mockup__form-content">

          <div className="auth-register-top">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login">Iniciar sesión</Link>
          </div>

          <div className="auth-account-types">
            <div className="auth-account-tab is-active">
              <FiUserPlus aria-hidden="true" />
              <span>Crear cuenta</span>
            </div>

            <div
              className="auth-account-tab is-unavailable"
              title="Próximamente"
            >
              <FiBriefcase aria-hidden="true" />
              <span>Para empresas</span>
            </div>
          </div>

          <header className="auth-form-header">
            <h1>Crea tu cuenta gratuita</h1>
            <p>
              Empieza a aprender y construye tu futuro en tecnología.
            </p>
          </header>

          <form className="auth-mockup-form" onSubmit={handleSubmit}>

            <div className="auth-register-name-row">
              <div className="auth-field">
                <label htmlFor="register-name">
                  Nombre completo
                </label>
                <div className="auth-input-wrapper">
                  <FiUser aria-hidden="true" />
                  <input
                    id="register-name"
                    autoComplete="given-name"
                    placeholder="Ej. Ana Gabriela"
                    required
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="register-last-name">
                  Apellido
                </label>
                <div className="auth-input-wrapper">
                  <FiUser aria-hidden="true" />
                  <input
                    id="register-last-name"
                    autoComplete="family-name"
                    placeholder="Ej. Ramírez"
                    value={lastName}
                    onChange={(event) =>
                      setLastName(event.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">
                Correo electrónico
              </label>
              <div className="auth-input-wrapper">
                <FiMail aria-hidden="true" />
                <input
                  id="register-email"
                  autoComplete="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">
                Contraseña
              </label>
              <div className="auth-input-wrapper">
                <FiLock aria-hidden="true" />
                <input
                  id="register-password"
                  autoComplete="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  required
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={
                    showPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                  aria-pressed={showPassword}
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-confirm">
                Confirmar contraseña
              </label>
              <div className="auth-input-wrapper">
                <FiLock aria-hidden="true" />
                <input
                  id="register-confirm"
                  autoComplete="new-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  required
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={
                    showConfirmPassword
                      ? 'Ocultar confirmación'
                      : 'Mostrar confirmación'
                  }
                  aria-pressed={showConfirmPassword}
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="auth-password-requirements">
              <p>Tu contraseña debe incluir:</p>

              <div className="auth-password-rules">
                {passwordRequirements.map(({ label, met }) => (
                  <div
                    className={`auth-password-rule ${met ? 'is-met' : ''}`}
                    key={label}
                  >
                    <FiCheck aria-hidden="true" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <label className="auth-register-terms">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                aria-label="Acepto los Términos y la Política de Privacidad"
                onChange={(event) =>
                  setTermsAccepted(event.target.checked)
                }
              />

              <span>
                Acepto los{' '}
                <span className="auth-register-terms-highlight">
                  Términos de Servicio
                </span>
                {' '}y la{' '}
                <span className="auth-register-terms-highlight">
                  Política de Privacidad
                </span>
              </span>
            </label>

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
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
              {!isSubmitting && <FiArrowRight aria-hidden="true" />}
            </button>

          </form>

          <div className="auth-social-divider">
            <span>o continúa con</span>
          </div>

          <div className="auth-social-options">
            <button className="auth-social-button" disabled type="button">
              <FcGoogle aria-hidden="true" />
              Continuar con Google
              <small>Próximamente</small>
            </button>

            <button className="auth-social-button" disabled type="button">
              <FiGithub aria-hidden="true" />
              Continuar con GitHub
              <small>Próximamente</small>
            </button>
          </div>

          <div className="auth-register-trust">
            <FiShield aria-hidden="true" />
            <div>
              <strong>Sin spam, sin trucos.</strong>
              <p>Recursos para impulsar tu aprendizaje.</p>
            </div>
          </div>

          <footer className="auth-register-copyright">
            © 2026 Learn2Code. Todos los derechos reservados.
          </footer>

        </div>
      </section>
    </main>
  )
}

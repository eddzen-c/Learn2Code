import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../auth/auth-context'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Consumimos el contexto correctamente
  const auth = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    try {
      // Ajusta esto según cómo tengas estructurado tu AuthContext (ej. auth.signUp o auth.register)
      await auth.signUp({ fullName, email, password })
      navigate('/verify-email', { state: { email } })
    } catch (err) {
      setErrorMessage(err.message || 'Error al registrar la cuenta.')
    }
  }

  return (
    <main className="login-page-container">
      <div className="login-card-wrapper">
        <div className="login-left-panel">
          <div className="login-form-wrapper">
            <div className="login-brand">
              <span className="login-brand-icon">[&lt;&gt;]</span>
              Learn2Code
            </div>
            <h1 className="login-title">Crear cuenta</h1>
            <p className="login-subtitle">Únete a miles de estudiantes y comienza tu viaje.</p>

            {errorMessage && (
              <div role="alert" className="error-alert">
                {errorMessage}
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="register-name">Nombre completo</label>
                <div className="input-field-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    id="register-name"
                    name="fullName"
                    type="text"
                    required
                    placeholder="Ej. Ana García"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="register-email">Correo electrónico</label>
                <div className="input-field-wrapper">
                  <span className="input-icon">✉</span>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="register-password">Contraseña</label>
                <div className="input-field-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Crea una contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="register-confirm">Confirmar contraseña</label>
                <div className="input-field-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="register-confirm"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Confirma tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="login-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  Acepto los Términos y la Política
                </label>
              </div>

              <button className="btn-submit-login" type="submit">
                Crear cuenta
              </button>
            </form>

            <p className="login-footer-text">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login">Iniciar sesión</Link>
            </p>
          </div>
        </div>

        <div className="login-right-panel">
          <img src="/images/registro.jpg" alt="Ilustración de registro" className="illustration-img" />
        </div>
      </div>
    </main>
  )
}
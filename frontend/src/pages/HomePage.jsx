import React from 'react'
import { useNavigate } from 'react-router-dom'
import './HomePage.css'

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="home-container">
      {/* Navigation Bar */}
      <header className="home-navbar">
        <div className="nav-logo">
          <span className="logo-icon">{`[<>]`}</span>
          <span className="logo-text">Learn2Code</span>
        </div>

        <nav className="nav-menu">
          <a href="#inicio" className="nav-item active" onClick={() => navigate('/login')}>Inicio</a>
          <a href="#rutas" className="nav-item">Rutas</a>
          <a href="#cursos" className="nav-item">Cursos</a>
          <a href="#comunidad" className="nav-item">Comunidad</a>
          <a href="#precios" className="nav-item">Precios</a>
        </nav>

        <div className="nav-buttons">
          <button className="btn-secondary-nav" onClick={() => navigate('/login')}>
            Iniciar sesión
          </button>
          <button className="btn-primary-nav" onClick={() => navigate('/register')}>
            Empieza gratis
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Columna Izquierda: Información */}
        <div className="hero-content">
          <div className="status-badge">
            <span className="badge-dot"></span>
            Empieza hoy. Sin tarjeta. Cancela cuando quieras.
          </div>

          <h1 className="hero-heading">
            Tu mejor decisión para aprender a{" "}
            <span className="highlight-blue-wrapper">
              <span className="highlight-blue">programar</span>
              <svg className="blue-underline" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 9C50 3 150 2 198 8" stroke="#1A56DB" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="hero-description">
            Lecciones prácticas, proyectos reales y una comunidad que te acompaña en cada paso. Desde cero hasta tu primer trabajo como desarrollador.
          </p>

          <div className="hero-cta-group">
            <button className="btn-primary-large" onClick={() => navigate('/register')}>
              Empieza gratis →
            </button>
            <button className="btn-outline-large" onClick={() => navigate('/register')}>
              Explorar rutas
            </button>
          </div>

          <div className="hero-features">
            <div className="feature-pill">
              <svg className="check-svg" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="9" stroke="#22C55E" strokeWidth="1.5" fill="#F0FDF4"/>
                <path d="M6 10L8.5 12.5L14 7" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Gratis para empezar</span>
            </div>

            <div className="feature-pill">
              <svg className="check-svg" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="9" stroke="#22C55E" strokeWidth="1.5" fill="#F0FDF4"/>
                <path d="M6 10L8.5 12.5L14 7" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Contenido práctico</span>
            </div>

            <div className="feature-pill">
              <svg className="check-svg" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="9" stroke="#22C55E" strokeWidth="1.5" fill="#F0FDF4"/>
                <path d="M6 10L8.5 12.5L14 7" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Certificados de logros</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Captura cargada directamente desde /public/images/ */}
        <div className="hero-visual">
          <img 
            src="/images/Hero_visual.png" 
            alt="Ilustración principal Learn2Code" 
            className="hero-img-full"
          />
        </div>
      </section>

      {/* Grid de 4 Pilares / Beneficios */}
      <section className="features-section">
        <div className="feature-card">
          <div className="icon-wrapper blue-bg">📖</div>
          <h3>Rutas guiadas</h3>
          <p>Sigue un camino claro desde lo básico hasta temas avanzados.</p>
        </div>

        <div className="feature-card">
          <div className="icon-wrapper green-bg">{`</>`}</div>
          <h3>Aprende haciendo</h3>
          <p>Ejercicios, desafíos y proyectos para aplicar lo que aprendes en la vida real.</p>
        </div>

        <div className="feature-card">
          <div className="icon-wrapper purple-bg">👥</div>
          <h3>Comunidad activa</h3>
          <p>Conéctate con estudiantes, comparte tu progreso y resuelve dudas.</p>
        </div>

        <div className="feature-card">
          <div className="icon-wrapper yellow-bg">🏆</div>
          <h3>Logros y certificados</h3>
          <p>Gana insignias, certificados y reconocimiento por tus habilidades.</p>
        </div>
      </section>

      {/* Footer / Tecnologías y Testimonios */}
      <section className="bottom-grid">
        <div className="tech-box">
          <h3>Tecnologías que aprenderás</h3>

          <div className="tech-grid">
            <div className="tech-item">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" alt="HTML5" />
              <span>HTML</span>
            </div>

            <div className="tech-item">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" alt="CSS3" />
              <span>CSS</span>
            </div>

            <div className="tech-item">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="JavaScript" />
              <span>JavaScript</span>
            </div>

            <div className="tech-item">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" alt="Python" />
              <span>Python</span>
            </div>

            <div className="tech-item">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React" />
              <span>React</span>
            </div>

            <div className="tech-item">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" alt="Node.js" />
              <span>Node.js</span>
            </div>

            <div className="tech-item">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" alt="Git & GitHub" />
              <span>Git & GitHub</span>
            </div>
          </div>

          <div className="tech-footer">
            <span className="tech-subtext">Y muchas más tecnologías modernas...</span>
            <button className="btn-outline-small">Ver todas las tecnologías</button>
          </div>
        </div>

        {/* TESTIMONIOS ESTUDIANTES */}
        <div className="testimonials-box">
          <div className="testimonials-header">
            <h3>Lo que dicen nuestros estudiantes</h3>
            <a href="#testimonios" className="link-more">Ver más testimonios</a>
          </div>

          <div className="testimonials-wrapper">
            <div className="testimonials-list">
              {/* Tarjeta 1 */}
              <div className="testimonial-card">
                <div className="testimonial-body">
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                    alt="Ana G." 
                    className="user-avatar" 
                  />
                  <p className="comment">
                    "Learn2Code me dio la estructura y motivación que necesitaba. Hoy trabajo como desarrollador."
                  </p>
                </div>
                <div className="user-info">
                  <strong>– Ana G.</strong>
                  <span>Desarrolladora Frontend</span>
                </div>
                <div className="rating-stars">★★★★★</div>
              </div>

              {/* Tarjeta 2 */}
              <div className="testimonial-card">
                <div className="testimonial-body">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" 
                    alt="Carlos M." 
                    className="user-avatar" 
                  />
                  <p className="comment">
                    "Los proyectos y desafíos son increíbles. Aprendes haciendo de verdad."
                  </p>
                </div>
                <div className="user-info">
                  <strong>– Carlos M.</strong>
                  <span>Estudiante de Ingeniería</span>
                </div>
                <div className="rating-stars">★★★★★</div>
              </div>

              {/* Tarjeta 3 */}
              <div className="testimonial-card">
                <div className="testimonial-body">
                  <img 
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80" 
                    alt="Sofía R." 
                    className="user-avatar" 
                  />
                  <p className="comment">
                    "La comunidad es lo mejor. Siempre hay alguien que te ayuda."
                  </p>
                </div>
                <div className="user-info">
                  <strong>– Sofía R.</strong>
                  <span>Desarrolladora Full Stack</span>
                </div>
                <div className="rating-stars">★★★★★</div>
              </div>
            </div>

            {/* Flecha de navegación lateral */}
            <button className="nav-arrow-btn" aria-label="Siguiente testimonio">
              ›
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
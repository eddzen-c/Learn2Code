import {
    FiAward, FiCode, FiHome, FiMap, FiMenu, FiUser, FiX,
} from 'react-icons/fi'
import { useId, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './LearningSidebar.css'

// Única navegación para todas las pantallas privadas de Learn2Code.
// Las secciones todavía no funcionales continúan ocultas para la exposición.
const LEARNING_NAVIGATION_ITEMS = Object.freeze([
    { key: 'home', label: 'Inicio', path: '/dashboard', Icon: FiHome },
    { key: 'routes', label: 'Rutas', path: '/routes', Icon: FiMap },
    { key: 'exercises', label: 'Ejercicios', path: '/exercises', Icon: FiCode },
    { key: 'achievements', label: 'Logros', path: '/badges', Icon: FiAward },
    { key: 'profile', label: 'Perfil', path: '/profile', Icon: FiUser },
])

const getSidebarActiveItem = (pathname) => {
    if (pathname === '/routes' || pathname.startsWith('/routes/')
        || pathname === '/recommended-plan'
        || pathname === '/my-recommendation'
        || pathname === '/start-learning') return 'routes'

    if (pathname === '/exercises' || pathname.startsWith('/exercises/')
        || pathname.startsWith('/resolver-ejercicio')
        || pathname === '/ejercicio-completado') return 'exercises'

    if (pathname === '/badges' || pathname.startsWith('/badges/')) return 'achievements'

    if (pathname === '/profile' || pathname.startsWith('/profile/')) return 'profile'

    // Onboarding, diagnóstico y resultados pertenecen al recorrido inicial.
    return 'home'
}

export function LearningSidebar({
    // La apariencia y la mascota son únicas, sin variantes visuales.
    // activeItem solo sirve de respaldo en pruebas fuera de una ruta real.
    activeItem: fallbackActiveItem = 'home',
    streakDays = null,
}) {
    const { pathname } = useLocation()
    const activeItem = pathname === '/'
        ? fallbackActiveItem
        : getSidebarActiveItem(pathname)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const navigationId = useId()

    return (
        <aside
            className="onboarding-sidebar learning-sidebar--profile learning-sidebar--unified"
            aria-label="Barra lateral de Learn2Code"
        >
            <Link
                className="onboarding-brand"
                to="/dashboard"
                aria-label="Learn2Code - Ir a Inicio"
            >
                <span className="learning-brand-icon" aria-hidden="true">
                    <FiCode />
                </span>
                <strong className="learning-brand-text">
                    Learn<span>2</span>Code
                </strong>
            </Link>

            <button
                type="button"
                className="learning-sidebar-menu-toggle"
                aria-expanded={mobileMenuOpen}
                aria-controls={navigationId}
                aria-label={mobileMenuOpen
                    ? 'Cerrar menú de navegación'
                    : 'Abrir menú de navegación'}
                onClick={() => setMobileMenuOpen((current) => !current)}
            >
                {mobileMenuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
            </button>

            <nav
                id={navigationId}
                className={mobileMenuOpen
                    ? 'onboarding-navigation is-mobile-open'
                    : 'onboarding-navigation'}
                aria-label="Navegación principal"
            >
                {LEARNING_NAVIGATION_ITEMS.map(({ key, label, path, Icon }) => (
                    <Link
                        key={key}
                        to={path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={activeItem === key ? 'is-active' : undefined}
                        aria-current={activeItem === key ? 'page' : undefined}
                    >
                        <span aria-hidden="true"><Icon /></span>
                        <span>{label}</span>
                    </Link>
                ))}
            </nav>

            <div className="learning-sidebar-bottom">
                {/* Exposición: no mostrar suscripción Pro sin integración real. */}
                <div className="learning-sidebar-dragon">
                    <img
                        src="/images/dragon-laptop-512.png"
                        alt="Dragón de Learn2Code programando"
                        className="learning-sidebar-dragon-image"
                    />
                </div>

                {streakDays != null
                    && Number.isFinite(Number(streakDays))
                    && (
                        <section className="learning-sidebar-streak">
                            <div className="learning-sidebar-streak-heading">
                                <span className="learning-sidebar-fire" aria-hidden="true">🔥</span>
                                <div>
                                    <span>Racha actual</span>
                                    <strong>
                                        {Math.max(0, Math.trunc(Number(streakDays)))} días
                                    </strong>
                                </div>
                            </div>
                        </section>
                    )}
            </div>
        </aside>
    )
}

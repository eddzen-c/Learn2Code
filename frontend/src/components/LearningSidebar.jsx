
/**
 * Learn2Code - Barra lateral reutilizable.
 *
 * Se utiliza en el onboarding, el dashboard y el perfil.
 * La variante "profile" muestra el menú completo,
 * la tarjeta Pro, la mascota y la racha semanal.
 */

import {
    FiAward,
    FiBookOpen,
    FiCheck,
    FiCode,
    FiHome,
    FiMap,
    FiPackage,
    FiUser,
    FiUsers,
} from 'react-icons/fi'

import { Link } from 'react-router-dom'

// Opciones compartidas de navegación.
const navigationItems = [
    {
        key: 'home',
        label: 'Inicio',
        path: '/dashboard',
        Icon: FiHome,
    },
    {
        key: 'routes',
        label: 'Rutas',
        path: '/routes',
        Icon: FiMap,
    },
    {
        key: 'courses',
        label: 'Cursos',
        path: '/courses',
        Icon: FiBookOpen,
    },
    {
        key: 'exercises',
        label: 'Ejercicios',
        path: '/exercises',
        Icon: FiCode,
    },
    {
        key: 'projects',
        label: 'Proyectos',
        path: '/projects',
        Icon: FiPackage,
    },
    {
        key: 'community',
        label: 'Comunidad',
        path: '/community',
        Icon: FiUsers,
    },
    {
        key: 'achievements',
        label: 'Logros',
        path: '/badges',
        Icon: FiAward,
    },
    {
        key: 'profile',
        label: 'Perfil',
        path: '/profile',
        Icon: FiUser,
    },
]

// Días ilustrativos hasta conectar el historial real.
const demoStreakDays = [
    { key: 'lun', label: 'Lun', completed: true },
    { key: 'mar', label: 'Mar', completed: true },
    { key: 'mie', label: 'Mié', completed: true },
    { key: 'jue', label: 'Jue', completed: true },
    { key: 'vie', label: 'Vie', completed: true },
    { key: 'sab', label: 'Sáb', completed: true },
    { key: 'dom', label: 'Dom', completed: false },
]

export function LearningSidebar({
    variant = 'default',
    activeItem = 'home',
    mascotSrc = '/images/learn2code-mascot-laptop.png',
    mascotAlt = 'Dragón de Learn2Code programando',
    messageTitle = 'Tu camino comienza aquí',
    message = 'Configura tu perfil para recibir un diagnóstico y una ruta adaptados a ti.',
}) {
    const isProfileVariant = variant === 'profile'

    // Onboarding muestra menos opciones que Perfil e Inicio.
    const visibleItems = isProfileVariant
        ? navigationItems
        : navigationItems.filter((item) =>
            [
                'home',
                'routes',
                'courses',
                'exercises',
                'profile',
            ].includes(item.key),
        )

    return (
        <aside
            className={
                isProfileVariant
                    ? 'onboarding-sidebar learning-sidebar--profile'
                    : 'onboarding-sidebar'
            }
            aria-label="Barra lateral de Learn2Code"
        >
            {/* Logotipo institucional */}
            <Link
                className="onboarding-brand"
                to="/dashboard"
                aria-label="Learn2Code - Ir a Inicio"
            >
                <span
                    className="learning-brand-icon"
                    aria-hidden="true"
                >
                    <FiCode />
                </span>

                <strong className="learning-brand-text">
                    Learn<span>2</span>Code
                </strong>
            </Link>

            {/* Menú principal */}
            <nav
                className="onboarding-navigation"
                aria-label="Navegación principal"
            >
                {visibleItems.map((item) => {
                    const { Icon } = item
                    const isActive = activeItem === item.key

                    return (
                        <Link
                            key={item.key}
                            to={item.path}
                            className={
                                isActive ? 'is-active' : undefined
                            }
                            aria-current={
                                isActive ? 'page' : undefined
                            }
                        >
                            <span aria-hidden="true">
                                <Icon />
                            </span>

                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {isProfileVariant ? (
                <div className="learning-sidebar-bottom">

                    {/* Promoción de Learn2Code Pro */}
                    <section className="learning-sidebar-promo">
                        <div className="learning-sidebar-promo-heading">
                            <span
                                className="learning-sidebar-crown"
                                aria-hidden="true"
                            >
                                ♛
                            </span>

                            <strong>
                                Aprende sin límites
                            </strong>
                        </div>

                        <p>
                            Accede a rutas premium,
                            proyectos reales y más.
                        </p>

                        {/* Pendiente: conectar suscripciones Pro. */}
                        <button
                            type="button"
                            className="learning-sidebar-pro-button"
                        >
                            Hazte Pro
                        </button>
                    </section>

                    {/* Mascota configurada desde el componente padre */}
                    <div className="learning-sidebar-dragon">
                        <img
                            src={mascotSrc}
                            alt={mascotAlt}
                            className="learning-sidebar-dragon-image"
                        />
                    </div>

                    {/* Racha semanal ilustrativa */}
                    <section className="learning-sidebar-streak">
                        <div className="learning-sidebar-streak-heading">
                            <span
                                className="learning-sidebar-fire"
                                aria-hidden="true"
                            >
                                🔥
                            </span>

                            <div>
                                <span>Racha actual</span>
                                <strong>14 días</strong>
                            </div>
                        </div>

                        <div className="learning-sidebar-streak-days">
                            {demoStreakDays.map((day) => (
                                <div
                                    key={day.key}
                                    className="learning-sidebar-streak-day"
                                >
                                    <span
                                        className={
                                            day.completed
                                                ? 'streak-circle is-complete'
                                                : 'streak-circle'
                                        }
                                    >
                                        {day.completed && (
                                            <FiCheck
                                                aria-hidden="true"
                                            />
                                        )}
                                    </span>

                                    <small>{day.label}</small>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            ) : (
                /* Mensaje de acompañamiento del onboarding */
                <section className="onboarding-sidebar-message">
                    <img
                        src={mascotSrc}
                        alt={mascotAlt}
                        className="onboarding-sidebar-mascot"
                    />

                    <div>
                        <strong>{messageTitle}</strong>
                        <p>{message}</p>
                    </div>
                </section>
            )}
        </aside>
    )
}

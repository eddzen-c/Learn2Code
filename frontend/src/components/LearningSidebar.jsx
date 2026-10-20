import {
    FiBookOpen,
    FiCode,
    FiHome,
    FiMap,
    FiUser,
} from 'react-icons/fi'

import {
    Link,
} from 'react-router-dom'

const navigationItems =
    Object.freeze([
        Object.freeze({
            key: 'home',
            label: 'Inicio',
            path: '/dashboard',
            Icon: FiHome,
        }),
        Object.freeze({
            key: 'routes',
            label: 'Rutas',
            path: '/routes',
            Icon: FiMap,
        }),
        Object.freeze({
            key: 'courses',
            label: 'Cursos',
            path: '/courses',
            Icon: FiBookOpen,
        }),
        Object.freeze({
            key: 'exercises',
            label: 'Ejercicios',
            path: '/exercises',
            Icon: FiCode,
        }),
        Object.freeze({
            key: 'profile',
            label: 'Perfil',
            path: '/profile',
            Icon: FiUser,
        }),
    ])

export function LearningSidebar({
    activeItem = 'home',
    mascotSrc =
    '/images/learn2code-mascot-laptop.png',
    mascotAlt =
    'Mascota de Learn2Code programando',
    messageTitle =
    'Tu camino comienza aquí',
    message =
    'Configura tu perfil para recibir un diagnóstico y una ruta adaptados a ti.',
}) {
    return (
        <aside className="onboarding-sidebar">
            <Link
                className="onboarding-brand"
                to="/dashboard"
            >
                <span aria-hidden="true">
                    <FiCode
                        focusable="false"
                    />
                </span>

                <strong>
                    Learn
                    <span>2</span>
                    Code
                </strong>
            </Link>

            <nav
                aria-label="Navegación principal"
                className="onboarding-navigation"
            >
                {navigationItems.map((item) => {
                    const {
                        Icon,
                    } = item

                    return (
                        <Link
                            className={
                                item.key
                                    === activeItem
                                    ? 'is-active'
                                    : undefined
                            }
                            key={item.key}
                            to={item.path}
                        >
                            <span aria-hidden="true">
                                <Icon
                                    focusable="false"
                                />
                            </span>

                            <span>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            <section className="onboarding-sidebar-message">
                <img
                    alt={mascotAlt}
                    className="onboarding-sidebar-mascot"
                    src={mascotSrc}
                />

                <div>
                    <strong>
                        {messageTitle}
                    </strong>

                    <p>
                        {message}
                    </p>
                </div>
            </section>
        </aside>
    )
}
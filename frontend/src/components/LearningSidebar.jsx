/**
 * ============================================================
 * LEARN2CODE - BARRA LATERAL REUTILIZABLE
 * ============================================================
 *
 * Este componente se utiliza en:
 * - onboarding
 * - profile
 *
 * variant="default"
 *   -> barra del onboarding
 *
 * variant="profile"
 *   -> barra del perfil con menú completo, tarjeta Pro,
 *      mascota y racha
 *
 * IMPORTANTE:
 * Para que el mockup se vea igual, todos los apartados
 * del menú se renderizan con el mismo estilo visual.
 *
 * TODO:
 * Más adelante puedes conectar cada opción a sus rutas reales.
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

import {
    Link,
} from 'react-router-dom'

/* ============================================================
   1. OPCIONES DEL MENÚ
   ============================================================

   Todas tienen:
   - key: identificador interno
   - label: texto visible
   - path: ruta que se intentará abrir
   - Icon: icono asociado

   NOTA:
   Aunque algunas páginas todavía no estén terminadas,
   las dejamos visualmente como enlaces normales para
   mantener la fidelidad del mockup.
*/
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

/* ============================================================
   2. DATOS DEMO DE LA RACHA
   ============================================================

   TODO (backend):
   Reemplazar estos valores de ejemplo por los datos reales
   que se guarden en la base de datos.
*/
const demoStreakDays = [
    { key: 'lun', label: 'Lun', completed: true },
    { key: 'mar', label: 'Mar', completed: true },
    { key: 'mie', label: 'Mié', completed: true },
    { key: 'jue', label: 'Jue', completed: true },
    { key: 'vie', label: 'Vie', completed: true },
    { key: 'sab', label: 'Sáb', completed: true },
    { key: 'dom', label: 'Dom', completed: false },
]

/* ============================================================
   3. COMPONENTE PRINCIPAL
   ============================================================ */
export function LearningSidebar({
    variant = 'default',
    activeItem = 'home',
    mascotSrc = '/images/learn2code-mascot-laptop.png',
    mascotAlt = 'Dragón de Learn2Code programando',
    messageTitle = 'Tu camino comienza aquí',
    message = 'Configura tu perfil para recibir un diagnóstico y una ruta adaptados a ti.',
}) {
    // Saber si estamos en la versión del perfil.
    const isProfileVariant = variant === 'profile'

    // En onboarding se muestran menos apartados.
    const visibleItems = isProfileVariant
        ? navigationItems
        : navigationItems.filter((item) =>
            ['home', 'routes', 'courses', 'exercises', 'profile'].includes(item.key)
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
            {/* =================================================
                4. LOGO
                ================================================= */}
            <Link
                className="onboarding-brand"
                to="/dashboard"
            >
                <span aria-hidden="true">
                    <FiCode />
                </span>

                <strong>
                    Learn<span>2</span>Code
                </strong>
            </Link>

            {/* =================================================
                5. NAVEGACIÓN
                =================================================

                Todos los apartados se muestran visualmente
                como elementos normales del menú.

                activeItem:
                determina cuál se resalta en rojo.
            */}
            <nav
                aria-label="Navegación principal"
                className="onboarding-navigation"
            >
                {visibleItems.map((item) => {
                    const { Icon } = item
                    const isActive = activeItem === item.key

                    return (
                        <Link
                            key={item.key}
                            to={item.path}
                            className={isActive ? 'is-active' : undefined}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <span aria-hidden="true">
                                <Icon />
                            </span>

                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* =================================================
                6. VARIANTE DEL PERFIL
                ================================================= */}
            {isProfileVariant ? (
                <div className="learning-sidebar-bottom">
                    {/* =========================================
                        6.1 TARJETA PRO
                        ========================================= */}
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

                        {/*
                         * TODO:
                         * Conectar este botón con el flujo real
                         * de la suscripción Pro.
                         */}
                        <button
                            className="learning-sidebar-pro-button"
                            type="button"
                        >
                            Hazte Pro
                        </button>
                    </section>

                    {/* =========================================
                        6.2 MASCOTA
                        =========================================

                        IMPORTANTE:
                        Si el archivo original ya trae el fondo
                        blanco integrado, CSS no puede eliminarlo
                        perfectamente.
                        
                        Lo ideal es usar una versión PNG/WebP
                        con transparencia real.
                    */}
                    <div className="learning-sidebar-dragon">
                        <img
                            src={mascotSrc}
                            alt={mascotAlt}
                            className="learning-sidebar-dragon-image"
                        />
                    </div>

                    {/* =========================================
                        6.3 TARJETA DE RACHA
                        ========================================= */}
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
                                    className="learning-sidebar-streak-day"
                                    key={day.key}
                                >
                                    <span
                                        className={
                                            day.completed
                                                ? 'streak-circle is-complete'
                                                : 'streak-circle'
                                        }
                                    >
                                        {day.completed && (
                                            <FiCheck aria-hidden="true" />
                                        )}
                                    </span>

                                    <small>{day.label}</small>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            ) : (
                /* =============================================
                   7. VARIANTE DEL ONBOARDING
                   ============================================= */
                <section className="onboarding-sidebar-message">
                    <img
                        alt={mascotAlt}
                        className="onboarding-sidebar-mascot"
                        src={mascotSrc}
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
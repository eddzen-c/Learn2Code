/**
 * ============================================================
 * LEARN2CODE - PESTAÑA "APRENDIZAJE"
 * ============================================================
 *
 * Este componente representa la vista de preferencias
 * de aprendizaje dentro de la página de perfil.
 *
 * OBJETIVO:
 * Reproducir visualmente el mockup de "Aprendizaje"
 * con la misma estructura:
 *
 * 1. Panel principal de preferencias.
 * 2. Tarjeta lateral "Tu ruta actual".
 * 3. Tarjeta lateral "Diagnóstico inicial".
 * 4. Tarjeta lateral con la mascota.
 * 5. Nota informativa inferior.
 *
 * NOTA:
 * Por ahora los datos son visuales/locales.
 * Más adelante se pueden conectar al backend.
 */

import {
    useState,
} from 'react'

import {
    FiArrowRight,
    FiBarChart2,
    FiBookOpen,
    FiBox,
    FiCheckCircle,
    FiChevronDown,
    FiClock,
    FiInfo,
    FiPlayCircle,
    FiRepeat,
} from 'react-icons/fi'

import './ProfileLearning.css'

export function ProfileLearning() {
    // ========================================================
    // 1. ESTADOS LOCALES
    // ========================================================
    // Estos estados nos permiten simular interacción
    // sin romper el diseño del mockup.

    const [objective, setObjective] = useState(
        'Conseguir trabajo como desarrolladora',
    )

    const [weeklyGoal, setWeeklyGoal] = useState('4 horas')
    const [sessionTime, setSessionTime] = useState('30 minutos')

    // Tecnologías activas según el mockup.
    const [selectedTechnologies, setSelectedTechnologies] =
        useState([
            'React',
            'JavaScript',
            'CSS',
        ])

    // Formato preferido seleccionado.
    const [preferredFormat, setPreferredFormat] =
        useState('Mixto')

    // ========================================================
    // 2. DATOS VISUALES
    // ========================================================

    const technologyOptions = [
        'React',
        'JavaScript',
        'CSS',
        'Node.js',
        'SQL',
    ]

    const formatOptions = [
        {
            label: 'Mixto',
            icon: <FiBookOpen aria-hidden="true" />,
        },
        {
            label: 'Lectura',
            icon: <FiBookOpen aria-hidden="true" />,
        },
        {
            label: 'Video',
            icon: <FiPlayCircle aria-hidden="true" />,
        },
    ]

    // ========================================================
    // 3. MANEJADORES
    // ========================================================

    /**
     * Activa o desactiva una tecnología.
     * Si ya existe en el arreglo, la quita.
     * Si no existe, la agrega.
     */
    const handleTechnologyToggle = (technology) => {
        setSelectedTechnologies((current) => {
            const alreadySelected =
                current.includes(technology)

            if (alreadySelected) {
                return current.filter(
                    (item) => item !== technology,
                )
            }

            return [
                ...current,
                technology,
            ]
        })
    }

    /**
     * Envía el formulario.
     * Por ahora solo evita que recargue la página.
     * TODO (backend):
     * Conectar con endpoint de actualización.
     */
    const handleSubmit = (event) => {
        event.preventDefault()
    }

    // ========================================================
    // 4. RENDER
    // ========================================================

    return (
        <section className="profile-learning">
            {/* ------------------------------------------------
                COLUMNA IZQUIERDA
                Contiene el formulario principal
                ------------------------------------------------ */}
            <div className="profile-learning__main">
                <form
                    className="profile-learning__card"
                    onSubmit={handleSubmit}
                >
                    {/* Encabezado del bloque */}
                    <div className="profile-learning__header">
                        <h2>Preferencias de aprendizaje</h2>

                        <p>
                            Ajusta tus metas y las recomendaciones
                            que recibes.
                        </p>
                    </div>

                    {/* Campo: Objetivo */}
                    <div className="profile-learning__field">
                        <label htmlFor="learning-objective">
                            Objetivo
                        </label>

                        <div className="profile-learning__select-wrapper">
                            <select
                                id="learning-objective"
                                value={objective}
                                onChange={(event) => {
                                    setObjective(
                                        event.target.value,
                                    )
                                }}
                            >
                                <option>
                                    Conseguir trabajo como desarrolladora
                                </option>

                                <option>
                                    Mejorar mis bases de programación
                                </option>

                                <option>
                                    Crear proyectos reales para mi portafolio
                                </option>
                            </select>

                            <FiChevronDown
                                aria-hidden="true"
                                className="profile-learning__select-icon"
                            />
                        </div>
                    </div>

                    {/* Fila de 2 columnas */}
                    <div className="profile-learning__grid-two">
                        <div className="profile-learning__field">
                            <label htmlFor="learning-weekly-goal">
                                Meta semanal
                            </label>

                            <div className="profile-learning__select-wrapper">
                                <select
                                    id="learning-weekly-goal"
                                    value={weeklyGoal}
                                    onChange={(event) => {
                                        setWeeklyGoal(
                                            event.target.value,
                                        )
                                    }}
                                >
                                    <option>4 horas</option>
                                    <option>6 horas</option>
                                    <option>8 horas</option>
                                </select>

                                <FiChevronDown
                                    aria-hidden="true"
                                    className="profile-learning__select-icon"
                                />
                            </div>
                        </div>

                        <div className="profile-learning__field">
                            <label htmlFor="learning-session-time">
                                Tiempo por sesión
                            </label>

                            <div className="profile-learning__select-wrapper">
                                <select
                                    id="learning-session-time"
                                    value={sessionTime}
                                    onChange={(event) => {
                                        setSessionTime(
                                            event.target.value,
                                        )
                                    }}
                                >
                                    <option>30 minutos</option>
                                    <option>45 minutos</option>
                                    <option>60 minutos</option>
                                </select>

                                <FiChevronDown
                                    aria-hidden="true"
                                    className="profile-learning__select-icon"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tecnologías */}
                    <div className="profile-learning__field">
                        <label>
                            Tecnologías de interés
                        </label>

                        <div className="profile-learning__tech-list">
                            {technologyOptions.map((technology) => {
                                const isSelected =
                                    selectedTechnologies.includes(
                                        technology,
                                    )

                                return (
                                    <button
                                        key={technology}
                                        className={
                                            isSelected
                                                ? 'profile-learning__tech-chip profile-learning__tech-chip--active'
                                                : 'profile-learning__tech-chip'
                                        }
                                        type="button"
                                        onClick={() => {
                                            handleTechnologyToggle(
                                                technology,
                                            )
                                        }}
                                    >
                                        <span
                                            className={
                                                isSelected
                                                    ? 'profile-learning__chip-indicator profile-learning__chip-indicator--active'
                                                    : 'profile-learning__chip-indicator'
                                            }
                                            aria-hidden="true"
                                        >
                                            {isSelected ? '✓' : ''}
                                        </span>

                                        <span>{technology}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Formato preferido */}
                    <div className="profile-learning__field">
                        <label>
                            Formato preferido
                        </label>

                        <div className="profile-learning__format-group">
                            {formatOptions.map((format) => {
                                const isActive =
                                    preferredFormat === format.label

                                return (
                                    <button
                                        key={format.label}
                                        className={
                                            isActive
                                                ? 'profile-learning__format-button profile-learning__format-button--active'
                                                : 'profile-learning__format-button'
                                        }
                                        type="button"
                                        onClick={() => {
                                            setPreferredFormat(
                                                format.label,
                                            )
                                        }}
                                    >
                                        <span
                                            className="profile-learning__format-icon"
                                            aria-hidden="true"
                                        >
                                            {format.icon}
                                        </span>

                                        <span>{format.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="profile-learning__actions">
                        <button
                            className="profile-learning__button profile-learning__button--secondary"
                            type="button"
                        >
                            Cancelar
                        </button>

                        <button
                            className="profile-learning__button profile-learning__button--primary"
                            type="submit"
                        >
                            Guardar preferencias
                        </button>
                    </div>
                </form>
            </div>

            {/* ------------------------------------------------
                COLUMNA DERECHA
                Tarjetas laterales del mockup
                ------------------------------------------------ */}
            <aside className="profile-learning__sidebar">
                {/* Tarjeta: Tu ruta actual */}
                <article className="profile-learning__side-card">
                    <div className="profile-learning__side-title">
                        <FiBox aria-hidden="true" />
                        <h3>Tu ruta actual</h3>
                    </div>

                    <div className="profile-learning__route-tags">
                        <span className="profile-learning__route-tag">
                            Ruta Frontend
                        </span>

                        <span className="profile-learning__route-badge">
                            Intermedio
                        </span>
                    </div>

                    <div className="profile-learning__progress">
                        <div className="profile-learning__progress-bar">
                            <div className="profile-learning__progress-fill" />
                        </div>

                        <span className="profile-learning__progress-percent">
                            42%
                        </span>
                    </div>

                    <p className="profile-learning__progress-text">
                        12 de 28 lecciones
                    </p>

                    <button
                        className="profile-learning__outline-action"
                        type="button"
                    >
                        <FiRepeat aria-hidden="true" />
                        <span>Cambiar ruta</span>
                    </button>
                </article>

                {/* Tarjeta: Diagnóstico inicial */}
                <article className="profile-learning__side-card">
                    <div className="profile-learning__side-title">
                        <FiBarChart2 aria-hidden="true" />
                        <h3>Diagnóstico inicial</h3>
                    </div>

                    <div className="profile-learning__diagnostic-box">
                        <div className="profile-learning__diagnostic-column">
                            <span className="profile-learning__diagnostic-label">
                                Nivel detectado
                            </span>

                            <strong className="profile-learning__diagnostic-value">
                                Intermedio
                            </strong>
                        </div>

                        <div className="profile-learning__diagnostic-column">
                            <span className="profile-learning__diagnostic-label">
                                Fortalezas
                            </span>

                            <ul className="profile-learning__strength-list">
                                <li>
                                    <FiCheckCircle aria-hidden="true" />
                                    <span>
                                        Lógica de programación
                                    </span>
                                </li>

                                <li>
                                    <FiCheckCircle aria-hidden="true" />
                                    <span>JavaScript</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <button
                        className="profile-learning__link-action"
                        type="button"
                    >
                        <span>Ver resultados</span>
                        <FiArrowRight aria-hidden="true" />
                    </button>
                </article>

                {/* Tarjeta mascota */}
               {/* ============================================================
    TARJETA DE CONSEJO - MASCOTA LEARN2CODE
    ============================================================

    Utilizamos la mascota transparente que ya forma
    parte de los recursos del proyecto.

    La imagen debe encontrarse en:
    frontend/public/images/
    ============================================================ */}

<article className="profile-learning__tip-card">

    {/* Mascota de Learn2Code */}
    <img
        src="/images/learn2code-mascot-laptop-transparent.png"
        alt="Mascota de Learn2Code con laptop"
        className="profile-learning__tip-mascot"
    />

    {/* Mensaje de la tarjeta */}
    <div className="profile-learning__tip-content">

        <h4>
            Una meta que puedas sostener
        </h4>

        <p>
            Elige un ritmo que encaje con tu semana.
        </p>

    </div>

</article>

                {/* Nota informativa */}
                <article className="profile-learning__info-note">
                    <FiInfo aria-hidden="true" />
                    <p>
                        Cambiar tus preferencias ajusta las
                        recomendaciones; tus cursos y proyectos
                        conservan su avance.
                    </p>
                </article>
            </aside>
        </section>
    )
}
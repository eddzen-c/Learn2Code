
import {
    useEffect,
    useState,
} from 'react'

import {
    Link,
    useParams,
} from 'react-router-dom'

import {
    FiArrowLeft,
    FiArrowRight,
    FiBookOpen,
    FiChevronRight,
    FiCode,
    FiHome,
    FiLayers,
} from 'react-icons/fi'

import {
    getAcademicCatalog,
} from '../api/exercise.api.js'

import { useAuth } from '../auth/useAuth.js'
import { useExercisesChrome } from '../hooks/useExercisesChrome.js'

import {
    LearningSidebar,
} from '../components/LearningSidebar.jsx'

import {
    ProfileTopbar,
} from '../components/ProfileTopbar.jsx'
import { AcademicPersonalizationBadge } from '../components/AcademicPersonalizationBadge.jsx'

import './exercises-catalog.css'
import './academic-hierarchy-redesign.css'

export function AcademicStagePage() {
    const { stageId } = useParams()

    const {
        accessToken,
        user,
        signOut,
    } = useAuth()
    const { sidebar, topbar } = useExercisesChrome()

    const [consulta, setConsulta] = useState(null)

    useEffect(() => {
        if (!accessToken) {
            return undefined
        }

        let activo = true

        getAcademicCatalog(accessToken)
            .then((resultado) => {
                if (!activo) {
                    return
                }

                if (
                    !Array.isArray(
                        resultado?.specializations,
                    )
                ) {
                    throw new Error(
                        'Respuesta académica inválida',
                    )
                }

                let coincidencia = null

                for (
                    const especializacion
                    of resultado.specializations
                ) {
                    const etapa =
                        especializacion.stages?.find(
                            (item) =>
                                String(item.id) === stageId,
                        )

                    if (etapa) {
                        coincidencia = {
                            especializacion,
                            etapa,
                        }

                        break
                    }
                }

                setConsulta({
                    token: accessToken,
                    stageId,
                    coincidencia,
                    error: false,
                })
            })
            .catch(() => {
                if (activo) {
                    setConsulta({
                        token: accessToken,
                        stageId,
                        coincidencia: null,
                        error: true,
                    })
                }
            })

        return () => {
            activo = false
        }
    }, [accessToken, stageId])

    const vigente = (
        consulta?.token === accessToken
        && consulta?.stageId === stageId
    )
        ? consulta
        : null

    const etapa = vigente?.coincidencia?.etapa
    const especializacion =
        vigente?.coincidencia?.especializacion

    return (
        <main className="inicio-layout excat-layout">
            <LearningSidebar {...sidebar} />

            <div className="inicio-workspace excat-workspace">
                <ProfileTopbar
                    userName={user?.fullName?.trim() || 'Estudiante'}
                    onLogout={signOut}
                    {...topbar}
                />

                <div className="excat-content exacademy-content">
                    <nav className="exacademy-breadcrumbs" aria-label="Navegación académica">
                        <Link to="/dashboard"><FiHome aria-hidden="true" /> Inicio</Link>
                        <FiChevronRight aria-hidden="true" />
                        <Link to="/exercises">Ejercicios</Link>
                        {especializacion && (
                            <>
                                <FiChevronRight aria-hidden="true" />
                                <Link to={`/exercises/specializations/${especializacion.key}`}>
                                    {especializacion.name}
                                </Link>
                            </>
                        )}
                        <FiChevronRight aria-hidden="true" />
                        <span>{etapa?.title ?? 'Etapa'}</span>
                    </nav>
                    <Link
                        className="exacademy-back"
                        to={especializacion
                            ? `/exercises/specializations/${especializacion.key}`
                            : '/exercises'}
                    >
                        <FiArrowLeft aria-hidden="true" />
                        Volver a la especialización
                    </Link>

                    <header className="excat-intro exacademy-section-hero">
                        <div>
                            <p className="exacademy-eyebrow">Etapa académica</p>
                            <h1>
                                {etapa
                                    ? etapa.title
                                    : 'Detalle de etapa académica'}
                            </h1>

                            <p>
                                {especializacion
                                    ? especializacion.name
                                    : 'Consulta los contenidos académicos disponibles.'}
                            </p>
                        </div>

                        <img
                            src="/images/learn2code-mascot-laptop-transparent.png"
                            alt="Mascota Learn2Code"
                        />
                    </header>

                    {etapa?.personalization?.recommended && (
                        <div className="exacademy-personal-note">
                            <strong>Etapa recomendada para tu aprendizaje.</strong>
                            {' '}Explora primero los módulos y temas marcados para ti.
                        </div>
                    )}
                    <section
                        className="excat-results exacademy-panel exacademy-stage-panel"
                        aria-label="Contenido de la etapa"
                    >
                        {!vigente ? (
                            <div
                                className="excat-empty"
                                role="status"
                            >
                                <h2>
                                    Consultando la etapa académica...
                                </h2>
                            </div>
                        ) : vigente.error ? (
                            <div
                                className="excat-empty"
                                role="alert"
                            >
                                <h2>
                                    No fue posible consultar la etapa
                                </h2>

                                <p>
                                    Comprueba tu conexión e
                                    inténtalo nuevamente.
                                </p>
                            </div>
                        ) : !etapa ? (
                            <div
                                className="excat-empty"
                                role="status"
                            >
                                <h2>
                                    Etapa no disponible
                                </h2>

                                <p>
                                    La etapa solicitada no está disponible.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="excat-results__heading exacademy-panel__heading">
                                    <h2>
                                        <FiLayers aria-hidden="true" />
                                        Módulos de la etapa
                                    </h2>

                                    <span>
                                        {etapa.status === 'planned'
                                            ? 'En preparación'
                                            : 'Etapa publicada'}
                                    </span>
                                </div>

                                {etapa.modules.length === 0 ? (
                                    <div className="excat-empty">
                                        <FiBookOpen aria-hidden="true" />

                                        <h3>
                                            Todavía no hay módulos publicados
                                        </h3>

                                        <p>
                                            El contenido estará disponible
                                            cuando se publiquen los módulos
                                            y sus unidades académicas.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="excat-grid exacademy-grid">
                                        {[...etapa.modules]
                                            .sort((a, b) => Number(b.personalization?.recommended)
                                                - Number(a.personalization?.recommended))
                                            .map((modulo) => (
                                                <article
                                                    className="excat-card exacademy-module-card"
                                                    key={modulo.id}
                                                >
                                                    <span className="exacademy-card__icon">
                                                        <FiCode aria-hidden="true" />
                                                    </span>
                                                    <div className="excat-card__details">
                                                        <h3>
                                                            {modulo.title}
                                                        </h3>
                                                        {modulo.personalization?.recommended && (
                                                            <AcademicPersonalizationBadge
                                                                personalization={{ recommended: true }}
                                                            />
                                                        )}

                                                        <p>
                                                            {modulo.description}
                                                        </p>
                                                    </div>

                                                    <Link
                                                        className="excat-card__action exacademy-card__action"
                                                        aria-label={`Abrir módulo: ${modulo.title}`}
                                                        to={`/exercises/modules/${modulo.id}`}
                                                    >
                                                        <span>Abrir módulo</span>
                                                        <FiArrowRight aria-hidden="true" />
                                                    </Link>

                                                    {modulo.units.length === 0 ? (
                                                        <p>
                                                            Sin unidades publicadas.
                                                        </p>
                                                    ) : (
                                                        <ol>
                                                            {modulo.units.map(
                                                                (unidad) => (
                                                                    <li key={unidad.id}>
                                                                        <strong>
                                                                            <Link
                                                                                to={`/exercises/units/${unidad.id}`}
                                                                            >
                                                                                {unidad.title}
                                                                            </Link>
                                                                        </strong>

                                                                        <AcademicPersonalizationBadge
                                                                            compact
                                                                            personalization={unidad.personalization}
                                                                        />
                                                                        <p>
                                                                            {unidad.description}
                                                                        </p>
                                                                    </li>
                                                                ),
                                                            )}
                                                        </ol>
                                                    )}
                                                </article>
                                            ),
                                        )}
                                    </div>
                                )}


                            </>
                        )}
                    </section>
                </div>
            </div>
        </main>
    )
}

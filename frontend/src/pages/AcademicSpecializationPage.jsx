import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
    FiArrowLeft,
    FiArrowRight,
    FiBookOpen,
    FiChevronRight,
    FiCode,
    FiHome,
    FiLayers,
} from 'react-icons/fi'

import { getAcademicCatalog } from '../api/exercise.api.js'
import { useAuth } from '../auth/useAuth.js'
import { useExercisesChrome } from '../hooks/useExercisesChrome.js'
import { LearningSidebar } from '../components/LearningSidebar.jsx'
import { ProfileTopbar } from '../components/ProfileTopbar.jsx'
import { AcademicPersonalizationBadge } from '../components/AcademicPersonalizationBadge.jsx'

import './exercises-catalog.css'
import './academic-hierarchy-redesign.css'

// Muestra solo especializaciones y etapas devueltas por el catálogo real.
export function AcademicSpecializationPage() {
    const { specializationKey } = useParams()
    const { accessToken, user, signOut } = useAuth()
    const { sidebar, topbar } = useExercisesChrome()
    const [consulta, setConsulta] = useState(null)

    useEffect(() => {
        if (!accessToken) return undefined
        let activo = true

        getAcademicCatalog(accessToken)
            .then((resultado) => {
                if (!activo) return

                if (!Array.isArray(resultado?.specializations)) {
                    throw new Error('Catálogo académico inválido')
                }

                setConsulta({
                    token: accessToken,
                    key: specializationKey,
                    personalization: resultado.personalization ?? null,
                    especializacion:
                        resultado.specializations.find(
                            (item) => item.key === specializationKey,
                        ) ?? null,
                    error: false,
                })
            })
            .catch(() => {
                if (!activo) return
                setConsulta({
                    token: accessToken,
                    key: specializationKey,
                    especializacion: null,
                    error: true,
                })
            })

        return () => { activo = false }
    }, [accessToken, specializationKey])

    const vigente = (
        consulta?.token === accessToken
        && consulta?.key === specializationKey
    ) ? consulta : null

    const especializacion = vigente?.especializacion
    const etapas = Array.isArray(especializacion?.stages)
        ? [...especializacion.stages].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0),
        )
        : []

    const totalModulos = etapas.reduce(
        (total, etapa) => total + (etapa.modules?.length ?? 0),
        0,
    )
    const totalUnidades = etapas.reduce(
        (total, etapa) => total + (etapa.modules ?? []).reduce(
            (suma, modulo) => suma + (modulo.units?.length ?? 0),
            0,
        ),
        0,
    )

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
                        <FiChevronRight aria-hidden="true" />
                        <span>{especializacion?.name || 'Especialización'}</span>
                    </nav>

                    <Link className="exacademy-back" to="/exercises">
                        <FiArrowLeft aria-hidden="true" />
                        Volver a ejercicios
                    </Link>

                    {!vigente ? (
                        <div className="exacademy-empty" role="status">
                            Consultando especialización académica...
                        </div>
                    ) : vigente.error ? (
                        <div className="exacademy-empty" role="alert">
                            No fue posible consultar la especialización.
                            Comprueba tu conexión e inténtalo nuevamente.
                        </div>
                    ) : !especializacion ? (
                        <div className="exacademy-empty" role="status">
                            Esta especialización no está disponible.
                        </div>
                    ) : (
                        <>
                            <header className="exacademy-hero">
                                <span className="exacademy-hero__icon">
                                    <FiLayers aria-hidden="true" />
                                </span>

                                <div className="exacademy-hero__copy">
                                    <p className="exacademy-eyebrow">Especialización académica</p>
                                    <h1>{especializacion.name}</h1>
                                    <p>
                                        {especializacion.description
                                            || 'Explora las etapas y los contenidos publicados de esta especialización.'}
                                    </p>
                                    <div className="exacademy-hero__metrics">
                                        <span><FiLayers aria-hidden="true" /> {etapas.length} etapas</span>
                                        <span>
                                            <FiCode aria-hidden="true" />
                                            {totalModulos} {totalModulos === 1 ? 'módulo registrado' : 'módulos registrados'}
                                        </span>
                                        <span>
                                            <FiBookOpen aria-hidden="true" />
                                            {totalUnidades} {totalUnidades === 1 ? 'unidad registrada' : 'unidades registradas'}
                                        </span>
                                    </div>
                                </div>
                                <img
                                    className="exacademy-hero__illustration"
                                    src="/images/exercises-redesign/landscape.jpg"
                                    alt=""
                                />
                            </header>

                            {vigente.personalization?.status === 'personalized' && (
                                <p className="exacademy-personal-note">
                                    Tu nivel de referencia es <strong>
                                        {vigente.personalization.difficulty.name}
                                    </strong>. La etapa recomendada se basa en el diagnóstico,
                                    el dominio de temas y tus ejercicios resueltos.
                                    {especializacion.personalization?.recommendedStageId && (
                                        <Link
                                            to={`/exercises/stages/${especializacion.personalization.recommendedStageId}`}
                                            className="exacademy-personal-note__action"
                                        >
                                            Ir a mi etapa recomendada
                                            <FiArrowRight aria-hidden="true" />
                                        </Link>
                                    )}
                                </p>
                            )}
                            {vigente.personalization?.status === 'diagnostic_required' && (
                                <p className="exacademy-personal-note">
                                    Completa el diagnóstico para recibir una etapa
                                    recomendada según tus conocimientos.
                                    <Link
                                        to="/diagnostic"
                                        className="exacademy-personal-note__action"
                                    >
                                        Realizar diagnóstico
                                    </Link>
                                </p>
                            )}
                            <section className="exacademy-panel" aria-label="Etapas de la especialización">
                                <div className="exacademy-panel__heading">
                                    <div>
                                        <p className="exacademy-eyebrow">Tu recorrido académico</p>
                                        <h2>Etapas de la especialización</h2>
                                    </div>
                                    <span className="exacademy-panel__count">
                                        {etapas.length} etapas registradas
                                    </span>
                                </div>

                                {etapas.length === 0 ? (
                                    <div className="exacademy-empty">
                                        Todavía no hay etapas registradas en esta especialización.
                                    </div>
                                ) : (
                                    <ol className="exacademy-list">
                                        {etapas.map((etapa, index) => (
                                            <li key={etapa.id}>
                                                <Link
                                                    className="exacademy-item"
                                                    to={`/exercises/stages/${etapa.id}`}
                                                >
                                                    <span className="exacademy-item__number">
                                                        {etapa.position ?? index + 1}
                                                    </span>
                                                    <span className="exacademy-item__content">
                                                        <strong>{etapa.title}</strong>
                                                        <AcademicPersonalizationBadge
                                                            compact
                                                            personalization={etapa.personalization}
                                                        />
                                                        {etapa.description && (
                                                            <span>{etapa.description}</span>
                                                        )}
                                                        <small>
                                                            {etapa.modules?.length ?? 0} {(etapa.modules?.length ?? 0) === 1 ? 'módulo registrado' : 'módulos registrados'}
                                                        </small>
                                                    </span>
                                                    <span
                                                        className={
                                                            etapa.status === 'planned'
                                                                ? 'exacademy-status'
                                                                : 'exacademy-status is-published'
                                                        }
                                                    >
                                                        {etapa.status === 'planned'
                                                            ? 'En preparación'
                                                            : 'Etapa publicada'}
                                                    </span>
                                                    <FiArrowRight
                                                        className="exacademy-item__arrow"
                                                        aria-hidden="true"
                                                    />
                                                </Link>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </div>
        </main>
    )
}


import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
    FiArrowLeft,
    FiArrowRight,
    FiBookOpen,
    FiChevronRight,
    FiHome,
} from 'react-icons/fi'

import { getAcademicCatalog } from '../api/exercise.api.js'
import { useAuth } from '../auth/useAuth.js'
import { useExercisesChrome } from '../hooks/useExercisesChrome.js'
import { LearningSidebar } from '../components/LearningSidebar.jsx'
import { ProfileTopbar } from '../components/ProfileTopbar.jsx'
import { AcademicPersonalizationBadge } from '../components/AcademicPersonalizationBadge.jsx'

import './exercises-catalog.css'
import './academic-hierarchy-redesign.css'

// Busca el módulo en la información real del catálogo.
function buscarModulo(especializaciones, moduleId) {
    for (const especializacion of especializaciones) {
        for (const etapa of especializacion.stages ?? []) {
            for (const modulo of etapa.modules ?? []) {
                if (String(modulo.id) === moduleId) {
                    return {
                        especializacion,
                        etapa,
                        modulo,
                    }
                }
            }
        }
    }

    return null
}

export function AcademicModulePage() {
    const { moduleId } = useParams()
    const { accessToken, user, signOut } = useAuth()
    const { sidebar, topbar } = useExercisesChrome()
    const [consulta, setConsulta] = useState(null)

    useEffect(() => {
        if (!accessToken) {
            return undefined
        }

        let activo = true

        getAcademicCatalog(accessToken)
            .then((resultado) => {
                if (!activo) return

                if (!Array.isArray(resultado?.specializations)) {
                    throw new Error('Catálogo académico inválido')
                }

                setConsulta({
                    token: accessToken,
                    moduleId,
                    detalle: buscarModulo(
                        resultado.specializations,
                        moduleId,
                    ),
                    error: false,
                })
            })
            .catch(() => {
                if (!activo) return

                setConsulta({
                    token: accessToken,
                    moduleId,
                    detalle: null,
                    error: true,
                })
            })

        return () => {
            activo = false
        }
    }, [accessToken, moduleId])

    // Evita mostrar información de una consulta anterior.
    const vigente = (
        consulta?.token === accessToken
        && consulta?.moduleId === moduleId
    ) ? consulta : null

    const detalle = vigente?.detalle
    const unidades = Array.isArray(detalle?.modulo?.units)
        ? detalle.modulo.units
        : []

    const rutaRegreso = detalle
        ? `/exercises/stages/${detalle.etapa.id}`
        : '/exercises'

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
                        {detalle && (
                            <>
                                <FiChevronRight aria-hidden="true" />
                                <Link to={`/exercises/specializations/${detalle.especializacion.key}`}>
                                    {detalle.especializacion.name}
                                </Link>
                                <FiChevronRight aria-hidden="true" />
                                <Link to={rutaRegreso}>{detalle.etapa.title}</Link>
                            </>
                        )}
                        <FiChevronRight aria-hidden="true" />
                        <span>{detalle?.modulo.title ?? 'Módulo'}</span>
                    </nav>
                    <Link
                        className="exacademy-back"
                        to={rutaRegreso}
                    >
                        <FiArrowLeft aria-hidden="true" />
                        Volver a la etapa
                    </Link>

                    <header className="excat-intro exacademy-section-hero">
                        <div>
                            <p className="exacademy-eyebrow">Módulo académico</p>
                            <h1>
                                {detalle?.modulo.title
                                    ?? 'Módulo académico'}
                            </h1>

                            <p>
                                {detalle
                                    ? `${detalle.especializacion.name} · ${detalle.etapa.title}`
                                    : 'Contenido académico de Learn2Code'}
                            </p>
                        </div>

                        <img
                            src="/images/learn2code-mascot-laptop-transparent.png"
                            alt="Mascota Learn2Code"
                        />
                    </header>

                    <section
                        className="excat-results exacademy-panel exacademy-stage-panel"
                        aria-label="Temas del módulo académico"
                    >
                        {!vigente ? (
                            <div className="excat-empty" role="status">
                                <h2>Consultando el módulo...</h2>
                            </div>
                        ) : vigente.error ? (
                            <div className="excat-empty" role="alert">
                                <h2>No fue posible consultar el módulo</h2>
                                <p>Comprueba la conexión e inténtalo nuevamente.</p>
                            </div>
                        ) : !detalle ? (
                            <div className="excat-empty" role="status">
                                <h2>Módulo no disponible</h2>
                                <p>
                                    Este módulo no está publicado
                                    o no existe.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="excat-results__heading exacademy-panel__heading">
                                    <h2>
                                        <FiBookOpen aria-hidden="true" />
                                        Temas del módulo
                                    </h2>

                                    <span>
                                        {unidades.length}
                                        {' '}
                                        {unidades.length === 1
                                            ? 'tema publicado'
                                            : 'temas publicados'}
                                    </span>
                                </div>

                                {detalle.modulo.description && (
                                    <p>{detalle.modulo.description}</p>
                                )}

                                {unidades.length === 0 ? (
                                    <div className="excat-empty">
                                        <h3>
                                            Todavía no hay temas publicados
                                        </h3>
                                        <p>
                                            Los temas aparecerán aquí
                                            cuando estén disponibles.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="excat-grid exacademy-grid">
                                        {[...unidades]
                                    .sort((a, b) => Number(b.personalization?.recommended)
                                        - Number(a.personalization?.recommended))
                                    .map((unidad) => (
                                            <article
                                                className="excat-card exacademy-module-card exacademy-topic-card"
                                                key={unidad.id}
                                            >
                                                <span className="exacademy-card__icon">
                                                    <FiBookOpen aria-hidden="true" />
                                                </span>
                                                <div className="excat-card__details">
                                                    <h3>{unidad.title}</h3>
                                                    <AcademicPersonalizationBadge
                                                        personalization={unidad.personalization}
                                                    />
                                                    {unidad.personalization?.message && (
                                                        <p>{unidad.personalization.message}</p>
                                                    )}

                                                    {unidad.description && (
                                                        <p>
                                                            {unidad.description}
                                                        </p>
                                                    )}
                                                </div>

                                                <Link
                                                    className="excat-card__action exacademy-card__action"
                                                    aria-label={`Abrir tema: ${unidad.title}`}
                                                    to={`/exercises/units/${unidad.id}`}
                                                >
                                                    Abrir tema
                                                    <FiArrowRight aria-hidden="true" />
                                                </Link>
                                            </article>
                                        ))}
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

import { useCallback, useState } from 'react'

import {
    askExerciseTutor,
    getExerciseTutorUsage,
    submitExerciseAttempt,
} from '../api/exercise.api.js'

import { Link, useSearchParams } from 'react-router-dom'
import {
    FiArrowLeft,
    FiAward,
    FiBarChart2,
    FiCheckCircle,
    FiChevronRight,
    FiClock,
    FiFileText,
    FiHome,
    FiInfo,
    FiStar,
} from 'react-icons/fi'

import { useAuth } from '../auth/useAuth.js'
import { useExercisesChrome } from '../hooks/useExercisesChrome.js'
import { LearningSidebar } from '../components/LearningSidebar.jsx'
import { ProfileTopbar } from '../components/ProfileTopbar.jsx'
import { PanelPistasEjercicio } from '../components/PanelPistasEjercicio.jsx'
import { buildExerciseSupport } from './exercise-support.js'

import {
    EditorCodigo,
    PanelEnunciado,
} from './ResolverEjercicioPage.jsx'

import {
    useExerciseSession,
} from './useExerciseSession.js'

import './resolver-ejercicio.css'
import './resolver-redesign.css'

export function ResolverEjercicioRealPage() {
    const [searchParams] = useSearchParams()
    const assignmentId = searchParams.get('assignment')

    const { accessToken, user, signOut } = useAuth()
    const { sidebar, topbar } = useExercisesChrome()

    const {
        session,
        exercise,
        code,
        setCode,
        isLoading,
        error,
    } = useExerciseSession({
        accessToken,
        assignmentId,
    })

    const [evaluacion, setEvaluacion] = useState(null)
    const [panelPistas, setPanelPistas] = useState(null)
    const apoyo = buildExerciseSupport(exercise)

    const assignmentActual = session?.assignment?.id ?? null

    const cargarUsoTutor = useCallback(() => getExerciseTutorUsage({
        accessToken,
        assignmentId: assignmentActual,
    }), [accessToken, assignmentActual])

    // Ignora resultados que pertenecen a otro ejercicio.
    const evaluacionActual =
        evaluacion?.assignmentId === assignmentActual
            ? evaluacion
            : null

    const evaluando = evaluacionActual?.evaluando === true
    const resultado = evaluacionActual?.resultado ?? null
    const errorEvaluacion = evaluacionActual?.error ?? null

    const completado = (
        session?.assignment?.status === 'completed'
        || resultado?.assignment?.status === 'completed'
        || resultado?.attempt?.passed === true
    )

    const puedeComprobar = Boolean(
        accessToken
        && assignmentActual
        && code.trim()
        && !evaluando
        && !completado
    )

    const comprobarSolucion = async () => {
        if (!puedeComprobar) return

        const assignmentIdActual = assignmentActual

        setEvaluacion({
            assignmentId: assignmentIdActual,
            evaluando: true,
            resultado: null,
            error: null,
        })

        try {
            const respuesta = await submitExerciseAttempt({
                accessToken,
                assignmentId: assignmentIdActual,
                submittedCode: code,
            })

            setEvaluacion({
                assignmentId: assignmentIdActual,
                evaluando: false,
                resultado: respuesta,
                error: null,
            })
        } catch {
            setEvaluacion({
                assignmentId: assignmentIdActual,
                evaluando: false,
                resultado: null,
                error: 'No fue posible evaluar la solución. Inténtalo nuevamente.',
            })
        }
    }

    const rutaRegreso = session?.assignment?.academicUnitId
        ? `/exercises/units/${session.assignment.academicUnitId}`
        : '/exercises'

    return (
        <main className="inicio-layout resolver-layout resolver-layout--real">
            <LearningSidebar {...sidebar} />

            <div className="inicio-workspace resolver-workspace">
                <ProfileTopbar
                    userName={user?.fullName?.trim() || 'Estudiante'}
                    onLogout={signOut}
                    {...topbar}
                />

                <div className="resolver-content resolver-content--real">
                    <div className="resolver-navegacion">
                        <nav className="resolver-breadcrumbs" aria-label="Navegación académica">
                            <Link to="/dashboard">
                                <FiHome aria-hidden="true" />
                                Inicio
                            </Link>
                            <FiChevronRight aria-hidden="true" />
                            <Link to="/routes">Rutas</Link>
                            <FiChevronRight aria-hidden="true" />
                            <Link to="/exercises">Ejercicios</Link>
                            {session?.assignment?.academicUnitId && (
                                <>
                                    <FiChevronRight aria-hidden="true" />
                                    <Link to={rutaRegreso}>Unidad académica</Link>
                                </>
                            )}
                            {exercise && (
                                <>
                                    <FiChevronRight aria-hidden="true" />
                                    <strong>{exercise.titulo}</strong>
                                </>
                            )}
                        </nav>
                        <Link
                            to={rutaRegreso}
                            className="resolver-volver-superior"
                        >
                            <FiArrowLeft />
                            Volver a ejercicios
                        </Link>
                    </div>

                    {isLoading ? (
                        <p role="status">
                            Cargando ejercicio...
                        </p>
                    ) : error ? (
                        <p role="alert">
                            No fue posible cargar el ejercicio.
                        </p>
                    ) : !exercise ? (
                        <p role="status">
                            No tienes un ejercicio asignado.
                        </p>
                    ) : (
                        <>
                            <header className="resolver-cabecera resolver-cabecera--real">
                                <span className="resolver-cabecera__accent" aria-hidden="true" />
                                <img
                                    className="resolver-hero-dragon"
                                    src="/images/exercises-redesign/editor-dragon.jpg"
                                    alt=""
                                />
                                {exercise.imagen && (
                                    <div className="resolver-cabecera-imagen">
                                        <img
                                            src={exercise.imagen}
                                            alt={exercise.tecnologia}
                                        />
                                    </div>
                                )}

                                <div className="resolver-cabecera-info">
                                    <h1>{exercise.titulo}</h1>
                                    {completado && (
                                        <span className="resolver-real-completed-status" role="status">
                                            <FiCheckCircle aria-hidden="true" />
                                            Finalizado
                                        </span>
                                    )}

                                    <div className="resolver-cabecera-metadatos">
                                        <span>
                                            <FiFileText />
                                            {exercise.tecnologia}
                                        </span>

                                        <span>
                                            <FiBarChart2 />
                                            {exercise.dificultad}
                                        </span>

                                        {exercise.minutos !== null && (
                                            <span>
                                                <FiClock />
                                                {exercise.minutos} min
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </header>

                            <div className="resolver-columnas resolver-columnas--real">
                                <PanelEnunciado
                                    ejercicio={exercise}
                                    intentos={[]}
                                    onPedirPista={() => setPanelPistas(assignmentActual)}
                                    recursos={apoyo.recursos}
                                    modoReal
                                />

                                <div className="resolver-columna-derecha">
                                    <EditorCodigo
                                        ejercicio={exercise}
                                        codigo={code}
                                        onCodigo={setCode}
                                        onRestablecer={() =>
                                            setCode(exercise.codigo)
                                        }
                                        onComprobar={comprobarSolucion}
                                        mostrarEjecutar={false}
                                        modoReal
                                        comprobarDeshabilitado={!puedeComprobar}
                                    />

                                    <section
                                        className="resolver-resultados"
                                        aria-label="Resultado de evaluación"
                                    >

                                        <div className="resolver-resultados-tabs">
                                            <h2 className="resolver-resultados-pestana-activa">
                                                <FiFileText aria-hidden="true" />
                                                Resultados
                                            </h2>
                                        </div>

                                        <div className="resolver-resultados-cuerpo">
                                            {evaluando ? (
                                                <p role="status">
                                                    Evaluando solución...
                                                </p>
                                            ) : resultado?.attempt ? (
                                                <div className={
                                                    resultado.attempt.passed
                                                        ? 'resolver-real-evaluation is-passed'
                                                        : 'resolver-real-evaluation'
                                                }>
                                                    <h2>
                                                        {resultado.attempt.passed
                                                            ? <FiAward aria-hidden="true" />
                                                            : <FiBarChart2 aria-hidden="true" />}
                                                        {resultado.attempt.passed
                                                            ? '¡Ejercicio superado!'
                                                            : 'Sigue intentándolo'}
                                                    </h2>

                                                    <div className="resolver-real-evaluation__stats">
                                                        {Number.isFinite(resultado.attempt.score) && (
                                                            <div className="resolver-real-evaluation__stat">
                                                                <FiStar aria-hidden="true" />
                                                                <span>Puntuación</span>
                                                                <strong>
                                                                    {resultado.attempt.score}/100
                                                                </strong>
                                                            </div>
                                                        )}
                                                        {Number.isFinite(resultado.attempt.testsPassed)
                                                            && Number.isFinite(resultado.attempt.testsTotal)
                                                            && (
                                                                <div className="resolver-real-evaluation__stat">
                                                                    <FiCheckCircle aria-hidden="true" />
                                                                    <span>Pruebas superadas</span>
                                                                    <strong>
                                                                        {resultado.attempt.testsPassed}
                                                                        /
                                                                        {resultado.attempt.testsTotal}
                                                                    </strong>
                                                                </div>
                                                            )}
                                                    </div>

                                                    {resultado.attempt.feedback && (
                                                        <p className="resolver-real-evaluation__feedback">
                                                            <FiInfo aria-hidden="true" />
                                                            {resultado.attempt.feedback}
                                                        </p>
                                                    )}

                                                    {resultado.progress?.applied
                                                        && Number.isFinite(
                                                            resultado.progress.xpAwarded,
                                                        ) && (
                                                            <p className="resolver-real-evaluation__xp">
                                                                +{resultado.progress.xpAwarded} XP
                                                            </p>
                                                        )}
                                                </div>
                                            ) : completado ? (
                                                <div className="resolver-real-evaluation is-passed" role="status">
                                                    <h2>
                                                        <FiCheckCircle aria-hidden="true" />
                                                        Ejercicio finalizado
                                                    </h2>
                                                    <p>Tu solución aprobada quedó registrada.</p>
                                                    <Link to={rutaRegreso}>Volver a la unidad académica</Link>
                                                </div>
                                            ) : (
                                                <p>
                                                    Los resultados aparecerán aquí
                                                    después de comprobar tu solución.
                                                </p>
                                            )}

                                            {errorEvaluacion && (
                                                <p role="alert">
                                                    {errorEvaluacion}
                                                </p>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {exercise && assignmentActual && (
                <PanelPistasEjercicio
                    key={assignmentActual}
                    abierto={panelPistas === assignmentActual}
                    alCerrar={() => setPanelPistas(null)}
                    tituloEjercicio={exercise.titulo}
                    pistas={[]}
                    onConsultarCuota={cargarUsoTutor}
                    onConsultarIA={(params) => askExerciseTutor({
                        accessToken,
                        assignmentId: assignmentActual,
                        ...params,
                    })}
                    modoReal
                />
            )}
        </main>
    )
}

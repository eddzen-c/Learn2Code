
/**
 * ============================================================
 * LEARN2CODE - EJERCICIO COMPLETADO
 * ============================================================
 *
 * ARCHIVO:
 * frontend/src/pages/EjercicioCompletadoPage.jsx
 *
 * OBJETIVO:
 * Representar el mockup de un ejercicio superado.
 *
 * INCLUYE:
 * - Barra lateral de Perfil.
 * - Barra superior del estudiante.
 * - Felicitación con el nombre del usuario autenticado.
 * - Mascota de ejercicio completado.
 * - Resumen de pruebas, XP y dificultad.
 * - Código de la solución.
 * - Explicación de lo aprendido.
 * - Comprobaciones.
 * - Siguiente reto.
 * - Opciones de volver a practicar.
 *
 * IMPORTANTE:
 * - La información todavía es demostrativa.
 * - No se asigna XP desde esta pantalla.
 * - No se ejecuta código del estudiante.
 * - No se modifica el backend.
 * ============================================================
 */

import { useState } from 'react'

import {
    Link,
    useLocation,
    useNavigate,
    useSearchParams,
} from 'react-router-dom'

import {
    FiActivity,
    FiArrowLeft,
    FiBarChart2,
    FiBookOpen,
    FiCheck,
    FiCode,
    FiCopy,
    FiFilter,
    FiInfo,
    FiList,
    FiPlay,
    FiRefreshCcw,
    FiRotateCcw,
    FiSliders,
    FiStar,
} from 'react-icons/fi'

import { FaLightbulb } from 'react-icons/fa'

import { useAuth } from '../auth/useAuth.js'

import {
    LearningSidebar,
} from '../components/LearningSidebar.jsx'

import {
    ProfileTopbar,
} from '../components/ProfileTopbar.jsx'

import './ejercicio-completado.css'

// ============================================================
// 1. IMÁGENES DEL REPOSITORIO
// ============================================================

const IMAGENES = {
    // Mascota transparente de la barra lateral.
    mascotaSidebar:
        '/images/learn2code-mascot-laptop-transparent.png',

    // Mascota especial del mockup de ejercicios completados.
    mascotaCompletado:
        '/images/ejercicio_completado.png',

    // Logotipo de JavaScript.
    javascript:
        '/images/imagen_ejercicios/tecnologia-javascript-256.png',
}

// ============================================================
// 2. DATOS DEMOSTRATIVOS
// ============================================================

const EJERCICIOS = {
    filter: {
        id: 'filter',
        titulo: 'Filtrar una lista de productos',
        tecnologia: 'JavaScript',
        dificultad: 'Intermedio',
        xp: 100,
        pruebas: 3,
        archivo: 'solucion.js',

        // Código de ejemplo que cumple la condición <= 100.
        codigo:
            'function filtrarProductos(productos) {\n' +
            '  return productos.filter(producto => producto.precio <= 100);\n' +
            '}',

        aprendizaje:
            'filter crea un nuevo array. La condición <= ' +
            'incluye los productos cuyo precio es exactamente 100.',

        comprobaciones: [
            'Filtra productos por debajo de 100',
            'Devuelve un array vacío si no hay coincidencias',
            'Incluye productos con precio igual a 100',
        ],

        temas: [
            {
                id: 'arrays',
                titulo: 'Filtrado de arrays',
                descripcion:
                    'Usar el método filter para crear nuevos arrays.',
                Icono: FiFilter,
            },
            {
                id: 'callbacks',
                titulo: 'Funciones de callback',
                descripcion:
                    'Trabajar con funciones como argumentos.',
                Icono: FiCode,
            },
            {
                // CORREGIDO: FiSliders existe en react-icons/fi.
                id: 'comparaciones',
                titulo: 'Comparaciones y casos límite',
                descripcion:
                    'Usar operadores de comparación y considerar casos límite.',
                Icono: FiSliders,
            },
        ],

        siguiente: {
            id: 'variables',
            titulo: 'Variables y operaciones',
            dificultad: 'Principiante',
            minutos: 10,
        },
    },

    variables: {
        id: 'variables',
        titulo: 'Variables y operaciones',
        tecnologia: 'JavaScript',
        dificultad: 'Principiante',
        xp: 50,
        pruebas: 3,
        archivo: 'solucion.js',

        codigo:
            'function calcularTotal(precio, cantidad) {\n' +
            '  return precio * cantidad;\n' +
            '}',

        aprendizaje:
            'Las funciones pueden recibir parámetros y devolver ' +
            'resultados utilizando return.',

        comprobaciones: [
            'Recibe precio y cantidad',
            'Calcula correctamente el total',
            'Devuelve el resultado esperado',
        ],

        temas: [
            {
                id: 'variables',
                titulo: 'Variables',
                descripcion:
                    'Guardar y utilizar valores en JavaScript.',
                Icono: FiCode,
            },
            {
                id: 'operaciones',
                titulo: 'Operaciones',
                descripcion:
                    'Realizar cálculos con operadores.',
                Icono: FiBarChart2,
            },
            {
                id: 'funciones',
                titulo: 'Funciones',
                descripcion:
                    'Trabajar con parámetros y valores de retorno.',
                Icono: FiBookOpen,
            },
        ],

        siguiente: {
            id: 'filter',
            titulo: 'Filtrar una lista de productos',
            dificultad: 'Intermedio',
            minutos: 15,
        },
    },
}

// ============================================================
// 3. NOMBRE DEL USUARIO AUTENTICADO
// ============================================================

/**
 * Obtiene el primer nombre de la sesión.
 *
 * Ejemplo:
 * "Carlos Ramírez" -> "Carlos"
 *
 * Nunca utiliza un nombre fijo como "Ana".
 */

function obtenerPrimerNombre(usuario) {
    const nombreCompleto =
        usuario?.fullName ||
        usuario?.full_name ||
        usuario?.name ||
        ''

    if (
        typeof nombreCompleto !== 'string' ||
        !nombreCompleto.trim()
    ) {
        return 'Estudiante'
    }

    return nombreCompleto.trim().split(/\s+/)[0]
}

/**
 * Obtiene el nombre completo para ProfileTopbar.
 */

function obtenerNombreCompleto(usuario) {
    const nombre =
        usuario?.fullName ||
        usuario?.full_name ||
        usuario?.name ||
        ''

    return typeof nombre === 'string' && nombre.trim()
        ? nombre.trim()
        : 'Estudiante'
}

// ============================================================
// 4. RESALTADO DE SINTAXIS
// ============================================================

/**
 * Separa el código por palabras clave y operadores.
 *
 * Se utiliza solamente para dar color al texto,
 * sin ejecutarlo ni modificar su contenido.
 */

function ResaltarCodigo({ codigo }) {
    const patron =
        /(\/\/[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:function|return|const|let|import|export)\b|\b(?:filtrarProductos|calcularTotal|filter)\b|<=|>=|=>|\b\d+\b)/g

    const lineas = codigo.split('\n')

    return (
        <div className="completado-editor-codigo">
            {lineas.map((linea, indice) => (
                <div
                    key={indice}
                    className="completado-editor-linea"
                >
                    <span className="completado-editor-numero">
                        {indice + 1}
                    </span>

                    <code>
                        {linea.split(patron).map((fragmento, parte) => {
                            let clase = ''

                            if (/^\/\//.test(fragmento)) {
                                clase = 'is-comment'
                            } else if (/^["']/.test(fragmento)) {
                                clase = 'is-string'
                            } else if (
                                /^(function|return|const|let|import|export)$/.test(fragmento)
                            ) {
                                clase = 'is-keyword'
                            } else if (
                                /^(filtrarProductos|calcularTotal)$/.test(fragmento)
                            ) {
                                clase = 'is-function'
                            } else if (
                                /^(filter|<=|>=|=>|\d+)$/.test(fragmento)
                            ) {
                                clase = 'is-operator'
                            }

                            return (
                                <span
                                    key={parte}
                                    className={clase}
                                >
                                    {fragmento}
                                </span>
                            )
                        })}
                        {'\u00A0'}
                    </code>
                </div>
            ))}
        </div>
    )
}

// ============================================================
// 5. TARJETAS DE RESUMEN
// ============================================================

function TarjetaResumen({
    tipo,
    Icono,
    valor,
    descripcion,
}) {
    return (
        <article className="completado-resumen-tarjeta">
            <div
                className={
                    'completado-resumen-icono ' +
                    `completado-resumen-icono--${tipo}`
                }
            >
                <Icono aria-hidden="true" />
            </div>

            <div>
                <strong>{valor}</strong>
                <p>{descripcion}</p>
            </div>
        </article>
    )
}

// ============================================================
// 6. SECCIÓN DE SOLUCIÓN
// ============================================================

function SeccionSolucion({
    ejercicio,
    codigo,
    onCopiar,
    mensajeCopiado,
}) {
    return (
        <section className="completado-panel completado-solucion">
            <header className="completado-seccion-cabecera">
                <h2>
                    <FiCode aria-hidden="true" />
                    Tu solución
                </h2>

                <button
                    type="button"
                    className="completado-copiar"
                    onClick={onCopiar}
                >
                    <FiCopy aria-hidden="true" />
                    {mensajeCopiado || 'Copiar'}
                </button>
            </header>

            {/* Editor oscuro de solo lectura */}
            <div className="completado-editor">
                <div className="completado-editor-barra">
                    <div className="completado-editor-archivo">
                        <FiCode aria-hidden="true" />
                        <span>{ejercicio.archivo}</span>
                    </div>

                    <div className="completado-editor-lenguaje">
                        <img
                            src={IMAGENES.javascript}
                            alt=""
                        />
                        <span>{ejercicio.tecnologia}</span>
                        <span aria-hidden="true">⌄</span>
                    </div>
                </div>

                <ResaltarCodigo codigo={codigo} />
            </div>

            {/* Explicación de la solución */}
            <div className="completado-explicacion">
                <FaLightbulb aria-hidden="true" />
                <p>{ejercicio.aprendizaje}</p>
            </div>
        </section>
    )
}

// ============================================================
// 7. COMPROBACIONES
// ============================================================

function SeccionComprobaciones({ ejercicio }) {
    return (
        <section className="completado-panel completado-comprobaciones">
            <header className="completado-seccion-cabecera">
                <h2>
                    <FiList aria-hidden="true" />
                    Comprobaciones
                </h2>
            </header>

            <div className="completado-comprobaciones-lista">
                {ejercicio.comprobaciones.map((prueba) => (
                    <div
                        key={prueba}
                        className="completado-comprobacion"
                    >
                        <span className="completado-check">
                            <FiCheck aria-hidden="true" />
                        </span>

                        <span>{prueba}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}

// ============================================================
// 8. LO QUE PRACTICASTE
// ============================================================

function SeccionAprendizajes({ temas }) {
    return (
        <section className="completado-panel completado-aprendizajes">
            <header className="completado-seccion-cabecera">
                <h2>
                    <FiBookOpen aria-hidden="true" />
                    Lo que practicaste
                </h2>
            </header>

            <div className="completado-aprendizajes-lista">
                {temas.map(({ id, titulo, descripcion, Icono }) => (
                    <article
                        key={id}
                        className="completado-aprendizaje"
                    >
                        <div className="completado-aprendizaje-icono">
                            <Icono aria-hidden="true" />
                        </div>

                        <div>
                            <h3>{titulo}</h3>
                            <p>{descripcion}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    )
}

// ============================================================
// 9. SIGUIENTE RETO
// ============================================================

function SeccionSiguienteReto({ siguiente }) {
    const rutaSiguiente =
        '/resolver-ejercicio?ejercicio=' +
        encodeURIComponent(siguiente.id)

    return (
        <section className="completado-siguiente">
            <h2>
                <FiRotateCcw aria-hidden="true" />
                Tu siguiente reto
            </h2>

            <div className="completado-siguiente-ejercicio">
                <img
                    src={IMAGENES.javascript}
                    alt="JavaScript"
                />

                <div>
                    <h3>{siguiente.titulo}</h3>

                    <p>
                        {siguiente.dificultad}
                        <span aria-hidden="true"> · </span>
                        {siguiente.minutos} min
                    </p>
                </div>
            </div>

            <Link
                className="completado-boton-siguiente"
                to={rutaSiguiente}
            >
                <FiPlay aria-hidden="true" />
                Resolver siguiente ejercicio
            </Link>
        </section>
    )
}

// ============================================================
// 10. VOLVER A PRACTICAR
// ============================================================

function SeccionVolver({ idEjercicio }) {
    const rutaEjercicio =
        '/resolver-ejercicio?ejercicio=' +
        encodeURIComponent(idEjercicio)

    return (
        <section className="completado-panel completado-volver">
            <h2>
                <FiRefreshCcw aria-hidden="true" />
                Vuelve cuando quieras
            </h2>

            <Link
                to={rutaEjercicio}
                className="completado-boton-revisar"
            >
                <FiRotateCcw aria-hidden="true" />
                Revisar mi solución
            </Link>

            <Link
                to={rutaEjercicio}
                className="completado-boton-practicar"
            >
                <FiPlay aria-hidden="true" />
                Volver a practicar
            </Link>

            <p>
                <FiInfo aria-hidden="true" />
                Repetir el ejercicio no vuelve a otorgar XP.
            </p>
        </section>
    )
}

// ============================================================
// 11. ICONO DE ESTADO DEL PIE
// ============================================================

function IconoNube() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path
                d="M20 17.5a4.5 4.5 0 0 0-1.9-8.6A6.5 6.5 0 0 0 5.7 10 4 4 0 0 0 6 18h13"
            />
        </svg>
    )
}

// ============================================================
// 12. COMPONENTE PRINCIPAL
// ============================================================

export function EjercicioCompletadoPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams] = useSearchParams()

    // Sesión del estudiante.
    const { user, signOut } = useAuth()

    // Nombre dinámico obtenido del usuario autenticado.
    const primerNombre = obtenerPrimerNombre(user)
    const nombreCompleto = obtenerNombreCompleto(user)

    // Identificador recibido desde la URL.
    const idEjercicio = searchParams.get('ejercicio') || 'filter'

    // Buscar el ejercicio o utilizar el de demostración.
    const ejercicio =
        EJERCICIOS[idEjercicio] || EJERCICIOS.filter

    /**
     * La página de resolución puede enviar su código
     * mediante el estado de navegación.
     */
    const resultado = location.state?.resultado

    // Indica si la evaluación fue confirmada por el backend.
    const confirmacionReal =
        resultado?.verificadoPorBackend === true

    // Código final a mostrar.
    const codigo =
        typeof resultado?.codigo === 'string'
            ? resultado.codigo
            : ejercicio.codigo

    // Estado del botón copiar.
    const [mensajeCopiado, setMensajeCopiado] = useState('')

    // Copiar la solución al portapapeles.
    const copiarSolucion = async () => {
        try {
            await navigator.clipboard.writeText(codigo)
            setMensajeCopiado('Copiado')
        } catch {
            setMensajeCopiado('No disponible')
        }
    }

    // Cerrar la sesión del usuario.
    const cerrarSesion = async () => {
        await signOut()
    }

    return (
        <main className="completado-layout">

            {/* ===============================================
                SIDEBAR COMPARTIDO
                =============================================== */}
            <LearningSidebar
                variant="profile"
                activeItem="exercises"
                mascotSrc={IMAGENES.mascotaSidebar}
                mascotAlt="Dragón Learn2Code programando"
            />

            <div className="completado-workspace">

                {/* ===========================================
                    BARRA SUPERIOR
                    =========================================== */}
                <ProfileTopbar
                    userName={nombreCompleto}
                    streakDays={14}
                    notificationCount={3}
                    onLogout={cerrarSesion}
                    onOpenNotifications={() =>
                        navigate('/profile', {
                            state: {
                                openTab: 'notifications',
                            },
                        })
                    }
                />

                <div className="completado-contenido">

                    {/* =======================================
                        NAVEGACIÓN
                        ======================================= */}
                    <nav
                        className="completado-migas"
                        aria-label="Ruta de navegación"
                    >
                        <Link to="/exercises">
                            <FiArrowLeft aria-hidden="true" />
                            Ejercicios
                        </Link>

                        <span>/</span>

                        <strong>{ejercicio.tecnologia}</strong>
                    </nav>

                    {/* =======================================
                        COLUMNAS DEL MOCKUP
                        ======================================= */}
                    <div className="completado-columnas">

                        {/* Columna principal */}
                        <div className="completado-principal">

                            {/* Banner de felicitación */}
                            <section className="completado-celebracion">

                                {/* Confeti decorativo */}
                                <div
                                    className="completado-confeti"
                                    aria-hidden="true"
                                >
                                    {Array.from(
                                        { length: 15 },
                                        (_, indice) => (
                                            <i key={indice} />
                                        ),
                                    )}
                                </div>

                                {/* Palomita de éxito */}
                                <span className="completado-exito-icono">
                                    <FiCheck aria-hidden="true" />
                                </span>

                                {/* Saludo personalizado */}
                                <div className="completado-celebracion-texto">
                                    <h1>
                                        ¡Reto superado, {primerNombre}!
                                    </h1>

                                    <p>
                                        Resolviste{' '}
                                        <strong>{ejercicio.titulo}</strong>.
                                    </p>
                                </div>

                                {/* Mascota de ejercicio completado */}
                                <img
                                    className="completado-celebracion-mascota"
                                    src={IMAGENES.mascotaCompletado}
                                    alt="Dragón Learn2Code celebrando el reto"
                                />
                            </section>

                            {/* ===================================
                                RESUMEN DE RESULTADOS
                                =================================== */}
                            <div className="completado-resumen">

                                <TarjetaResumen
                                    tipo="pruebas"
                                    Icono={FiBarChart2}
                                    valor={
                                        `${ejercicio.pruebas} de ${ejercicio.pruebas}`
                                    }
                                    descripcion="Pruebas superadas"
                                />

                                <TarjetaResumen
                                    tipo="xp"
                                    Icono={FiStar}
                                    valor={`+${ejercicio.xp} XP`}
                                    descripcion={
                                        confirmacionReal
                                            ? 'Recompensa confirmada'
                                            : 'Recompensa de demostración'
                                    }
                                />

                                <TarjetaResumen
                                    tipo="dificultad"
                                    Icono={FiActivity}
                                    valor={ejercicio.dificultad}
                                    descripcion="Dificultad"
                                />
                            </div>

                            {/* ===================================
                                SOLUCIÓN
                                =================================== */}
                            <SeccionSolucion
                                ejercicio={ejercicio}
                                codigo={codigo}
                                onCopiar={copiarSolucion}
                                mensajeCopiado={mensajeCopiado}
                            />

                            {/* ===================================
                                COMPROBACIONES
                                =================================== */}
                            <SeccionComprobaciones
                                ejercicio={ejercicio}
                            />

                        </div>

                        {/* =======================================
                            COLUMNA DERECHA
                            ======================================= */}
                        <aside className="completado-lateral">

                            <SeccionAprendizajes
                                temas={ejercicio.temas}
                            />

                            <SeccionSiguienteReto
                                siguiente={ejercicio.siguiente}
                            />

                            <SeccionVolver
                                idEjercicio={ejercicio.id}
                            />

                        </aside>
                    </div>

                    {/* =======================================
                        PIE INFERIOR
                        ======================================= */}
                    <footer className="completado-footer">

                        <div className="completado-footer-info">
                            <IconoNube />

                            <div>
                                <h2>
                                    {confirmacionReal
                                        ? 'Tu solución quedó guardada'
                                        : 'Tu solución está lista para consultar'}
                                </h2>

                                <p>
                                    {confirmacionReal
                                        ? 'Puedes consultarla en Ejercicios → Completados.'
                                        : 'Esta pantalla muestra una referencia visual; el guardado real está pendiente.'}
                                </p>
                            </div>
                        </div>

                        <Link
                            to="/exercises"
                            className="completado-boton-catalogo"
                        >
                            <FiArrowLeft aria-hidden="true" />
                            Volver al catálogo
                        </Link>
                    </footer>

                    {/* Aviso para diferenciar el demo de la API */}
                    {!confirmacionReal && (
                        <p className="completado-aviso-demo">
                            Vista demostrativa: las pruebas y la recompensa
                            mostradas son parte del mockup; no constituyen
                            una evaluación ni una asignación real de XP.
                        </p>
                    )}

                </div>
            </div>
        </main>
    )
}

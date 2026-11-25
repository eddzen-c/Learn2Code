const IMAGENES_LENGUAJES = {
    javascript:
        '/images/imagen_ejercicios/tecnologia-javascript-256.png',
    html:
        '/images/imagen_ejercicios/tecnologia-html-256.png',
    css:
        '/images/imagen_ejercicios/tecnologia-css-256.png',
    react:
        '/images/imagen_ejercicios/tecnologia-react-256.png',
    postgresql:
        '/images/imagen_ejercicios/tecnologia-postgresql-256.png',
}

const convertirValor = (valor) => {
    if (valor === null || valor === undefined) {
        return null
    }

    if (typeof valor === 'string') {
        return valor
    }

    return JSON.stringify(valor, null, 2)
}

// Adapta la información real del ejercicio al diseño.
export function toExerciseViewModel(exercise) {
    if (
        !exercise
        || typeof exercise.id !== 'string'
        || !exercise.id.trim()
    ) {
        return null
    }

    const lenguaje = exercise.language?.name || null
    const extension = exercise.language?.fileExtension || null

    const casosPublicos = Array.isArray(
        exercise.publicTestCases,
    )
        ? exercise.publicTestCases
        : []

    const primerCaso = casosPublicos[0] ?? null

    return {
        id: exercise.id,

        titulo:
            exercise.title || 'Ejercicio sin título',

        tecnologia:
            lenguaje || 'Lenguaje no disponible',

        dificultad:
            exercise.difficulty?.name
            || 'Dificultad no disponible',

        tema: exercise.topic?.name || null,

        minutos:
            Number.isFinite(exercise.estimatedMinutes)
                && exercise.estimatedMinutes > 0
                ? exercise.estimatedMinutes
                : null,

        // La recompensa solo se muestra cuando
        // el backend confirma que fue otorgada.
        xp: null,

        imagen:
            IMAGENES_LENGUAJES[
            lenguaje?.toLowerCase()
            ] ?? null,

        archivo:
            extension
                ? `solucion${extension}`
                : null,

        enunciado: exercise.statement || '',

        requisitos:
            exercise.instructions?.trim()
                ? [exercise.instructions]
                : [],

        entrada:
            primerCaso
                ? convertirValor(primerCaso.input)
                : null,

        salida:
            primerCaso
                ? convertirValor(primerCaso.expectedOutput)
                : null,

        codigo:
            exercise.starterCode ?? '',

        casosPublicos,
    }
}
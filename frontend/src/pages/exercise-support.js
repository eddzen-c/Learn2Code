// Apoyos pedagógicos derivados de datos reales del ejercicio.
// No se inventan soluciones, resultados de evaluación ni respuestas de IA.
const GUIAS_TEMA = {
    variables: {
        titulo: 'Organiza los datos',
        consejo: 'Identifica qué valores cambian y cuáles deben conservarse. Guarda el resultado antes de mostrarlo.',
        recursos: [
            ['Variables y tipos de datos', 'https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Grammar_and_types'],
        ],
    },
    condicionales: {
        titulo: 'Revisa las condiciones',
        consejo: 'Separa los casos posibles y considera los valores límite antes de elegir una condición.',
        recursos: [
            ['Condicionales en JavaScript', 'https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Statements/if...else'],
        ],
    },
    ciclos: {
        titulo: 'Recorre los elementos',
        consejo: 'Piensa qué debe ocurrir en cada iteración. Comprueba también qué sucede cuando la colección está vacía.',
        recursos: [
            ['Bucles e iteración', 'https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Loops_and_iteration'],
        ],
    },
    funciones: {
        titulo: 'Divide el problema',
        consejo: 'Identifica entrada, transformación y resultado. Trabaja por pasos pequeños y prueba cada uno por separado.',
        recursos: [
            ['Funciones en JavaScript', 'https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Functions'],
        ],
    },
    estructuras_de_datos: {
        titulo: 'Elige la transformación adecuada',
        consejo: 'Si recibes un arreglo, piensa si necesitas seleccionar, transformar o acumular sus elementos, sin alterar la entrada.',
        recursos: [
            ['Métodos de Array', 'https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Array'],
        ],
    },
}

const ENLACES_LENGUAJE = {
    javascript: {
        nombre: 'JavaScript',
        enlaces: [
            ['Guía de JavaScript', 'https://developer.mozilla.org/es/docs/Web/JavaScript/Guide'],
            ['Lectura de archivos con Node.js', 'https://nodejs.org/api/fs.html'],
        ],
    },
    python: {
        nombre: 'Python',
        enlaces: [
            ['Tutorial oficial de Python', 'https://docs.python.org/es/3/tutorial/'],
            ['Estructuras de datos en Python', 'https://docs.python.org/es/3/tutorial/datastructures.html'],
        ],
    },
}

const normalizar = (texto) => typeof texto === 'string'
    ? texto.trim()
    : ''

export function buildExerciseSupport(exercise) {
    if (!exercise || !normalizar(exercise.id)) {
        return { pistas: [], recursos: [] }
    }

    const lenguaje = normalizar(exercise.tecnologia).toLowerCase()
    const tema = normalizar(exercise.tema)
    const guia = lenguaje === 'javascript' ? GUIAS_TEMA[tema] : null
    const listaLenguaje = ENLACES_LENGUAJE[lenguaje]

    const pistas = [
        {
            title: 'Comprende el objetivo',
            description: 'Primero identifica la entrada, la transformación solicitada y la salida. Revisa exactamente qué pide el enunciado:',
            example: normalizar(exercise.enunciado) || null,
        },
    ]

    if (guia) {
        pistas.push({
            title: guia.titulo,
            description: guia.consejo,
            example: null,
        })
    } else {
        pistas.push({
            title: 'Organiza tu solución',
            description: 'Resuelve una parte del problema a la vez. Comprueba los casos límite y evita imprimir información distinta del resultado solicitado.',
            example: null,
        })
    }

    const instrucciones = Array.isArray(exercise.requisitos)
        ? exercise.requisitos.filter((item) => normalizar(item))
        : []

    if (instrucciones.length > 0) {
        pistas.push({
            title: 'Revisa los requisitos',
            description: 'Antes de ejecutar, verifica que tu solución cumple estas instrucciones del ejercicio:',
            example: instrucciones.join('\n'),
        })
    } else if (exercise.entrada !== null && exercise.entrada !== undefined
        && exercise.salida !== null && exercise.salida !== undefined) {
        pistas.push({
            title: 'Compara el ejemplo público',
            description: 'Prueba tu código con la entrada pública y comprueba que la salida coincide. Los casos ocultos no se muestran.',
            example: `Entrada: ${exercise.entrada}\nSalida esperada: ${exercise.salida}`,
        })
    } else {
        pistas.push({
            title: 'Prueba los casos límite',
            description: 'Comprueba qué ocurre con un valor vacío, con un solo elemento y con los límites indicados en el enunciado.',
            example: null,
        })
    }

    const enlaces = [
        ...(listaLenguaje?.enlaces ?? []),
        ...(guia?.recursos ?? []),
    ]

    const recursos = enlaces.map(([titulo, url]) => ({
        titulo,
        url,
        descripcion: 'Documentación de referencia',
    }))

    return { pistas, recursos }
}

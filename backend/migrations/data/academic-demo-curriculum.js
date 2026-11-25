// Contenido académico publicado para una demostración navegable.
// Cada entrada: etapa, módulo, unidad, reto, explicación, transformación y casos.
export const curriculum = {
frontend: [
 [1,[
  ['HTML semántico y datos','Construcción de fichas','Preparar una ficha de perfil','Organiza información de una persona en un objeto estructurado antes de representarla en secciones HTML.','({nombre:input.nombre,descripcion:input.descripcion||"Sin descripción",etiqueta:"Perfil: "+input.nombre})',[{nombre:'Ana',descripcion:'Diseñadora'},{nombre:'Luis'},{nombre:'Sol',descripcion:''}],'variables',1],
  ['Formularios accesibles','Validación de campos','Validar un registro básico','Los formularios requieren mensajes precisos. Valida nombre y correo y comunica qué campos necesitan atención.','({valido:input.nombre.trim().length>=2&&input.correo.includes("@"),errores:[...(input.nombre.trim().length<2?["nombre"]:[]),...(!input.correo.includes("@")?["correo"]:[])]})',[{nombre:'Ana',correo:'ana@mail.com'},{nombre:'A',correo:'incorrecto'},{nombre:'Raul',correo:'ra@web.mx'}],'condicionales',1],
 ]],
 [2,[
  ['Componentes y propiedades','Props de componentes','Preparar una tarjeta de producto','Las props trasladan datos a componentes React. Calcula un objeto para mostrar precio y disponibilidad sin mutar la entrada.','({titulo:input.nombre,precio:input.precio,agotado:input.stock===0})',[{nombre:'Teclado',precio:400,stock:2},{nombre:'Mouse',precio:80,stock:0},{nombre:'Pantalla',precio:2200,stock:7}],'estructuras_de_datos',1],
  ['Listas con claves estables','Representación de colecciones','Preparar opciones de navegación','React utiliza claves estables para listas. Transforma registros en elementos con key de texto y etiqueta visible.','input.map(x=>({key:String(x.id),label:x.nombre}))',[[{id:3,nombre:'Inicio'},{id:4,nombre:'Perfil'}],[],[{id:9,nombre:'Cursos'}]],'ciclos',1],
 ]],
 [3,[
  ['Estado local inmutable','Actualización de estado','Cambiar cantidad del carrito','Calcula una cantidad nueva sin mutar el estado y sin permitir valores negativos.','Math.max(0,input.actual+input.cambio)',[{actual:2,cambio:3},{actual:1,cambio:-5},{actual:0,cambio:0}],'funciones',2],
  ['Navegación entre vistas','Resolución de rutas','Identificar la sección activa','Asocia URLs con pantallas registradas y devuelve un estado seguro cuando la ruta no exista.','({"/":"Inicio","/cursos":"Cursos","/perfil":"Perfil","/ejercicios":"Ejercicios"}[input]??"No encontrada")',['/perfil','/ejercicios','/otro'],'condicionales',1],
 ]],
 [4,[
  ['Funciones puras','Ordenamiento sin efectos','Ordenar puntuaciones','Una función pura devuelve una copia ordenada sin cambiar el arreglo original.','[...input].sort((a,b)=>b-a)',[[10,5,30],[4],[]],'funciones',2],
  ['Limpieza de entradas','Normalización de etiquetas','Limpiar etiquetas visibles','Normaliza espacios y descarta etiquetas vacías. Esto no equivale a sanitizar HTML.','input.map(s=>s.trim()).filter(Boolean)',[[' Hola ',' ','Mundo '],[],['A',' B ','']],'estructuras_de_datos',1],
 ]],
 [5,[
  ['Catálogo interactivo','Filtros combinados','Buscar productos por categoría','Integra filtros de catálogo para mostrar solo los nombres que pertenecen a una categoría.','input.productos.filter(p=>p.categoria===input.categoria).map(p=>p.nombre)',[{productos:[{nombre:'A',categoria:'web'},{nombre:'B',categoria:'datos'}],categoria:'web'},{productos:[],categoria:'web'},{productos:[{nombre:'X',categoria:'ui'}],categoria:'web'}],'estructuras_de_datos',2],
  ['Panel de progreso','Indicadores del usuario','Calcular avance de ejercicios','Un panel debe calcular cifras desde eventos reales: cuenta intentos aprobados y total.','({total:input.length,aprobados:input.filter(x=>x.aprobado).length})',[[{aprobado:true},{aprobado:false},{aprobado:true}],[],[{aprobado:false}]],'ciclos',2],
 ]],
],
backend: [
 [1,[
  ['Fundamentos de HTTP','Métodos de una petición','Normalizar el método HTTP','HTTP distingue lectura y escritura con verbos. Normaliza un método y determina si corresponde a GET.','({metodo:input.trim().toUpperCase(),lectura:input.trim().toUpperCase()==="GET"})',['get','Post',' PATCH '],'condicionales',1],
  ['Respuestas JSON','Contratos consistentes','Construir una respuesta de API','Una API facilita la integración con objetos estructurados. Devuelve una respuesta exitosa con registros y total.','({status:"success",data:input,total:input.length})',[[{id:1},{id:2}],[],[{id:7}]],'estructuras_de_datos',1],
 ]],
 [2,[
  ['Rutas y parámetros','Identificadores de recurso','Extraer identificador de una URL','Una ruta parametrizada usa segmentos como /usuarios/42. Extrae el último segmento ignorando barras finales.','input.split("/").filter(Boolean).at(-1)??null',['/usuarios/42','/tareas/abc/','/'],'funciones',1],
  ['Paginación de APIs','Resultados por página','Paginar registros del servidor','Una API puede devolver lotes de registros. Implementa páginas numeradas desde uno mediante límites y desplazamientos.','input.registros.slice((input.pagina-1)*input.limite,input.pagina*input.limite)',[{registros:[1,2,3,4,5],pagina:2,limite:2},{registros:[1,2,3],pagina:1,limite:2},{registros:[],pagina:3,limite:5}],'estructuras_de_datos',2],
 ]],
 [3,[
  ['Filtros de consultas','Selección de registros','Filtrar filas activas','Una consulta WHERE selecciona filas por una condición. Practica su lógica con objetos antes de escribir SQL.','input.filter(x=>x.activo).map(x=>x.id)',[[{id:1,activo:true},{id:2,activo:false}],[],[{id:9,activo:true}]],'ciclos',1],
  ['Agrupación de datos','Conteos por cliente','Agrupar transacciones por usuario','Las operaciones GROUP BY producen agregados. Genera un mapa con el número de transacciones por usuario.','input.reduce((a,x)=>(a[x.usuario]=(a[x.usuario]??0)+1,a),{})',[[{usuario:'ana'},{usuario:'ana'},{usuario:'leo'}],[],[{usuario:'m'}]],'estructuras_de_datos',2],
 ]],
 [4,[
  ['Contraseñas y políticas','Requisitos de credenciales','Evaluar requisitos mínimos','Verifica longitud, mayúsculas y números. Es una práctica de validación; el backend real también requiere hashing y defensas adicionales.','({longitud:input.length>=12,mayuscula:/[A-Z]/.test(input),numero:/[0-9]/.test(input)})',['ClaveSegura2026','abc','Password123456'],'condicionales',2],
  ['Roles y autorización','Acceso según propietario','Decidir permiso de edición','Simula una política: administración edita todo, autores solo su recurso. En producción el servidor siempre verifica el permiso.','input.rol==="admin"||(input.rol==="autor"&&input.usuarioId===input.propietarioId)',[{rol:'admin',usuarioId:1,propietarioId:2},{rol:'autor',usuarioId:3,propietarioId:3},{rol:'lector',usuarioId:4,propietarioId:4}],'condicionales',2],
 ]],
 [5,[
  ['Pedidos e inventario','Validación de existencias','Aceptar un pedido disponible','Comprueba las existencias antes de confirmar un pedido y conserva el stock cuando no sea suficiente.','({aceptado:input.stock>=input.solicitados,restante:input.stock>=input.solicitados?input.stock-input.solicitados:input.stock})',[{stock:10,solicitados:3},{stock:2,solicitados:5},{stock:0,solicitados:0}],'condicionales',2],
  ['Reportes de servicio','Totales de ventas','Calcular ventas confirmadas','Suma el importe de transacciones confirmadas, ignorando operaciones pendientes o canceladas.','input.filter(t=>t.estado==="confirmado").reduce((s,t)=>s+t.importe,0)',[[{estado:'confirmado',importe:50},{estado:'pendiente',importe:70},{estado:'confirmado',importe:20}],[],[{estado:'cancelado',importe:9}]],'ciclos',2],
 ]],
],
fullstack: [
 [1,[
  ['Datos de cliente y servidor','Sincronización de perfil','Fusionar datos de perfil','Combina información confiable del servidor con la preferencia visual del cliente sin perder el identificador.','({...input.servidor,tema:input.cliente.tema??"claro"})',[{servidor:{id:1,nombre:'Ana'},cliente:{tema:'oscuro'}},{servidor:{id:2},cliente:{}},{servidor:{id:3},cliente:{tema:'claro'}}],'estructuras_de_datos',2],
  ['Consumo de servicios','Ordenar respuestas recibidas','Ordenar artículos del servidor','Procesa los datos de una respuesta de API sin mutar la colección original. Devuelve los id ordenados por fecha descendente.','[...input].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(x=>x.id)',[[{id:1,fecha:'2026-01-01'},{id:2,fecha:'2026-02-01'}],[],[{id:5,fecha:'2026-06-20'}]],'estructuras_de_datos',2],
 ]],
 [2,[
  ['Contratos de endpoints','Campos de respuesta pública','Proyectar un usuario público','Un endpoint debe exponer solo los campos necesarios. Devuelve id y nombre sin compartir secretos ni datos privados.','({id:input.id,nombre:input.nombre})',[{id:1,nombre:'Ana',password:'secreto'},{id:2,nombre:'Luis',email:'l@mail.com'},{id:7,nombre:'Luz'}],'funciones',2],
  ['Errores de servicios','Interpretación HTTP','Clasificar una respuesta HTTP','Clasifica una respuesta en éxito, error del cliente, error del servidor u otra categoría.','input>=500?"servidor":input>=400?"cliente":input>=200&&input<300?"éxito":"otro"',[200,404,503],'condicionales',2],
 ]],
 [3,[
  ['Validación compartida','Normalización de payload','Preparar un usuario para la API','Frontend y backend deben compartir reglas de normalización. Limpia espacios y normaliza correo a minúsculas.','({nombre:input.nombre.trim(),correo:input.correo.trim().toLowerCase()})',[{nombre:' Ana ',correo:' ANA@MAIL.COM '},{nombre:'Luis',correo:'l@x.com'},{nombre:'  Sol',correo:' SOL@WEB.MX'}],'funciones',1],
  ['Sincronización de registros','Conciliación de cambios','Actualizar una lista con el servidor','Tras guardar, la versión del servidor reemplaza la entidad local que tenga el mismo identificador.','input.local.map(x=>x.id===input.servidor.id?input.servidor:x)',[{local:[{id:1,v:0},{id:2,v:1}],servidor:{id:1,v:3}},{local:[],servidor:{id:1,v:2}},{local:[{id:4,v:5}],servidor:{id:7,v:8}}],'estructuras_de_datos',2],
 ]],
 [4,[
  ['Pruebas de integración','Resúmenes de suites','Contar pruebas fallidas','Un reporte de tests refleja los casos fallidos. Calcula total y fallidas desde sus resultados.','({total:input.length,fallidas:input.filter(x=>!x.passed).length})',[[{passed:true},{passed:false},{passed:false}],[],[{passed:true}]],'ciclos',2],
  ['Preparación de releases','Validar condiciones de entrega','Decidir si se puede publicar','Solo autoriza una entrega cuando compilación y pruebas están aprobadas.','input.buildOk===true&&input.testsOk===true',[{buildOk:true,testsOk:true},{buildOk:false,testsOk:true},{buildOk:true,testsOk:false}],'condicionales',2],
 ]],
 [5,[
  ['Panel de operaciones','Estadísticas de pedidos','Resumir estados de pedidos','Un panel de administración cuenta pedidos por estado real. Calcula completados y pendientes.','({completados:input.filter(x=>x.estado==="completado").length,pendientes:input.filter(x=>x.estado==="pendiente").length})',[[{estado:'pendiente'},{estado:'completado'},{estado:'completado'}],[],[{estado:'cancelado'}]],'estructuras_de_datos',2],
  ['Observabilidad de APIs','Errores HTTP recientes','Contar errores del servidor','La observabilidad permite reconocer respuestas 5xx. Cuenta los registros cuyo código corresponda a error del servidor.','input.filter(x=>x.status>=500).length',[[{status:200},{status:500},{status:503}],[],[{status:404},{status:201}]],'ciclos',2],
 ]],
],
devops: [
 [1,[
  ['Lectura de logs','Mensajes de error','Extraer errores del registro','Los logs revelan eventos de operación. Filtra líneas que comienzan con ERROR en un arreglo de mensajes.','input.filter(line=>line.startsWith("ERROR"))',[['INFO listo','ERROR caído','WARN lento'],[],['ERROR A','ERROR B']],'estructuras_de_datos',1],
  ['Configuración de entornos','Variables obligatorias','Comprobar configuración esencial','Un servicio requiere HOST, PORT y DATABASE_URL no vacíos. Devuelve los nombres faltantes, nunca los valores secretos.','["HOST","PORT","DATABASE_URL"].filter(k=>!String(input[k]??"").trim())',[{HOST:'localhost',PORT:'3000',DATABASE_URL:'postgres://demo'},{HOST:'',PORT:3000},{HOST:'a',PORT:'1',DATABASE_URL:'db'}],'condicionales',2],
 ]],
 [2,[
  ['Definiciones de contenedores','Validación de imagen y puerto','Validar descriptor de contenedor','Comprueba que una configuración JSON incluya imagen y puerto válido. Este reto no inicia Docker realmente.','({valido:typeof input.imagen==="string"&&input.imagen.length>0&&Number.isInteger(input.puerto)&&input.puerto>0})',[{imagen:'node:24-alpine',puerto:3000},{imagen:'',puerto:3000},{imagen:'postgres:17',puerto:5432}],'condicionales',2],
  ['Healthchecks de servicios','Estados saludables','Detectar servicios con problemas','Analiza estados de salud y devuelve el nombre de todo servicio que no esté healthy.','input.filter(x=>x.estado!=="healthy").map(x=>x.nombre)',[[{nombre:'api',estado:'healthy'},{nombre:'db',estado:'unhealthy'}],[],[{nombre:'cache',estado:'starting'}]],'estructuras_de_datos',2],
 ]],
 [3,[
  ['Pipelines de integración','Etapas fallidas','Detectar fallos de CI','Los pipelines realizan lint, tests y build. Devuelve los nombres de los pasos con resultado failed.','input.filter(x=>x.resultado==="failed").map(x=>x.paso)',[[{paso:'lint',resultado:'passed'},{paso:'test',resultado:'failed'}],[],[{paso:'build',resultado:'failed'}]],'ciclos',2],
  ['Políticas de publicación','Aprobación de despliegue','Autorizar producción','Para publicar se necesitan pruebas, compilación y aprobación. Devuelve verdadero solo cuando todas se cumplan.','input.tests===true&&input.build===true&&input.aprobacion===true',[{tests:true,build:true,aprobacion:true},{tests:true,build:false,aprobacion:true},{tests:true,build:true,aprobacion:false}],'condicionales',2],
 ]],
 [4,[
  ['Estimación cloud','Costo según consumo','Estimar costo de ejecución','Simula una estimación multiplicando horas y tarifa por hora. Los precios no provienen del servicio real de AWS.','input.horas*input.tarifa',[{horas:10,tarifa:2},{horas:0,tarifa:3},{horas:12,tarifa:0.5}],'variables',2],
  ['Monitoreo de capacidad','Umbrales de recursos','Identificar recursos saturados','Devuelve los nombres de recursos que superan su límite de uso establecido.','input.filter(r=>r.uso>r.limite).map(r=>r.nombre)',[[{nombre:'cpu',uso:91,limite:80},{nombre:'ram',uso:60,limite:85}],[],[{nombre:'disco',uso:70,limite:70}]],'condicionales',2],
 ]],
 [5,[
  ['Planificación de entregas','Tareas de despliegue','Listar acciones pendientes','Identifica operaciones pendientes en una lista de pasos de release.','input.filter(x=>!x.completada).map(x=>x.nombre)',[[{nombre:'build',completada:true},{nombre:'deploy',completada:false}],[],[{nombre:'rollback',completada:false}]],'estructuras_de_datos',2],
  ['Disponibilidad de plataforma','Salud global de servicios','Calcular estado del sistema','El sistema se considera saludable si existe al menos un servicio y todos están healthy.','input.length>0&&input.every(x=>x.estado==="healthy")',[[{estado:'healthy'},{estado:'healthy'}],[],[{estado:'healthy'},{estado:'down'}]],'condicionales',2],
 ]],
],
}

// Genera código y casos reproducibles para evaluar soluciones reales.
export const buildAcademicSeed = () => {
    const rows = []
    const keys = ['frontend', 'backend', 'fullstack', 'devops']
    for (const key of keys) {
        for (const [stagePosition, modules] of curriculum[key]) {
            for (let index = 0; index < modules.length; index++) {
                const [
                    moduleTitle, unitTitle, exerciseTitle, explanation,
                    expression, inputs, topic, difficulty,
                ] = modules[index]
                const modulePosition = key === 'fullstack' && stagePosition === 1
                    ? index + 2 : index + 1
                const code = `demo26-${key}-s${stagePosition}-m${modulePosition}`
                const compute = new Function('input', `return (${expression});`)
                const cases = inputs.map((value, i) => ({
                    position: i + 1,
                    input: JSON.stringify(value),
                    expectedOutput: JSON.stringify(compute(value)),
                    isHidden: i === 2,
                }))
                if (cases.some((c) => c.expectedOutput === undefined)) {
                    throw new Error(`Salida sin definir: ${code}`)
                }
                const inputLine =
                    "const input = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));"
                const starterCode = [
                    inputLine,
                    '',
                    '// ' + exerciseTitle,
                    '// Escribe tu solución y usa console.log(JSON.stringify(resultado)).',
                ].join('\n')
                const solutionCode = [
                    inputLine, '',
                    `const resultado = (${expression});`,
                    'console.log(JSON.stringify(resultado));',
                ].join('\n')
                rows.push({
                    key, stagePosition, modulePosition, code,
                    moduleTitle, unitCode: `${code}-u1`, unitTitle,
                    moduleDescription: explanation,
                    unitDescription: explanation,
                    topic, difficulty, exerciseTitle,
                    statement: `${exerciseTitle}. ${explanation}`,
                    instructions: 'Lee un JSON desde la entrada estándar y muestra solo el resultado como JSON. No imprimas mensajes adicionales.',
                    starterCode, solutionCode, cases,
                })
            }
        }
    }
    return rows
}

<p align="center">
  <img
    src="https://capsule-render.vercel.app/api?type=waving&color=0:0F172A,45:2563EB,100:7C3AED&height=230&section=header&text=Learn2Code&fontSize=68&fontColor=FFFFFF&animation=fadeIn&fontAlignY=38&desc=Aprende%20programaci%C3%B3n%20con%20inteligencia%20artificial&descAlignY=61&descSize=20"
    width="100%"
    alt="Banner de Learn2Code"
  />
</p>

<p align="center">
  <strong>Plataforma web educativa para aprender programación desde cero mediante acompañamiento con IA, práctica guiada y ejecución de código en línea.</strong>
</p>

<p align="center">
  <a href="#-estado-del-proyecto">
    <img src="https://img.shields.io/badge/Estado-MVP%20en%20configuraci%C3%B3n-F59E0B?style=for-the-badge&logo=progress&logoColor=white" alt="Estado del proyecto" />
  </a>
  <a href="#-frontend">
    <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Frontend con React y Vite" />
  </a>
  <a href="#-backend">
    <img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Backend con Node.js y Express" />
  </a>
  <a href="#-base-de-datos">
    <img src="https://img.shields.io/badge/Base%20de%20datos-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="Base de datos PostgreSQL" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/IA-OpenAI-412991?style=flat-square&logo=openai&logoColor=white" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Editor-Monaco-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white" alt="Monaco Editor" />
  <img src="https://img.shields.io/badge/API-REST-0EA5E9?style=flat-square&logo=fastapi&logoColor=white" alt="API REST" />
  <img src="https://img.shields.io/badge/Autenticaci%C3%B3n-JWT-EF4444?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Arquitectura-Modular-8B5CF6?style=flat-square&logo=diagramsdotnet&logoColor=white" alt="Arquitectura modular" />
</p>

---

## 📌 Contenido

- [Descripción](#-descripción)
- [Objetivo del MVP](#-objetivo-del-mvp)
- [Alcance del MVP](#-alcance-del-mvp)
- [Experiencia principal](#-experiencia-principal)
- [Tecnologías](#-tecnologías)
- [Arquitectura](#-arquitectura-del-sistema)
- [Estructura del repositorio](#-estructura-del-repositorio)
- [Instalación](#-instalación-y-ejecución-local)
- [Variables de entorno](#-variables-de-entorno)
- [Scripts](#-scripts-principales)
- [API](#-api-del-mvp)
- [Seguridad](#-seguridad-del-mvp)
- [Estado del proyecto](#-estado-del-proyecto)
- [Flujo de trabajo con Git](#-flujo-de-trabajo-con-git)
- [Equipo](#-equipo)
- [Licencia](#-licencia)

---

## 🚀 Descripción

**Learn2Code** es una plataforma web educativa diseñada para ayudar a personas que desean comenzar a programar y necesitan una experiencia de aprendizaje más guiada, práctica y personalizada.

El MVP integra una interfaz desarrollada con **React y Vite**, una API construida con **Node.js y Express**, persistencia de información en **PostgreSQL**, autenticación mediante **JWT**, asistencia educativa con la **API de OpenAI** y un editor de código basado en **Monaco Editor**.

> [!IMPORTANT]
> Este repositorio documenta exclusivamente el **Producto Mínimo Viable (MVP)**. Las funciones de gamificación avanzada, clasificación, insignias, banco completo de ejercicios y otras ampliaciones no se presentan como parte terminada de esta versión.

---

## 🎯 Objetivo del MVP

Construir una primera versión funcional de Learn2Code que permita validar la propuesta principal del proyecto:

> **Ofrecer una plataforma donde una persona pueda registrarse, acceder a un panel personal, conversar con un asistente de inteligencia artificial y escribir o ejecutar código desde el navegador.**

El MVP busca comprobar que la combinación de acompañamiento con IA y práctica inmediata puede facilitar el inicio del aprendizaje de programación.

---

## 🧩 Alcance del MVP

<table>
  <thead>
    <tr>
      <th width="24%">Módulo</th>
      <th width="50%">Función principal</th>
      <th width="26%">Estado</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>🔐 Autenticación</td>
      <td>Registro, inicio de sesión, sesión segura, renovación de token y consulta del usuario autenticado.</td>
      <td>⚪ Planeado</td>
    </tr>
    <tr>
      <td>📊 Dashboard</td>
      <td>Panel principal con acceso a las funciones disponibles para cada usuario.</td>
      <td>⚪ Pendiente</td>
    </tr>
    <tr>
      <td>🤖 Chatbot con IA</td>
      <td>Asistente educativo capaz de orientar, explicar conceptos y apoyar durante la práctica.</td>
      <td>⚪ Pendiente</td>
    </tr>
    <tr>
      <td>💻 Editor de código</td>
      <td>Interfaz de escritura de código utilizando Monaco Editor.</td>
      <td>⚪ Pendiente</td>
    </tr>
    <tr>
      <td>▶️ Ejecución controlada</td>
      <td>Envío del código al backend para procesarlo dentro de un entorno limitado y devolver el resultado.</td>
      <td>⚪ Pendiente</td>
    </tr>
    <tr>
      <td>🗄️ Persistencia</td>
      <td>Almacenamiento de usuarios y datos esenciales del MVP en PostgreSQL.</td>
      <td>⚪ Planeado</td>
    </tr>
    <tr>
      <td>🌐 Staging</td>
      <td>Publicación de una versión de prueba accesible para validación.</td>
      <td>⚪ Pendiente</td>
    </tr>
  </tbody>
</table>

### Fuera del alcance actual

Las siguientes funciones podrán considerarse para versiones posteriores, pero **no forman parte del compromiso principal del MVP**:

- Sistema completo de experiencia y niveles.
- Insignias, rachas y recompensas.
- Tabla de clasificación.
- Banco amplio de ejercicios.
- Evaluación automática avanzada.
- Generación dinámica completa de rutas de aprendizaje.
- Aplicación móvil.
- Despliegue definitivo en producción.

---

## ✨ Experiencia principal

```text
Crear una cuenta
      ↓
Iniciar sesión
      ↓
Entrar al dashboard
      ↓
Consultar al asistente con IA
      ↓
Escribir código en Monaco Editor
      ↓
Enviar el código al backend
      ↓
Recibir el resultado de ejecución
```

### Propuesta de valor

- **Acompañamiento inmediato:** el usuario puede solicitar explicaciones sin abandonar la plataforma.
- **Aprendizaje práctico:** los conceptos pueden probarse directamente en el editor.
- **Experiencia centralizada:** autenticación, asistencia y práctica se reúnen en una sola aplicación.
- **Base escalable:** el MVP se organiza para permitir nuevas funciones en futuras versiones.

---

## 🛠️ Tecnologías

### 🎨 Frontend

| Tecnología | Uso dentro del MVP |
|---|---|
| **React** | Construcción de componentes e interfaces de usuario. |
| **Vite** | Entorno de desarrollo, servidor local y generación del paquete de producción. |
| **React Router** | Navegación entre páginas públicas y rutas protegidas. |
| **Monaco Editor** | Editor de código integrado en el navegador. |
| **JavaScript** | Lenguaje principal de la aplicación web. |

> Vite es la herramienta de desarrollo y compilación del frontend. La estrategia visual o librería de estilos podrá definirse durante la implementación sin comprometer desde ahora una tecnología que todavía no haya sido aprobada.

### ⚙️ Backend

| Tecnología | Uso dentro del MVP |
|---|---|
| **Node.js** | Entorno de ejecución del servidor. |
| **Express.js** | Construcción de la API REST. |
| **JWT** | Autenticación y autorización de sesiones. |
| **OpenAI API** | Comunicación con el asistente de inteligencia artificial. |

### 🗃️ Base de datos

| Tecnología | Uso dentro del MVP |
|---|---|
| **PostgreSQL** | Persistencia de usuarios y datos esenciales del sistema. |

### 🧰 Herramientas de desarrollo

| Herramienta | Uso |
|---|---|
| **Git** | Control de versiones. |
| **GitHub** | Repositorio remoto y colaboración. |
| **Visual Studio Code** | Entorno principal de desarrollo. |
| **Postman o equivalente** | Validación de endpoints durante el desarrollo. |

---

## 🏗️ Arquitectura del sistema

Learn2Code utiliza una organización de **monolito modular**. El backend separa sus responsabilidades mediante las capas **Controller, Service y Repository**.

```mermaid
flowchart LR
    U[Usuario] --> F[Frontend<br/>React + Vite]
    F -->|HTTPS / JSON| R[API REST<br/>Node.js + Express]

    R --> C[Controllers]
    C --> S[Services]
    S --> P[Repositories]
    P --> DB[(PostgreSQL)]

    S --> AI[OpenAI API]
    S --> EX[Servicio de ejecución<br/>controlada]
```

### Responsabilidad de cada capa

| Capa | Responsabilidad |
|---|---|
| **Routes** | Define las rutas disponibles y conecta middlewares con controladores. |
| **Controllers** | Recibe la solicitud HTTP, valida la entrada básica y devuelve la respuesta. |
| **Services** | Contiene las reglas de negocio y coordina los procesos del sistema. |
| **Repositories** | Gestiona las operaciones de lectura y escritura en PostgreSQL. |
| **Middlewares** | Aplica autenticación, manejo de errores, seguridad y validaciones compartidas. |

### Principios de organización

- Separación de responsabilidades.
- Módulos independientes dentro de una sola aplicación backend.
- API versionada bajo `/api/v1`.
- Configuración mediante variables de entorno.
- Manejo centralizado de errores.
- Credenciales y secretos fuera del repositorio.

---

## 📁 Estructura del repositorio

> [!NOTE]
> Esta es la estructura objetivo del MVP. Las carpetas se incorporarán conforme avance cada módulo.

```text
Learn2Code/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── chatbot/
│   │   │   ├── compiler/
│   │   │   └── dashboard/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── vite.config.js
│   ├── package.json
│   └── package-lock.json
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── README.md
│
├── docs/
│   └── README.md
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## ✅ Requisitos previos

Antes de ejecutar el proyecto localmente se necesita:

- **Git**
- **Node.js** en una versión LTS reciente.
- **npm**
- **PostgreSQL**
- Una clave válida de la **API de OpenAI** para probar el chatbot.
- **Visual Studio Code** o un editor equivalente.

Comprobación rápida:

```bash
git --version
node --version
npm --version
psql --version
```

---

## 📦 Instalación y ejecución local

> [!NOTE]
> Los pasos siguientes aplican una vez creada la estructura base de `backend/` y `frontend/`. Mientras el repositorio se encuentre vacío, primero deberán inicializarse ambos proyectos.

### 1. Clonar el repositorio

```bash
git clone https://github.com/eddzen-c/Learn2Code.git
cd Learn2Code
```

### 2. Preparar el backend

```bash
cd backend
npm install
```

Crear el archivo local de configuración:

#### PowerShell

```powershell
Copy-Item .env.example .env
```

#### Bash

```bash
cp .env.example .env
```

Completar las variables del archivo `.env` y ejecutar:

```bash
npm run dev
```

El servidor utilizará el puerto definido en `PORT`.

### 3. Preparar el frontend

Abrir otra terminal desde la raíz del repositorio:

```bash
cd frontend
npm install
```

Crear el archivo local de configuración:

#### PowerShell

```powershell
Copy-Item .env.example .env
```

#### Bash

```bash
cp .env.example .env
```

Ejecutar el frontend:

```bash
npm run dev
```

Vite mostrará en la terminal la dirección local de la aplicación.

### 4. Preparar PostgreSQL

Crear la base de datos:

```sql
CREATE DATABASE learn2code;
```

Después, configurar `DATABASE_URL` en el archivo `.env` del backend y ejecutar las migraciones cuando estén disponibles:

```bash
npm run migrate
```

---

## 🔐 Variables de entorno

### Backend — `backend/.env`

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://postgres:TU_CONTRASENA@localhost:5432/learn2code

JWT_ACCESS_SECRET=reemplazar_por_un_secreto_seguro
JWT_REFRESH_SECRET=reemplazar_por_otro_secreto_seguro
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

OPENAI_API_KEY=colocar_clave_personal
CORS_ORIGIN=http://localhost:5173

SANDBOX_TIMEOUT_MS=5000
```

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:3000/api/v1
```

> [!CAUTION]
> Nunca se deben subir archivos `.env` ni claves reales al repositorio. Únicamente los archivos `.env.example` deben mantenerse bajo control de versiones.

---

## ▶️ Scripts principales

Los scripts exactos dependerán de la configuración de cada paquete. La estructura prevista es la siguiente.

### Backend

```bash
npm run dev
npm start
npm test
npm run migrate
```

| Script | Propósito |
|---|---|
| `npm run dev` | Iniciar el servidor en modo desarrollo. |
| `npm start` | Iniciar el servidor en modo normal. |
| `npm test` | Ejecutar las pruebas disponibles. |
| `npm run migrate` | Aplicar migraciones de la base de datos. |

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

| Script | Propósito |
|---|---|
| `npm run dev` | Iniciar Vite en modo desarrollo. |
| `npm run build` | Crear la versión optimizada del frontend. |
| `npm run preview` | Previsualizar localmente la compilación. |
| `npm run lint` | Revisar la calidad y consistencia del código. |

---

## 🌐 API del MVP

La API se organizará bajo la ruta base:

```text
/api/v1
```

### Salud del servidor

```http
GET /api/v1/health
```

### Autenticación

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Módulos previstos

```text
/api/v1/auth
/api/v1/chat
/api/v1/compiler
/api/v1/dashboard
```

> [!NOTE]
> La presencia de una ruta en esta documentación representa el alcance previsto del MVP. Su disponibilidad final dependerá del avance registrado en la sección de estado.

### Formato general de respuesta

```json
{
  "success": true,
  "message": "Operación realizada correctamente",
  "data": {}
}
```

### Formato general de error

```json
{
  "success": false,
  "message": "No fue posible completar la solicitud",
  "errors": []
}
```

---

## 🛡️ Seguridad del MVP

El MVP considera como mínimo las siguientes medidas:

- Contraseñas almacenadas mediante hash seguro.
- Tokens de acceso y actualización.
- Rutas protegidas para usuarios autenticados.
- Validación de datos recibidos.
- Manejo centralizado de errores.
- Restricción de orígenes mediante CORS.
- Límites de tamaño para las solicitudes.
- Limitación de solicitudes en rutas sensibles.
- Secretos almacenados mediante variables de entorno.
- Tiempo máximo para la ejecución de código.
- Ninguna clave privada incluida en GitHub.

> La ejecución de código proporcionado por usuarios debe realizarse en un entorno aislado. Monaco Editor únicamente ofrece la interfaz de edición; no reemplaza el servicio seguro de ejecución del backend.

---

## 📈 Estado del proyecto

<table>
  <thead>
    <tr>
      <th>Área</th>
      <th>Progreso</th>
      <th>Observación</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Repositorio y flujo Git</td>
      <td>🟡 En preparación</td>
      <td>Configuración inicial del proyecto.</td>
    </tr>
    <tr>
      <td>Backend base</td>
      <td>⚪ Pendiente</td>
      <td>Servidor, configuración y organización modular.</td>
    </tr>
    <tr>
      <td>Base de datos</td>
      <td>⚪ Pendiente</td>
      <td>Conexión y primeras migraciones.</td>
    </tr>
    <tr>
      <td>Autenticación</td>
      <td>⚪ Pendiente</td>
      <td>Registro, login, refresh, logout y perfil.</td>
    </tr>
    <tr>
      <td>Frontend base</td>
      <td>⚪ Pendiente</td>
      <td>React, Vite, rutas y layouts.</td>
    </tr>
    <tr>
      <td>Dashboard</td>
      <td>⚪ Pendiente</td>
      <td>Vista principal del usuario.</td>
    </tr>
    <tr>
      <td>Chatbot con IA</td>
      <td>⚪ Pendiente</td>
      <td>Integración segura con OpenAI.</td>
    </tr>
    <tr>
      <td>Editor y ejecución</td>
      <td>⚪ Pendiente</td>
      <td>Monaco Editor y servicio controlado.</td>
    </tr>
    <tr>
      <td>Staging</td>
      <td>⚪ Pendiente</td>
      <td>Despliegue para validación del MVP.</td>
    </tr>
  </tbody>
</table>

### Criterio de finalización del MVP

El MVP se considerará listo cuando un usuario pueda:

- [ ] Registrarse.
- [ ] Iniciar y cerrar sesión.
- [ ] Mantener una sesión segura.
- [ ] Acceder a un dashboard protegido.
- [ ] Enviar una consulta al chatbot.
- [ ] Recibir una respuesta generada mediante IA.
- [ ] Escribir código dentro de Monaco Editor.
- [ ] Enviar código para su ejecución controlada.
- [ ] Consultar el resultado de la ejecución.
- [ ] Utilizar una versión desplegada en staging.

---

## 🌿 Flujo de trabajo con Git

```mermaid
gitGraph
    commit id: "Base"
    branch develop
    checkout develop
    commit id: "Preparación"
    branch feature/modulo
    checkout feature/modulo
    commit id: "Desarrollo"
    commit id: "Pruebas"
    checkout develop
    merge feature/modulo
    checkout main
    merge develop tag: "MVP"
```

### Ramas principales

| Rama | Uso |
|---|---|
| `main` | Versión estable y aprobada del proyecto. |
| `develop` | Integración del trabajo terminado antes de llegar a `main`. |
| `feature/*` | Desarrollo de módulos o funciones nuevas. |
| `fix/*` | Correcciones realizadas durante el desarrollo. |
| `docs/*` | Cambios exclusivos de documentación. |

### Flujo recomendado

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nombre-del-modulo
```

Después de trabajar:

```bash
git add .
git commit -m "feat: agregar nombre del cambio"
git push -u origin feature/nombre-del-modulo
```

Finalmente, se debe crear un **Pull Request** hacia `develop`. La rama `main` únicamente recibirá cambios revisados y aprobados.

### Convención de commits

```text
feat: nueva funcionalidad
fix: corrección de un error
docs: cambio de documentación
refactor: reorganización sin cambiar el comportamiento
test: creación o modificación de pruebas
chore: tareas de configuración o mantenimiento
```

---

## 🤝 Contribución

Este es un proyecto académico desarrollado por un equipo definido. Para mantener la estabilidad del repositorio:

1. No trabajar directamente sobre `main`.
2. Crear una rama desde `develop`.
3. Realizar cambios pequeños y relacionados.
4. Escribir mensajes de commit claros.
5. Probar el módulo antes de enviarlo.
6. Abrir un Pull Request.
7. Resolver observaciones antes de fusionar.

---

## 👥 Equipo

<table>
  <tr>
    <td align="center">
      <strong>Del Ángel Hernández Edwin Cirilo</strong><br />
      Desarrollo y gestión del proyecto
    </td>
    <td align="center">
      <strong>Ortiz Galaviz Juan Luis</strong><br />
      Integrante del equipo
    </td>
  </tr>
</table>

**Grupo:** 9IDS3  
**Docente:** Ramírez Campoy Lorena

---

## 📚 Documentación

La documentación técnica y académica del proyecto se organizará dentro del directorio:

```text
docs/
```

Allí podrán incluirse:

- Alcance del MVP.
- Arquitectura del sistema.
- Diseño de base de datos.
- Manual de ramas.
- Plan y evidencias de pruebas.
- Diagramas de flujo de información.
- Decisiones técnicas.
- Manuales de instalación y uso.

---

## 📄 Licencia

Learn2Code es actualmente un **proyecto académico**. La licencia de distribución y reutilización deberá definirse antes de publicar una versión abierta o comercial.

Mientras no exista un archivo de licencia aprobado, el contenido del repositorio no debe asumirse como software de uso libre.

---

## 🌟 Visión

Learn2Code nace con la intención de convertir el inicio en la programación en una experiencia menos confusa y más práctica.

El MVP no pretende incluir todas las funciones imaginadas para la plataforma. Su propósito es construir una base funcional, probar la experiencia principal y reunir evidencia para decidir cómo debe crecer el producto.

<p align="center">
  <strong>Aprender. Practicar. Equivocarse. Comprender. Volver a intentarlo.</strong>
</p>

<p align="center">
  Hecho con dedicación para el proyecto <strong>Learn2Code</strong>.
</p>

<p align="center">
  <a href="#-contenido">⬆️ Volver al inicio</a>
</p>

<p align="center">
  <img
    src="https://capsule-render.vercel.app/api?type=waving&color=0:7C3AED,50:2563EB,100:0F172A&height=120&section=footer"
    width="100%"
    alt="Pie de página de Learn2Code"
  />
</p>

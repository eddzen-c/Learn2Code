
/**
 * ============================================================
 * LEARN2CODE - ENRUTAMIENTO PRINCIPAL
 * ============================================================
 *
 * ARCHIVO:
 * frontend/src/App.jsx
 *
 * FUNCIÓN:
 * Administrar la navegación entre todas las páginas
 * de Learn2Code mediante React Router.
 *
 * SECCIONES:
 * 1. Importaciones de React Router.
 * 2. Guardas de autenticación.
 * 3. Contexto de sesión.
 * 4. Componentes de carga.
 * 5. Páginas públicas.
 * 6. Páginas autenticadas.
 * 7. Redirección inicial.
 * 8. Definición de rutas.
 *
 * NUEVA RUTA:
 * /profile/public
 *
 * IMPORTANTE:
 * La vista pública se mantiene protegida por ahora
 * porque funciona como vista previa del perfil del
 * estudiante autenticado.
 *
 * ============================================================
 */

// ============================================================
// 1. REACT ROUTER
// ============================================================

import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from 'react-router-dom'

// ============================================================
// 2. GUARDAS DE AUTENTICACIÓN
// ============================================================

// Permite acceder únicamente a usuarios autenticados.
import {
    ProtectedRoute,
} from './auth/ProtectedRoute.jsx'

// Exige que el usuario tenga el correo verificado.
import {
    VerifiedEmailRoute,
} from './auth/VerifiedEmailRoute.jsx'

// Evita que usuarios autenticados accedan a login/registro.
import {
    PublicOnlyRoute,
} from './auth/PublicOnlyRoute.jsx'

// ============================================================
// 3. CONTEXTO DE AUTENTICACIÓN
// ============================================================

import {
    useAuth,
} from './auth/useAuth.js'

// ============================================================
// 4. COMPONENTE DE CARGA
// ============================================================

import {
    FullPageLoader,
} from './components/FullPageLoader.jsx'

// ============================================================
// 5. PÁGINAS PÚBLICAS
// ============================================================

// Landing principal de Learn2Code.
import {
    LandingPage,
} from './pages/LandingPage.jsx'

// Inicio de sesión.
import {
    LoginPage,
} from './pages/LoginPage.jsx'

// Registro.
// RegisterPage usa exportación por defecto.
import RegisterPage from './pages/RegisterPage.jsx'

// Recuperación de contraseña.
import {
    ForgotPasswordPage,
} from './pages/ForgotPasswordPage.jsx'

// Establecer una nueva contraseña.
import {
    ResetPasswordPage,
} from './pages/ResetPasswordPage.jsx'

// Verificación de correo electrónico.
import {
    VerifyEmailPage,
} from './pages/VerifyEmailPage.jsx'

// Página cuando una ruta no existe.
import {
    NotFoundPage,
} from './pages/NotFoundPage.jsx'

// ============================================================
// 6. PÁGINAS AUTENTICADAS
// ============================================================

// Dashboard principal del estudiante.
import {
    DashboardPage,
} from './pages/DashboardPage.jsx'

// Onboarding del estudiante.
import {
    OnboardingPage,
} from './pages/OnboardingPage.jsx'

// Perfil principal del estudiante.
import {
    ProfilePage,
} from './pages/ProfilePage.jsx'

// ============================================================
// 7. NUEVA PÁGINA: VISTA PÚBLICA DEL PERFIL
// ============================================================

/**
 * Este componente representa el segundo mockup:
 *
 * - Encabezado del estudiante.
 * - Tecnologías de interés.
 * - Proyectos compartidos.
 * - Publicaciones.
 * - Logros destacados.
 *
 * URL:
 * http://localhost:5173/profile/public
 */
import {
    PublicProfilePage,
} from './pages/PublicProfilePage.jsx'

// ============================================================
// 8. OTRAS PÁGINAS
// ============================================================

// Diagnóstico inicial.
import {
    DiagnosticPage,
} from './pages/DiagnosticPage.jsx'

// Ejercicios de programación.
import {
    ExercisePage,
} from './pages/ExercisePage.jsx'

// Insignias y logros.
import {
    BadgesPage,
} from './pages/BadgesPage.jsx'

// ============================================================
// 9. REDIRECCIÓN PRINCIPAL
// ============================================================

/**
 * RootRedirect:
 *
 * Determina qué mostrar cuando se visita "/".
 *
 * Si la sesión está cargando:
 * muestra el loader.
 *
 * Si no hay sesión:
 * muestra la landing.
 *
 * Si el usuario está autenticado:
 * lo dirige al onboarding o a la verificación
 * según su estado de correo electrónico.
 *
 * Se conserva el comportamiento existente.
 */

function RootRedirect() {

    const {
        isAuthenticated,
        isLoading,
        user,
    } = useAuth()

    // Mostrar pantalla de carga.
    if (isLoading) {
        return <FullPageLoader />
    }

    // Usuario no autenticado.
    if (!isAuthenticated) {
        return <LandingPage />
    }

    // Usuario autenticado.
    return (
        <Navigate
            replace
            to={
                user?.emailVerified
                    ? '/onboarding'
                    : '/verify-email'
            }
        />
    )
}

// ============================================================
// 10. COMPONENTE PRINCIPAL DE LA APLICACIÓN
// ============================================================

function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* ============================================
                    10.1 RUTA PRINCIPAL
                    ============================================ */}

                <Route
                    path="/"
                    element={<RootRedirect />}
                />

                {/* ============================================
                    10.2 RECUPERACIÓN DE CONTRASEÑA
                    ============================================ */}

                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                />

                {/* ============================================
                    10.3 VERIFICACIÓN DE CORREO
                    ============================================ */}

                <Route
                    path="/verify-email"
                    element={<VerifyEmailPage />}
                />

                {/* ============================================
                    10.4 INICIO DE SESIÓN
                    ============================================ */}

                <Route
                    element={
                        <PublicOnlyRoute
                            authenticatedRedirectTo="/"
                        />
                    }
                >

                    <Route
                        path="/login"
                        element={<LoginPage />}
                    />

                </Route>

                {/* ============================================
                    10.5 REGISTRO DE USUARIO
                    ============================================ */}

                <Route
                    element={
                        <PublicOnlyRoute
                            authenticatedRedirectTo="/"
                        />
                    }
                >

                    <Route
                        path="/register"
                        element={<RegisterPage />}
                    />

                </Route>

                {/* ============================================
                    10.6 RUTAS PROTEGIDAS
                    ============================================

                    Todas las rutas de esta sección
                    requieren una sesión autenticada.
                */}

                <Route element={<ProtectedRoute />}>

                    {/* ----------------------------------------
                        PERFIL PRINCIPAL
                        ----------------------------------------

                        Contiene:
                        - Información personal.
                        - Aprendizaje.
                        - Seguridad.
                        - Notificaciones.
                        - Privacidad.
                    */}

                    <Route
                        path="/profile"
                        element={<ProfilePage />}
                    />

                    {/* ========================================
                        NUEVA RUTA: PERFIL PÚBLICO
                        ========================================

                        Se abre desde el botón:
                        "Ver perfil público"

                        Muestra el segundo mockup que
                        compartiste.

                        Esta ruta es una vista previa del
                        perfil autenticado. Una ruta pública
                        real requerirá integración adicional
                        con el backend.
                    */}

                    <Route
                        path="/profile/public"
                        element={<PublicProfilePage />}
                    />

                    {/* ========================================
                        RUTAS PARA CORREOS VERIFICADOS
                        ======================================== */}

                    <Route element={<VerifiedEmailRoute />}>

                        {/* ONBOARDING */}
                        <Route
                            path="/onboarding"
                            element={<OnboardingPage />}
                        />

                        {/* DASHBOARD */}
                        <Route
                            path="/dashboard"
                            element={<DashboardPage />}
                        />

                        {/* DIAGNÓSTICO */}
                        <Route
                            path="/diagnostic"
                            element={<DiagnosticPage />}
                        />

                        {/* EJERCICIOS */}
                        <Route
                            path="/exercises"
                            element={<ExercisePage />}
                        />

                        {/* LOGROS */}
                        <Route
                            path="/badges"
                            element={<BadgesPage />}
                        />

                    </Route>

                </Route>

                {/* ============================================
                    10.7 RUTA NO ENCONTRADA
                    ============================================ */}

                <Route
                    path="*"
                    element={<NotFoundPage />}
                />

            </Routes>

        </BrowserRouter>

    )
}

// ============================================================
// 11. EXPORTAR COMPONENTE
// ============================================================

export default App

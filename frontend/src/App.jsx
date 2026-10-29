
/**
 * ============================================================
 * LEARN2CODE - RUTAS PRINCIPALES
 * ============================================================
 *
 * Mantiene las páginas existentes y agrega el flujo:
 *
 * /exercises
 *      ↓
 * /resolver-ejercicio?ejercicio=filter
 *      ↓
 * /ejercicio-completado?ejercicio=filter
 *
 * La ruta /exercises/current se conserva sin cambios.
 * ============================================================
 */

import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from 'react-router-dom'

// Guardas de acceso.
import { ProtectedRoute } from './auth/ProtectedRoute.jsx'
import { VerifiedEmailRoute } from './auth/VerifiedEmailRoute.jsx'
import { PublicOnlyRoute } from './auth/PublicOnlyRoute.jsx'

// Autenticación y carga.
import { useAuth } from './auth/useAuth.js'
import { FullPageLoader } from './components/FullPageLoader.jsx'

// Páginas públicas.
import { LandingPage } from './pages/LandingPage.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.jsx'
import { ResetPasswordPage } from './pages/ResetPasswordPage.jsx'
import { VerifyEmailPage } from './pages/VerifyEmailPage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'

// Páginas del estudiante.
import { DashboardPage } from './pages/DashboardPage.jsx'
import { OnboardingPage } from './pages/OnboardingPage.jsx'
import { ProfilePage } from './pages/ProfilePage.jsx'
import { PublicProfilePage } from './pages/PublicProfilePage.jsx'
import { DiagnosticPage } from './pages/DiagnosticPage.jsx'
import { BadgesPage } from './pages/BadgesPage.jsx'

// Catálogo de ejercicios.
import {
    ExercisesCatalogPage,
} from './pages/ExercisesCatalogPage.jsx'

// Nuevo editor de ejercicios.
import {
    ResolverEjercicioPage,
} from './pages/ResolverEjercicioPage.jsx'

// Pantalla final de éxito del mockup.
import {
    EjercicioCompletadoPage,
} from './pages/EjercicioCompletadoPage.jsx'

// Práctica adaptativa anterior.
// NO se elimina ni se sustituye.
import {
    ExercisePage,
} from './pages/ExercisePage.jsx'

// ============================================================
// REDIRECCIÓN PRINCIPAL
// ============================================================

function RootRedirect() {
    const {
        isAuthenticated,
        isLoading,
        user,
    } = useAuth()

    if (isLoading) {
        return <FullPageLoader />
    }

    if (!isAuthenticated) {
        return <LandingPage />
    }

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
// APLICACIÓN Y NAVEGACIÓN
// ============================================================

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Página principal */}
                <Route
                    path="/"
                    element={<RootRedirect />}
                />

                {/* Recuperación de contraseña */}
                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                />

                {/* Verificación del correo */}
                <Route
                    path="/verify-email"
                    element={<VerifyEmailPage />}
                />

                {/* Inicio de sesión */}
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

                {/* Registro */}
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
                    RUTAS PARA USUARIOS AUTENTICADOS
                    ============================================ */}

                <Route element={<ProtectedRoute />}>

                    {/* Perfil del estudiante */}
                    <Route
                        path="/profile"
                        element={<ProfilePage />}
                    />

                    {/* Vista previa del perfil público */}
                    <Route
                        path="/profile/public"
                        element={<PublicProfilePage />}
                    />

                    {/* Rutas que exigen correo verificado */}
                    <Route element={<VerifiedEmailRoute />}>

                        {/* Onboarding */}
                        <Route
                            path="/onboarding"
                            element={<OnboardingPage />}
                        />

                        {/* Dashboard */}
                        <Route
                            path="/dashboard"
                            element={<DashboardPage />}
                        />

                        {/* Diagnóstico */}
                        <Route
                            path="/diagnostic"
                            element={<DiagnosticPage />}
                        />

                        {/* 1. Catálogo de ejercicios */}
                        <Route
                            path="/exercises"
                            element={<ExercisesCatalogPage />}
                        />

                        {/* 2. Nuevo editor de ejercicios */}
                        <Route
                            path="/resolver-ejercicio"
                            element={<ResolverEjercicioPage />}
                        />

                        {/* 3. Pantalla final del ejercicio */}
                        <Route
                            path="/ejercicio-completado"
                            element={<EjercicioCompletadoPage />}
                        />

                        {/*
                         * Práctica adaptativa del proyecto.
                         * Se conserva su URL original.
                         */}
                        <Route
                            path="/exercises/current"
                            element={<ExercisePage />}
                        />

                        {/* Insignias */}
                        <Route
                            path="/badges"
                            element={<BadgesPage />}
                        />

                    </Route>
                </Route>

                {/* Página no encontrada */}
                <Route
                    path="*"
                    element={<NotFoundPage />}
                />

            </Routes>
        </BrowserRouter>
    )
}

export default App

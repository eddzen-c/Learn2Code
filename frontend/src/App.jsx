// Enrutamiento principal y utilidades de React Router.
// BrowserRouter provee el contexto de routing en toda la aplicación.
// Routes y Route definen las rutas visibles en la UI.
// Navigate permite redirecciones programáticas.
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

// Guardas de ruta para controlar el acceso según la sesión.
import {
  ProtectedRoute,
} from './auth/ProtectedRoute.jsx'

import {
  VerifiedEmailRoute,
} from './auth/VerifiedEmailRoute.jsx'

import {
  PublicOnlyRoute,
} from './auth/PublicOnlyRoute.jsx'

// Hook personalizado para acceder al estado de autenticación.
import {
  useAuth,
} from './auth/useAuth.js'

// Componente de carga que se muestra mientras se obtienen datos de autenticación.
import {
  FullPageLoader,
} from './components/FullPageLoader.jsx'

// Página principal del dashboard disponible solo para usuarios autenticados.
import {
  DashboardPage,
} from './pages/DashboardPage.jsx'

// Páginas relacionadas con la autenticación y estados de navegación.
import {
  LoginPage,
} from './pages/LoginPage.jsx'

import {
  NotFoundPage,
} from './pages/NotFoundPage.jsx'

import {
  RegisterPage,
} from './pages/RegisterPage.jsx'

import {
  ForgotPasswordPage,
} from './pages/ForgotPasswordPage.jsx'

import {
  ResetPasswordPage,
} from './pages/ResetPasswordPage.jsx'

import {
  VerifyEmailPage,
} from './pages/VerifyEmailPage.jsx'

// Páginas del área de usuario que requieren sesión activa.
import {
  ProfilePage,
} from './pages/ProfilePage.jsx'

import {
  DiagnosticPage,
} from './pages/DiagnosticPage.jsx'

import {
  ExercisePage,
} from './pages/ExercisePage.jsx'

import {
  BadgesPage,
} from './pages/BadgesPage.jsx'

// Componente intermedio que decide la ruta inicial para el usuario.
function RootRedirect() {
  const {
    isAuthenticated,
    isLoading,
    user,
  } = useAuth()

  if (isLoading) {
    // Muestra un loader hasta tener certeza del estado de sesión.
    return <FullPageLoader />
  }

  // Redirige automáticamente según si el usuario está autenticado.
  return (
    <Navigate
      replace
      to={
        isAuthenticated
          ? (
            user?.emailVerified
              ? '/dashboard'
              : '/verify-email'
          )
          : '/login'
      }
    />
  )
}

// Componente raíz que configura todas las rutas de la aplicación.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta inicial que delega destino según sesión */}
        <Route
          element={<RootRedirect />}
          path="/"
        />

        {/* Rutas de recuperación y verificación de cuenta, accesibles sin sesión activa */}
        <Route
          element={<ForgotPasswordPage />}
          path="/forgot-password"
        />

        <Route
          element={<ResetPasswordPage />}
          path="/reset-password"
        />

        <Route
          element={<VerifyEmailPage />}
          path="/verify-email"
        />

        {/* Rutas públicas para usuarios no autenticados; redirigen cuando ya tienen sesión */}
        <Route
          element={
            <PublicOnlyRoute
              authenticatedRedirectTo="/dashboard"
            />
          }
        >
          <Route
            element={<LoginPage />}
            path="/login"
          />
        </Route>

        <Route
          element={
            <PublicOnlyRoute
              authenticatedRedirectTo="/dashboard"
            />
          }
        >
          <Route
            element={<RegisterPage />}
            path="/register"
          />
        </Route>

        {/* Rutas protegidas que requieren autenticación previa */}
        <Route element={<ProtectedRoute />}>
          <Route
            element={<DashboardPage />}
            path="/dashboard"
          />

          <Route
            element={<ProfilePage />}
            path="/profile"
          />

          <Route element={<VerifiedEmailRoute />}>
            <Route
              element={<DiagnosticPage />}
              path="/diagnostic"
            />

            <Route
              element={<ExercisePage />}
              path="/exercises"
            />

            <Route
              element={<BadgesPage />}
              path="/badges"
            />
          </Route>
        </Route>

        {/* Ruta fallback para URLs no definidas */}
        <Route
          element={<NotFoundPage />}
          path="*"
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
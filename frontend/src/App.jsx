import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import {
  ProtectedRoute,
} from './auth/ProtectedRoute.jsx'

import {
  PublicOnlyRoute,
} from './auth/PublicOnlyRoute.jsx'

import {
  useAuth,
} from './auth/useAuth.js'

import {
  FullPageLoader,
} from './components/FullPageLoader.jsx'

import {
  DashboardPage,
} from './pages/DashboardPage.jsx'

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
  ProfilePage,
} from './pages/ProfilePage.jsx'

import {
  DiagnosticPage,
} from './pages/DiagnosticPage.jsx'

import {
  ExercisePage,
} from './pages/ExercisePage.jsx'

// landing page pública
import {
  HomePage,
} from './pages/HomePage.jsx'

/**
 * Redirección dinámica para la ruta raíz ('/').
 * - Si el usuario YA está autenticado -> va directamente al /dashboard.
 * - Si NO está autenticado -> muestra la Landing Page (HomePage).
 */
function RootRedirect() {
  const {
    isAuthenticated,
    isLoading,
  } = useAuth()

  if (isLoading) {
    return <FullPageLoader />
  }

  if (isAuthenticated) {
    return (
      <Navigate
        replace
        to="/dashboard"
      />
    )
  }

  return <HomePage />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal: Landing Page (o Dashboard si hay sesión activa) */}
        <Route
          element={<RootRedirect />}
          path="/"
        />

        {/* Rutas exclusivas para usuarios sin autenticar */}
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
              authenticatedRedirectTo="/diagnostic"
            />
          }
        >
          <Route
            element={<RegisterPage />}
            path="/register"
          />
        </Route>

        {/* Rutas protegidas para usuarios autenticados */}
        <Route element={<ProtectedRoute />}>
          <Route
            element={<DashboardPage />}
            path="/dashboard"
          />
          <Route
            element={<ProfilePage />}
            path="/profile"
          />
          <Route
            element={<DiagnosticPage />}
            path="/diagnostic"
          />
          <Route
            element={<ExercisePage />}
            path="/exercises"
          />
        </Route>

        {/* Ruta comodín para manejo de errores 404 */}
        <Route
          element={<NotFoundPage />}
          path="*"
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
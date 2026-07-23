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

function RootRedirect() {
  const {
    isAuthenticated,
    isLoading,
  } = useAuth()

  if (isLoading) {
    return <FullPageLoader />
  }

  return (
    <Navigate
      replace
      to={
        isAuthenticated
          ? '/dashboard'
          : '/login'
      }
    />
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={<RootRedirect />}
          path="/"
        />

        <Route element={<PublicOnlyRoute />}>
          <Route
            element={<LoginPage />}
            path="/login"
          />

          <Route
            element={<RegisterPage />}
            path="/register"
          />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route
            element={<DashboardPage />}
            path="/dashboard"
          />
        </Route>

        <Route
          element={<NotFoundPage />}
          path="*"
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
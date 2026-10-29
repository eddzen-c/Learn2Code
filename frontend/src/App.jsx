
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
    VerifiedEmailRoute,
} from './auth/VerifiedEmailRoute.jsx'

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
    LandingPage,
} from './pages/LandingPage.jsx'

import {
    LoginPage,
} from './pages/LoginPage.jsx'

import RegisterPage from './pages/RegisterPage.jsx'

import {
    ForgotPasswordPage,
} from './pages/ForgotPasswordPage.jsx'

import {
    ResetPasswordPage,
} from './pages/ResetPasswordPage.jsx'

import {
    VerifyEmailPage,
} from './pages/VerifyEmailPage.jsx'

import {
    NotFoundPage,
} from './pages/NotFoundPage.jsx'

import {
    DashboardPage,
} from './pages/DashboardPage.jsx'

import {
    OnboardingPage,
} from './pages/OnboardingPage.jsx'

import {
    ProfilePage,
} from './pages/ProfilePage.jsx'

import {
    PublicProfilePage,
} from './pages/PublicProfilePage.jsx'

import {
    DiagnosticPage,
} from './pages/DiagnosticPage.jsx'

import {
    DiagnosticResultsPage,
} from './pages/DiagnosticResultsPage.jsx'

import {
    RecommendedPlanPage,
} from './pages/RecommendedPlanPage.jsx'

import {
    StartLearningPage,
} from './pages/StartLearningPage.jsx'

import {
    RoutesPage,
} from './pages/RoutesPage.jsx'

import {
    FrontendRoutePage,
} from './pages/FrontendRoutePage.jsx'

import {
    ExercisePage,
} from './pages/ExercisePage.jsx'

import {
    BadgesPage,
} from './pages/BadgesPage.jsx'

// Redirección inicial según el estado de la sesión.
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

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Página inicial */}
                <Route
                    path="/"
                    element={<RootRedirect />}
                />

                {/* Recuperación y verificación de cuenta */}
                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                />

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

                {/* Rutas que requieren autenticación */}
                <Route element={<ProtectedRoute />}>
                    {/* Perfil integrado */}
                    <Route
                        path="/profile"
                        element={<ProfilePage />}
                    />

                    {/* Vista previa del perfil público.
              No es una página pública anónima. */}
                    <Route
                        path="/profile/public"
                        element={<PublicProfilePage />}
                    />

                    {/* Rutas académicas para correos verificados */}
                    <Route element={<VerifiedEmailRoute />}>
                        <Route
                            path="/onboarding"
                            element={<OnboardingPage />}
                        />

                        <Route
                            path="/dashboard"
                            element={<DashboardPage />}
                        />

                        {/* Diagnóstico */}
                        <Route
                            path="/diagnostic"
                            element={<DiagnosticPage />}
                        />

                        <Route
                            path="/diagnostic/results"
                            element={<DiagnosticResultsPage />}
                        />

                        {/* Plan personalizado con OpenAI */}
                        <Route
                            path="/recommended-plan"
                            element={<RecommendedPlanPage />}
                        />

                        <Route
                            path="/start-learning"
                            element={<StartLearningPage />}
                        />

                        {/* Catálogo y detalles de rutas */}
                        <Route
                            path="/routes"
                            element={<RoutesPage />}
                        />

                        <Route
                            path="/routes/frontend"
                            element={<FrontendRoutePage />}
                        />

                        {/* Ejercicios y logros */}
                        <Route
                            path="/exercises"
                            element={<ExercisePage />}
                        />

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


import {
    useEffect,
    useState,
} from 'react'

import {
    BrowserRouter,
    Navigate,
    Outlet,
    Route,
    Routes,
    useLocation,
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
    getCurrentStudentOnboarding,
} from './api/onboarding.api.js'

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
    BackendRoutePage,
} from './pages/BackendRoutePage.jsx'

import {
    FullStackRoutePage,
} from './pages/FullStackRoutePage.jsx'

import {
    DevOpsRoutePage,
} from './pages/DevOpsRoutePage.jsx'

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
                    ? '/dashboard'
                    : '/verify-email'
            }
        />
    )
}

// Las cinco páginas que forman el recorrido inicial.
const learningFlowPaths = new Set([
    '/onboarding',
    '/diagnostic',
    '/diagnostic/results',
    '/recommended-plan',
    '/start-learning',
])

/**
 * Consulta PostgreSQL antes de permitir navegar
 * entre el recorrido inicial y el resto de la plataforma.
 *
 * La finalización se determina exclusivamente mediante
 * onboarding.learningFlowCompletedAt.
 */
function LearningFlowGate() {
    const { accessToken } = useAuth()
    const { pathname } = useLocation()

    const [retryKey, setRetryKey] = useState(0)
    const [flowResult, setFlowResult] = useState(null)

    useEffect(() => {
        let active = true

        if (!accessToken) {
            return () => {
                active = false
            }
        }

        getCurrentStudentOnboarding(accessToken)
            .then((result) => {
                if (!active) {
                    return
                }

                setFlowResult({
                    accessToken,
                    pathname,
                    retryKey,
                    completed: Boolean(
                        result?.onboarding?.learningFlowCompletedAt,
                    ),
                    error: '',
                })
            })
            .catch((error) => {
                if (!active) {
                    return
                }

                setFlowResult({
                    accessToken,
                    pathname,
                    retryKey,
                    completed: false,
                    error:
                        error?.message
                        ?? 'No fue posible consultar tu avance.',
                })
            })

        return () => {
            active = false
        }
    }, [accessToken, pathname, retryKey])

    // No utilizar resultados de otra sesión o navegación.
    const hasCurrentResult =
        flowResult?.accessToken === accessToken
        && flowResult?.pathname === pathname
        && flowResult?.retryKey === retryKey

    if (!accessToken || !hasCurrentResult) {
        return <FullPageLoader />
    }

    // Ante un error de red, no asumir que el recorrido
    // está pendiente o completado.
    if (flowResult.error) {
        return (
            <main
                role="alert"
                style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                }}
            >
                <h1>No pudimos consultar tu avance</h1>

                <p>{flowResult.error}</p>

                <button
                    type="button"
                    onClick={() => {
                        setRetryKey((value) => value + 1)
                    }}
                >
                    Reintentar
                </button>
            </main>
        )
    }

    const isLearningFlowPage =
        learningFlowPaths.has(pathname)

    // Un recorrido terminado no debe repetirse.
    if (flowResult.completed && isLearningFlowPage) {
        return (
            <Navigate
                replace
                to="/dashboard"
            />
        )
    }

    // Sin finalizar el recorrido, no se permite
    // saltar directamente al dashboard u otras secciones.
    if (!flowResult.completed && !isLearningFlowPage) {
        return (
            <Navigate
                replace
                to="/onboarding"
            />
        )
    }

    return <Outlet />
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
                        <Route element={<LearningFlowGate />}>
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

                            {/* Plan recomendado durante el onboarding */}
                            <Route
                                path="/recommended-plan"
                                element={<RecommendedPlanPage />}
                            />

                            {/* Recomendación consultable después del onboarding */}
                            <Route
                                path="/my-recommendation"
                                element={
                                    <RecommendedPlanPage standalone />
                                }
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

                            <Route
                                path="/routes/backend"
                                element={<BackendRoutePage />}
                            />

                            <Route
                                path="/routes/fullstack"
                                element={<FullStackRoutePage />}
                            />

                            <Route
                                path="/routes/devops"
                                element={<DevOpsRoutePage />}
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

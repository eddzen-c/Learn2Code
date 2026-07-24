import {
    Navigate,
    Outlet,
    useLocation,
} from 'react-router-dom'

import {
    FullPageLoader,
} from '../components/FullPageLoader.jsx'

import {
    useAuth,
} from './useAuth.js'

export function ProtectedRoute() {
    const location = useLocation()

    const {
        isAuthenticated,
        isLoading,
    } = useAuth()

    if (isLoading) {
        return <FullPageLoader />
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                replace
                state={{
                    from:
                        `${location.pathname
                        }${location.search}`,
                }}
                to="/login"
            />
        )
    }

    return <Outlet />
}
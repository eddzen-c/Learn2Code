import {
    Navigate,
    Outlet,
} from 'react-router-dom'

import {
    FullPageLoader,
} from '../components/FullPageLoader.jsx'

import {
    useAuth,
} from './useAuth.js'

export function VerifiedEmailRoute() {
    const {
        isAuthenticated,
        isLoading,
        user,
    } = useAuth()

    if (isLoading) {
        return <FullPageLoader />
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                replace
                to="/login"
            />
        )
    }

    if (!user?.emailVerified) {
        return (
            <Navigate
                replace
                to="/verify-email"
            />
        )
    }

    return <Outlet />
}
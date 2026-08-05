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

export function PublicOnlyRoute({
    authenticatedRedirectTo = '/dashboard',
}) {
    const {
        isAuthenticated,
        isLoading,
        user,
    } = useAuth()

    if (isLoading) {
        return <FullPageLoader />
    }

    if (isAuthenticated) {
        return (
            <Navigate
                replace
                to={
                    user?.emailVerified
                        ? authenticatedRedirectTo
                        : '/verify-email'
                }
            />
        )
    }

    return <Outlet />
}
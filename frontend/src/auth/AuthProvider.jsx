import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'

import {
    getCurrentUser as getCurrentUserRequest,
    login as loginRequest,
    logout as logoutRequest,
    refresh as refreshRequest,
    register as registerRequest,
    updateCurrentUser as updateCurrentUserRequest,
} from '../api/auth.api.js'

import {
    AuthContext,
} from './auth-context.js'

const anonymousSession = {
    status: 'anonymous',
    user: null,
    accessToken: null,
}

let pendingRefreshRequest = null

const requestSessionRefresh = () => {
    if (!pendingRefreshRequest) {
        pendingRefreshRequest = refreshRequest()
            .finally(() => {
                pendingRefreshRequest = null
            })
    }

    return pendingRefreshRequest
}

export function AuthProvider({ children }) {
    const [session, setSession] = useState({
        status: 'loading',
        user: null,
        accessToken: null,
    })

    const applyAuthenticatedSession = useCallback(
        (data) => {
            setSession({
                status: 'authenticated',
                user: data.user,
                accessToken: data.accessToken,
            })

            return data
        },
        [],
    )

    const clearSession = useCallback(() => {
        setSession(anonymousSession)
    }, [])

    const signUp = useCallback(
        async (credentials) => {
            const data = await registerRequest(
                credentials,
            )

            return applyAuthenticatedSession(data)
        },
        [applyAuthenticatedSession],
    )

    const signIn = useCallback(
        async (credentials) => {
            const data = await loginRequest(
                credentials,
            )

            return applyAuthenticatedSession(data)
        },
        [applyAuthenticatedSession],
    )

    const refreshSession = useCallback(async () => {
        try {
            const data = await requestSessionRefresh()

            return applyAuthenticatedSession(data)
        } catch (error) {
            clearSession()
            throw error
        }
    }, [
        applyAuthenticatedSession,
        clearSession,
    ])

    const signOut = useCallback(async () => {
        try {
            await logoutRequest()
        } finally {
            clearSession()
        }
    }, [clearSession])

    useEffect(() => {
        let active = true

        requestSessionRefresh()
            .then((data) => {
                if (active) {
                    applyAuthenticatedSession(data)
                }
            })
            .catch(() => {
                if (active) {
                    clearSession()
                }
            })

        return () => {
            active = false
        }
    }, [
        applyAuthenticatedSession,
        clearSession,
    ])

    const loadProfile = useCallback(
        async () => {
            const accessToken =
                session.accessToken

            if (!accessToken) {
                throw new Error(
                    'Authentication session is unavailable',
                )
            }

            const user =
                await getCurrentUserRequest(
                    accessToken,
                )

            setSession((currentSession) => {
                if (
                    currentSession.status
                    !== 'authenticated'
                ) {
                    return currentSession
                }

                return {
                    ...currentSession,
                    user,
                }
            })

            return user
        },
        [session.accessToken],
    )

    const updateProfile = useCallback(
        async (profile) => {
            const accessToken =
                session.accessToken

            if (!accessToken) {
                throw new Error(
                    'Authentication session is unavailable',
                )
            }

            const user =
                await updateCurrentUserRequest({
                    accessToken,
                    profile,
                })

            setSession((currentSession) => {
                if (
                    currentSession.status
                    !== 'authenticated'
                ) {
                    return currentSession
                }

                return {
                    ...currentSession,
                    user,
                }
            })

            return user
        },
        [session.accessToken],
    )

    const value = useMemo(
        () => ({
            ...session,
            isLoading: session.status === 'loading',
            isAuthenticated:
                session.status === 'authenticated',
            signUp,
            signIn,
            signOut,
            refreshSession,
            loadProfile,
            updateProfile,
        }),
        [
            session,
            signUp,
            signIn,
            signOut,
            refreshSession,
            loadProfile,
            updateProfile,
        ],
    )

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
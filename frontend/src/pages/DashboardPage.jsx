import {
    useState,
} from 'react'

import {
    useAuth,
} from '../auth/useAuth.js'

export function DashboardPage() {
    const {
        user,
        signOut,
    } = useAuth()

    const [logoutError, setLogoutError] =
        useState('')

    const handleLogout = async () => {
        setLogoutError('')

        try {
            await signOut()
        } catch {
            setLogoutError(
                'La sesión se cerró localmente, pero no fue posible contactar al servidor.',
            )
        }
    }

    return (
        <main className="dashboard-page">
            <section className="dashboard-card">
                <p className="eyebrow">
                    Sesión autenticada
                </p>

                <h1>
                    Hola, {user.fullName}
                </h1>

                <p>{user.email}</p>

                <p>
                    Rol: {user.roles.join(', ')}
                </p>

                {logoutError && (
                    <p role="alert">
                        {logoutError}
                    </p>
                )}

                <button
                    onClick={handleLogout}
                    type="button"
                >
                    Cerrar sesión
                </button>
            </section>
        </main>
    )
}
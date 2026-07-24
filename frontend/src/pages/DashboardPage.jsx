import {
    useState,
} from 'react'

import {
    Link,
} from 'react-router-dom'

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
                    <p
                        className="form-error"
                        role="alert"
                    >
                        {logoutError}
                    </p>
                )}

                <div className="dashboard-actions">
                    <Link to="/profile">
                        Editar perfil
                    </Link>

                    <button
                        onClick={handleLogout}
                        type="button"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </section>
        </main>
    )
}
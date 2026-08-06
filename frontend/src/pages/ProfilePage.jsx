import {
    useEffect,
    useState,
} from 'react'

import {
    Link,
} from 'react-router-dom'

import {
    getAuthErrorMessage,
} from '../auth/auth-error-message.js'

import {
    useAuth,
} from '../auth/useAuth.js'

import {
    FullPageLoader,
} from '../components/FullPageLoader.jsx'

import './ProfilePage.css'

const createProfileForm = (user) => ({
    fullName: user.fullName ?? '',
    preferredLocale:
        user.preferredLocale ?? 'es-MX',
    preferredProgrammingLanguageId:
        user.preferredProgrammingLanguageId
            == null
            ? ''
            : String(
                user.preferredProgrammingLanguageId,
            ),
})

export function ProfilePage() {
    const {
        loadProfile,
        updateProfile,
    } = useAuth()

    const [form, setForm] = useState(null)
    const [loadError, setLoadError] = useState('')
    const [formError, setFormError] = useState('')
    const [successMessage, setSuccessMessage] =
        useState('')
    const [isSubmitting, setIsSubmitting] =
        useState(false)

    useEffect(() => {
        let active = true

        loadProfile()
            .then((user) => {
                if (active) {
                    setForm(
                        createProfileForm(user),
                    )
                }
            })
            .catch((error) => {
                if (active) {
                    setLoadError(
                        getAuthErrorMessage(error),
                    )
                }
            })

        return () => {
            active = false
        }
    }, [loadProfile])

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        setFormError('')
        setSuccessMessage('')
        setIsSubmitting(true)

        try {
            const user = await updateProfile({
                fullName: form.fullName,
                preferredLocale:
                    form.preferredLocale,
                preferredProgrammingLanguageId:
                    form.preferredProgrammingLanguageId
                        === ''
                        ? null
                        : Number(
                            form
                                .preferredProgrammingLanguageId,
                        ),
            })

            setForm(createProfileForm(user))

            setSuccessMessage(
                'Tu perfil se actualizó correctamente.',
            )
        } catch (error) {
            setFormError(
                getAuthErrorMessage(error),
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!form && !loadError) {
        return <FullPageLoader />
    }

    if (loadError) {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <p className="eyebrow">
                        Perfil
                    </p>

                    <h1>No fue posible cargar tu perfil</h1>

                    <p
                        className="form-error"
                        role="alert"
                    >
                        {loadError}
                    </p>

                    <Link to="/dashboard">
                        Volver al dashboard
                    </Link>
                </section>
            </main>
        )
    }

    return (
        <main className="auth-page">
            <section className="auth-card profile-card split-card">
                {/* Columna Izquierda: Formulario */}
                <div className="auth-form-container">
                    <header className="auth-header">
                        <p className="eyebrow">
                            Mi perfil
                        </p>

                        <h1>Preferencias</h1>

                        <p>
                            Personaliza tu experiencia de aprendizaje.
                        </p>
                    </header>

                    <form
                        className="auth-form"
                        onSubmit={handleSubmit}
                    >
                        <label htmlFor="profile-name">
                            Nombre completo
                        </label>

                        <input
                            autoComplete="name"
                            id="profile-name"
                            name="fullName"
                            onChange={handleChange}
                            required
                            type="text"
                            value={form.fullName}
                        />

                        <label htmlFor="profile-locale">
                            Idioma de la interfaz
                        </label>

                        <select
                            id="profile-locale"
                            name="preferredLocale"
                            onChange={handleChange}
                            value={form.preferredLocale}
                        >
                            <option value="es-MX">
                                Español (México)
                            </option>

                            <option value="en-US">
                                English (United States)
                            </option>
                        </select>

                        <label htmlFor="profile-language">
                            Lenguaje de programación preferido
                        </label>

                        <select
                            id="profile-language"
                            name="preferredProgrammingLanguageId"
                            onChange={handleChange}
                            value={
                                form.preferredProgrammingLanguageId
                            }
                        >
                            <option value="">
                                Sin preferencia
                            </option>

                            <option value="1">
                                JavaScript
                            </option>

                            <option value="2">
                                Python
                            </option>
                        </select>

                        {formError && (
                            <p
                                className="form-error"
                                role="alert"
                            >
                                {formError}
                            </p>
                        )}

                        {successMessage && (
                            <p
                                className="form-success"
                                role="status"
                            >
                                {successMessage}
                            </p>
                        )}

                        <button
                            disabled={isSubmitting}
                            type="submit"
                        >
                            {isSubmitting
                                ? 'Guardando...'
                                : 'Guardar cambios'}
                        </button>
                    </form>

                    <p className="auth-switch">
                        <Link to="/dashboard">
                            Volver al dashboard
                        </Link>
                    </p>
                </div>

                {/* Columna Derecha: Contenedor limpio para colocar tu imagen */}
                <div className="auth-illustration-container">
                    <div className="illustration-wrapper">
                        <div className="profile-illustration-graphics">
                            {/* Reemplaza la siguiente etiqueta con tu imagen */}
                            <img 
                                src="/images/perfil.jpg"
                                alt="Ilustración de perfil" 
                            />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
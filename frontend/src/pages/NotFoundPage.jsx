import {
    Link,
} from 'react-router-dom'

export function NotFoundPage() {
    return (
        <main className="not-found-page">
            <section>
                <p className="eyebrow">Error 404</p>
                <h1>Página no encontrada</h1>

                <Link to="/">
                    Volver al inicio
                </Link>
            </section>
        </main>
    )
}
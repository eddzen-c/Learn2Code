
import { useEffect, useState } from 'react';
import { FiClock } from 'react-icons/fi';

import './DiagnosticCountdown.css';

// Debe coincidir con el límite actual del backend.
const EXAM_DURATION_SECONDS = 30 * 60;

/**
 * Calcula el tiempo restante a partir de la fecha
 * de vencimiento recibida desde PostgreSQL.
 *
 * No guardamos un contador independiente en el navegador.
 */
function calculateRemainingSeconds(expiresAt) {
    const expiration = Date.parse(expiresAt);

    if (!Number.isFinite(expiration)) {
        return 0;
    }

    return Math.max(
        0,
        Math.ceil((expiration - Date.now()) / 1000),
    );
}

/**
 * Convierte segundos a formato MM:SS.
 */
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return [
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0'),
    ].join(':');
}

/**
 * Temporizador visual del diagnóstico.
 *
 * Cada segundo recalcula el tiempo usando expiresAt.
 * Por eso continúa correctamente después de F5
 * o cuando el estudiante cambia de pestaña.
 */
export function DiagnosticCountdown({ expiresAt }) {
    const [remainingSeconds, setRemainingSeconds] = useState(
        () => calculateRemainingSeconds(expiresAt),
    );

    useEffect(() => {
        const updateTimer = () => {
            setRemainingSeconds(
                calculateRemainingSeconds(expiresAt),
            );
        };

        // Actualización inmediata.
        updateTimer();

        // Actualización visual cada segundo.
        const intervalId = window.setInterval(
            updateTimer,
            1000,
        );

        return () => {
            window.clearInterval(intervalId);
        };
    }, [expiresAt]);

    const isExpired = remainingSeconds === 0;

    const percentage = Math.min(
        100,
        (remainingSeconds / EXAM_DURATION_SECONDS) * 100,
    );

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return (
        <div
            className={
                isExpired
                    ? 'diagnostic-countdown is-expired'
                    : 'diagnostic-countdown'
            }
        >
            <div
                className="diagnostic-countdown__ring"
                style={{
                    '--remaining-percentage': `${percentage}%`,
                }}
                role="timer"
                aria-label={
                    isExpired
                        ? 'Tiempo agotado'
                        : `Tiempo restante: ${minutes} minutos y ${seconds} segundos`
                }
            >
                <div className="diagnostic-countdown__content">
                    <FiClock aria-hidden="true" />

                    <strong>
                        {formatTime(remainingSeconds)}
                    </strong>

                    <span>
                        {isExpired
                            ? 'Finalizado'
                            : 'Tiempo restante'}
                    </span>
                </div>
            </div>

            <p className="diagnostic-countdown__message">
                {isExpired
                    ? 'El tiempo terminó. Consulta el estado del diagnóstico.'
                    : 'El tiempo sigue contando aunque salgas de esta pantalla.'}
            </p>
        </div>
    );
}

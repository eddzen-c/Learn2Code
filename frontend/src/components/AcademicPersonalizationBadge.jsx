import { FiCheckCircle, FiTarget } from 'react-icons/fi'

const ETIQUETAS = {
    completed: 'Práctica completada',
    in_progress: 'Continuar práctica',
    reinforce: 'Reforzar fundamentos',
    challenge: 'Reto de ampliación',
    practice: 'Práctica sugerida',
}

export function AcademicPersonalizationBadge({ personalization, compact = false }) {
    if (!personalization) return null

    const key = personalization.state
    const label = personalization.recommended
        ? 'Recomendado para ti'
        : ETIQUETAS[key]

    if (!label) return null

    return (
        <span
            className={
                'exacademy-personalization-badge'
                + (compact ? ' is-compact' : '')
                + (key === 'completed' ? ' is-complete' : '')
            }
        >
            {key === 'completed'
                ? <FiCheckCircle aria-hidden="true" />
                : <FiTarget aria-hidden="true" />}
            {label}
        </span>
    )
}

import {
    LearningFlowProgress,
} from './LearningFlowProgress.jsx'

export function LearningTopbar({
    activeStep = 1,
    userName = 'Estudiante',
}) {
    const normalizedUserName = (
        typeof userName === 'string'
        && userName.trim().length > 0
    )
        ? userName.trim()
        : 'Estudiante'

    const userInitial = normalizedUserName
        .charAt(0)
        .toUpperCase()

    return (
        <header className="onboarding-topbar">
            <LearningFlowProgress
                activeStep={activeStep}
            />

            <div
                aria-label={`Perfil de ${normalizedUserName}`}
                className="onboarding-user"
            >
                <span aria-hidden="true">
                    {userInitial}
                </span>

                <div>
                    <strong>
                        {normalizedUserName}
                    </strong>

                    <small>
                        Estudiante
                    </small>
                </div>
            </div>
        </header>
    )
}
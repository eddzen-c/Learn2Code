import {
    FiCheck,
} from 'react-icons/fi'

const learningFlowSteps =
    Object.freeze([
        Object.freeze({
            number: 1,
            title: 'Sobre ti',
            description: 'Cuéntanos de ti',
        }),
        Object.freeze({
            number: 2,
            title: 'Diagnóstico',
            description: 'Evaluamos tu nivel',
        }),
        Object.freeze({
            number: 3,
            title: 'Resultados',
            description:
                'Descubre tus resultados',
        }),
        Object.freeze({
            number: 4,
            title: 'Plan recomendado',
            description:
                'Tu plan personalizado',
        }),
        Object.freeze({
            number: 5,
            title: '¡A aprender!',
            description: 'Comienza tu ruta',
        }),
    ])

const getStepClassName = ({
    stepNumber,
    activeStep,
}) => {
    if (stepNumber === activeStep) {
        return 'is-active'
    }

    if (stepNumber < activeStep) {
        return 'is-complete'
    }

    return ''
}

export function LearningFlowProgress({
    activeStep = 1,
}) {
    return (
        <ol
            aria-label="Progreso de configuración"
            className="onboarding-progress"
        >
            {learningFlowSteps.map((step) => {
                const isComplete =
                    step.number < activeStep

                return (
                    <li
                        className={getStepClassName({
                            stepNumber:
                                step.number,
                            activeStep,
                        })}
                        key={step.number}
                    >
                        <span>
                            {isComplete ? (
                                <FiCheck
                                    aria-hidden="true"
                                    focusable="false"
                                />
                            ) : (
                                step.number
                            )}
                        </span>

                        <div>
                            <strong>
                                {step.title}
                            </strong>

                            <small>
                                {step.description}
                            </small>
                        </div>
                    </li>
                )
            })}
        </ol>
    )
}
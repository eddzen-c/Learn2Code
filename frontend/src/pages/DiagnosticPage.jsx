import { useEffect, useState } from "react";

import {
    Link,
    Navigate,
} from 'react-router-dom';

import {
    FiArrowLeft,
    FiArrowRight,
    FiFileText,
} from 'react-icons/fi';

import {
    getCurrentDiagnostic,
    startDiagnostic,
    submitDiagnosticAnswer,
} from "../api/diagnostic.api.js";

import { getAuthErrorMessage } from "../auth/auth-error-message.js";

import { useAuth } from "../auth/useAuth.js";

import { DiagnosticExamSummary } from "../components/DiagnosticExamSummary.jsx";

import { DiagnosticCodeBlock } from "../components/DiagnosticCodeBlock.jsx";

import { LearningSidebar } from "../components/LearningSidebar.jsx";

import { LearningTopbar } from "../components/LearningTopbar.jsx";

import { TechnologyIcon } from "../components/TechnologyIcon.jsx";

import './DiagnosticPage.css';

import './DiagnosticExam.css';

export function DiagnosticPage() {
    const { accessToken, user } = useAuth();

    const firstName =
        typeof user?.fullName === "string" && user.fullName.trim().length > 0
            ? user.fullName.trim().split(/\s+/)[0]
            : "Estudiante";

    const [diagnostic, setDiagnostic] = useState(null);

    const [loadError, setLoadError] = useState("");

    const [startError, setStartError] = useState("");

    const [isStarting, setIsStarting] = useState(false);

    const [selectedAnswer, setSelectedAnswer] = useState("");

    // Posición de una pregunta respondida que estamos revisando.
    // null significa que mostramos la siguiente pregunta pendiente.
    const [reviewPosition, setReviewPosition] = useState(null);

    const [answerError, setAnswerError] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let active = true;

        getCurrentDiagnostic(accessToken)
            .then((data) => {
                if (active) {
                    setDiagnostic(data);
                    setLoadError("");
                }
            })
            .catch((error) => {
                if (active) {
                    setDiagnostic(null);

                    setLoadError(getAuthErrorMessage(error));
                }
            });

        return () => {
            active = false;
        };
    }, [accessToken, reloadKey]);

    const handleRetry = () => {
        setDiagnostic(null);
        setLoadError("");
        setReloadKey((current) => current + 1);
    };


    // Primera pregunta que todavía no tiene respuesta.
    const pendingQuestion =
        diagnostic?.state === "in_progress"
            ? diagnostic.questions.find(
                (question) => !question.response,
            )
            : null;

    // Pregunta anterior seleccionada para revisión.
    const reviewedQuestion =
        diagnostic?.state === "in_progress"
            && reviewPosition !== null
            ? diagnostic.questions.find(
                (question) =>
                    question.position === reviewPosition
                    && question.response,
            ) ?? null
            : null;

    // Mostramos la pregunta revisada o la pendiente.
    const currentQuestion =
        reviewedQuestion ?? pendingQuestion;

    const isReviewingAnswer =
        reviewedQuestion !== null;

    // Pregunta respondida inmediatamente anterior.
    const previousAnsweredQuestion =
        diagnostic?.questions
            ?.filter(
                (question) =>
                    question.response
                    && question.position <
                    (currentQuestion?.position ?? 0),
            )
            .sort(
                (first, second) =>
                    second.position - first.position,
            )[0] ?? null;

    // Siguiente pregunta ya respondida, si existe.
    const nextAnsweredQuestion =
        diagnostic?.questions
            ?.filter(
                (question) =>
                    question.response
                    && question.position >
                    (currentQuestion?.position ?? 0),
            )
            .sort(
                (first, second) =>
                    first.position - second.position,
            )[0] ?? null;


    const currentPosition =
        currentQuestion?.position ?? diagnostic?.assessment?.answeredCount ?? 0;

    const totalQuestions = diagnostic?.assessment?.questionCount ?? 0;

    /**
     * El progreso representa las preguntas respondidas,
     * no la posición de la pregunta que se está mostrando.
     *
        */
    const answeredCount =
        diagnostic?.assessment?.answeredCount ?? 0;

    const questionProgressPercentage =
        totalQuestions > 0
            ? Math.round(
                (answeredCount / totalQuestions) * 100
            )
            : 0;

    const isFinalQuestion =
        currentPosition === totalQuestions && totalQuestions > 0;

    /**
     * Permite consultar la pregunta respondida anterior.
     * No realiza llamadas al backend ni modifica respuestas.
     */
    const handlePreviousQuestion = () => {
        if (!previousAnsweredQuestion || isSubmitting) {
            return;
        }

        setReviewPosition(
            previousAnsweredQuestion.position,
        );
    };

    /**
     * Avanza por las preguntas respondidas.
     * Cuando no quedan más, vuelve a la pendiente.
     */
    const handleNextReviewedQuestion = () => {
        if (!isReviewingAnswer || isSubmitting) {
            return;
        }

        setReviewPosition(
            nextAnsweredQuestion?.position ?? null,
        );
    };

    const handleStart = async (event) => {
        event.preventDefault();

        setStartError("");
        setIsStarting(true);

        try {
            const data = await startDiagnostic(accessToken);

            setDiagnostic({
                state: data.assessment.status,
                assessment: data.assessment,
                questions: data.questions,
                result: null,
                language: data.language,
                generation: data.generation,
            });
        } catch (error) {
            setStartError(getAuthErrorMessage(error));
        } finally {
            setIsStarting(false);
        }
    };

    const handleSubmitAnswer = async (event) => {
        event.preventDefault();

        // Las preguntas respondidas son de solo lectura.
        if (isReviewingAnswer) {
            return;
        }

        if (!currentQuestion || selectedAnswer.trim().length === 0) {
            setAnswerError("Selecciona una respuesta.");

            return;
        }

        setAnswerError("");
        setIsSubmitting(true);

        try {
            const data = await submitDiagnosticAnswer({
                accessToken,
                assessmentId: diagnostic.assessment.id,
                questionId: currentQuestion.id,
                answer: selectedAnswer,
            });

            const updatedQuestions = diagnostic.questions.map((question) =>
                question.id === currentQuestion.id
                    ? {
                        ...question,

                        response: {
                            ...data.response,
                            answer: selectedAnswer,
                            submittedCode: null,
                        },
                    }
                    : question,
            );

            setSelectedAnswer("");

            if (data.completion) {
                setDiagnostic({
                    ...diagnostic,

                    state: "completed",

                    assessment: {
                        ...diagnostic.assessment,
                        status: "completed",
                        answeredCount: data.progress.answeredCount,
                    },

                    questions: updatedQuestions,

                    result: {
                        overallScore: data.completion.overallScore,

                        resultingDifficulty: data.completion.resultingDifficulty,

                        completedAt: data.response.evaluatedAt,
                    },
                });

                return;
            }

            setDiagnostic({
                ...diagnostic,

                assessment: {
                    ...diagnostic.assessment,
                    answeredCount: data.progress.answeredCount,
                },

                questions: updatedQuestions,
            });
        } catch (error) {
            const errorMessage = getAuthErrorMessage(error);

            if (error?.code === "DIAGNOSTIC_EXPIRED") {
                setAnswerError("");
                setStartError(errorMessage);
                setSelectedAnswer("");
                setDiagnostic(null);

                setReloadKey((currentKey) => currentKey + 1);
            } else {
                setAnswerError(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!diagnostic && !loadError) {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <p role="status">Revisando tu diagnóstico...</p>
                </section>
            </main>
        );
    }

    if (loadError) {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <p className="form-error" role="alert">
                        {loadError}
                    </p>

                    <button onClick={handleRetry} type="button">
                        Reintentar
                    </button>
                </section>
            </main>
        );
    }


    // Pantalla de bienvenida antes de iniciar el diagnóstico.
    // Conservamos la lógica del backend mediante handleStart.
    if (
        diagnostic.state === "not_started"
        || diagnostic.state === "available"
    ) {
        return (
            <main className="onboarding-page diagnostic-learning-page diagnostic-intro-page">

                {/* Barra lateral existente de Learn2Code */}
                <LearningSidebar
                    activeItem="diagnostic"
                    mascotSrc="/images/learn2code-mascot-laptop.png"
                    messageTitle="Aprende a tu ritmo"
                    message="Un paso a la vez."
                />

                <section className="onboarding-content">

                    {/* Barra de progreso de los cinco pasos */}
                    <LearningTopbar
                        activeStep={2}
                        userName={firstName}
                    />

                    <div className="diagnostic-intro">

                        {/* Encabezado principal */}
                        <header className="diagnostic-intro__header">
                            <p className="diagnostic-intro__breadcrumb">
                                Configuración inicial
                                <span aria-hidden="true"> / </span>
                                Diagnóstico
                            </p>

                            <h1>
                                Conozcamos tu punto de partida
                            </h1>

                            <p className="diagnostic-intro__subtitle">
                                Un diagnóstico breve para orientar
                                tu aprendizaje.
                            </p>
                        </header>

                        {/* Tarjeta principal */}
                        <section className="diagnostic-intro__hero">

                            <div className="diagnostic-intro__content">

                                {/* Icono original de diana del mockup */}
                                <img
                                    className="diagnostic-intro__icon"
                                    src="/images/learn2code-mockups/diagnostic/06-icono-principal-diana.svg"
                                    alt=""
                                    aria-hidden="true"
                                />

                                <p className="diagnostic-intro__eyebrow">
                                    EVALUACIÓN INICIAL
                                </p>

                                <h2>
                                    Descubramos tu nivel
                                </h2>

                                <p className="diagnostic-intro__description">
                                    Responderás doce preguntas generadas
                                    especialmente para ti, considerando
                                    tus conocimientos y tecnologías de interés.
                                </p>

                                {/* Características de la evaluación */}
                                <div className="diagnostic-intro__features">

                                    <div className="diagnostic-intro__feature">
                                        <img
                                            src="/images/learn2code-mockups/diagnostic/23-icono-preguntas-rojo.svg"
                                            alt=""
                                            aria-hidden="true"
                                        />

                                        <span>12 preguntas</span>
                                    </div>

                                    <div className="diagnostic-intro__feature">
                                        <img
                                            src="/images/learn2code-mockups/diagnostic/24-icono-nivel-rojo.svg"
                                            alt=""
                                            aria-hidden="true"
                                        />

                                        <span>Adaptado a tu nivel</span>
                                    </div>

                                </div>

                                <p className="diagnostic-intro__help">
                                    No necesitas prepararte. Responde
                                    con lo que sabes hoy.
                                </p>

                                {/* Formulario funcional conectado al backend */}
                                <form
                                    className="diagnostic-intro__form"
                                    onSubmit={handleStart}
                                >
                                    {startError && (
                                        <p
                                            className="form-error"
                                            role="alert"
                                        >
                                            {startError}
                                        </p>
                                    )}

                                    <button
                                        className="diagnostic-intro__start"
                                        disabled={isStarting}
                                        type="submit"
                                    >
                                        <span>
                                            {isStarting
                                                ? "Preparando evaluación..."
                                                : "Comenzar diagnóstico"}
                                        </span>

                                        {!isStarting && (
                                            <FiArrowRight aria-hidden="true" />
                                        )}
                                    </button>
                                </form>

                                <Link
                                    className="diagnostic-intro__back"
                                    to="/dashboard"
                                >
                                    Volver al panel
                                </Link>
                            </div>

                            {/* Ilustración construida con los recursos originales */}
                            <div className="diagnostic-intro__illustration">

                                {/* 1. Fondo geométrico rosa */}
                                <img
                                    className="diagnostic-intro__geometry"
                                    src="/images/learn2code-mockups/diagnostic/03-fondo-geometrico-rosa.svg"
                                    alt=""
                                    aria-hidden="true"
                                />

                                {/* 2. Base ovalada sobre la que descansa el dragón */}
                                <img
                                    className="diagnostic-intro__base"
                                    src="/images/learn2code-mockups/diagnostic/04-base-ovalada-rosa.svg"
                                    alt=""
                                    aria-hidden="true"
                                />

                                {/* 3. Mascota original del mockup */}
                                <img
                                    className="diagnostic-intro__dragon"
                                    src="/images/learn2code-mockups/diagnostic/01-dragon-bienvenida-diagnostico-1024.webp"
                                    alt="Dragón de Learn2Code trabajando en su laptop"
                                    decoding="async"
                                />

                                {/* 4. Acentos rojos decorativos */}
                                <img
                                    className="diagnostic-intro__accents"
                                    src="/images/learn2code-mockups/diagnostic/07-acentos-rojos.svg"
                                    alt=""
                                    aria-hidden="true"
                                />

                                {/* 5. Diana flotante con check */}
                                <div className="diagnostic-intro__target-badge">
                                    <img
                                        src="/images/learn2code-mockups/diagnostic/05-diana-con-check.svg"
                                        alt=""
                                        aria-hidden="true"
                                    />
                                </div>

                            </div>

                        </section>


                        {/* Beneficios que aparecen debajo de la tarjeta principal */}
                        <section
                            className="diagnostic-intro__benefits"
                            aria-label="Beneficios del diagnóstico"
                        >
                            <article className="diagnostic-intro__benefit">

                                <img
                                    className="diagnostic-intro__benefit-icon"
                                    src="/images/learn2code-mockups/diagnostic/09-recuadro-tiempo.svg"
                                    alt=""
                                    aria-hidden="true"
                                />

                                <div>
                                    <h3>Responde a tu ritmo</h3>
                                    <p>Tómate el tiempo que necesites.</p>
                                </div>
                            </article>

                            <article className="diagnostic-intro__benefit">

                                <img
                                    className="diagnostic-intro__benefit-icon"
                                    src="/images/learn2code-mockups/diagnostic/10-recuadro-nivel.svg"
                                    alt=""
                                    aria-hidden="true"
                                />

                                <div>
                                    <h3>Descubre tus fortalezas</h3>
                                    <p>
                                        Conoce tus puntos fuertes y áreas de mejora.
                                    </p>
                                </div>
                            </article>

                            <article className="diagnostic-intro__benefit">

                                <img
                                    className="diagnostic-intro__benefit-icon"
                                    src="/images/learn2code-mockups/diagnostic/11-recuadro-idea.svg"
                                    alt=""
                                    aria-hidden="true"
                                />

                                <div>
                                    <h3>Recibe un plan recomendado</h3>
                                    <p>
                                        Obtén una ruta de aprendizaje personalizada.
                                    </p>
                                </div>
                            </article>
                        </section>

                        <p className="diagnostic-intro__footer">
                            Cada gran proyecto empieza con un
                            primer paso. 🚀
                        </p>

                    </div>
                </section>
            </main>
        );
    }

    // Redirigir automáticamente
    // cuando el diagnóstico haya finalizado.
    if (diagnostic.state === "completed") {
        return (
            <Navigate
                to="/diagnostic/results"
                replace
            />
        );
    }

    return (
        <main className="onboarding-page diagnostic-learning-page">
            <LearningSidebar
                activeItem="diagnostic"
                mascotAlt="Mascota de Learn2Code apoyando durante el diagnóstico"
                mascotSrc="/images/learn2code-mascot-thinking.png"
                message="Analiza cada pregunta con calma. Tus respuestas ayudarán a crear una ruta adecuada para ti."
                messageTitle="¡Tú puedes!"
            />

            <section className="onboarding-content">
                <LearningTopbar activeStep={2} userName={firstName} />


                <header className="diagnostic-learning-heading diagnostic-exam-heading">
                    <Link
                        className="diagnostic-back-link"
                        to="/dashboard"
                    >
                        <FiArrowLeft aria-hidden="true" />
                        Volver
                    </Link>

                    <div className="diagnostic-exam-heading__layout">

                        <div className="diagnostic-exam-heading__title">
                            <div className="diagnostic-exam-heading__icon">
                                <FiFileText aria-hidden="true" />
                            </div>

                            <div>
                                <h1>Examen diagnóstico</h1>

                                <p>
                                    Para personalizar tu experiencia,
                                    necesitamos conocer tu nivel actual.
                                </p>
                            </div>
                        </div>

                        <div
                            className="diagnostic-exam-heading__mascot"
                            aria-hidden="true"
                        >
                            <img
                                src="/images/learn2code-mockups/diagnostic/01-dragon-bienvenida-diagnostico-1024.webp"
                                alt=""
                            />
                        </div>
                    </div>
                </header>

                <div className="diagnostic-learning-workspace">
                    <div className="diagnostic-exam-layout">
                        <section className="diagnostic-card">
                            <header className="diagnostic-question-header">
                                <p className="eyebrow">Diagnóstico en progreso</p>

                                <div className="diagnostic-question-title">
                                    <h2>
                                        Pregunta {currentPosition} de {totalQuestions}
                                    </h2>

                                    <span>{questionProgressPercentage}% completado</span>
                                </div>

                                <p>
                                    Respondidas: {diagnostic.assessment.answeredCount} de{" "}
                                    {totalQuestions}
                                </p>
                            </header>

                            <div
                                aria-label="Progreso del diagnóstico"
                                aria-valuemax={diagnostic.assessment.questionCount}
                                aria-valuemin="0"
                                aria-valuenow={answeredCount}
                                className="progress-track"
                                role="progressbar"
                            >
                                <span
                                    style={{
                                        width: `${questionProgressPercentage}%`,
                                    }}
                                />
                            </div>

                            {currentQuestion ? (
                                <form className="diagnostic-form" onSubmit={handleSubmitAnswer}>
                                    <div className="question-meta">
                                        <TechnologyIcon
                                            className="diagnostic-technology"
                                            showLabel
                                            size={18}
                                            technologyKey={currentQuestion.technologyKey}
                                        />

                                        <span>{currentQuestion.topic.name}</span>

                                        <span>Nivel {currentQuestion.difficulty.name}</span>
                                    </div>

                                    <div className="diagnostic-question-copy">
                                        <h2>{currentQuestion.prompt}</h2>
                                    </div>

                                    {currentQuestion.starterCode && (
                                        <DiagnosticCodeBlock code={currentQuestion.starterCode} />
                                    )}

                                    {isReviewingAnswer && (
                                        <p className="diagnostic-review-note" role="status">
                                            Estás revisando una respuesta guardada.
                                            No se puede modificar.
                                        </p>
                                    )}

                                    <fieldset disabled={isSubmitting || isReviewingAnswer}>
                                        <legend>Selecciona el resultado</legend>

                                        {currentQuestion.options.map((option, index) => {
                                            const value = String(option);

                                            const optionLetter = String.fromCharCode(65 + index);

                                            return (
                                                <label className="diagnostic-option" key={value}>
                                                    <input
                                                        checked={
                                                            isReviewingAnswer
                                                                ? String(currentQuestion.response.answer) === value
                                                                : selectedAnswer === value
                                                        }
                                                        name="diagnostic-answer"
                                                        onChange={(event) => {
                                                            setSelectedAnswer(event.target.value);
                                                        }}
                                                        type="radio"
                                                        value={value}
                                                    />

                                                    <span
                                                        aria-hidden="true"
                                                        className="diagnostic-option-letter"
                                                    >
                                                        {optionLetter}
                                                    </span>

                                                    <span className="diagnostic-option-text">
                                                        {value}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </fieldset>

                                    {answerError && (
                                        <p className="form-error" role="alert">
                                            {answerError}
                                        </p>
                                    )}

                                    <div className="diagnostic-navigation">

                                        {/* Navegar a una pregunta respondida anterior */}
                                        <button
                                            className="diagnostic-navigation__previous"
                                            type="button"
                                            onClick={handlePreviousQuestion}
                                            disabled={!previousAnsweredQuestion || isSubmitting}
                                        >
                                            <FiArrowLeft aria-hidden="true" />
                                            <span>Pregunta anterior</span>
                                        </button>

                                        {/* Al revisar, avanzar sin enviar otra respuesta */}
                                        {isReviewingAnswer ? (
                                            <button
                                                className="diagnostic-navigation__next"
                                                type="button"
                                                onClick={handleNextReviewedQuestion}
                                            >
                                                <span>Siguiente pregunta</span>
                                                <FiArrowRight aria-hidden="true" />
                                            </button>
                                        ) : (
                                            <button
                                                className="diagnostic-navigation__next"
                                                type="submit"
                                                disabled={isSubmitting}
                                            >
                                                <span>
                                                    {isSubmitting
                                                        ? "Evaluando..."
                                                        : isFinalQuestion
                                                            ? "Finalizar diagnóstico"
                                                            : "Siguiente pregunta"}
                                                </span>

                                                {!isSubmitting && (
                                                    <FiArrowRight aria-hidden="true" />
                                                )}
                                            </button>
                                        )}

                                    </div>

                                </form>
                            ) : (
                                <p role="status">Procesando el resultado...</p>
                            )}

                            <p className="auth-switch">
                                <Link to="/dashboard">Guardar y continuar después</Link>
                            </p>
                        </section>

                        <DiagnosticExamSummary
                            answeredCount={diagnostic.assessment.answeredCount}
                            questionCount={diagnostic.assessment.questionCount}
                            questions={diagnostic.questions}
                            expiresAt={diagnostic.assessment.expiresAt}
                        />
                    </div>
                </div>
            </section>
        </main>
    );
}

import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

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

    const currentQuestion =
        diagnostic?.state === "in_progress"
            ? diagnostic.questions.find((question) => !question.response)
            : null;

    const currentPosition =
        currentQuestion?.position ?? diagnostic?.assessment?.answeredCount ?? 0;

    const totalQuestions = diagnostic?.assessment?.questionCount ?? 0;

    const questionProgressPercentage =
        totalQuestions > 0
            ? Math.round((currentPosition / totalQuestions) * 100)
            : 0;

    const isFinalQuestion =
        currentPosition === totalQuestions && totalQuestions > 0;

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

    if (diagnostic.state === "not_started" || diagnostic.state === "available") {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <header className="auth-header">
                        <p className="eyebrow">Evaluación inicial</p>

                        <h1>Descubramos tu nivel</h1>

                        <p>
                            Responderás ocho preguntas adaptadas para conocer tus fortalezas y
                            los temas que necesitas reforzar.
                        </p>
                    </header>

                    <form className="auth-form" onSubmit={handleStart}>
                        {startError && (
                            <p className="form-error" role="alert">
                                {startError}
                            </p>
                        )}

                        <button disabled={isStarting} type="submit">
                            {isStarting ? "Preparando evaluación..." : "Comenzar diagnóstico"}
                        </button>
                    </form>

                    <p className="auth-switch">
                        <Link to="/dashboard">Volver al panel</Link>
                    </p>
                </section>
            </main>
        );
    }

    if (diagnostic.state === "completed") {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <header className="auth-header">
                        <p className="eyebrow">Diagnóstico completado</p>

                        <h1>Tu resultado</h1>
                    </header>

                    <div className="diagnostic-result">
                        <p>
                            Calificación: <strong>{diagnostic.result.overallScore}%</strong>
                        </p>

                        <p>
                            Nivel asignado:{" "}
                            <strong>
                                {diagnostic.result.resultingDifficulty?.name ?? "Sin nivel"}
                            </strong>
                        </p>
                    </div>

                    <p className="auth-switch">
                        <Link to="/dashboard">Continuar al panel</Link>
                    </p>
                </section>
            </main>
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

                <header className="diagnostic-learning-heading">
                    <Link className="diagnostic-back-link" to="/dashboard">
                        <FiArrowLeft aria-hidden="true" />
                        Volver
                    </Link>

                    <h1>Examen diagnóstico</h1>

                    <p>
                        Para personalizar tu experiencia, necesitamos conocer tu nivel
                        actual.
                    </p>
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
                                aria-valuenow={currentPosition}
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

                                    <fieldset disabled={isSubmitting}>
                                        <legend>Selecciona el resultado</legend>

                                        {currentQuestion.options.map((option, index) => {
                                            const value = String(option);

                                            const optionLetter = String.fromCharCode(65 + index);

                                            return (
                                                <label className="diagnostic-option" key={value}>
                                                    <input
                                                        checked={selectedAnswer === value}
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

                                    <button disabled={isSubmitting} type="submit">
                                        {isSubmitting ? (
                                            "Evaluando..."
                                        ) : (
                                            <>
                                                <span>
                                                    {isFinalQuestion
                                                        ? "Finalizar diagnóstico"
                                                        : "Siguiente pregunta"}
                                                </span>

                                                <FiArrowRight aria-hidden="true" />
                                            </>
                                        )}
                                    </button>
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
                        />
                    </div>
                </div>
            </section>
        </main>
    );
}

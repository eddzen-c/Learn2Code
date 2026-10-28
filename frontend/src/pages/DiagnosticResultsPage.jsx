
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiArrowRight,
    FiAward,
    FiCheckCircle,
    FiAlertTriangle,
    FiBarChart2,
    FiClock,
    FiTarget,
} from 'react-icons/fi';

import { getCurrentDiagnostic } from '../api/diagnostic.api.js';
import { getAuthErrorMessage } from '../auth/auth-error-message.js';
import { useAuth } from '../auth/useAuth.js';
import { LearningSidebar } from '../components/LearningSidebar.jsx';
import { LearningTopbar } from '../components/LearningTopbar.jsx';

import './DiagnosticResultsPage.css';

const ASSETS = '/images/plan-recomendado';

function summarizeBy(questions, getName) {
    const groups = new Map();

    for (const question of questions) {
        const name = getName(question);
        const response = question.response;

        if (!name || response?.status !== 'evaluated') {
            continue;
        }

        if (!groups.has(name)) {
            groups.set(name, {
                name,
                total: 0,
                correct: 0,
                scoreSum: 0,
            });
        }

        const group = groups.get(name);
        group.total += 1;

        if (response.isCorrect === true) {
            group.correct += 1;
        }

        const score = Number(response.score);
        group.scoreSum += Number.isFinite(score) ? score : 0;
    }

    return [...groups.values()]
        .map((group) => ({
            ...group,
            percentage: Math.round(group.scoreSum / group.total),
        }))
        .sort((a, b) => b.percentage - a.percentage);
}

function calculateDuration(startedAt, completedAt) {
    if (!startedAt || !completedAt) return null;

    const elapsed =
        Date.parse(completedAt) - Date.parse(startedAt);

    if (!Number.isFinite(elapsed) || elapsed < 0) {
        return null;
    }

    return `${Math.ceil(elapsed / 60000)} min`;
}

function ScoreBar({ item, variant = 'default' }) {
    return (
        <div className={`dr-score-item dr-score-item--${variant}`}>
            <span className="dr-score-item__name">
                {item.name.replaceAll('_', ' ')}
            </span>

            <div
                className="dr-score-item__track"
                role="progressbar"
                aria-label={`Desempeño en ${item.name}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={item.percentage}
            >
                <span
                    style={{ width: `${item.percentage}%` }}
                />
            </div>

            <strong>{item.percentage}%</strong>
        </div>
    );
}

export function DiagnosticResultsPage() {
    const { accessToken, user } = useAuth();

    const [diagnostic, setDiagnostic] = useState(null);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let active = true;

        getCurrentDiagnostic(accessToken)
            .then((data) => {
                if (!active) return;
                setDiagnostic(data);
                setError('');
            })
            .catch((requestError) => {
                if (!active) return;
                setDiagnostic(null);
                setError(getAuthErrorMessage(requestError));
            });

        return () => {
            active = false;
        };
    }, [accessToken, reloadKey]);

    const firstName =
        user?.fullName?.trim().split(/\s+/)[0]
        || 'Estudiante';

    const isCompleted =
        diagnostic?.state === 'completed'
        && diagnostic.result?.overallScore != null;

    const questions = Array.isArray(diagnostic?.questions)
        ? diagnostic.questions
        : [];

    const evaluated = questions.filter(
        (question) =>
            question.response?.status === 'evaluated',
    );

    const correctCount = evaluated.filter(
        (question) => question.response.isCorrect === true,
    ).length;

    const incorrectCount = evaluated.filter(
        (question) => question.response.isCorrect === false,
    ).length;

    const rawScore = Number(
        diagnostic?.result?.overallScore ?? 0,
    );

    const score = Number.isFinite(rawScore)
        ? Math.max(0, Math.min(100, rawScore))
        : 0;

    const level =
        diagnostic?.result?.resultingDifficulty?.name
        || 'No disponible';

    const duration = calculateDuration(
        diagnostic?.assessment?.startedAt,
        diagnostic?.result?.completedAt,
    );

    const topics = summarizeBy(
        questions,
        (question) => question.topic?.name,
    );

    const technologies = summarizeBy(
        questions,
        (question) => question.technologyKey,
    );

    const strengths = topics.filter(
        (topic) => topic.percentage >= 70,
    );

    const improvements = topics.filter(
        (topic) => topic.percentage < 70,
    );

    return (
        <main className="onboarding-page diagnostic-results-page">
            <LearningSidebar
                mascotSrc={`${ASSETS}/dragon-laptop-512.webp`}
                messageTitle="¡Gran esfuerzo!"
                message="Cada resultado nos ayuda a construir tu camino de aprendizaje."
            />

            <section className="onboarding-content">
                <LearningTopbar
                    activeStep={3}
                    userName={firstName}
                />

                <div className="dr-container">
                    <header className="dr-heading">
                        <h1>
                            Resultados de tu diagnóstico 🎉
                        </h1>

                        <p>
                            {`Buen trabajo, ${firstName}. `}
                            Aquí tienes un resumen de tu desempeño.
                        </p>
                    </header>

                    {!diagnostic && !error && (
                        <section className="dr-card">
                            <p role="status">
                                Cargando resultados...
                            </p>
                        </section>
                    )}

                    {error && (
                        <section className="dr-card">
                            <p role="alert" className="form-error">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    setError('');
                                    setDiagnostic(null);
                                    setReloadKey((value) => value + 1);
                                }}
                            >
                                Reintentar
                            </button>
                        </section>
                    )}

                    {diagnostic && !isCompleted && (
                        <section className="dr-card dr-empty">
                            <FiTarget aria-hidden="true" />

                            <h2>
                                Primero completa tu diagnóstico
                            </h2>

                            <p>
                                Al terminar podrás consultar tus
                                fortalezas, áreas de mejora y nivel.
                            </p>

                            <Link to="/diagnostic">
                                Volver al diagnóstico
                                <FiArrowRight aria-hidden="true" />
                            </Link>
                        </section>
                    )}

                    {isCompleted && (
                        <>
                            <div className="dr-top-grid">
                                <section className="dr-card dr-level-card">
                                    <div className="dr-level-text">
                                        <p className="dr-card-label">
                                            Nivel detectado
                                        </p>

                                        <div className="dr-level-heading">
                                            <span className="dr-level-icon">
                                                <FiBarChart2 aria-hidden="true" />
                                            </span>

                                            <div>
                                                <small>Tu nivel actual</small>
                                                <h2>{level}</h2>
                                            </div>
                                        </div>

                                        <p>
                                            Este nivel se determinó
                                            mediante los resultados
                                            de tu evaluación.
                                        </p>

                                        <div className="dr-level-details">
                                            <span>
                                                Diagnóstico completado
                                            </span>

                                            <strong>
                                                {diagnostic.assessment?.questionCount ?? 0}
                                                {' '}preguntas
                                            </strong>
                                        </div>
                                    </div>

                                    <img
                                        className="dr-result-dragon"
                                        src={`${ASSETS}/dragon-bienvenida-512.webp`}
                                        alt="Mascota de Learn2Code celebrando"
                                    />
                                </section>

                                <section className="dr-card dr-overview-card">
                                    <h2>Resumen general</h2>

                                    <div className="dr-overview-body">
                                        <div
                                            className="dr-score-ring"
                                            style={{
                                                '--score': `${score}%`,
                                            }}
                                            role="progressbar"
                                            aria-label="Calificación global"
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-valuenow={score}
                                        >
                                            <div>
                                                <strong>{score}%</strong>
                                                <span>
                                                    Puntuación global
                                                </span>
                                            </div>
                                        </div>

                                        <div className="dr-overview-stats">
                                            <p>
                                                <FiCheckCircle aria-hidden="true" />
                                                Correctas
                                                <strong>{correctCount}</strong>
                                            </p>

                                            <p>
                                                <FiAlertTriangle aria-hidden="true" />
                                                Incorrectas
                                                <strong>{incorrectCount}</strong>
                                            </p>

                                            <p>
                                                <FiTarget aria-hidden="true" />
                                                Evaluadas
                                                <strong>{evaluated.length}</strong>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="dr-meta">
                                        <span>
                                            <FiAward aria-hidden="true" />
                                            {level}
                                        </span>

                                        <span>
                                            <FiClock aria-hidden="true" />
                                            {duration ?? 'Tiempo no disponible'}
                                        </span>
                                    </div>
                                </section>
                            </div>

                            <div className="dr-details-grid">
                                <section className="dr-card dr-detail-card">
                                    <h2 className="dr-positive-heading">
                                        <FiCheckCircle aria-hidden="true" />
                                        Fortalezas
                                    </h2>

                                    {strengths.length > 0
                                        ? strengths.map((topic) => (
                                            <ScoreBar
                                                key={topic.name}
                                                item={topic}
                                                variant="positive"
                                            />
                                        ))
                                        : (
                                            <p className="dr-empty-text">
                                                Seguiremos fortaleciendo
                                                tus conocimientos.
                                            </p>
                                        )}
                                </section>

                                <section className="dr-card dr-detail-card">
                                    <h2 className="dr-warning-heading">
                                        <FiAlertTriangle aria-hidden="true" />
                                        Áreas a mejorar
                                    </h2>

                                    {improvements.length > 0
                                        ? improvements.map((topic) => (
                                            <ScoreBar
                                                key={topic.name}
                                                item={topic}
                                                variant="warning"
                                            />
                                        ))
                                        : (
                                            <p className="dr-empty-text">
                                                No se detectaron temas
                                                por debajo del 70 %.
                                            </p>
                                        )}
                                </section>

                                <section className="dr-card dr-detail-card">
                                    <h2>
                                        Puntaje por tecnología
                                    </h2>

                                    {technologies.length > 0
                                        ? technologies.map((technology) => (
                                            <ScoreBar
                                                key={technology.name}
                                                item={technology}
                                            />
                                        ))
                                        : (
                                            <p className="dr-empty-text">
                                                No hay datos por tecnología.
                                            </p>
                                        )}
                                </section>
                            </div>

                            <section className="dr-card dr-recommendation">
                                <div>
                                    <span className="dr-recommendation-label">
                                        Tu siguiente paso
                                    </span>

                                    <h2>
                                        Tu ruta personalizada está más cerca
                                    </h2>

                                    <p>
                                        La IA utilizará estos resultados
                                        junto con tu información de
                                        «Sobre ti» para proponer
                                        tu plan de aprendizaje.
                                    </p>
                                </div>

                                <img
                                    src={`${ASSETS}/miniatura-portafolio.svg`}
                                    alt=""
                                />
                            </section>

                            <footer className="dr-card dr-footer">
                                <div>
                                    <h2>
                                        ¡Estás listo para seguir avanzando!
                                    </h2>

                                    <p>
                                        Descubre el siguiente paso
                                        de tu formación en Learn2Code.
                                    </p>
                                </div>

                                <Link to="/recommended-plan">
                                    Ver plan recomendado
                                    <FiArrowRight aria-hidden="true" />
                                </Link>
                            </footer>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}

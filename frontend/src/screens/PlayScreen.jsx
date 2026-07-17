import { useState, useEffect, useRef } from 'react';
import { playCorrectSound, playWrongSound } from '../sounds';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function PlayScreen({ quizId, initialData, onComplete, onNotFound, onShowToast }) {
  const hasInitialQuestions = initialData && Array.isArray(initialData.questions) && initialData.questions.length > 0;
  const [quiz, setQuiz] = useState(hasInitialQuestions ? initialData : null);
  const [loading, setLoading] = useState(!hasInitialQuestions);
  const [error, setError] = useState('');

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState([]); // [{ questionId, selectedIdx, correct }]
  const [animating, setAnimating] = useState(false);

  // Fetch quiz if not already loaded
  useEffect(() => {
    if (!quiz && quizId) {
      fetch(`/api/quizzes/${quizId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            if (data.error.includes('not found')) {
              onNotFound();
            } else {
              setError(data.error);
            }
          } else {
            setQuiz(data);
          }
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load quiz. Check your connection.');
          setLoading(false);
        });
    }
  }, [quizId]);

  if (loading) {
    return (
      <main className="screen animate-fade-in" style={{ gap: '2rem' }}>
        <div className="hud-box" style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <p className="font-mono text-cyan" style={{ fontSize: '0.9rem', letterSpacing: '0.12em' }}>
            LOADING QUIZ... <span className="cursor-blink" />
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="screen animate-fade-in" style={{ gap: '2rem' }}>
        <div className="hud-box hud-box-red" style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
          <p className="font-mono text-red" style={{ fontSize: '0.9rem' }}>✗ {error}</p>
        </div>
      </main>
    );
  }

  if (!quiz) return null;

  const questions = quiz.questions;
  const total = questions.length;
  const current = questions[currentIdx];
  const progress = ((currentIdx) / total) * 100;

  function handleSelectAnswer(idx) {
    if (answered || animating) return;

    setSelectedIdx(idx);
    setAnswered(true);

    const isCorrect = idx === current.correct_index;
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    const newAnswers = [
      ...answers,
      {
        questionId: current.id,
        questionText: current.question,
        selectedIdx: idx,
        correctIdx: current.correct_index,
        correct: isCorrect,
        options: current.options,
        explanation: current.explanation,
      },
    ];
    setAnswers(newAnswers);

    // Auto-advance after delay — correct: 1.8s, wrong: 2.8s (more time to read explanation)
    const delay = isCorrect ? 1800 : 2800;
    setTimeout(() => {
      setAnimating(true);
      setTimeout(() => {
        if (currentIdx + 1 < total) {
          setCurrentIdx((p) => p + 1);
          setSelectedIdx(null);
          setAnswered(false);
          setAnimating(false);
        } else {
          onComplete(newAnswers);
        }
      }, 300);
    }, delay);
  }

  function getOptionClass(idx) {
    if (!answered) return '';
    if (idx === current.correct_index) return 'revealed';
    if (idx === selectedIdx && idx !== current.correct_index) return 'wrong';
    return '';
  }

  return (
    <main
      className={`screen animate-fade-in`}
      style={{ gap: '1.75rem', opacity: animating ? 0 : 1, transition: 'opacity 0.3s ease' }}
    >
      {/* Quiz Title + Progress Header */}
      <div style={{ width: '100%', textAlign: 'center' }}>
        <p
          className="font-mono"
          style={{ color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '0.15em', marginBottom: '0.25rem' }}
        >
          {quiz.title}
        </p>
        <div
          className="font-display text-cyan"
          style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.1em' }}
        >
          QUESTION {String(currentIdx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-track" style={{ width: '100%' }}>
        <div
          className="progress-bar-fill"
          style={{ width: `${((currentIdx + (answered ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="hud-box" style={{ width: '100%' }}>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.05rem',
            lineHeight: 1.65,
            color: 'var(--text-primary)',
            fontWeight: 400,
          }}
        >
          {current.question}
        </p>
      </div>

      {/* Answer options */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {current.options.map((opt, idx) => (
          <button
            key={idx}
            className={`option-card ${getOptionClass(idx)}`}
            onClick={() => handleSelectAnswer(idx)}
            disabled={answered}
            id={`option-${idx}`}
          >
            <span className="option-label">{OPTION_LABELS[idx]}</span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                color: 'var(--text-primary)',
              }}
            >
              {opt}
            </span>
            {answered && idx === current.correct_index && (
              <span className="text-green" style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', flexShrink: 0 }}>
                ✓ CORRECT
              </span>
            )}
            {answered && idx === selectedIdx && idx !== current.correct_index && (
              <span className="text-red" style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', flexShrink: 0 }}>
                ✗ WRONG
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Explanation (shown when wrong) */}
      {answered && selectedIdx !== current.correct_index && (
        <div
          className="hud-box hud-box-magenta animate-fade-in"
          style={{ width: '100%', padding: '1rem 1.25rem' }}
        >
          <p
            className="font-mono"
            style={{ fontSize: '0.65rem', color: 'var(--magenta)', letterSpacing: '0.15em', marginBottom: '0.4rem' }}
          >
            SYSTEM ANALYSIS
          </p>
          <p
            style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)' }}
          >
            {current.explanation}
          </p>
        </div>
      )}

      {/* Correct feedback banner */}
      {answered && selectedIdx === current.correct_index && (
        <div
          className="hud-box hud-box-green animate-fade-in"
          style={{ width: '100%', padding: '0.875rem 1.25rem', textAlign: 'center' }}
        >
          <p className="font-display text-green" style={{ fontSize: '0.9rem', letterSpacing: '0.12em' }}>
            ✓ CORRECT — ADVANCING...
          </p>
        </div>
      )}
    </main>
  );
}

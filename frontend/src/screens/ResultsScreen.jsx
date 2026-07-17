import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function getScoreMessage(pct) {
  if (pct >= 90) return { label: 'SYSTEM ANALYSIS: HIGH APTITUDE DETECTED', sub: 'Certified genius. 🧠⚡', color: 'var(--green)' };
  if (pct >= 70) return { label: 'SIGNAL STRONG — GOOD THROUGHPUT', sub: 'Sharp. You clearly did the reading.', color: 'var(--cyan)' };
  if (pct >= 40) return { label: 'PARTIAL SYSTEM KNOWLEDGE FOUND', sub: 'Decent effort — a few gaps to patch.', color: 'var(--magenta)' };
  return { label: 'CRITICAL KNOWLEDGE GAPS DETECTED', sub: 'Rough round. Time to revisit those notes.', color: 'var(--red)' };
}

export default function ResultsScreen({ quizData, answers, onCreateNew, onPlayAgain }) {
  const score = answers.filter((a) => a.correct).length;
  const total = answers.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const msg = getScoreMessage(pct);
  const launched = useRef(false);

  useEffect(() => {
    if (pct >= 70 && !launched.current) {
      launched.current = true;
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#00fff2', '#ff2079', '#39ff14'],
      });
    }
  }, [pct]);

  return (
    <main
      className="screen screen-wide animate-fade-in"
      style={{ gap: '2rem', alignItems: 'stretch' }}
    >
      {/* Score hero */}
      <div style={{ textAlign: 'center' }}>
        <div className="label-tag" style={{ marginBottom: '1rem' }}>RESULTS</div>
        <div
          className="font-display"
          style={{
            fontSize: 'clamp(3rem, 12vw, 6rem)',
            fontWeight: 900,
            color: msg.color,
            textShadow: `0 0 30px ${msg.color}`,
            letterSpacing: '0.05em',
            lineHeight: 1,
          }}
        >
          {score} / {total}
        </div>
        <div
          className="font-mono"
          style={{
            fontSize: '0.72rem',
            letterSpacing: '0.2em',
            color: msg.color,
            marginTop: '0.75rem',
            opacity: 0.8,
          }}
        >
          {msg.label}
        </div>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.05rem',
            color: 'var(--text-primary)',
            marginTop: '0.5rem',
          }}
        >
          {msg.sub}
        </p>

        {/* Score bar */}
        <div
          className="progress-bar-track"
          style={{ maxWidth: '400px', margin: '1.25rem auto 0' }}
        >
          <div
            className="progress-bar-fill"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${msg.color}, rgba(0,0,0,0.3))`,
              transition: 'width 1.5s ease',
            }}
          />
        </div>
        <p
          className="font-mono"
          style={{ color: 'var(--text-dim)', fontSize: '0.7rem', marginTop: '0.4rem' }}
        >
          {pct}% ACCURACY
        </p>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-primary" id="btn-play-again" onClick={onPlayAgain}>
          ↺ PLAY AGAIN
        </button>
        <button className="btn-secondary" id="btn-create-new" onClick={onCreateNew}>
          + CREATE YOUR OWN QUIZ
        </button>
      </div>

      <div className="section-divider" />

      {/* Question review */}
      <div>
        <div
          className="font-display"
          style={{
            fontSize: '0.9rem',
            letterSpacing: '0.12em',
            color: 'var(--text-secondary)',
            marginBottom: '1rem',
          }}
        >
          QUESTION REVIEW
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {answers.map((ans, i) => (
            <div
              key={ans.questionId}
              className={`hud-box ${ans.correct ? 'hud-box-green' : 'hud-box-red'} animate-fade-in`}
              style={{ animationDelay: `${i * 0.04}s`, padding: '1.25rem' }}
            >
              {/* Q header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span
                  className="font-mono"
                  style={{
                    color: ans.correct ? 'var(--green)' : 'var(--red)',
                    fontSize: '0.8rem',
                    minWidth: '24px',
                  }}
                >
                  {ans.correct ? '✓' : '✗'}
                </span>
                <span
                  className="font-mono"
                  style={{
                    color: 'var(--text-dim)',
                    fontSize: '0.65rem',
                    letterSpacing: '0.15em',
                    paddingTop: '2px',
                    minWidth: '60px',
                    flexShrink: 0,
                  }}
                >
                  Q{String(i + 1).padStart(2, '0')}
                </span>
                <p
                  style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}
                >
                  {ans.questionText}
                </p>
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', paddingLeft: '2.5rem' }}>
                {ans.options.map((opt, oi) => {
                  const isCorrect = oi === ans.correctIdx;
                  const isSelected = oi === ans.selectedIdx;
                  let color = 'var(--text-dim)';
                  if (isCorrect) color = 'var(--green)';
                  else if (isSelected && !isCorrect) color = 'var(--red)';

                  return (
                    <div
                      key={oi}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.3rem 0.75rem',
                        background: isCorrect
                          ? 'rgba(57,255,20,0.08)'
                          : isSelected && !isCorrect
                          ? 'rgba(255,0,60,0.08)'
                          : 'transparent',
                        border: `1px solid ${
                          isCorrect
                            ? 'rgba(57,255,20,0.25)'
                            : isSelected && !isCorrect
                            ? 'rgba(255,0,60,0.25)'
                            : 'transparent'
                        }`,
                      }}
                    >
                      <span
                        className="font-mono"
                        style={{ fontSize: '0.7rem', color, minWidth: '20px' }}
                      >
                        {OPTION_LABELS[oi]}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.85rem',
                          color,
                        }}
                      >
                        {opt}
                      </span>
                      {isCorrect && (
                        <span className="font-mono text-green" style={{ fontSize: '0.65rem', marginLeft: 'auto' }}>
                          CORRECT
                        </span>
                      )}
                      {isSelected && !isCorrect && (
                        <span className="font-mono text-red" style={{ fontSize: '0.65rem', marginLeft: 'auto' }}>
                          YOUR ANSWER
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation if wrong */}
              {!ans.correct && ans.explanation && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    paddingLeft: '2.5rem',
                    paddingTop: '0.625rem',
                    borderTop: '1px solid rgba(255,32,121,0.15)',
                  }}
                >
                  <p
                    className="font-mono"
                    style={{ color: 'var(--magenta)', fontSize: '0.62rem', letterSpacing: '0.12em', marginBottom: '0.25rem' }}
                  >
                    EXPLANATION
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                    }}
                  >
                    {ans.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', paddingTop: '1rem' }}>
        <button className="btn-primary" onClick={onCreateNew}>
          ⚡ CREATE YOUR OWN QUIZ
        </button>
      </div>
    </main>
  );
}

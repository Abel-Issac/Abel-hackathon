import { useState, useRef } from 'react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function WelcomeScreen({ onCreateQuiz, onJumpToQuiz }) {
  const [quizLink, setQuizLink] = useState('');
  const [linkError, setLinkError] = useState('');

  function handleLinkJump() {
    setLinkError('');
    const val = quizLink.trim();
    if (!val) {
      setLinkError('Please paste a quiz link or ID.');
      return;
    }
    // Extract ID from URL or use raw value
    const match = val.match(/quiz\/([a-z0-9-]+)/i);
    const id = match ? match[1] : val;
    if (id) onJumpToQuiz(id);
    else setLinkError('Could not find a quiz ID in that link.');
  }

  return (
    <main className="screen animate-fade-in" style={{ gap: '2.5rem' }}>
      {/* Logo / Title */}
      <div style={{ textAlign: 'center' }}>
        <div className="label-tag" style={{ marginBottom: '1.25rem' }}>
          DEVDYNASTY PRESENTS
        </div>
        <h1
          className="glitch font-display"
          data-text="QUIZ//FORGE"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: 900,
            letterSpacing: '0.08em',
            color: 'var(--cyan)',
            lineHeight: 1,
            textShadow: '0 0 30px rgba(0,255,242,0.5)',
          }}
        >
          QUIZ//FORGE
        </h1>
        <p
          className="font-mono"
          style={{
            marginTop: '1rem',
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            letterSpacing: '0.05em',
          }}
        >
          Turn any PDF into a quiz. Instantly.
        </p>
      </div>

      {/* Primary Action */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <button
          className="btn-primary"
          style={{ fontSize: '1rem', padding: '1.1rem 3rem' }}
          onClick={onCreateQuiz}
          id="btn-create-quiz"
        >
          ⚡ CREATE A QUIZ
        </button>
      </div>

      <div className="section-divider" />

      {/* Secondary: Paste Link */}
      <div className="hud-box" style={{ width: '100%' }}>
        <p
          className="font-mono"
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            color: 'var(--text-secondary)',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
          }}
        >
          Have a quiz link? Paste it here
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            className="neon-input"
            id="input-quiz-link"
            placeholder="https://yourapp.com/quiz/abc123  or just paste the ID"
            value={quizLink}
            onChange={(e) => setQuizLink(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLinkJump()}
            style={{ flex: 1, minWidth: '200px' }}
          />
          <button
            className="btn-secondary"
            id="btn-jump-to-quiz"
            onClick={handleLinkJump}
          >
            PLAY →
          </button>
        </div>
        {linkError && (
          <p className="font-mono text-red" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            ✗ {linkError}
          </p>
        )}
      </div>

      {/* Decorative stats */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { val: 'PDF → QUIZ', label: 'IN SECONDS' },
          { val: '10-15', label: 'AI QUESTIONS' },
          { val: 'ZERO', label: 'SIGNUP NEEDED' },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div
              className="font-display text-cyan"
              style={{ fontSize: '1.1rem', fontWeight: 700 }}
            >
              {s.val}
            </div>
            <div
              className="font-mono"
              style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--text-dim)' }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

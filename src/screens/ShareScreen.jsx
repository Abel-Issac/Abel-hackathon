import { useState } from 'react';

export default function ShareScreen({ quizData, onPlay, onShowToast, onCreateAnother }) {
  const [copied, setCopied] = useState(false);

  const quizLink = `${window.location.origin}/quiz/${quizData.id}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(quizLink);
      setCopied(true);
      onShowToast('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: select input text
      const input = document.getElementById('share-link-input');
      input?.select();
    }
  }

  return (
    <main className="screen animate-fade-in" style={{ gap: '2rem' }}>
      {/* Success header */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{ fontSize: '4rem', marginBottom: '0.75rem', animation: 'scaleIn 0.4s ease' }}
        >
          ⚡
        </div>
        <div className="label-tag" style={{ marginBottom: '0.75rem', borderColor: 'rgba(57,255,20,0.3)', color: 'var(--green)', backgroundColor: 'rgba(57,255,20,0.06)' }}>
          QUIZ READY
        </div>
        <h2
          className="font-display text-green"
          style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '0.06em' }}
        >
          YOUR QUIZ IS FORGED
        </h2>
        <p
          className="font-mono"
          style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}
        >
          {quizData.title}
        </p>
        <p
          className="font-mono"
          style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '0.25rem' }}
        >
          {quizData.questionCount} questions generated
        </p>
      </div>

      {/* Shareable link */}
      <div className="hud-box hud-box-green" style={{ width: '100%' }}>
        <p
          className="font-mono"
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            color: 'var(--green)',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
          }}
        >
          SHAREABLE LINK
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            id="share-link-input"
            className="neon-input"
            value={quizLink}
            readOnly
            style={{
              flex: 1,
              minWidth: '200px',
              borderColor: 'rgba(57,255,20,0.4)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
            }}
          />
          <button
            className="btn-primary"
            id="btn-copy-link"
            onClick={handleCopy}
            style={{
              background: copied ? 'var(--green)' : 'var(--green)',
              borderColor: 'var(--green)',
              color: '#000',
              minWidth: '120px',
            }}
          >
            {copied ? '✓ COPIED!' : '⎘ COPY LINK'}
          </button>
        </div>
        <p
          className="font-mono"
          style={{ color: 'var(--text-dim)', fontSize: '0.7rem', marginTop: '0.75rem' }}
        >
          Anyone with this link can play the quiz — no account required
        </p>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        <button
          className="btn-primary"
          id="btn-play-now"
          onClick={onPlay}
          style={{ flex: 1, minWidth: '200px' }}
        >
          ▶ PLAY NOW
        </button>
        <button
          className="btn-secondary"
          id="btn-create-another"
          onClick={onCreateAnother}
        >
          + CREATE ANOTHER
        </button>
      </div>

      {/* Quiz ID info */}
      <div className="hud-box" style={{ width: '100%', padding: '0.875rem 1.25rem' }}>
        <p className="font-mono" style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
          QUIZ ID:{' '}
          <span style={{ color: 'var(--text-secondary)' }}>{quizData.id}</span>
        </p>
      </div>
    </main>
  );
}

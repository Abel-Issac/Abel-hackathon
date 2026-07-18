import { useState, useRef, useCallback, useEffect } from 'react';

const TERMINAL_STEPS = [
  { key: 'upload',  label: 'UPLOADING DOCUMENT...' },
  { key: 'extract', label: 'PARSING PDF TEXT...' },
  { key: 'ai',      label: 'AI READING DOCUMENT...' },
  { key: 'compile', label: 'COMPILING QUESTIONS...' },
  { key: 'save',    label: 'SAVING QUIZ...' },
];

export default function CreateScreen({ onQuizCreated, onBack }) {
  const [phase, setPhase]           = useState('upload'); // 'upload' | 'loading' | 'error'
  const [dragOver, setDragOver]     = useState(false);
  const [fileName, setFileName]     = useState('');
  const [terminalStep, setTerminalStep] = useState(0);
  const [error, setError]           = useState('');
  const [keyStatus, setKeyStatus]   = useState(null); // null | { ready, engine }
  const fileInputRef = useRef(null);
  const timersRef    = useRef([]);

  // ── Check if an AI key is configured on mount ──────────────────────────────
  useEffect(() => {
    fetch('/api/check-key')
      .then((r) => r.json())
      .then(setKeyStatus)
      .catch(() => setKeyStatus({ ready: false, engine: null }));
  }, []);

  // ── Handle file selection ──────────────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    const isPdf = file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    if (!isPdf) { setError('Please upload a valid PDF file.'); return; }

    setFileName(file.name);
    setPhase('loading');
    setTerminalStep(0);
    setError('');

    // Clear any previous timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    // Animate loading steps — AI call typically takes 20-60s
    const stepDelays = [0, 800, 2200, 4000, 7000];
    stepDelays.forEach((delay, i) => {
      const t = setTimeout(() => setTerminalStep(i), delay);
      timersRef.current.push(t);
    });

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res  = await fetch('/api/quizzes', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to generate quiz.');

      // Show the final step briefly, then transition
      setTerminalStep(4);
      await new Promise((r) => setTimeout(r, 700));
      timersRef.current.forEach(clearTimeout);
      onQuizCreated(data);
    } catch (err) {
      timersRef.current.forEach(clearTimeout);
      setPhase('error');
      setError(err.message || 'An unexpected error occurred. Please try again.');
    }
  }, [onQuizCreated]);

  function onFileInputChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <main className="screen animate-fade-in" style={{ gap: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="label-tag" style={{ marginBottom: '1rem' }}>PROCESSING</div>
          <h2 className="font-display text-cyan" style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.1em' }}>
            FORGING YOUR QUIZ
          </h2>
          <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {fileName}
          </p>
        </div>

        <div className="hud-box" style={{ width: '100%', maxWidth: '520px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {TERMINAL_STEPS.map((step, i) => (
              <div
                key={step.key}
                className={`terminal-line ${i < terminalStep ? 'done' : i === terminalStep ? 'active' : 'pending'}`}
              >
                <span>{i < terminalStep ? '✓' : i === terminalStep ? '►' : '○'}</span>
                <span>{step.label}</span>
                {i === terminalStep && <span className="cursor-blink" />}
              </div>
            ))}
          </div>
        </div>

        <p className="font-mono" style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textAlign: 'center' }}>
          AI is reading your document and crafting questions — this may take 20–60 seconds...
        </p>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UPLOAD SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="screen animate-fade-in" style={{ gap: '1.75rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
        <button className="btn-ghost" onClick={onBack} id="btn-back">← BACK</button>
        <div className="label-tag">NEW QUIZ</div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <h2 className="font-display text-cyan" style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '0.08em' }}>
          UPLOAD YOUR PDF
        </h2>
        <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          AI will read your document and generate a custom quiz from it
        </p>
      </div>

      {/* API Key Warning Banner */}
      {keyStatus && !keyStatus.ready && (
        <div
          className="hud-box animate-fade-in"
          style={{
            width: '100%',
            borderColor: 'rgba(255, 165, 0, 0.5)',
            background: 'rgba(255, 165, 0, 0.06)',
          }}
        >
          <p className="font-mono" style={{ color: '#ffaa00', fontSize: '0.82rem', lineHeight: 1.6 }}>
            ⚠ <strong>NO AI KEY CONFIGURED</strong> — Quiz generation requires an API key.<br />
            Open <code style={{ color: 'var(--cyan)' }}>backend/.env</code> and set either:
          </p>
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
              <span style={{ color: '#ffaa00' }}>ANTHROPIC_API_KEY</span>=sk-ant-api03-... &nbsp;
              <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)' }}>[get key]</a>
            </p>
            <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
              <span style={{ color: '#ffaa00' }}>GEMINI_API_KEY</span>=AIzaSy... &nbsp;
              <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)' }}>[get free key]</a>
            </p>
          </div>
        </div>
      )}

      {/* AI Engine Badge */}
      {keyStatus?.ready && (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div className="label-tag" style={{ background: 'rgba(57,255,20,0.08)', borderColor: 'rgba(57,255,20,0.4)', color: 'var(--green)' }}>
            ⚡ AI READY — {keyStatus.engine}
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        style={{ width: '100%' }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        id="pdf-drop-zone"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        aria-label="Click or drag to upload a PDF file"
      >
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📄</div>
        <p className="font-display" style={{ color: 'var(--cyan)', fontSize: '1.1rem', letterSpacing: '0.1em', fontWeight: 700 }}>
          DROP PDF HERE
        </p>
        <p className="font-mono" style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '0.5rem' }}>
          or click to browse &nbsp;·&nbsp; max 20 MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={onFileInputChange}
          style={{ display: 'none' }}
          id="file-input"
        />
      </div>

      {/* Error Box */}
      {(error || phase === 'error') && (
        <div className="hud-box hud-box-red animate-fade-in" style={{ width: '100%' }}>
          <p className="font-mono text-red" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
            ✗ {error}
          </p>
          <button
            className="btn-secondary"
            style={{ marginTop: '1rem' }}
            onClick={() => { setPhase('upload'); setError(''); }}
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* Info Notes */}
      <div className="hud-box" style={{ width: '100%', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {[
            '✦ AI generates 10–15 MCQ questions purely from your PDF content',
            '✦ Works best with text-based PDFs (notes, textbooks, articles)',
            '✦ Scanned / image-only PDFs are not supported',
            '✦ No account required — the shareable link is your only key',
          ].map((note, i) => (
            <p key={i} className="font-mono" style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
              {note}
            </p>
          ))}
        </div>
      </div>

    </main>
  );
}

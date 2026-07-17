export default function NotFoundScreen({ onCreateNew }) {
  return (
    <main className="screen animate-fade-in" style={{ gap: '2rem', textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠</div>
        <div className="label-tag hud-box-red" style={{ borderColor: 'rgba(255,0,60,0.4)', color: 'var(--red)', background: 'rgba(255,0,60,0.06)', marginBottom: '1rem' }}>
          404 — NOT FOUND
        </div>
        <h2 className="font-display text-red" style={{ fontSize: '1.75rem', letterSpacing: '0.08em', fontWeight: 700 }}>
          QUIZ NOT FOUND
        </h2>
        <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.75rem', lineHeight: 1.6 }}>
          This quiz link may be invalid, or the quiz was never created.<br />
          Double-check the link or start fresh.
        </p>
      </div>

      <button className="btn-primary" id="btn-create-new-notfound" onClick={onCreateNew}>
        ⚡ CREATE A QUIZ
      </button>
    </main>
  );
}

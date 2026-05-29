// Inline SVG icons — no external dependency needed

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#3D82E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
)

const ShieldOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#E07830" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <path d="M19.7 14a6.9 6.9 0 0 0 .3-2V5l-8-3-3.2 1.2"/>
    <path d="M4.7 4.7 4 5v7a8 8 0 0 0 12.8 6.4"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#C060A8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#0AABBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="30" height="30">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

export default function PrivacyWelcome({ onDismiss }) {
  const cards = [
    {
      icon: <PhoneIcon />,
      bg: 'rgba(61,130,224,0.10)',
      title: 'Stays on your phone',
      body: 'Everything you write is saved only on this device. It never leaves.',
    },
    {
      icon: <ShieldOffIcon />,
      bg: 'rgba(224,120,48,0.10)',
      title: 'No accounts. No cloud.',
      body: "There is no server, no sign-in, and no database. We don't collect anything.",
    },
    {
      icon: <EyeOffIcon />,
      bg: 'rgba(192,96,168,0.10)',
      title: 'No one can see it',
      body: 'Not us, not anyone. Your thoughts are completely private — only you.',
    },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(150deg, var(--bg-a), var(--bg-b))',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 'calc(env(safe-area-inset-top) + 1.5rem) 1.5rem calc(env(safe-area-inset-bottom) + 1.5rem)',
      overflowY: 'auto',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(10,171,187,0.10)',
        border: '1.5px solid rgba(10,171,187,0.25)',
        boxShadow: '0 4px 20px rgba(10,171,187,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.25rem', flexShrink: 0,
      }}>
        <LockIcon />
      </div>

      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.7rem, 7vw, 2.2rem)', fontWeight: 500, color: 'var(--text-hi)', textAlign: 'center', lineHeight: 1.2, marginBottom: '0.35rem' }}>
        Your privacy matters
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1rem, 4vw, 1.15rem)', color: 'var(--text-lo)', textAlign: 'center', marginBottom: '1.75rem' }}>
        Before you begin, here is what you should know
      </div>

      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.75rem' }}>
        {cards.map(c => (
          <div key={c.title} style={{ background: 'rgba(255,255,255,0.72)', border: '1.5px solid var(--border)', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '0.875rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {c.icon}
            </div>
            <div style={{ paddingTop: 2 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-hi)', marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--text-lo)', lineHeight: 1.5 }}>{c.body}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1rem, 4vw, 1.15rem)', color: 'var(--text-lo)', textAlign: 'center', marginBottom: '1.75rem', padding: '0 0.5rem' }}>
        "Write freely. This is a safe place to notice what is good."
      </div>

      <button onClick={onDismiss} style={{ width: '100%', maxWidth: 400, padding: '1rem', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, var(--now), var(--now-dk))', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.03em', boxShadow: '0 4px 18px rgba(0,0,0,0.18)', marginBottom: '1rem' }}>
        I understand — let's begin
      </button>

      <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '0.68rem', color: 'var(--text-lo)', opacity: 0.7, textAlign: 'center', maxWidth: 320, lineHeight: 1.5 }}>
        This message only appears once. You can revisit your privacy information in Settings at any time.
      </div>
    </div>
  )
}
